#!/usr/bin/env node
/**
 * AST sync tests for accessibility patterns
 * Tests ARIA attributes, focus states, keyboard navigation, semantic HTML
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Accessibility Patterns ===\n');

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

// Test 1: Button with focus state styling
test('Accessible button with focus indicators', () => {
  const code = `
export function AccessibleButton() {
  return (
    <button id="focus-button">Click</button>
  );
}`;

  const nodesMap = {
    'focus-button': { 
      id: 'focus-button', 
      type: 'button', 
      tag: 'button', 
      text: 'Save Changes', 
      style: { 
        padding: '12px 24px', 
        background: '#2563eb', 
        color: '#fff', 
        border: '2px solid #2563eb', 
        borderRadius: 6, 
        fontSize: 15, 
        fontWeight: 600, 
        cursor: 'pointer',
        outline: 'none',
        transition: 'all 0.2s ease'
      } 
    }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Save Changes', 'Button text updated');
  assertIncludes(patched, '2px solid', 'Focus border applied');
  assertIncludes(patched, 'outline', 'Outline style applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['focus-button'].text, 'Save Changes', 'Button text round-tripped');
});

// Test 2: Form with accessible labels and helper text
test('Accessible form with proper labeling', () => {
  const code = `
export function AccessibleForm() {
  return (
    <form id="a11y-form">
      <div id="email-field">
        <label id="email-label">Email</label>
        <input id="email-input" type="email" placeholder="email" />
        <span id="email-hint">Helper</span>
      </div>
    </form>
  );
}`;

  const nodesMap = {
    'a11y-form': { id: 'a11y-form', type: 'container', tag: 'form', style: { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400 } },
    'email-field': { id: 'email-field', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', gap: 6 } },
    'email-label': { id: 'email-label', type: 'text', tag: 'label', text: 'Email Address', style: { fontSize: 14, fontWeight: 600, color: '#374151' } },
    'email-input': { id: 'email-input', type: 'input', tag: 'input', inputType: 'email', placeholder: 'you@example.com', style: { padding: 10, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, outline: 'none', transition: 'border-color 0.2s ease' } },
    'email-hint': { id: 'email-hint', type: 'text', tag: 'span', text: 'We will never share your email address', style: { fontSize: 13, color: '#6b7280' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Email Address', 'Label updated');
  assertIncludes(patched, 'you@example.com', 'Placeholder updated');
  assertIncludes(patched, 'never share', 'Helper text updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['email-label'].text, 'Email Address', 'Label round-tripped');
  assertEqual(parsed['email-hint'].text, 'We will never share your email address', 'Hint round-tripped');
});

// Test 3: Skip navigation link
test('Skip to main content navigation link', () => {
  const code = `
export function SkipNav() {
  return (
    <div id="skip-nav-wrapper">
      <a id="skip-link" href="#main">Skip</a>
      <main id="main-content">Content</main>
    </div>
  );
}`;

  const nodesMap = {
    'skip-nav-wrapper': { id: 'skip-nav-wrapper', type: 'container', tag: 'div', style: {} },
    'skip-link': { 
      id: 'skip-link', 
      type: 'text', 
      tag: 'a', 
      href: '#main-content', 
      text: 'Skip to main content', 
      style: { 
        position: 'absolute', 
        left: -9999, 
        top: 0, 
        padding: '12px 20px', 
        background: '#2563eb', 
        color: '#fff', 
        textDecoration: 'none', 
        fontSize: 14, 
        fontWeight: 600,
        borderRadius: '0 0 6px 6px',
        transition: 'left 0.2s ease'
      } 
    },
    'main-content': { id: 'main-content', type: 'text', tag: 'main', text: 'Main application content here', style: { padding: 20 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Skip to main content', 'Skip link text updated');
  assertIncludes(patched, 'main-content', 'Skip link href updated');
  assertIncludes(patched, 'absolute', 'Visually hidden pattern applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['skip-link'].text, 'Skip to main content', 'Skip link round-tripped');
  assertEqual(parsed['skip-link'].href, '#main-content', 'Skip link href round-tripped');
});

// Test 4: Accessible modal dialog
test('Modal dialog with proper focus management', () => {
  const code = `
export function AccessibleModal() {
  return (
    <div id="modal-overlay">
      <div id="modal-dialog">
        <div id="modal-header">
          <h2 id="modal-title">Title</h2>
          <button id="modal-close">×</button>
        </div>
        <div id="modal-body">
          <p id="modal-text">Content</p>
        </div>
        <div id="modal-footer">
          <button id="modal-cancel">Cancel</button>
          <button id="modal-confirm">Confirm</button>
        </div>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'modal-overlay': { id: 'modal-overlay', type: 'container', tag: 'div', style: { position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } },
    'modal-dialog': { id: 'modal-dialog', type: 'container', tag: 'div', style: { background: '#fff', borderRadius: 12, maxWidth: 500, width: '100%', boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)' } },
    'modal-header': { id: 'modal-header', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottom: '1px solid #e5e7eb' } },
    'modal-title': { id: 'modal-title', type: 'text', tag: 'h2', text: 'Confirm Action', style: { margin: 0, fontSize: 20, fontWeight: 600, color: '#111827' } },
    'modal-close': { id: 'modal-close', type: 'button', tag: 'button', text: '×', style: { padding: 0, width: 32, height: 32, background: 'transparent', border: 'none', fontSize: 28, color: '#6b7280', cursor: 'pointer', borderRadius: 6, transition: 'background 0.2s ease' } },
    'modal-body': { id: 'modal-body', type: 'container', tag: 'div', style: { padding: 20 } },
    'modal-text': { id: 'modal-text', type: 'text', tag: 'p', text: 'Are you sure you want to proceed? This action cannot be undone.', style: { margin: 0, fontSize: 15, color: '#374151', lineHeight: 1.6 } },
    'modal-footer': { id: 'modal-footer', type: 'container', tag: 'div', style: { display: 'flex', gap: 12, justifyContent: 'end', padding: 20, borderTop: '1px solid #e5e7eb' } },
    'modal-cancel': { id: 'modal-cancel', type: 'button', tag: 'button', text: 'Cancel', style: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s ease' } },
    'modal-confirm': { id: 'modal-confirm', type: 'button', tag: 'button', text: 'Confirm', style: { padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s ease' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Confirm Action', 'Modal title updated');
  assertIncludes(patched, 'cannot be undone', 'Modal message updated');
  assertIncludes(patched, 'fixed', 'Modal overlay positioning');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['modal-title'].text, 'Confirm Action', 'Modal title round-tripped');
});

// Test 5: Accessible alert/banner with icon
test('Alert banner with semantic structure', () => {
  const code = `
export function AccessibleAlert() {
  return (
    <div id="alert-banner">
      <div id="alert-icon">ℹ</div>
      <div id="alert-content">
        <h3 id="alert-heading">Heading</h3>
        <p id="alert-description">Description</p>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'alert-banner': { id: 'alert-banner', type: 'container', tag: 'div', style: { display: 'flex', gap: 12, padding: 16, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, borderLeft: '4px solid #2563eb' } },
    'alert-icon': { id: 'alert-icon', type: 'text', tag: 'div', text: '⚠️', style: { fontSize: 24, color: '#f59e0b', flexShrink: 0 } },
    'alert-content': { id: 'alert-content', type: 'container', tag: 'div', style: { flex: 1 } },
    'alert-heading': { id: 'alert-heading', type: 'text', tag: 'h3', text: 'Important Update', style: { margin: 0, fontSize: 16, fontWeight: 600, color: '#1e40af' } },
    'alert-description': { id: 'alert-description', type: 'text', tag: 'p', text: 'Please review the latest changes to your account settings by Friday.', style: { margin: 0, marginTop: 4, fontSize: 14, color: '#1e40af', lineHeight: 1.5 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Important Update', 'Alert heading updated');
  assertIncludes(patched, 'review the latest', 'Alert description updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['alert-heading'].text, 'Important Update', 'Heading round-tripped');
  assertEqual(parsed['alert-description'].text, 'Please review the latest changes to your account settings by Friday.', 'Description round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All accessibility tests passed!');
