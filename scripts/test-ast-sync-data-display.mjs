#!/usr/bin/env node
/**
 * AST sync tests for data display patterns
 * Tests list views, data cards, comparison tables, tree views, timeline displays
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Data Display Patterns ===\n');

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

// Test 1: User list with avatar and metadata
test('User list with avatars and metadata', () => {
  const code = `
export function UserList() {
  return (
    <div id="user-list">
      <div id="user-1">
        <div id="avatar-1"></div>
        <div id="user-1-info">
          <h4 id="user-1-name">User 1</h4>
          <p id="user-1-role">Role</p>
        </div>
      </div>
      <div id="user-2">
        <div id="avatar-2"></div>
        <div id="user-2-info">
          <h4 id="user-2-name">User 2</h4>
          <p id="user-2-role">Role</p>
        </div>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'user-list': { id: 'user-list', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', gap: 12 } },
    'user-1': { id: 'user-1', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' } },
    'avatar-1': { id: 'avatar-1', type: 'container', tag: 'div', style: { width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } },
    'user-1-info': { id: 'user-1-info', type: 'container', tag: 'div', style: { flex: 1 } },
    'user-1-name': { id: 'user-1-name', type: 'text', tag: 'h4', text: 'Sarah Anderson', style: { margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' } },
    'user-1-role': { id: 'user-1-role', type: 'text', tag: 'p', text: 'Product Manager', style: { margin: 0, fontSize: 14, color: '#6b7280', marginTop: 2 } },
    'user-2': { id: 'user-2', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' } },
    'avatar-2': { id: 'avatar-2', type: 'container', tag: 'div', style: { width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' } },
    'user-2-info': { id: 'user-2-info', type: 'container', tag: 'div', style: { flex: 1 } },
    'user-2-name': { id: 'user-2-name', type: 'text', tag: 'h4', text: 'Michael Chen', style: { margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' } },
    'user-2-role': { id: 'user-2-role', type: 'text', tag: 'p', text: 'Senior Engineer', style: { margin: 0, fontSize: 14, color: '#6b7280', marginTop: 2 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Sarah Anderson', 'User 1 name updated');
  assertIncludes(patched, 'Product Manager', 'User 1 role updated');
  assertIncludes(patched, 'Michael Chen', 'User 2 name updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['user-1-name'].text, 'Sarah Anderson', 'Name round-tripped');
  assertEqual(parsed['user-2-role'].text, 'Senior Engineer', 'Role round-tripped');
});

// Test 2: Product comparison card grid
test('Product comparison cards in grid layout', () => {
  const code = `
export function ProductGrid() {
  return (
    <div id="product-grid">
      <div id="product-a">
        <h3 id="product-a-name">Product A</h3>
        <p id="product-a-price">$99</p>
        <ul id="product-a-features">
          <li id="feature-a1">Feature 1</li>
          <li id="feature-a2">Feature 2</li>
        </ul>
      </div>
      <div id="product-b">
        <h3 id="product-b-name">Product B</h3>
        <p id="product-b-price">$199</p>
        <ul id="product-b-features">
          <li id="feature-b1">Feature 1</li>
          <li id="feature-b2">Feature 2</li>
        </ul>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'product-grid': { id: 'product-grid', type: 'container', tag: 'div', style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 } },
    'product-a': { id: 'product-a', type: 'container', tag: 'div', style: { padding: 24, border: '2px solid #e5e7eb', borderRadius: 12, background: '#fff' } },
    'product-a-name': { id: 'product-a-name', type: 'text', tag: 'h3', text: 'Pro Plan', style: { margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' } },
    'product-a-price': { id: 'product-a-price', type: 'text', tag: 'p', text: '$49/mo', style: { margin: 0, marginTop: 8, fontSize: 36, fontWeight: 800, color: '#2563eb' } },
    'product-a-features': { id: 'product-a-features', type: 'container', tag: 'ul', style: { margin: 0, marginTop: 16, padding: 0, paddingLeft: 20, fontSize: 14, color: '#374151' } },
    'feature-a1': { id: 'feature-a1', type: 'text', tag: 'li', text: 'Unlimited projects', style: { marginBottom: 8 } },
    'feature-a2': { id: 'feature-a2', type: 'text', tag: 'li', text: 'Priority support', style: { marginBottom: 8 } },
    'product-b': { id: 'product-b', type: 'container', tag: 'div', style: { padding: 24, border: '2px solid #2563eb', borderRadius: 12, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' } },
    'product-b-name': { id: 'product-b-name', type: 'text', tag: 'h3', text: 'Enterprise', style: { margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' } },
    'product-b-price': { id: 'product-b-price', type: 'text', tag: 'p', text: 'Custom pricing', style: { margin: 0, marginTop: 8, fontSize: 28, fontWeight: 800, color: '#1e40af' } },
    'product-b-features': { id: 'product-b-features', type: 'container', tag: 'ul', style: { margin: 0, marginTop: 16, padding: 0, paddingLeft: 20, fontSize: 14, color: '#374151' } },
    'feature-b1': { id: 'feature-b1', type: 'text', tag: 'li', text: 'Unlimited everything', style: { marginBottom: 8, fontWeight: 600 } },
    'feature-b2': { id: 'feature-b2', type: 'text', tag: 'li', text: 'Dedicated account manager', style: { marginBottom: 8, fontWeight: 600 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Pro Plan', 'Product A name updated');
  assertIncludes(patched, '$49/mo', 'Product A price updated');
  assertIncludes(patched, 'Enterprise', 'Product B name updated');
  assertIncludes(patched, 'Custom pricing', 'Product B price updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['product-a-name'].text, 'Pro Plan', 'Product name round-tripped');
  assertEqual(parsed['feature-b1'].text, 'Unlimited everything', 'Feature round-tripped');
});

// Test 3: Timeline with events
test('Vertical timeline with event markers', () => {
  const code = `
export function Timeline() {
  return (
    <div id="timeline">
      <div id="event-1">
        <div id="event-1-marker"></div>
        <div id="event-1-content">
          <h4 id="event-1-title">Event 1</h4>
          <p id="event-1-time">Time</p>
          <p id="event-1-desc">Description</p>
        </div>
      </div>
      <div id="event-2">
        <div id="event-2-marker"></div>
        <div id="event-2-content">
          <h4 id="event-2-title">Event 2</h4>
          <p id="event-2-time">Time</p>
        </div>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'timeline': { id: 'timeline', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 24, borderLeft: '2px solid #e5e7eb' } },
    'event-1': { id: 'event-1', type: 'container', tag: 'div', style: { position: 'relative', paddingBottom: 24, paddingLeft: 24 } },
    'event-1-marker': { id: 'event-1-marker', type: 'container', tag: 'div', style: { position: 'absolute', left: -26, top: 4, width: 12, height: 12, borderRadius: '50%', background: '#2563eb', border: '3px solid #fff', boxShadow: '0 0 0 2px #2563eb' } },
    'event-1-content': { id: 'event-1-content', type: 'container', tag: 'div', style: {} },
    'event-1-title': { id: 'event-1-title', type: 'text', tag: 'h4', text: 'Project Launched', style: { margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' } },
    'event-1-time': { id: 'event-1-time', type: 'text', tag: 'p', text: '2 hours ago', style: { margin: 0, marginTop: 4, fontSize: 13, color: '#6b7280' } },
    'event-1-desc': { id: 'event-1-desc', type: 'text', tag: 'p', text: 'The new product website went live to the public. Initial feedback has been very positive.', style: { margin: 0, marginTop: 8, fontSize: 14, color: '#374151', lineHeight: 1.6 } },
    'event-2': { id: 'event-2', type: 'container', tag: 'div', style: { position: 'relative', paddingBottom: 24, paddingLeft: 24 } },
    'event-2-marker': { id: 'event-2-marker', type: 'container', tag: 'div', style: { position: 'absolute', left: -26, top: 4, width: 12, height: 12, borderRadius: '50%', background: '#e5e7eb', border: '3px solid #fff' } },
    'event-2-content': { id: 'event-2-content', type: 'container', tag: 'div', style: {} },
    'event-2-title': { id: 'event-2-title', type: 'text', tag: 'h4', text: 'Final Review Completed', style: { margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' } },
    'event-2-time': { id: 'event-2-time', type: 'text', tag: 'p', text: '1 day ago', style: { margin: 0, marginTop: 4, fontSize: 13, color: '#6b7280' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Project Launched', 'Event 1 title updated');
  assertIncludes(patched, '2 hours ago', 'Event 1 time updated');
  assertIncludes(patched, 'went live', 'Event description updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['event-1-title'].text, 'Project Launched', 'Event title round-tripped');
});

// Test 4: Stat cards with metrics
test('Statistics dashboard with metric cards', () => {
  const code = `
export function StatsCards() {
  return (
    <div id="stats-grid">
      <div id="stat-1">
        <p id="stat-1-label">Label</p>
        <h3 id="stat-1-value">100</h3>
        <span id="stat-1-change">+10%</span>
      </div>
      <div id="stat-2">
        <p id="stat-2-label">Label</p>
        <h3 id="stat-2-value">200</h3>
        <span id="stat-2-change">-5%</span>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'stats-grid': { id: 'stats-grid', type: 'container', tag: 'div', style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 } },
    'stat-1': { id: 'stat-1', type: 'container', tag: 'div', style: { padding: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 } },
    'stat-1-label': { id: 'stat-1-label', type: 'text', tag: 'p', text: 'Total Users', style: { margin: 0, fontSize: 14, fontWeight: 500, color: '#6b7280' } },
    'stat-1-value': { id: 'stat-1-value', type: 'text', tag: 'h3', text: '12,543', style: { margin: 0, marginTop: 8, fontSize: 32, fontWeight: 700, color: '#111827' } },
    'stat-1-change': { id: 'stat-1-change', type: 'text', tag: 'span', text: '↑ 23.5%', style: { display: 'inline-block', marginTop: 8, fontSize: 14, fontWeight: 600, color: '#16a34a' } },
    'stat-2': { id: 'stat-2', type: 'container', tag: 'div', style: { padding: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 } },
    'stat-2-label': { id: 'stat-2-label', type: 'text', tag: 'p', text: 'Bounce Rate', style: { margin: 0, fontSize: 14, fontWeight: 500, color: '#6b7280' } },
    'stat-2-value': { id: 'stat-2-value', type: 'text', tag: 'h3', text: '28.3%', style: { margin: 0, marginTop: 8, fontSize: 32, fontWeight: 700, color: '#111827' } },
    'stat-2-change': { id: 'stat-2-change', type: 'text', tag: 'span', text: '↓ 8.2%', style: { display: 'inline-block', marginTop: 8, fontSize: 14, fontWeight: 600, color: '#dc2626' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Total Users', 'Stat 1 label updated');
  assertIncludes(patched, '12,543', 'Stat 1 value updated');
  assertIncludes(patched, '↑ 23.5%', 'Stat 1 change updated');
  assertIncludes(patched, 'Bounce Rate', 'Stat 2 label updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['stat-1-value'].text, '12,543', 'Stat value round-tripped');
  assertEqual(parsed['stat-2-change'].text, '↓ 8.2%', 'Change indicator round-tripped');
});

// Test 5: Hierarchical tree/folder view
test('Tree view with expandable items', () => {
  const code = `
export function TreeView() {
  return (
    <div id="tree-root">
      <div id="folder-1">
        <span id="folder-1-icon">📁</span>
        <span id="folder-1-name">Root</span>
      </div>
      <div id="folder-1-children">
        <div id="folder-2">
          <span id="folder-2-icon">📄</span>
          <span id="folder-2-name">File</span>
        </div>
        <div id="folder-3">
          <span id="folder-3-icon">📁</span>
          <span id="folder-3-name">Subfolder</span>
        </div>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'tree-root': { id: 'tree-root', type: 'container', tag: 'div', style: { fontSize: 14, color: '#374151' } },
    'folder-1': { id: 'folder-1', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderRadius: 6, background: '#eff6ff' } },
    'folder-1-icon': { id: 'folder-1-icon', type: 'text', tag: 'span', text: '▾', style: { fontSize: 12, color: '#6b7280', fontWeight: 600 } },
    'folder-1-name': { id: 'folder-1-name', type: 'text', tag: 'span', text: 'src/', style: { fontWeight: 600, color: '#2563eb' } },
    'folder-1-children': { id: 'folder-1-children', type: 'container', tag: 'div', style: { paddingLeft: 24, marginTop: 4 } },
    'folder-2': { id: 'folder-2', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer', borderRadius: 6 } },
    'folder-2-icon': { id: 'folder-2-icon', type: 'text', tag: 'span', text: '📝', style: { fontSize: 14 } },
    'folder-2-name': { id: 'folder-2-name', type: 'text', tag: 'span', text: 'index.tsx', style: { color: '#374151' } },
    'folder-3': { id: 'folder-3', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer', borderRadius: 6 } },
    'folder-3-icon': { id: 'folder-3-icon', type: 'text', tag: 'span', text: '▸', style: { fontSize: 12, color: '#6b7280', fontWeight: 600 } },
    'folder-3-name': { id: 'folder-3-name', type: 'text', tag: 'span', text: 'components/', style: { fontWeight: 500, color: '#374151' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'src/', 'Root folder name updated');
  assertIncludes(patched, 'index.tsx', 'File name updated');
  assertIncludes(patched, 'components/', 'Subfolder name updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['folder-1-name'].text, 'src/', 'Folder name round-tripped');
  assertEqual(parsed['folder-2-name'].text, 'index.tsx', 'File name round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All data display tests passed!');
