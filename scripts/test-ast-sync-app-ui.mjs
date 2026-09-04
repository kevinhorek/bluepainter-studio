#!/usr/bin/env node
/**
 * AST sync tests for app UI patterns
 * Tests modals, tables, sidebars, and dashboard layouts
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: App UI Patterns ===\n');

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

// Test 1: Modal dialog with header, body, footer
test('Modal dialog with overlay and content', () => {
  const code = `
export function Modal() {
  return (
    <div id="overlay">
      <div id="modal">
        <div id="header">
          <h2 id="title">Title</h2>
          <button id="close">×</button>
        </div>
        <div id="body">
          <p id="content">Content</p>
        </div>
        <div id="footer">
          <button id="cancel">Cancel</button>
          <button id="confirm">OK</button>
        </div>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'overlay': { id: 'overlay', type: 'container', tag: 'div', style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    'modal': { id: 'modal', type: 'container', tag: 'div', style: { background: '#fff', borderRadius: 12, maxWidth: 500, width: '100%', boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)' } },
    'header': { id: 'header', type: 'container', tag: 'div', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottom: '1px solid #e5e7eb' } },
    'title': { id: 'title', type: 'text', tag: 'h2', text: 'Confirm Action', style: { fontSize: 24, fontWeight: 700, margin: 0 } },
    'close': { id: 'close', type: 'button', tag: 'button', text: '×', style: { fontSize: 32, border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' } },
    'body': { id: 'body', type: 'container', tag: 'div', style: { padding: 24 } },
    'content': { id: 'content', type: 'text', tag: 'p', text: 'Are you sure you want to proceed with this action?', style: { fontSize: 16, lineHeight: 1.6, color: '#374151' } },
    'footer': { id: 'footer', type: 'container', tag: 'div', style: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: 24, borderTop: '1px solid #e5e7eb' } },
    'cancel': { id: 'cancel', type: 'button', tag: 'button', text: 'Cancel', style: { padding: 12, fontSize: 16, fontWeight: 600, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer' } },
    'confirm': { id: 'confirm', type: 'button', tag: 'button', text: 'Confirm', style: { padding: 12, fontSize: 16, fontWeight: 600, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Confirm Action', 'Modal title updated');
  assertIncludes(patched, 'Are you sure', 'Modal content updated');
  assertIncludes(patched, 'rgba(0, 0, 0, 0.5)', 'Overlay background added');
  assertIncludes(patched, 'position:', 'Fixed positioning added');
  assertIncludes(patched, 'fixed', 'Fixed value present');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['title'].text, 'Confirm Action', 'Title round-tripped');
  assertEqual(parsed['content'].text, 'Are you sure you want to proceed with this action?', 'Content round-tripped');
});

// Test 2: Data table with header and rows
test('Data table with header row and data rows', () => {
  const code = `
export function DataTable() {
  return (
    <table id="table">
      <thead id="thead">
        <tr id="header-row">
          <th id="col-name">Name</th>
          <th id="col-email">Email</th>
          <th id="col-status">Status</th>
        </tr>
      </thead>
      <tbody id="tbody">
        <tr id="row-1">
          <td id="r1-name">User 1</td>
          <td id="r1-email">user1@example.com</td>
          <td id="r1-status">Active</td>
        </tr>
        <tr id="row-2">
          <td id="r2-name">User 2</td>
          <td id="r2-email">user2@example.com</td>
          <td id="r2-status">Inactive</td>
        </tr>
      </tbody>
    </table>
  );
}`;

  const nodesMap = {
    'table': { id: 'table', type: 'container', tag: 'table', style: { width: '100%', borderCollapse: 'collapse', fontSize: 14 } },
    'thead': { id: 'thead', type: 'container', tag: 'thead', style: {} },
    'header-row': { id: 'header-row', type: 'container', tag: 'tr', style: { borderBottom: '2px solid #e5e7eb' } },
    'col-name': { id: 'col-name', type: 'text', tag: 'th', text: 'Full Name', style: { padding: 16, textAlign: 'left', fontWeight: 700, color: '#111827' } },
    'col-email': { id: 'col-email', type: 'text', tag: 'th', text: 'Email Address', style: { padding: 16, textAlign: 'left', fontWeight: 700, color: '#111827' } },
    'col-status': { id: 'col-status', type: 'text', tag: 'th', text: 'Account Status', style: { padding: 16, textAlign: 'left', fontWeight: 700, color: '#111827' } },
    'tbody': { id: 'tbody', type: 'container', tag: 'tbody', style: {} },
    'row-1': { id: 'row-1', type: 'container', tag: 'tr', style: { borderBottom: '1px solid #e5e7eb' } },
    'r1-name': { id: 'r1-name', type: 'text', tag: 'td', text: 'John Smith', style: { padding: 16 } },
    'r1-email': { id: 'r1-email', type: 'text', tag: 'td', text: 'john@example.com', style: { padding: 16, color: '#6b7280' } },
    'r1-status': { id: 'r1-status', type: 'text', tag: 'td', text: 'Active', style: { padding: 16, color: '#10b981', fontWeight: 600 } },
    'row-2': { id: 'row-2', type: 'container', tag: 'tr', style: { borderBottom: '1px solid #e5e7eb', background: '#f9fafb' } },
    'r2-name': { id: 'r2-name', type: 'text', tag: 'td', text: 'Jane Doe', style: { padding: 16 } },
    'r2-email': { id: 'r2-email', type: 'text', tag: 'td', text: 'jane@example.com', style: { padding: 16, color: '#6b7280' } },
    'r2-status': { id: 'r2-status', type: 'text', tag: 'td', text: 'Pending', style: { padding: 16, color: '#f59e0b', fontWeight: 600 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Full Name', 'Header column updated');
  assertIncludes(patched, 'John Smith', 'Row 1 name updated');
  assertIncludes(patched, 'jane@example.com', 'Row 2 email updated');
  assertIncludes(patched, 'borderCollapse', 'Table border collapse added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['col-name'].text, 'Full Name', 'Header round-tripped');
  assertEqual(parsed['r1-name'].text, 'John Smith', 'Data row round-tripped');
});

// Test 3: Sidebar navigation with sections
test('Sidebar navigation with menu sections', () => {
  const code = `
export function Sidebar() {
  return (
    <aside id="sidebar">
      <div id="logo-section">
        <h1 id="logo">App</h1>
      </div>
      <nav id="nav">
        <div id="section-main">
          <h3 id="heading-main">Main</h3>
          <ul id="list-main">
            <li id="item-dashboard"><a id="link-dashboard" href="/dashboard">Dashboard</a></li>
            <li id="item-projects"><a id="link-projects" href="/projects">Projects</a></li>
          </ul>
        </div>
        <div id="section-settings">
          <h3 id="heading-settings">Settings</h3>
          <ul id="list-settings">
            <li id="item-profile"><a id="link-profile" href="/profile">Profile</a></li>
            <li id="item-preferences"><a id="link-preferences" href="/preferences">Preferences</a></li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}`;

  const nodesMap = {
    'sidebar': { id: 'sidebar', type: 'container', tag: 'aside', style: { width: 280, height: '100vh', background: '#111827', color: '#fff', padding: 24 } },
    'logo-section': { id: 'logo-section', type: 'container', tag: 'div', style: { marginBottom: 32 } },
    'logo': { id: 'logo', type: 'text', tag: 'h1', text: 'BluePainter', style: { fontSize: 28, fontWeight: 900, margin: 0 } },
    'nav': { id: 'nav', type: 'container', tag: 'nav', style: {} },
    'section-main': { id: 'section-main', type: 'container', tag: 'div', style: { marginBottom: 32 } },
    'heading-main': { id: 'heading-main', type: 'text', tag: 'h3', text: 'Main Menu', style: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 12 } },
    'list-main': { id: 'list-main', type: 'list', tag: 'ul', style: { listStyle: 'none', padding: 0, margin: 0 } },
    'item-dashboard': { id: 'item-dashboard', type: 'list-item', tag: 'li', style: { marginBottom: 8 } },
    'link-dashboard': { id: 'link-dashboard', type: 'link', tag: 'a', text: '📊 Dashboard', href: '/dashboard', style: { color: '#fff', textDecoration: 'none', display: 'block', padding: 12, borderRadius: 8, background: '#1f2937' } },
    'item-projects': { id: 'item-projects', type: 'list-item', tag: 'li', style: { marginBottom: 8 } },
    'link-projects': { id: 'link-projects', type: 'link', tag: 'a', text: '📁 Projects', href: '/projects', style: { color: '#fff', textDecoration: 'none', display: 'block', padding: 12, borderRadius: 8 } },
    'section-settings': { id: 'section-settings', type: 'container', tag: 'div', style: { marginBottom: 32 } },
    'heading-settings': { id: 'heading-settings', type: 'text', tag: 'h3', text: 'Account', style: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 12 } },
    'list-settings': { id: 'list-settings', type: 'list', tag: 'ul', style: { listStyle: 'none', padding: 0, margin: 0 } },
    'item-profile': { id: 'item-profile', type: 'list-item', tag: 'li', style: { marginBottom: 8 } },
    'link-profile': { id: 'link-profile', type: 'link', tag: 'a', text: '👤 Profile', href: '/profile', style: { color: '#fff', textDecoration: 'none', display: 'block', padding: 12, borderRadius: 8 } },
    'item-preferences': { id: 'item-preferences', type: 'list-item', tag: 'li', style: { marginBottom: 8 } },
    'link-preferences': { id: 'link-preferences', type: 'link', tag: 'a', text: '⚙️ Preferences', href: '/preferences', style: { color: '#fff', textDecoration: 'none', display: 'block', padding: 12, borderRadius: 8 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'BluePainter', 'Logo updated');
  assertIncludes(patched, 'Main Menu', 'Section heading updated');
  assertIncludes(patched, '📊 Dashboard', 'Dashboard link updated');
  assertIncludes(patched, '⚙️ Preferences', 'Preferences link updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['logo'].text, 'BluePainter', 'Logo round-tripped');
  assertEqual(parsed['link-dashboard'].text, '📊 Dashboard', 'Link text round-tripped');
});

// Test 4: Card grid dashboard layout
test('Dashboard card grid with metrics', () => {
  const code = `
export function Dashboard() {
  return (
    <div id="dashboard" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
      <div id="card-users">
        <h3 id="label-users">Users</h3>
        <p id="value-users">1,234</p>
        <p id="change-users">+12% from last month</p>
      </div>
      <div id="card-revenue">
        <h3 id="label-revenue">Revenue</h3>
        <p id="value-revenue">$12,345</p>
        <p id="change-revenue">+8% from last month</p>
      </div>
      <div id="card-orders">
        <h3 id="label-orders">Orders</h3>
        <p id="value-orders">567</p>
        <p id="change-orders">-3% from last month</p>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'dashboard': { id: 'dashboard', type: 'container', tag: 'div', style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, padding: 32 } },
    'card-users': { id: 'card-users', type: 'container', tag: 'div', style: { padding: 32, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' } },
    'label-users': { id: 'label-users', type: 'text', tag: 'h3', text: 'Total Users', style: { fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 8 } },
    'value-users': { id: 'value-users', type: 'text', tag: 'p', text: '12,847', style: { fontSize: 36, fontWeight: 900, color: '#111827', margin: 0, marginBottom: 8 } },
    'change-users': { id: 'change-users', type: 'text', tag: 'p', text: '↑ 15.2% from last month', style: { fontSize: 14, color: '#10b981', margin: 0 } },
    'card-revenue': { id: 'card-revenue', type: 'container', tag: 'div', style: { padding: 32, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' } },
    'label-revenue': { id: 'label-revenue', type: 'text', tag: 'h3', text: 'Monthly Revenue', style: { fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 8 } },
    'value-revenue': { id: 'value-revenue', type: 'text', tag: 'p', text: '$84,293', style: { fontSize: 36, fontWeight: 900, color: '#111827', margin: 0, marginBottom: 8 } },
    'change-revenue': { id: 'change-revenue', type: 'text', tag: 'p', text: '↑ 22.5% from last month', style: { fontSize: 14, color: '#10b981', margin: 0 } },
    'card-orders': { id: 'card-orders', type: 'container', tag: 'div', style: { padding: 32, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' } },
    'label-orders': { id: 'label-orders', type: 'text', tag: 'h3', text: 'Active Orders', style: { fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 8 } },
    'value-orders': { id: 'value-orders', type: 'text', tag: 'p', text: '1,432', style: { fontSize: 36, fontWeight: 900, color: '#111827', margin: 0, marginBottom: 8 } },
    'change-orders': { id: 'change-orders', type: 'text', tag: 'p', text: '↓ 5.1% from last month', style: { fontSize: 14, color: '#ef4444', margin: 0 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Total Users', 'Users label updated');
  assertIncludes(patched, '12,847', 'Users value updated');
  assertIncludes(patched, '15.2%', 'Users change updated');
  assertIncludes(patched, '$84,293', 'Revenue value updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['value-users'].text, '12,847', 'Users value round-tripped');
  assertEqual(parsed['change-revenue'].text, '↑ 22.5% from last month', 'Revenue change round-tripped');
});

// Test 5: Alert/notification banner
test('Alert notification banner with icon and actions', () => {
  const code = `
export function Alert() {
  return (
    <div id="alert">
      <div id="icon">⚠️</div>
      <div id="content">
        <h4 id="title">Warning</h4>
        <p id="message">Something needs your attention.</p>
      </div>
      <button id="dismiss">Dismiss</button>
    </div>
  );
}`;

  const nodesMap = {
    'alert': { id: 'alert', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8 } },
    'icon': { id: 'icon', type: 'text', tag: 'div', text: '⚠️', style: { fontSize: 24 } },
    'content': { id: 'content', type: 'container', tag: 'div', style: { flex: 1 } },
    'title': { id: 'title', type: 'text', tag: 'h4', text: 'Action Required', style: { fontSize: 16, fontWeight: 700, color: '#92400e', margin: 0, marginBottom: 4 } },
    'message': { id: 'message', type: 'text', tag: 'p', text: 'Your subscription will expire in 3 days. Please renew to continue.', style: { fontSize: 14, color: '#78350f', margin: 0 } },
    'dismiss': { id: 'dismiss', type: 'button', tag: 'button', text: 'Renew Now', style: { padding: 10, fontSize: 14, fontWeight: 600, background: '#fbbf24', color: '#78350f', border: 'none', borderRadius: 6, cursor: 'pointer' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Action Required', 'Alert title updated');
  assertIncludes(patched, 'subscription will expire', 'Alert message updated');
  assertIncludes(patched, 'Renew Now', 'Alert action button updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['title'].text, 'Action Required', 'Alert title round-tripped');
  assertEqual(parsed['dismiss'].text, 'Renew Now', 'Alert button round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All app UI tests passed!');
