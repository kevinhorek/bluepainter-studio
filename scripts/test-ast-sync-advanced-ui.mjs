#!/usr/bin/env node
/**
 * AST sync tests for advanced UI patterns
 * Tests tabs, accordions, dropdowns, badges, tooltips
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Advanced UI Patterns ===\n');

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

// Test 1: Tabs component with multiple panels
test('Tabs with active state and panels', () => {
  const code = `
export function Tabs() {
  return (
    <div id="tabs-container">
      <div id="tab-list">
        <button id="tab-home">Home</button>
        <button id="tab-profile">Profile</button>
        <button id="tab-settings">Settings</button>
      </div>
      <div id="tab-panel">
        <p id="panel-content">Content here</p>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'tabs-container': { id: 'tabs-container', type: 'container', tag: 'div', style: { width: '100%' } },
    'tab-list': { id: 'tab-list', type: 'container', tag: 'div', style: { display: 'flex', borderBottom: '2px solid #e5e7eb', gap: 8 } },
    'tab-home': { id: 'tab-home', type: 'button', tag: 'button', text: 'Home', style: { padding: 16, background: '#fff', border: 'none', borderBottom: '2px solid #2563eb', color: '#2563eb', fontWeight: 600, cursor: 'pointer' } },
    'tab-profile': { id: 'tab-profile', type: 'button', tag: 'button', text: 'Profile', style: { padding: 16, background: '#fff', border: 'none', color: '#6b7280', cursor: 'pointer' } },
    'tab-settings': { id: 'tab-settings', type: 'button', tag: 'button', text: 'Settings', style: { padding: 16, background: '#fff', border: 'none', color: '#6b7280', cursor: 'pointer' } },
    'tab-panel': { id: 'tab-panel', type: 'container', tag: 'div', style: { padding: 24, background: '#fff' } },
    'panel-content': { id: 'panel-content', type: 'text', tag: 'p', text: 'Welcome to your dashboard! Here you can manage all your settings and preferences.', style: { fontSize: 16, lineHeight: 1.6 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Welcome to your dashboard', 'Panel content updated');
  assertIncludes(patched, 'borderBottom:', 'Active tab indicator added');
  assertIncludes(patched, '#2563eb', 'Active tab color applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['panel-content'].text, 'Welcome to your dashboard! Here you can manage all your settings and preferences.', 'Content round-tripped');
});

// Test 2: Accordion with expandable sections
test('Accordion with multiple collapsible sections', () => {
  const code = `
export function Accordion() {
  return (
    <div id="accordion">
      <div id="section-1">
        <button id="header-1">Section 1</button>
        <div id="content-1">
          <p id="text-1">Content 1</p>
        </div>
      </div>
      <div id="section-2">
        <button id="header-2">Section 2</button>
        <div id="content-2">
          <p id="text-2">Content 2</p>
        </div>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'accordion': { id: 'accordion', type: 'container', tag: 'div', style: { border: '1px solid #e5e7eb', borderRadius: 8 } },
    'section-1': { id: 'section-1', type: 'container', tag: 'div', style: { borderBottom: '1px solid #e5e7eb' } },
    'header-1': { id: 'header-1', type: 'button', tag: 'button', text: '▼ Getting Started', style: { width: '100%', padding: 16, background: '#f9fafb', border: 'none', textAlign: 'left', fontWeight: 600, cursor: 'pointer' } },
    'content-1': { id: 'content-1', type: 'container', tag: 'div', style: { padding: 16, background: '#fff' } },
    'text-1': { id: 'text-1', type: 'text', tag: 'p', text: 'Learn the basics with our comprehensive getting started guide. Follow step-by-step instructions to set up your first project.', style: { margin: 0, lineHeight: 1.6 } },
    'section-2': { id: 'section-2', type: 'container', tag: 'div', style: {} },
    'header-2': { id: 'header-2', type: 'button', tag: 'button', text: '▶ Advanced Features', style: { width: '100%', padding: 16, background: '#fff', border: 'none', textAlign: 'left', fontWeight: 600, cursor: 'pointer' } },
    'content-2': { id: 'content-2', type: 'container', tag: 'div', style: { display: 'none' } },
    'text-2': { id: 'text-2', type: 'text', tag: 'p', text: 'Explore advanced features', style: { margin: 0 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Getting Started', 'Accordion header updated');
  assertIncludes(patched, 'comprehensive getting started guide', 'Accordion content updated');
  assertIncludes(patched, 'display:', 'Collapsed state applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['text-1'].text, 'Learn the basics with our comprehensive getting started guide. Follow step-by-step instructions to set up your first project.', 'Content round-tripped');
});

// Test 3: Badge and chip components
test('Badges and chips with different styles', () => {
  const code = `
export function Badges() {
  return (
    <div id="container">
      <span id="badge-new">New</span>
      <span id="badge-sale">Sale</span>
      <span id="chip-tag">Technology</span>
    </div>
  );
}`;

  const nodesMap = {
    'container': { id: 'container', type: 'container', tag: 'div', style: { display: 'flex', gap: 12, alignItems: 'center' } },
    'badge-new': { id: 'badge-new', type: 'text', tag: 'span', text: 'NEW', style: { padding: 6, fontSize: 12, fontWeight: 700, background: '#2563eb', color: '#fff', borderRadius: 4, textTransform: 'uppercase' } },
    'badge-sale': { id: 'badge-sale', type: 'text', tag: 'span', text: '50% OFF', style: { padding: 6, fontSize: 12, fontWeight: 700, background: '#dc2626', color: '#fff', borderRadius: 4, textTransform: 'uppercase' } },
    'chip-tag': { id: 'chip-tag', type: 'text', tag: 'span', text: 'React', style: { padding: 8, fontSize: 14, background: '#eff6ff', color: '#1e40af', borderRadius: 16, border: '1px solid #bfdbfe' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'NEW', 'Badge text updated');
  assertIncludes(patched, '50% OFF', 'Sale badge updated');
  assertIncludes(patched, 'React', 'Chip tag updated');
  assertIncludes(patched, 'textTransform', 'Text transform applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['badge-new'].text, 'NEW', 'Badge round-tripped');
  assertEqual(parsed['chip-tag'].text, 'React', 'Chip round-tripped');
});

// Test 4: Dropdown menu
test('Dropdown menu with options', () => {
  const code = `
export function Dropdown() {
  return (
    <div id="dropdown-container">
      <button id="dropdown-trigger">Menu</button>
      <div id="dropdown-menu">
        <a id="option-1" href="/profile">Profile</a>
        <a id="option-2" href="/settings">Settings</a>
        <a id="option-3" href="/logout">Logout</a>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'dropdown-container': { id: 'dropdown-container', type: 'container', tag: 'div', style: { position: 'relative', display: 'inline-block' } },
    'dropdown-trigger': { id: 'dropdown-trigger', type: 'button', tag: 'button', text: 'Account ▼', style: { padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 } },
    'dropdown-menu': { id: 'dropdown-menu', type: 'container', tag: 'div', style: { position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', minWidth: 200, display: 'flex', flexDirection: 'column' } },
    'option-1': { id: 'option-1', type: 'link', tag: 'a', text: 'View Profile', href: '/profile', style: { padding: 12, color: '#374151', textDecoration: 'none', borderBottom: '1px solid #f3f4f6' } },
    'option-2': { id: 'option-2', type: 'link', tag: 'a', text: 'Settings', href: '/settings', style: { padding: 12, color: '#374151', textDecoration: 'none', borderBottom: '1px solid #f3f4f6' } },
    'option-3': { id: 'option-3', type: 'link', tag: 'a', text: 'Sign Out', href: '/logout', style: { padding: 12, color: '#dc2626', textDecoration: 'none' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Account', 'Dropdown trigger updated');
  assertIncludes(patched, 'View Profile', 'Option 1 updated');
  assertIncludes(patched, 'Sign Out', 'Option 3 updated');
  assertIncludes(patched, 'position:', 'Positioning styles applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['option-1'].text, 'View Profile', 'Dropdown option round-tripped');
});

// Test 5: Progress bar
test('Progress bar with percentage', () => {
  const code = `
export function ProgressBar() {
  return (
    <div id="progress-container">
      <div id="progress-label">
        <span id="label-text">Upload Progress</span>
        <span id="percentage">0%</span>
      </div>
      <div id="progress-track">
        <div id="progress-fill"></div>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'progress-container': { id: 'progress-container', type: 'container', tag: 'div', style: { width: '100%' } },
    'progress-label': { id: 'progress-label', type: 'container', tag: 'div', style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } },
    'label-text': { id: 'label-text', type: 'text', tag: 'span', text: 'Uploading files...', style: { fontSize: 14, fontWeight: 600 } },
    'percentage': { id: 'percentage', type: 'text', tag: 'span', text: '75%', style: { fontSize: 14, fontWeight: 600, color: '#2563eb' } },
    'progress-track': { id: 'progress-track', type: 'container', tag: 'div', style: { width: '100%', height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' } },
    'progress-fill': { id: 'progress-fill', type: 'container', tag: 'div', style: { width: '75%', height: '100%', background: '#2563eb', transition: 'width 0.3s ease' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Uploading files', 'Progress label updated');
  assertIncludes(patched, '75%', 'Percentage updated');
  assertIncludes(patched, 'transition', 'Transition property added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['percentage'].text, '75%', 'Percentage round-tripped');
  assertEqual(parsed['label-text'].text, 'Uploading files...', 'Label round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All advanced UI tests passed!');
