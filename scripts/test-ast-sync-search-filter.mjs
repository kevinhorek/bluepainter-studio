#!/usr/bin/env node
/**
 * AST sync tests for search, filter, and data manipulation patterns
 * Tests search bars, filters, sort controls, and notifications
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Search, Filter & Data Patterns ===\n');

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

// Test 1: Search bar with icon
test('Search bar with icon and placeholder', () => {
  const code = `
export function SearchBar() {
  return (
    <div id="search-container">
      <div id="search-icon">🔍</div>
      <input id="search-input" type="text" placeholder="Search..." />
      <button id="search-button">Search</button>
    </div>
  );
}`;

  const nodesMap = {
    'search-container': { id: 'search-container', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', padding: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, gap: 8 } },
    'search-icon': { id: 'search-icon', type: 'text', tag: 'div', text: '🔍', style: { fontSize: 20, color: '#6b7280' } },
    'search-input': { id: 'search-input', type: 'input', tag: 'input', inputType: 'text', placeholder: 'Search projects, files, or documentation...', style: { flex: 1, padding: 8, border: 'none', background: 'transparent', fontSize: 16, outline: 'none' } },
    'search-button': { id: 'search-button', type: 'button', tag: 'button', text: 'Search', style: { padding: 10, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Search projects', 'Search placeholder updated');
  assertIncludes(patched, 'flex: 1', 'Input flex styling applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['search-input'].placeholder, 'Search projects, files, or documentation...', 'Placeholder round-tripped');
});

// Test 2: Filter chips with remove buttons
test('Filter chips with active states', () => {
  const code = `
export function FilterChips() {
  return (
    <div id="filter-container">
      <span id="filter-label">Filters:</span>
      <div id="chip-1">
        <span id="chip-1-text">Active</span>
        <button id="chip-1-remove">×</button>
      </div>
      <div id="chip-2">
        <span id="chip-2-text">Recent</span>
        <button id="chip-2-remove">×</button>
      </div>
      <button id="clear-all">Clear</button>
    </div>
  );
}`;

  const nodesMap = {
    'filter-container': { id: 'filter-container', type: 'container', tag: 'div', style: { display: 'flex', gap: 8, alignItems: 'center', padding: 12, background: '#f9fafb', borderRadius: 8 } },
    'filter-label': { id: 'filter-label', type: 'text', tag: 'span', text: 'Active Filters:', style: { fontSize: 14, fontWeight: 600, color: '#374151' } },
    'chip-1': { id: 'chip-1', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 6, padding: 8, background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 16, fontSize: 14 } },
    'chip-1-text': { id: 'chip-1-text', type: 'text', tag: 'span', text: 'Status: Active', style: { color: '#1e40af', fontWeight: 500 } },
    'chip-1-remove': { id: 'chip-1-remove', type: 'button', tag: 'button', text: '×', style: { padding: 0, width: 18, height: 18, background: 'transparent', border: 'none', color: '#1e40af', fontSize: 18, cursor: 'pointer', lineHeight: 1 } },
    'chip-2': { id: 'chip-2', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 6, padding: 8, background: '#dcfce7', border: '1px solid #86efac', borderRadius: 16, fontSize: 14 } },
    'chip-2-text': { id: 'chip-2-text', type: 'text', tag: 'span', text: 'Type: Project', style: { color: '#166534', fontWeight: 500 } },
    'chip-2-remove': { id: 'chip-2-remove', type: 'button', tag: 'button', text: '×', style: { padding: 0, width: 18, height: 18, background: 'transparent', border: 'none', color: '#166534', fontSize: 18, cursor: 'pointer', lineHeight: 1 } },
    'clear-all': { id: 'clear-all', type: 'button', tag: 'button', text: 'Clear All Filters', style: { padding: 8, background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14, color: '#6b7280', cursor: 'pointer' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Status: Active', 'Filter chip text updated');
  assertIncludes(patched, 'Clear All Filters', 'Clear button updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['chip-1-text'].text, 'Status: Active', 'Chip text round-tripped');
});

// Test 3: Sort dropdown
test('Sort dropdown with options', () => {
  const code = `
export function SortControl() {
  return (
    <div id="sort-container">
      <label id="sort-label">Sort by:</label>
      <select id="sort-select">
        <option id="option-recent">Recent</option>
        <option id="option-name">Name</option>
        <option id="option-size">Size</option>
      </select>
    </div>
  );
}`;

  const nodesMap = {
    'sort-container': { id: 'sort-container', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 8 } },
    'sort-label': { id: 'sort-label', type: 'text', tag: 'label', text: 'Sort by:', style: { fontSize: 14, fontWeight: 600, color: '#374151' } },
    'sort-select': { id: 'sort-select', type: 'input', tag: 'select', style: { padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: '#fff', cursor: 'pointer' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Sort by:', 'Sort label updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['sort-label'].text, 'Sort by:', 'Label round-tripped');
});

// Test 4: Notification toast
test('Notification toast with icon and actions', () => {
  const code = `
export function Toast() {
  return (
    <div id="toast">
      <div id="toast-icon">✓</div>
      <div id="toast-content">
        <p id="toast-title">Success</p>
        <p id="toast-message">Your changes have been saved.</p>
      </div>
      <button id="toast-dismiss">×</button>
    </div>
  );
}`;

  const nodesMap = {
    'toast': { id: 'toast', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', maxWidth: 400 } },
    'toast-icon': { id: 'toast-icon', type: 'text', tag: 'div', style: { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#22c55e', color: '#fff', borderRadius: '50%', fontSize: 20, fontWeight: 'bold' } },
    'toast-content': { id: 'toast-content', type: 'container', tag: 'div', style: { flex: 1 } },
    'toast-title': { id: 'toast-title', type: 'text', tag: 'p', text: 'Successfully Saved', style: { margin: 0, marginBottom: 4, fontSize: 16, fontWeight: 600, color: '#166534' } },
    'toast-message': { id: 'toast-message', type: 'text', tag: 'p', text: 'All your changes have been saved and synced to the cloud.', style: { margin: 0, fontSize: 14, color: '#166534', lineHeight: 1.5 } },
    'toast-dismiss': { id: 'toast-dismiss', type: 'button', tag: 'button', text: '×', style: { padding: 0, width: 24, height: 24, background: 'transparent', border: 'none', color: '#166534', fontSize: 24, cursor: 'pointer', lineHeight: 1 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Successfully Saved', 'Toast title updated');
  assertIncludes(patched, 'synced to the cloud', 'Toast message updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['toast-title'].text, 'Successfully Saved', 'Toast title round-tripped');
});

// Test 5: Empty state
test('Empty state with icon and CTA', () => {
  const code = `
export function EmptyState() {
  return (
    <div id="empty-container">
      <div id="empty-icon">📂</div>
      <h2 id="empty-title">No items found</h2>
      <p id="empty-message">Get started by creating your first item.</p>
      <button id="empty-cta">Create Item</button>
    </div>
  );
}`;

  const nodesMap = {
    'empty-container': { id: 'empty-container', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64, textAlign: 'center', gap: 16 } },
    'empty-icon': { id: 'empty-icon', type: 'text', tag: 'div', text: '📦', style: { fontSize: 64, opacity: 0.5 } },
    'empty-title': { id: 'empty-title', type: 'text', tag: 'h2', text: 'No Projects Yet', style: { margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' } },
    'empty-message': { id: 'empty-message', type: 'text', tag: 'p', text: 'Create your first project to start building amazing things.', style: { margin: 0, fontSize: 16, color: '#6b7280', maxWidth: 400, lineHeight: 1.6 } },
    'empty-cta': { id: 'empty-cta', type: 'button', tag: 'button', text: 'Create Your First Project', style: { padding: 16, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'No Projects Yet', 'Empty title updated');
  assertIncludes(patched, 'Create Your First Project', 'CTA updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['empty-title'].text, 'No Projects Yet', 'Title round-tripped');
  assertEqual(parsed['empty-message'].text, 'Create your first project to start building amazing things.', 'Message round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All search & filter tests passed!');
