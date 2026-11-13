#!/usr/bin/env node
/**
 * Advanced AST sync tests — expanded coverage for PricingCard-like patterns
 * Tests button lists, nested containers, complex style updates, and edge cases
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== Advanced AST Sync Tests ===\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`❌ ${name}`);
    console.error(`   ${err.message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertIncludes(str, substring, message) {
  if (!str.includes(substring)) {
    throw new Error(`${message}: expected string to include "${substring}"`);
  }
}

test('Patch button list (multiple buttons)', () => {
  const code = `
export function ButtonList() {
  return (
    <div id="container">
      <button id="btn-1" style={{ background: '#blue' }}>First</button>
      <button id="btn-2" style={{ background: '#green' }}>Second</button>
    </div>
  );
}`;

  const nodesMap = {
    'container': { id: 'container', type: 'container', tag: 'div' },
    'btn-1': { id: 'btn-1', type: 'button', tag: 'button', style: { background: '#ff0000' }, text: 'Updated First' },
    'btn-2': { id: 'btn-2', type: 'button', tag: 'button', style: { background: '#00ff00', padding: 12 }, text: 'Updated Second' }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, '#ff0000', 'First button color updated');
  assertIncludes(patched, '#00ff00', 'Second button color updated');
  assertIncludes(patched, 'Updated First', 'First button text updated');
  assertIncludes(patched, 'Updated Second', 'Second button text updated');
  assertIncludes(patched, 'padding: 12', 'Second button padding added');
});

test('Patch nested containers with multiple style updates', () => {
  const code = `
export function NestedCard() {
  return (
    <div id="outer" style={{ padding: 16 }}>
      <div id="inner" style={{ margin: 8 }}>
        <p id="text">Content</p>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'outer': { id: 'outer', type: 'container', tag: 'div', style: { padding: 24, borderRadius: 8 } },
    'inner': { id: 'inner', type: 'container', tag: 'div', style: { margin: 16, background: '#f0f0f0' } },
    'text': { id: 'text', type: 'text', tag: 'p', text: 'Updated Content', style: { color: '#333' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'padding: 24', 'Outer padding updated');
  assertIncludes(patched, 'borderRadius: 8', 'Border radius added');
  assertIncludes(patched, 'margin: 16', 'Inner margin updated');
  assertIncludes(patched, '#f0f0f0', 'Inner background added');
  assertIncludes(patched, 'Updated Content', 'Text content updated');
  const hasColor = patched.includes("color: '#333'") || patched.includes('color: "#333"') || patched.includes('color: \'#333\'');
  if (!hasColor) {
    throw new Error('Text color added: expected color to be in patched code');
  }
});

test('Patch feature list (ul with multiple li)', () => {
  const code = `
export function FeatureList() {
  return (
    <ul id="features-list" style={{ listStyle: 'none' }}>
      <li id="feature-1">Feature A</li>
      <li id="feature-2">Feature B</li>
      <li id="feature-3">Feature C</li>
    </ul>
  );
}`;

  const nodesMap = {
    'features-list': { id: 'features-list', type: 'list', tag: 'ul', style: { listStyle: 'none', padding: 0 } },
    'feature-1': { id: 'feature-1', type: 'text', tag: 'li', text: 'Updated A', style: { marginBottom: 8 } },
    'feature-2': { id: 'feature-2', type: 'text', tag: 'li', text: 'Updated B', style: { marginBottom: 8 } },
    'feature-3': { id: 'feature-3', type: 'text', tag: 'li', text: 'Updated C', style: { marginBottom: 8 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'padding: 0', 'List padding added');
  assertIncludes(patched, 'Updated A', 'Feature 1 text updated');
  assertIncludes(patched, 'Updated B', 'Feature 2 text updated');
  assertIncludes(patched, 'Updated C', 'Feature 3 text updated');
  assertIncludes(patched, 'marginBottom: 8', 'List item margin added');
});

test('Round-trip with PricingCard pattern', () => {
  const code = `
export function PricingCard() {
  return (
    <div id="card" style={{ padding: 32 }}>
      <h3 id="title">PRO</h3>
      <p id="price">$49/mo</p>
      <ul id="features">
        <li>Feature 1</li>
        <li>Feature 2</li>
      </ul>
      <button id="cta" style={{ background: '#1e40af' }}>Get Started</button>
    </div>
  );
}`;

  const nodesMap = {
    'card': { id: 'card', type: 'container', tag: 'div', style: { padding: 40, borderRadius: 12 } },
    'title': { id: 'title', type: 'text', tag: 'h3', text: 'ENTERPRISE', style: { fontSize: 16 } },
    'price': { id: 'price', type: 'text', tag: 'p', text: '$99/mo', style: { fontWeight: 700 } },
    'cta': { id: 'cta', type: 'button', tag: 'button', style: { background: '#2563eb', padding: 16 }, text: 'Contact Sales' }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  const parsed = parseTSXWithAST(patched, nodesMap);

  assertEqual(parsed['card'].style.padding, 40, 'Card padding round-tripped');
  assertEqual(parsed['card'].style.borderRadius, 12, 'Card border radius round-tripped');
  assertEqual(parsed['title'].text, 'ENTERPRISE', 'Title text round-tripped');
  assertEqual(parsed['price'].text, '$99/mo', 'Price text round-tripped');
  assertEqual(parsed['cta'].text, 'Contact Sales', 'CTA text round-tripped');
  assertEqual(parsed['cta'].style.background, '#2563eb', 'CTA background round-tripped');
});

test('Handle empty style object', () => {
  const code = `
export function EmptyStyle() {
  return <div id="test" style={{}}>Content</div>;
}`;

  const nodesMap = {
    'test': { id: 'test', type: 'container', tag: 'div', style: { padding: 16 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'padding: 16', 'Padding added to empty style');
});

test('Preserve comments and formatting in complex component', () => {
  const code = `
// Component comment
export function Card() {
  return (
    <div id="wrapper">
      {/* Header section */}
      <h1 id="heading">Title</h1>
      
      {/* Content section */}
      <p id="body">Body text</p>
    </div>
  );
}`;

  const nodesMap = {
    'wrapper': { id: 'wrapper', type: 'container', tag: 'div', style: { padding: 24 } },
    'heading': { id: 'heading', type: 'text', tag: 'h1', text: 'Updated Title', style: { color: '#000' } },
    'body': { id: 'body', type: 'text', tag: 'p', text: 'Updated Body', style: { fontSize: 14 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, '// Component comment', 'Line comment preserved');
  assertIncludes(patched, '{/* Header section */}', 'JSX comment preserved');
  assertIncludes(patched, '{/* Content section */}', 'Second JSX comment preserved');
  assertIncludes(patched, 'Updated Title', 'Heading updated');
  assertIncludes(patched, 'Updated Body', 'Body updated');
});

test('Multiple style properties added simultaneously', () => {
  const code = `
export function StyleTest() {
  return <div id="target" style={{ padding: 8 }}>Test</div>;
}`;

  const nodesMap = {
    'target': {
      id: 'target',
      type: 'container',
      tag: 'div',
      style: {
        padding: 16,
        margin: 8,
        borderRadius: 4,
        background: '#ffffff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'padding: 16', 'Padding updated');
  assertIncludes(patched, 'margin: 8', 'Margin added');
  assertIncludes(patched, 'borderRadius: 4', 'Border radius added');
  assertIncludes(patched, '#ffffff', 'Background added');
  assertIncludes(patched, 'boxShadow', 'Box shadow added');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All advanced tests passed!');
