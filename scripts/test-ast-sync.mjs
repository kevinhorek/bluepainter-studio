#!/usr/bin/env node
// Test AST sync consistency between Studio and extension engines

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Import Studio engine (ES modules)
const { parseTSXWithAST: studioParseAST, patchTSXWithAST: studioPatchAST } = await import(
  join(rootDir, 'src/utils/astSyncEngine.js')
);

// Import extension engine (CommonJS via dynamic import)
const { parseTSXWithAST: extParseAST, patchTSXWithAST: extPatchAST } = await import(
  join(rootDir, 'extension/lib/astSyncEngine.js')
);

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

console.log('Testing AST sync consistency between Studio and extension engines\n');

for (const fixture of fixtures) {
  console.log(`Testing fixture: ${fixture.name}`);
  const code = readFileSync(fixture.path, 'utf-8');

  // Test 1: Parse consistency
  console.log('  [1/3] Testing parse consistency...');
  const studioParsed = studioParseAST(code, fixture.nodes);
  const extParsed = extParseAST(code, fixture.nodes);

  if (!studioParsed) {
    console.log('    ❌ Studio parse failed');
    failed++;
  } else if (!extParsed) {
    console.log('    ❌ Extension parse failed');
    failed++;
  } else {
    const studioKeys = Object.keys(studioParsed).sort();
    const extKeys = Object.keys(extParsed).sort();
    
    if (JSON.stringify(studioKeys) === JSON.stringify(extKeys)) {
      console.log('    ✓ Parse consistency: both engines parsed same nodes');
      passed++;
    } else {
      console.log('    ❌ Parse consistency: different node keys');
      console.log('      Studio:', studioKeys);
      console.log('      Extension:', extKeys);
      failed++;
    }
  }

  // Test 2: Patch generates valid code
  console.log('  [2/3] Testing patch validity...');
  const modifiedNodes = JSON.parse(JSON.stringify(fixture.nodes));
  modifiedNodes['cta-button'].text = 'Start free trial';
  modifiedNodes['cta-button'].style.background = '#2563eb';

  const studioPatched = studioPatchAST(code, modifiedNodes);
  const extPatched = extPatchAST(code, modifiedNodes);

  if (!studioPatched) {
    console.log('    ❌ Studio patch failed');
    failed++;
  } else if (!extPatched) {
    console.log('    ❌ Extension patch failed');
    failed++;
  } else {
    const studioValid = studioPatched.includes('Start free trial') && studioPatched.includes('#2563eb');
    const extValid = extPatched.includes('Start free trial') && extPatched.includes('#2563eb');
    
    if (studioValid && extValid) {
      console.log('    ✓ Patch validity: both engines applied changes correctly');
      passed++;
    } else {
      console.log('    ❌ Patch validity: changes not applied correctly');
      if (!studioValid) console.log('      Studio patch missing expected changes');
      if (!extValid) console.log('      Extension patch missing expected changes');
      failed++;
    }
  }

  // Test 3: Round-trip preserves formatting
  console.log('  [3/3] Testing round-trip formatting preservation...');
  const roundTripped = studioPatchAST(code, fixture.nodes);
  
  if (!roundTripped) {
    console.log('    ❌ Round-trip failed');
    failed++;
  } else {
    // Check that original formatting markers are preserved
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
