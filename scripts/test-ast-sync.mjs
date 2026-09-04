#!/usr/bin/env node
// Test AST sync consistency using shared package

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const require = createRequire(import.meta.url);

// Import shared engine (CommonJS via require)
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

// Test fixtures
const fixtures = [
  {
    name: 'PricingCard',
    path: join(rootDir, 'extension/test-fixtures/PricingCard.tsx'),
    nodes: {
      'cta-button': {
        id: 'cta-button',
        type: 'button',
        tag: 'button',
        style: {
          width: '100%',
          background: '#1E40AF',
          color: '#ffffff',
          padding: 12,
          borderRadius: 8
        },
        text: 'Submit'
      },
      'header-text': {
        id: 'header-text',
        type: 'text',
        tag: 'h3',
        style: {
          textTransform: 'uppercase',
          fontSize: 12,
          fontWeight: 700,
          color: '#64748b'
        },
        text: 'PRO'
      }
    }
  }
];

let passed = 0;
let failed = 0;

console.log('Testing AST sync using shared package\n');

for (const fixture of fixtures) {
  console.log(`Testing fixture: ${fixture.name}`);
  const code = readFileSync(fixture.path, 'utf-8');

  // Test 1: Parse
  console.log('  [1/3] Testing parse...');
  const parsed = parseTSXWithAST(code, fixture.nodes);

  if (!parsed) {
    console.log('    ❌ Parse failed');
    failed++;
  } else {
    const parsedKeys = Object.keys(parsed).sort();
    console.log('    ✓ Parse successful: parsed', parsedKeys.length, 'nodes');
    passed++;
  }

  // Test 2: Patch generates valid code
  console.log('  [2/3] Testing patch validity...');
  const modifiedNodes = JSON.parse(JSON.stringify(fixture.nodes));
  modifiedNodes['cta-button'].text = 'Start free trial';
  modifiedNodes['cta-button'].style.background = '#2563eb';

  const patched = patchTSXWithAST(code, modifiedNodes);

  if (!patched) {
    console.log('    ❌ Patch failed');
    failed++;
  } else {
    const valid = patched.includes('Start free trial') && patched.includes('#2563eb');
    
    if (valid) {
      console.log('    ✓ Patch validity: changes applied correctly');
      passed++;
    } else {
      console.log('    ❌ Patch validity: changes not applied correctly');
      failed++;
    }
  }

  // Test 3: Round-trip preserves formatting
  console.log('  [3/3] Testing round-trip formatting preservation...');
  const roundTripped = patchTSXWithAST(code, fixture.nodes);
  
  if (!roundTripped) {
    console.log('    ❌ Round-trip failed');
    failed++;
  } else {
    const hasExportKeyword = roundTripped.includes('export function');
    const hasOriginalIndent = roundTripped.includes('      style={{');
    
    if (hasExportKeyword && hasOriginalIndent) {
      console.log('    ✓ Round-trip: formatting preserved');
      passed++;
    } else {
      console.log('    ❌ Round-trip: formatting not preserved');
      if (!hasExportKeyword) console.log('      Missing export keyword');
      if (!hasOriginalIndent) console.log('      Indentation changed');
      failed++;
    }
  }

  console.log('');
}

// Summary
console.log('─'.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('─'.repeat(60));

if (failed > 0) {
  console.log('\n❌ AST sync consistency test FAILED');
  process.exit(1);
} else {
  console.log('\n✓ All AST sync consistency tests PASSED');
  process.exit(0);
}
