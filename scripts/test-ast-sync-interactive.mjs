#!/usr/bin/env node
/**
 * AST sync tests for interactive UI patterns
 * Tests tooltips, popovers, pagination, breadcrumbs, etc.
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Interactive UI Patterns ===\n');

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

// Test 1: Tooltip component
test('Tooltip with hover target and content', () => {
  const code = `
export function TooltipDemo() {
  return (
    <div id="tooltip-container">
      <button id="tooltip-trigger">Hover me</button>
      <div id="tooltip-content">
        <p id="tooltip-text">Helpful tip here</p>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'tooltip-container': { id: 'tooltip-container', type: 'container', tag: 'div', style: { position: 'relative', display: 'inline-block' } },
    'tooltip-trigger': { id: 'tooltip-trigger', type: 'button', tag: 'button', text: 'Help', style: { padding: 8, background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'help' } },
    'tooltip-content': { id: 'tooltip-content', type: 'container', tag: 'div', style: { position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8, padding: 8, background: '#1f2937', color: '#fff', borderRadius: 4, fontSize: 14, whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' } },
    'tooltip-text': { id: 'tooltip-text', type: 'text', tag: 'p', text: 'Click to open settings and customize your experience', style: { margin: 0, fontSize: 14, lineHeight: 1.4 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Help', 'Tooltip trigger updated');
  assertIncludes(patched, 'customize your experience', 'Tooltip content updated');
  assertIncludes(patched, 'transform:', 'Tooltip positioning applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['tooltip-text'].text, 'Click to open settings and customize your experience', 'Tooltip text round-tripped');
});

// Test 2: Popover with content
test('Popover with rich content', () => {
  const code = `
export function Popover() {
  return (
    <div id="popover-root">
      <button id="popover-trigger">Options</button>
      <div id="popover-panel">
        <div id="popover-header">
          <h3 id="popover-title">Actions</h3>
        </div>
        <div id="popover-body">
          <p id="popover-description">Choose an action</p>
          <button id="popover-action-1">Edit</button>
          <button id="popover-action-2">Delete</button>
        </div>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'popover-root': { id: 'popover-root', type: 'container', tag: 'div', style: { position: 'relative', display: 'inline-block' } },
    'popover-trigger': { id: 'popover-trigger', type: 'button', tag: 'button', text: 'More Options', style: { padding: 10, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' } },
    'popover-panel': { id: 'popover-panel', type: 'container', tag: 'div', style: { position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 300, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', zIndex: 50 } },
    'popover-header': { id: 'popover-header', type: 'container', tag: 'div', style: { padding: 16, borderBottom: '1px solid #e5e7eb' } },
    'popover-title': { id: 'popover-title', type: 'text', tag: 'h3', text: 'Quick Actions', style: { margin: 0, fontSize: 18, fontWeight: 600 } },
    'popover-body': { id: 'popover-body', type: 'container', tag: 'div', style: { padding: 16, display: 'flex', flexDirection: 'column', gap: 8 } },
    'popover-description': { id: 'popover-description', type: 'text', tag: 'p', text: 'Select an action to perform on this item', style: { margin: 0, marginBottom: 12, fontSize: 14, color: '#6b7280' } },
    'popover-action-1': { id: 'popover-action-1', type: 'button', tag: 'button', text: 'Edit Item', style: { padding: 10, background: '#f3f4f6', border: 'none', borderRadius: 4, textAlign: 'left', cursor: 'pointer', fontWeight: 500 } },
    'popover-action-2': { id: 'popover-action-2', type: 'button', tag: 'button', text: 'Delete Item', style: { padding: 10, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 4, textAlign: 'left', cursor: 'pointer', fontWeight: 500 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Quick Actions', 'Popover title updated');
  assertIncludes(patched, 'Select an action', 'Popover description updated');
  assertIncludes(patched, 'zIndex', 'z-index applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['popover-title'].text, 'Quick Actions', 'Popover title round-tripped');
});

// Test 3: Pagination component
test('Pagination with numbered pages', () => {
  const code = `
export function Pagination() {
  return (
    <div id="pagination">
      <button id="prev">Prev</button>
      <button id="page-1">1</button>
      <button id="page-2">2</button>
      <button id="page-3">3</button>
      <button id="next">Next</button>
    </div>
  );
}`;

  const nodesMap = {
    'pagination': { id: 'pagination', type: 'container', tag: 'div', style: { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' } },
    'prev': { id: 'prev', type: 'button', tag: 'button', text: '← Previous', style: { padding: 10, background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontWeight: 500 } },
    'page-1': { id: 'page-1', type: 'button', tag: 'button', text: '1', style: { padding: 10, minWidth: 40, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 } },
    'page-2': { id: 'page-2', type: 'button', tag: 'button', text: '2', style: { padding: 10, minWidth: 40, background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' } },
    'page-3': { id: 'page-3', type: 'button', tag: 'button', text: '3', style: { padding: 10, minWidth: 40, background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' } },
    'next': { id: 'next', type: 'button', tag: 'button', text: 'Next →', style: { padding: 10, background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontWeight: 500 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Previous', 'Prev button updated');
  assertIncludes(patched, 'Next', 'Next button updated');
  assertIncludes(patched, 'minWidth', 'Page button sizing applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['prev'].text, '← Previous', 'Prev button round-tripped');
  assertEqual(parsed['page-1'].text, '1', 'Page number round-tripped');
});

// Test 4: Breadcrumb navigation
test('Breadcrumb navigation with separators', () => {
  const code = `
export function Breadcrumbs() {
  return (
    <nav id="breadcrumb-nav">
      <a id="crumb-home" href="/">Home</a>
      <span id="sep-1">/</span>
      <a id="crumb-category" href="/category">Category</a>
      <span id="sep-2">/</span>
      <span id="crumb-current">Current</span>
    </nav>
  );
}`;

  const nodesMap = {
    'breadcrumb-nav': { id: 'breadcrumb-nav', type: 'container', tag: 'nav', style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 } },
    'crumb-home': { id: 'crumb-home', type: 'link', tag: 'a', text: 'Dashboard', href: '/', style: { color: '#2563eb', textDecoration: 'none' } },
    'sep-1': { id: 'sep-1', type: 'text', tag: 'span', text: '›', style: { color: '#9ca3af' } },
    'crumb-category': { id: 'crumb-category', type: 'link', tag: 'a', text: 'Projects', href: '/projects', style: { color: '#2563eb', textDecoration: 'none' } },
    'sep-2': { id: 'sep-2', type: 'text', tag: 'span', text: '›', style: { color: '#9ca3af' } },
    'crumb-current': { id: 'crumb-current', type: 'text', tag: 'span', text: 'BluePainter Studio', style: { color: '#374151', fontWeight: 600 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Dashboard', 'Home crumb updated');
  assertIncludes(patched, 'Projects', 'Category crumb updated');
  assertIncludes(patched, 'BluePainter Studio', 'Current crumb updated');
  assertIncludes(patched, '/projects', 'Breadcrumb href updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['crumb-home'].text, 'Dashboard', 'Breadcrumb round-tripped');
  assertEqual(parsed['crumb-current'].text, 'BluePainter Studio', 'Current crumb round-tripped');
});

// Test 5: Loading spinner
test('Loading spinner with text', () => {
  const code = `
export function LoadingSpinner() {
  return (
    <div id="loading-container">
      <div id="spinner"></div>
      <p id="loading-text">Loading...</p>
    </div>
  );
}`;

  const nodesMap = {
    'loading-container': { id: 'loading-container', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40 } },
    'spinner': { id: 'spinner', type: 'container', tag: 'div', style: { width: 40, height: 40, border: '4px solid #e5e7eb', borderTop: '4px solid #2563eb', borderRadius: '50%' } },
    'loading-text': { id: 'loading-text', type: 'text', tag: 'p', text: 'Processing your request, please wait...', style: { margin: 0, fontSize: 16, color: '#6b7280', textAlign: 'center' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Processing your request', 'Loading text updated');
  assertIncludes(patched, '50%', 'Spinner circle shape applied');
  assertIncludes(patched, 'borderTop:', 'Spinner color applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['loading-text'].text, 'Processing your request, please wait...', 'Loading text round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All interactive UI tests passed!');
