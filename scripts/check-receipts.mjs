#!/usr/bin/env node

/**
 * Receipt gate checker — run in CI or pre-merge
 * Evaluates Designer's Receipts on TSX files and fails on error-severity findings.
 * 
 * Usage:
 *   node scripts/check-receipts.mjs [file1.tsx] [file2.tsx]
 *   node scripts/check-receipts.mjs extension/test-fixtures/*.tsx
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

async function loadReceiptEngine() {
  const receiptPolicyPath = join(repoRoot, 'src/utils/receiptPolicy.js');
  const receiptModule = await import(`file://${receiptPolicyPath}`);
  return receiptModule;
}

function parseTSXToNodes(code, filename) {
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

async function checkFile(filepath) {
  const code = readFileSync(filepath, 'utf-8');
  const filename = filepath.split('/').pop();
  
  console.log(`\nChecking ${filename}...`);
  
  let nodes;
  try {
    nodes = parseTSXToNodes(code, filename);
  } catch (err) {
    console.log(`  ⚠️  Skipped: ${err.message}`);
    return { errors: 0, warnings: 0, skipped: true };
  }
  
  const { evaluateReceipts } = await loadReceiptEngine();
  
  const policy = {
    spacingGrid: 8,
    radiusGrid: 4,
    minContrastRatio: 4.5,
    maxFeatureCount: 5,
    weakCtaWords: ['submit', 'click here', 'send', 'button', 'ok', 'enter'],
    suggestedCta: 'Start free trial',
    contrastFixColor: '#1e40af'
  };
  
  const rootNode = Object.values(nodes)[0];
  const result = evaluateReceipts(nodes, rootNode, policy, new Set());
  
  const errors = result.rules.filter(r => !r.valid && r.severity === 'error');
  const warnings = result.rules.filter(r => !r.valid && r.severity === 'warning');
  
  if (errors.length > 0) {
    console.log(`  ❌ ${errors.length} error(s):`);
    for (const rule of errors) {
      console.log(`     • ${rule.title}`);
      console.log(`       ${rule.desc}`);
    }
  }
  
  if (warnings.length > 0) {
    console.log(`  ⚠️  ${warnings.length} warning(s):`);
    for (const rule of warnings) {
      console.log(`     • ${rule.title}`);
      console.log(`       ${rule.desc}`);
    }
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`  ✅ All receipts passed`);
  }
  
  return { errors: errors.length, warnings: warnings.length, skipped: false };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node scripts/check-receipts.mjs <file.tsx> [file2.tsx ...]');
    console.error('Example: node scripts/check-receipts.mjs extension/test-fixtures/*.tsx');
    process.exit(1);
  }
  
  let totalErrors = 0;
  let totalWarnings = 0;
  let checked = 0;
  let skipped = 0;
  
  for (const file of args) {
    const result = await checkFile(file);
    if (result.skipped) {
      skipped++;
    } else {
      checked++;
      totalErrors += result.errors;
      totalWarnings += result.warnings;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Checked ${checked} file(s), skipped ${skipped}`);
  console.log(`Total: ${totalErrors} error(s), ${totalWarnings} warning(s)`);
  
  if (totalErrors > 0) {
    console.log('\n❌ Receipt gate FAILED — fix error-severity findings before merge');
    process.exit(1);
  }
  
  console.log('\n✅ Receipt gate passed');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
