#!/usr/bin/env node
/**
 * Integration test for own-repo real-file workflow
 * Tests: Studio load → validate → parse → edit → patch
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const require = createRequire(import.meta.url);

const { parseTSXWithAST, patchTSXWithAST, detectStyleSources } = require('@bluepainter/shared/astSyncEngine');

console.log('=== Real-File Workflow Integration Tests ===\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
    testsFailed++;
  }
}

// Load real test fixture
const pricingCardPath = join(rootDir, 'extension/test-fixtures/PricingCard.tsx');
const pricingCode = readFileSync(pricingCardPath, 'utf-8');

// Test 1: detectStyleSources
test('Detect style sources in real component', () => {
  const sources = detectStyleSources(pricingCode);
  if (!sources.hasInlineStyles) {
    throw new Error('Failed to detect inline styles');
  }
});

// Test 2: Parse with base nodes
test('Parse real component with base nodes', () => {
  const baseNodes = {
    'cta-button': { id: 'cta-button', type: 'button', tag: 'button', style: {}, text: '', children: [] }
  };
  const parsed = parseTSXWithAST(pricingCode, baseNodes);
  if (!parsed || !parsed['cta-button']) throw new Error('Parse failed');
  if (!parsed['cta-button'].style || typeof parsed['cta-button'].style.background === 'undefined') {
    throw new Error('Failed to extract styles');
  }
});

// Test 3: Edit and patch
test('Edit component and generate patched code', () => {
  const baseNodes = {
    'cta-button': { id: 'cta-button', type: 'button', tag: 'button', style: {}, text: '', children: [] }
  };
  const parsed = parseTSXWithAST(pricingCode, baseNodes);
  if (!parsed) throw new Error('Parse failed');
  
  const edited = {
    ...parsed['cta-button'],
    text: 'Try for Free',
    style: { ...parsed['cta-button'].style, background: '#10b981' }
  };
  
  const patched = patchTSXWithAST(pricingCode, { 'cta-button': edited });
  if (!patched || !patched.includes('Try for Free') || !patched.includes('#10b981')) {
    throw new Error('Patch failed');
  }
});

// Test 4: Round-trip
test('Round-trip: parse → patch → parse', () => {
  const baseNodes = {
    'header-text': { id: 'header-text', type: 'text', tag: 'h3', style: {}, text: '', children: [] }
  };
  const parsed1 = parseTSXWithAST(pricingCode, baseNodes);
  if (!parsed1) throw new Error('Initial parse failed');
  
  const edited = {
    ...parsed1['header-text'],
    text: 'PREMIUM',
    style: { ...parsed1['header-text'].style, color: '#1e40af' }
  };
  
  const patched = patchTSXWithAST(pricingCode, { 'header-text': edited });
  if (!patched) throw new Error('Patch failed');
  
  const parsed2 = parseTSXWithAST(patched, baseNodes);
  if (!parsed2 || parsed2['header-text'].text !== 'PREMIUM') {
    throw new Error('Round-trip failed');
  }
});

// Test 5: Formatting preservation
test('Preserve formatting after patch', () => {
  const baseNodes = {
    'cta-button': { id: 'cta-button', type: 'button', tag: 'button', style: {}, text: '', children: [] }
  };
  const parsed = parseTSXWithAST(pricingCode, baseNodes);
  const patched = patchTSXWithAST(pricingCode, parsed);
  
  if (!patched || !patched.includes('export function') || !patched.includes('style={{')) {
    throw new Error('Formatting not preserved');
  }
});

// Test 6: Multiple edits
test('Apply multiple edits in single patch', () => {
  const baseNodes = {
    'cta-button': { id: 'cta-button', type: 'button', tag: 'button', style: {}, text: '', children: [] },
    'header-text': { id: 'header-text', type: 'text', tag: 'h3', style: {}, text: '', children: [] }
  };
  
  const parsed = parseTSXWithAST(pricingCode, baseNodes);
  if (!parsed) throw new Error('Parse failed');
  
  const edits = {
    'cta-button': { ...parsed['cta-button'], text: 'Sign Up Now' },
    'header-text': { ...parsed['header-text'], text: 'ENTERPRISE' }
  };
  
  const patched = patchTSXWithAST(pricingCode, edits);
  if (!patched || !patched.includes('Sign Up Now') || !patched.includes('ENTERPRISE')) {
    throw new Error('Multi-edit failed');
  }
});

console.log('\n============================================================');
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✅ All real-file workflow tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
}
