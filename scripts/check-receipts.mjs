#!/usr/bin/env node

/**
 * Receipt gate checker — run in CI or pre-merge
 * Evaluates Designer's Receipts on TSX files and fails on error-severity findings.
 * 
 * Usage:
 *   node scripts/check-receipts.mjs [file1.tsx] [file2.tsx]
 *   node scripts/check-receipts.mjs extension/test-fixtures/*.tsx
 *   node scripts/check-receipts.mjs --config=.bluepainter.json src/components/*.tsx
 * 
 * Exit codes:
 *   0 = All checks passed (warnings are non-blocking)
 *   1 = Error-severity findings detected (blocks merge)
 * 
 * Severity levels:
 *   ERROR (blocks merge): WCAG contrast failures
 *   WARNING (non-blocking): Spacing grid, border radius, CTA copy, feature count
 * 
 * Config file:
 *   Create .bluepainter.json in repo root to customize receipt policy
 *   See .bluepainter.json for schema
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import recast from 'recast';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as t from '@babel/types';

const traverse = traverseModule.default || traverseModule;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

function loadConfig(configPath) {
  const fullPath = resolve(repoRoot, configPath);
  if (!existsSync(fullPath)) {
    return null;
  }
  
  try {
    const content = readFileSync(fullPath, 'utf-8');
    const config = JSON.parse(content);
    return config.receiptPolicy || null;
  } catch (err) {
    console.error(`⚠️  Failed to load config from ${configPath}: ${err.message}`);
    return null;
  }
}

function getDefaultPolicy() {
  return {
    spacingGrid: 8,
    radiusGrid: 4,
    minContrastRatio: 4.5,
    maxFeatureCount: 5,
    weakCtaWords: ['submit', 'click here', 'send', 'button', 'ok', 'enter'],
    suggestedCta: 'Start free trial',
    contrastFixColor: '#1e40af'
  };
}

async function loadReceiptPolicy() {
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const receiptModule = require('@bluepainter/shared/receiptPolicy');
    return receiptModule;
  } catch (err) {
    console.error('\n❌ FATAL: Failed to load receipt policy module');
    console.error(`   Error: ${err.message}`);
    console.error('   Ensure @bluepainter/shared/receiptPolicy is available in your project.');
    console.error('   Exit code: 1');
    process.exit(1);
  }
}

const babelParser = {
  parse(source) {
    return parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      tokens: true,
      ranges: true
    });
  }
};

function getJsxId(openingElement) {
  if (!openingElement?.attributes) return null;
  for (const attr of openingElement.attributes) {
    if (!t.isJSXAttribute(attr) || !t.isJSXIdentifier(attr.name, { name: 'id' })) continue;
    if (t.isStringLiteral(attr.value)) return attr.value.value;
    if (t.isJSXExpressionContainer(attr.value) && t.isStringLiteral(attr.value.expression)) {
      return attr.value.expression.value;
    }
  }
  return null;
}

function readObjectExpression(expr) {
  if (!t.isObjectExpression(expr)) return null;
  const out = {};
  for (const prop of expr.properties) {
    if (!t.isObjectProperty(prop)) continue;
    let key;
    if (t.isIdentifier(prop.key)) key = prop.key.name;
    else if (t.isStringLiteral(prop.key)) key = prop.key.value;
    else continue;

    if (t.isNumericLiteral(prop.value)) out[key] = prop.value.value;
    else if (t.isStringLiteral(prop.value)) out[key] = prop.value.value;
  }
  return out;
}

function readJsxText(jsxElement) {
  for (const child of jsxElement.children || []) {
    if (t.isJSXText(child)) return child.value.trim();
    if (t.isJSXExpressionContainer(child) && t.isStringLiteral(child.expression)) {
      return child.expression.value;
    }
  }
  return null;
}

function parseTSXToNodes(code, filename) {
  const nodes = {};
  
  try {
    const ast = recast.parse(code, { parser: babelParser });
    
    traverse(ast, {
      JSXElement(path) {
        const opening = path.node.openingElement;
        const id = getJsxId(opening);
        if (!id) return;
        
        const tagName = t.isJSXIdentifier(opening.name) 
          ? opening.name.name 
          : 'div';
        
        const style = {};
        const styleAttr = opening.attributes.find(
          (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'style' })
        );
        
        if (styleAttr && t.isJSXExpressionContainer(styleAttr.value)) {
          const parsed = readObjectExpression(styleAttr.value.expression);
          if (parsed) Object.assign(style, parsed);
        }
        
        const text = readJsxText(path.node) || '';
        
        const type = tagName === 'button' ? 'button' :
                     ['h1', 'h2', 'h3', 'p', 'span'].includes(tagName) ? 'text' :
                     tagName === 'ul' ? 'list' :
                     'frame';
        
        nodes[id] = {
          id,
          type,
          tag: tagName,
          style,
          text,
          children: []
        };
      }
    });
    
    if (Object.keys(nodes).length === 0) {
      throw new Error(`No elements with id attributes found in ${filename}`);
    }
    
    return nodes;
  } catch (err) {
    // Fallback to regex parsing if AST parsing fails
    console.log(`  ⚠️  AST parsing failed (${err.message}), falling back to regex parser`);
    return parseTSXToNodesRegex(code, filename);
  }
}

// Legacy regex parser fallback (clearly labeled)
function parseTSXToNodesRegex(code, filename) {
  const idPattern = /id="([^"]+)"/g;
  const matches = [...code.matchAll(idPattern)];
  
  if (matches.length === 0) {
    throw new Error(`No elements with id attributes found in ${filename}`);
  }

  const nodes = {};
  
  for (const match of matches) {
    const id = match[1];
    const startIdx = match.index;
    const elementEnd = code.indexOf('>', startIdx);
    const closingTag = code.indexOf(`</${code.substring(startIdx + 1, code.indexOf(' ', startIdx))}`, elementEnd);
    
    let elementCode = code.substring(startIdx, closingTag > 0 ? closingTag : code.length);
    
    const styleMatch = elementCode.match(/style=\{\{([^}]+)\}\}/s);
    const style = {};
    
    if (styleMatch) {
      const styleContent = styleMatch[1];
      const styleProps = styleContent.split(',');
      
      for (const prop of styleProps) {
        const [key, value] = prop.split(':').map(s => s.trim());
        if (key && value) {
          const cleanKey = key.replace(/['"]/g, '');
          let cleanValue = value.replace(/['"]/g, '').replace(/,$/, '');
          
          if (!isNaN(cleanValue)) {
            cleanValue = parseInt(cleanValue, 10);
          }
          
          style[cleanKey] = cleanValue;
        }
      }
    }
    
    const tagMatch = elementCode.match(/<(\w+)/);
    const tag = tagMatch ? tagMatch[1] : 'div';
    
    const textMatch = elementCode.match(/>\s*([^<]+)\s*</);
    const text = textMatch ? textMatch[1].trim() : '';
    
    const type = tag === 'button' ? 'button' : 
                 tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'p' ? 'text' : 
                 'frame';
    
    nodes[id] = {
      id,
      type,
      tag,
      style,
      text,
      children: []
    };
  }
  
  return nodes;
}

async function checkFile(filepath, policy) {
  const code = readFileSync(filepath, 'utf-8');
  const filename = filepath.split('/').pop();
  
  console.log(`\nChecking ${filename}...`);
  
  let nodes;
  try {
    nodes = parseTSXToNodes(code, filename);
  } catch (err) {
    console.log(`  ⚠️  Skipped: ${err.message}`);
    return { errors: 0, warnings: 0, skipped: true, filepath };
  }
  
  const { evaluateReceipts } = await loadReceiptPolicy();
  
  const rootNode = Object.values(nodes)[0];
  const result = evaluateReceipts(nodes, rootNode, policy, new Set());
  
  const errors = result.rules.filter(r => !r.valid && r.severity === 'error');
  const warnings = result.rules.filter(r => !r.valid && r.severity === 'warning');
  
  if (errors.length > 0) {
    console.log(`  ❌ ${errors.length} error(s) — BLOCKING:`);
    for (const rule of errors) {
      console.log(`     • ${rule.title}`);
      console.log(`       ${rule.desc}`);
      if (rule.fixLabel) {
        console.log(`       → Fix: ${rule.fixLabel}`);
      }
    }
  }
  
  if (warnings.length > 0) {
    console.log(`  ⚠️  ${warnings.length} warning(s) — non-blocking:`);
    for (const rule of warnings) {
      console.log(`     • ${rule.title}`);
      console.log(`       ${rule.desc}`);
      if (rule.fixLabel) {
        console.log(`       → Suggestion: ${rule.fixLabel}`);
      }
    }
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`  ✅ All receipts passed`);
  }
  
  return { errors: errors.length, warnings: warnings.length, skipped: false, filepath };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Designer\'s Receipts Gate — Receipt policy checker for CI/pre-merge');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/check-receipts.mjs <file.tsx> [file2.tsx ...]');
    console.log('  node scripts/check-receipts.mjs --config=.bluepainter.json <files>');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/check-receipts.mjs src/components/Button.tsx');
    console.log('  node scripts/check-receipts.mjs extension/test-fixtures/*.tsx');
    console.log('  node scripts/check-receipts.mjs --config=custom.json src/**/*.tsx');
    console.log('');
    console.log('Exit Codes:');
    console.log('  0 = All checks passed (warnings allowed)');
    console.log('  1 = Error-severity findings detected (blocks merge)');
    console.log('');
    console.log('Receipt Severity:');
    console.log('  ERROR (blocks merge): WCAG contrast failures');
    console.log('  WARNING (non-blocking): Spacing, radius, CTA copy, feature count');
    process.exit(args.length === 0 ? 1 : 0);
  }
  
  let configPath = '.bluepainter.json';
  let files = [];
  
  for (const arg of args) {
    if (arg.startsWith('--config=')) {
      configPath = arg.substring(9);
    } else {
      files.push(arg);
    }
  }
  
  const customPolicy = loadConfig(configPath);
  const policy = customPolicy || getDefaultPolicy();
  
  if (customPolicy) {
    console.log(`✓ Loaded policy from ${configPath}`);
  } else {
    console.log(`ℹ Using default policy (no ${configPath} found)`);
  }
  
  let totalErrors = 0;
  let totalWarnings = 0;
  let checked = 0;
  let skipped = 0;
  const results = [];
  
  for (const file of files) {
    const result = await checkFile(file, policy);
    results.push(result);
    if (result.skipped) {
      skipped++;
    } else {
      checked++;
      totalErrors += result.errors;
      totalWarnings += result.warnings;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('RECEIPT GATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`Checked: ${checked} file(s)`);
  if (skipped > 0) {
    console.log(`Skipped: ${skipped} file(s)`);
  }
  console.log(`Errors (blocking): ${totalErrors}`);
  console.log(`Warnings (non-blocking): ${totalWarnings}`);
  
  const filesWithErrors = results.filter(r => !r.skipped && r.errors > 0);
  if (filesWithErrors.length > 0) {
    console.log('\n❌ FILES WITH BLOCKING ERRORS:');
    for (const result of filesWithErrors) {
      console.log(`   • ${result.filepath} (${result.errors} error(s))`);
    }
  }
  
  if (totalErrors > 0) {
    console.log('\n❌ RECEIPT GATE FAILED');
    console.log('Fix error-severity findings before merge. Warnings are non-blocking.');
    console.log('Exit code: 1');
    process.exit(1);
  }
  
  console.log('\n✅ RECEIPT GATE PASSED');
  if (totalWarnings > 0) {
    console.log(`Note: ${totalWarnings} warning(s) present but non-blocking`);
  }
  console.log('Exit code: 0');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
