#!/usr/bin/env node
/**
 * AST sync edge case tests
 * Tests boundary conditions, error recovery, and robustness
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Edge Case Tests ===\n');

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

function assertNotNull(value, message) {
  if (value === null || value === undefined) {
    throw new Error(`${message}: expected non-null value`);
  }
}

// Test 1: Empty elements (no children)
test('Empty container elements', () => {
  const code = `
export function EmptyContainer() {
  return (
    <div id="outer" style={{ padding: 24 }}>
      <div id="empty"></div>
    </div>
  );
}`;

  const nodesMap = {
    'outer': { id: 'outer', type: 'container', tag: 'div', style: { padding: 32, background: '#f9fafb' } },
    'empty': { id: 'empty', type: 'container', tag: 'div', style: { width: 100, height: 100, background: '#e5e7eb' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'padding: 32', 'Outer padding updated');
  assertIncludes(patched, '#f9fafb', 'Outer background added');
  assertIncludes(patched, 'width: 100', 'Empty container width added');
  assertIncludes(patched, '#e5e7eb', 'Empty container background added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['empty'].style.width, 100, 'Empty container style round-tripped');
});

// Test 2: Self-closing tags with styles
test('Self-closing tags (br, hr, img)', () => {
  const code = `
export function SelfClosingTags() {
  return (
    <div id="container">
      <img id="avatar" src="/default.jpg" />
      <hr id="divider" />
    </div>
  );
}`;

  const nodesMap = {
    'container': { id: 'container', type: 'container', tag: 'div', style: { padding: 24 } },
    'avatar': { id: 'avatar', type: 'image', tag: 'img', src: '/avatar.png', style: { width: 64, height: 64, borderRadius: '50%' } },
    'divider': { id: 'divider', type: 'line', tag: 'hr', style: { borderColor: '#e5e7eb', margin: 16 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, '/avatar.png', 'Image src updated');
  assertIncludes(patched, '50%', 'Avatar border radius added');
  assertIncludes(patched, 'borderColor', 'Divider color added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['avatar'].src, '/avatar.png', 'Image src round-tripped');
});

// Test 3: Mixed content (text and elements)
test('Mixed text and element content', () => {
  const code = `
export function MixedContent() {
  return (
    <p id="paragraph">
      This is <strong id="bold">bold</strong> text.
    </p>
  );
}`;

  const nodesMap = {
    'paragraph': { id: 'paragraph', type: 'text', tag: 'p', style: { fontSize: 16, lineHeight: 1.6 } },
    'bold': { id: 'bold', type: 'text', tag: 'strong', text: 'emphasized', style: { fontWeight: 900, color: '#2563eb' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'emphasized', 'Bold text updated');
  assertIncludes(patched, 'fontWeight: 900', 'Bold font weight added');
  assertIncludes(patched, '#2563eb', 'Bold color added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['bold'].text, 'emphasized', 'Bold text round-tripped');
});

// Test 4: Comments preservation
test('Preserve comments in code', () => {
  const code = `
export function WithComments() {
  return (
    // Main container
    <div id="container" style={{ padding: 24 }}>
      {/* Important note: do not remove */}
      <p id="text">Hello</p>
    </div>
  );
}`;

  const nodesMap = {
    'container': { id: 'container', type: 'container', tag: 'div', style: { padding: 32 } },
    'text': { id: 'text', type: 'text', tag: 'p', text: 'Updated', style: { fontSize: 16 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Updated', 'Text updated');
  assertIncludes(patched, 'Main container', 'Line comment preserved');
  assertIncludes(patched, 'Important note', 'Block comment preserved');
});

// Test 5: Zero and negative style values
test('Zero and negative style values', () => {
  const code = `
export function NumericValues() {
  return (
    <div id="box" style={{ padding: 24 }}>
      <p id="text">Content</p>
    </div>
  );
}`;

  const nodesMap = {
    'box': { id: 'box', type: 'container', tag: 'div', style: { padding: 0, margin: -16, zIndex: -1 } },
    'text': { id: 'text', type: 'text', tag: 'p', text: 'Content', style: { marginTop: 0, marginBottom: -8 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'padding: 0', 'Zero padding applied');
  assertIncludes(patched, 'margin: -16', 'Negative margin applied');
  assertIncludes(patched, 'zIndex: -1', 'Negative z-index applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['box'].style.padding, 0, 'Zero padding round-tripped');
  assertEqual(parsed['box'].style.margin, -16, 'Negative margin round-tripped');
});

// Test 6: Very long text content
test('Very long text content', () => {
  const longText = ('This is a very long paragraph that contains a lot of text. '.repeat(20)).trim();
  const code = `
export function LongText() {
  return <p id="paragraph">Short text</p>;
}`;

  const nodesMap = {
    'paragraph': { id: 'paragraph', type: 'text', tag: 'p', text: longText, style: { fontSize: 14 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'very long paragraph', 'Long text included');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['paragraph'].text, longText, 'Long text round-tripped');
});

// Test 7: Deeply nested structure (10+ levels)
test('Deeply nested structure', () => {
  const code = `
export function DeeplyNested() {
  return (
    <div id="l1"><div id="l2"><div id="l3"><div id="l4"><div id="l5">
      <div id="l6"><div id="l7"><div id="l8"><div id="l9"><div id="l10">
        <p id="content">Deep</p>
      </div></div></div></div></div>
    </div></div></div></div></div>
  );
}`;

  const nodesMap = {
    'l1': { id: 'l1', type: 'container', tag: 'div', style: { padding: 1 } },
    'l2': { id: 'l2', type: 'container', tag: 'div', style: { padding: 2 } },
    'l3': { id: 'l3', type: 'container', tag: 'div', style: { padding: 3 } },
    'l4': { id: 'l4', type: 'container', tag: 'div', style: { padding: 4 } },
    'l5': { id: 'l5', type: 'container', tag: 'div', style: { padding: 5 } },
    'l6': { id: 'l6', type: 'container', tag: 'div', style: { padding: 6 } },
    'l7': { id: 'l7', type: 'container', tag: 'div', style: { padding: 7 } },
    'l8': { id: 'l8', type: 'container', tag: 'div', style: { padding: 8 } },
    'l9': { id: 'l9', type: 'container', tag: 'div', style: { padding: 9 } },
    'l10': { id: 'l10', type: 'container', tag: 'div', style: { padding: 10 } },
    'content': { id: 'content', type: 'text', tag: 'p', text: 'Very Deep Content', style: { fontSize: 16 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Very Deep Content', 'Deep content updated');
  assertIncludes(patched, 'padding: 10', 'Level 10 padding updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['content'].text, 'Very Deep Content', 'Deep content round-tripped');
  assertEqual(parsed['l10'].style.padding, 10, 'Deep padding round-tripped');
});

// Test 8: Empty string text content
test('Empty string text content', () => {
  const code = `
export function EmptyText() {
  return <p id="text">Original text</p>;
}`;

  const nodesMap = {
    'text': { id: 'text', type: 'text', tag: 'p', text: '', style: { fontSize: 16 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'fontSize: 16', 'Style applied even with empty text');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['text'].text, '', 'Empty text round-tripped');
});

// Test 9: Special characters in text
test('Special characters in text content', () => {
  const code = `
export function SpecialChars() {
  return <p id="text">Normal</p>;
}`;

  const specialText = 'Price: $99 & "free" shipping! 10% off today';
  const nodesMap = {
    'text': { id: 'text', type: 'text', tag: 'p', text: specialText, style: {} }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, '$99', 'Dollar sign preserved');
  assertIncludes(patched, 'free', 'Quoted text preserved');
  assertIncludes(patched, '10%', 'Percent sign preserved');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['text'].text, specialText, 'Special characters round-tripped');
});

// Test 10: Whitespace handling
test('Whitespace preservation in text', () => {
  const code = `
export function Whitespace() {
  return (
    <p id="text">
      Line 1
      Line 2
    </p>
  );
}`;

  const nodesMap = {
    'text': { id: 'text', type: 'text', tag: 'p', text: 'Single line', style: { whiteSpace: 'pre-wrap' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Single line', 'Text updated');
  assertIncludes(patched, 'whiteSpace', 'Whitespace style added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['text'].text, 'Single line', 'Text round-tripped');
  assertEqual(parsed['text'].style.whiteSpace, 'pre-wrap', 'Whitespace style round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All edge case tests passed!');
