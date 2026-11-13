#!/usr/bin/env node
/**
 * AST sync tests for layout patterns
 * Tests grids, flexbox, multi-column, split views, and responsive patterns
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Layout Patterns ===\n');

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

// Test 1: CSS Grid layout
test('CSS Grid layout with multiple items', () => {
  const code = `
export function GridLayout() {
  return (
    <div id="grid-container">
      <div id="grid-item-1">Item 1</div>
      <div id="grid-item-2">Item 2</div>
      <div id="grid-item-3">Item 3</div>
      <div id="grid-item-4">Item 4</div>
    </div>
  );
}`;

  const nodesMap = {
    'grid-container': { id: 'grid-container', type: 'container', tag: 'div', style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, padding: 24 } },
    'grid-item-1': { id: 'grid-item-1', type: 'container', tag: 'div', style: { padding: 32, background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: 12, textAlign: 'center', fontSize: 18, fontWeight: 600 } },
    'grid-item-2': { id: 'grid-item-2', type: 'container', tag: 'div', style: { padding: 32, background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: 12, textAlign: 'center', fontSize: 18, fontWeight: 600 } },
    'grid-item-3': { id: 'grid-item-3', type: 'container', tag: 'div', style: { padding: 32, background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 12, textAlign: 'center', fontSize: 18, fontWeight: 600 } },
    'grid-item-4': { id: 'grid-item-4', type: 'container', tag: 'div', style: { padding: 32, background: '#fce7f3', border: '2px solid #ec4899', borderRadius: 12, textAlign: 'center', fontSize: 18, fontWeight: 600 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'gridTemplateColumns', 'Grid template columns applied');
  assertIncludes(patched, 'repeat(2, 1fr)', 'Grid columns defined');
  assertIncludes(patched, '#3b82f6', 'Grid item styles applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['grid-item-1'].style.background, '#eff6ff', 'Grid item style round-tripped');
});

// Test 2: Flexbox layout with justify and align
test('Flexbox layout with space-between and alignment', () => {
  const code = `
export function FlexLayout() {
  return (
    <div id="flex-container">
      <div id="flex-left">
        <h2 id="flex-title">Title</h2>
      </div>
      <div id="flex-right">
        <button id="flex-action">Action</button>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'flex-container': { id: 'flex-container', type: 'container', tag: 'div', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 24, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8 } },
    'flex-left': { id: 'flex-left', type: 'container', tag: 'div', style: { flex: 1 } },
    'flex-title': { id: 'flex-title', type: 'text', tag: 'h2', text: 'Dashboard Analytics', style: { margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' } },
    'flex-right': { id: 'flex-right', type: 'container', tag: 'div', style: { display: 'flex', gap: 12 } },
    'flex-action': { id: 'flex-action', type: 'button', tag: 'button', text: 'Export Data', style: { padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Dashboard Analytics', 'Flex title updated');
  assertIncludes(patched, 'Export Data', 'Flex action updated');
  assertIncludes(patched, 'justifyContent', 'Justify content applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['flex-title'].text, 'Dashboard Analytics', 'Flex title round-tripped');
});

// Test 3: Split pane layout
test('Split pane layout with sidebar and main content', () => {
  const code = `
export function SplitLayout() {
  return (
    <div id="split-container">
      <aside id="sidebar">
        <nav id="sidebar-nav">
          <a id="nav-link-1" href="/dashboard">Dashboard</a>
          <a id="nav-link-2" href="/projects">Projects</a>
        </nav>
      </aside>
      <main id="main-content">
        <h1 id="content-title">Main Content</h1>
        <p id="content-text">Content goes here</p>
      </main>
    </div>
  );
}`;

  const nodesMap = {
    'split-container': { id: 'split-container', type: 'container', tag: 'div', style: { display: 'flex', height: '100vh' } },
    'sidebar': { id: 'sidebar', type: 'container', tag: 'aside', style: { width: 250, padding: 24, background: '#1f2937', color: '#fff', borderRight: '1px solid #374151' } },
    'sidebar-nav': { id: 'sidebar-nav', type: 'container', tag: 'nav', style: { display: 'flex', flexDirection: 'column', gap: 8 } },
    'nav-link-1': { id: 'nav-link-1', type: 'link', tag: 'a', text: 'Dashboard', href: '/dashboard', style: { padding: 12, color: '#fff', textDecoration: 'none', borderRadius: 6, background: '#374151' } },
    'nav-link-2': { id: 'nav-link-2', type: 'link', tag: 'a', text: 'My Projects', href: '/projects', style: { padding: 12, color: '#9ca3af', textDecoration: 'none', borderRadius: 6 } },
    'main-content': { id: 'main-content', type: 'container', tag: 'main', style: { flex: 1, padding: 40, background: '#fff', overflow: 'auto' } },
    'content-title': { id: 'content-title', type: 'text', tag: 'h1', text: 'Welcome to Your Dashboard', style: { margin: 0, marginBottom: 16, fontSize: 32, fontWeight: 700 } },
    'content-text': { id: 'content-text', type: 'text', tag: 'p', text: 'Here you can manage all your projects and track your progress.', style: { fontSize: 16, lineHeight: 1.6, color: '#6b7280' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Welcome to Your Dashboard', 'Main title updated');
  assertIncludes(patched, 'My Projects', 'Nav link updated');
  assertIncludes(patched, 'width: 250', 'Sidebar width set');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['content-title'].text, 'Welcome to Your Dashboard', 'Title round-tripped');
});

// Test 4: Multi-column layout
test('Multi-column layout with responsive columns', () => {
  const code = `
export function MultiColumnLayout() {
  return (
    <div id="columns-container">
      <div id="column-1">
        <h3 id="col-1-title">Features</h3>
        <p id="col-1-text">Description</p>
      </div>
      <div id="column-2">
        <h3 id="col-2-title">Benefits</h3>
        <p id="col-2-text">Description</p>
      </div>
      <div id="column-3">
        <h3 id="col-3-title">Pricing</h3>
        <p id="col-3-text">Description</p>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'columns-container': { id: 'columns-container', type: 'container', tag: 'div', style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, padding: 40 } },
    'column-1': { id: 'column-1', type: 'container', tag: 'div', style: { padding: 24, background: '#f9fafb', borderRadius: 8 } },
    'col-1-title': { id: 'col-1-title', type: 'text', tag: 'h3', text: 'Powerful Features', style: { margin: 0, marginBottom: 12, fontSize: 20, fontWeight: 700, color: '#111827' } },
    'col-1-text': { id: 'col-1-text', type: 'text', tag: 'p', text: 'Build with the latest technology stack and modern development tools.', style: { margin: 0, fontSize: 14, lineHeight: 1.6, color: '#6b7280' } },
    'column-2': { id: 'column-2', type: 'container', tag: 'div', style: { padding: 24, background: '#f9fafb', borderRadius: 8 } },
    'col-2-title': { id: 'col-2-title', type: 'text', tag: 'h3', text: 'Key Benefits', style: { margin: 0, marginBottom: 12, fontSize: 20, fontWeight: 700, color: '#111827' } },
    'col-2-text': { id: 'col-2-text', type: 'text', tag: 'p', text: 'Save time and increase productivity with automated workflows.', style: { margin: 0, fontSize: 14, lineHeight: 1.6, color: '#6b7280' } },
    'column-3': { id: 'column-3', type: 'container', tag: 'div', style: { padding: 24, background: '#f9fafb', borderRadius: 8 } },
    'col-3-title': { id: 'col-3-title', type: 'text', tag: 'h3', text: 'Flexible Pricing', style: { margin: 0, marginBottom: 12, fontSize: 20, fontWeight: 700, color: '#111827' } },
    'col-3-text': { id: 'col-3-text', type: 'text', tag: 'p', text: 'Choose the plan that fits your team and scale as you grow.', style: { margin: 0, fontSize: 14, lineHeight: 1.6, color: '#6b7280' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Powerful Features', 'Column 1 title updated');
  assertIncludes(patched, 'Key Benefits', 'Column 2 title updated');
  assertIncludes(patched, 'Flexible Pricing', 'Column 3 title updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['col-1-title'].text, 'Powerful Features', 'Column title round-tripped');
});

// Test 5: Card grid with aspect ratio
test('Card grid with fixed aspect ratio items', () => {
  const code = `
export function CardGrid() {
  return (
    <div id="card-grid">
      <div id="card-1">
        <div id="card-1-image">📷</div>
        <div id="card-1-content">
          <h4 id="card-1-title">Title</h4>
          <p id="card-1-desc">Description</p>
        </div>
      </div>
      <div id="card-2">
        <div id="card-2-image">🎨</div>
        <div id="card-2-content">
          <h4 id="card-2-title">Title</h4>
          <p id="card-2-desc">Description</p>
        </div>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'card-grid': { id: 'card-grid', type: 'container', tag: 'div', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, padding: 24 } },
    'card-1': { id: 'card-1', type: 'container', tag: 'div', style: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' } },
    'card-1-image': { id: 'card-1-image', type: 'text', tag: 'div', text: '🌄', style: { height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontSize: 64 } },
    'card-1-content': { id: 'card-1-content', type: 'container', tag: 'div', style: { padding: 20 } },
    'card-1-title': { id: 'card-1-title', type: 'text', tag: 'h4', text: 'Mountain Landscape', style: { margin: 0, marginBottom: 8, fontSize: 18, fontWeight: 700, color: '#111827' } },
    'card-1-desc': { id: 'card-1-desc', type: 'text', tag: 'p', text: 'Beautiful mountain scenery captured at sunset with stunning natural colors.', style: { margin: 0, fontSize: 14, lineHeight: 1.6, color: '#6b7280' } },
    'card-2': { id: 'card-2', type: 'container', tag: 'div', style: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' } },
    'card-2-image': { id: 'card-2-image', type: 'text', tag: 'div', text: '🎭', style: { height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontSize: 64 } },
    'card-2-content': { id: 'card-2-content', type: 'container', tag: 'div', style: { padding: 20 } },
    'card-2-title': { id: 'card-2-title', type: 'text', tag: 'h4', text: 'Theater Performance', style: { margin: 0, marginBottom: 8, fontSize: 18, fontWeight: 700, color: '#111827' } },
    'card-2-desc': { id: 'card-2-desc', type: 'text', tag: 'p', text: 'Experience world-class theatrical performances from renowned artists.', style: { margin: 0, fontSize: 14, lineHeight: 1.6, color: '#6b7280' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Mountain Landscape', 'Card 1 title updated');
  assertIncludes(patched, 'Theater Performance', 'Card 2 title updated');
  assertIncludes(patched, 'repeat(auto-fill, minmax(300px, 1fr))', 'Responsive grid applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['card-1-title'].text, 'Mountain Landscape', 'Card title round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All layout tests passed!');
