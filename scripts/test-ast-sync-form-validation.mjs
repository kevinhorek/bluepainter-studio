#!/usr/bin/env node
/**
 * AST sync tests for form validation patterns
 * Tests error messages, field validation states, tooltips, helper text
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Form Validation Patterns ===\n');

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

// Test 1: Input field with error state and message
test('Input with validation error message', () => {
  const code = `
export function EmailField() {
  return (
    <div id="field-wrapper">
      <label id="field-label">Email</label>
      <input id="email-input" type="email" placeholder="your@email.com" />
      <span id="error-message">Invalid email</span>
    </div>
  );
}`;

  const nodesMap = {
    'field-wrapper': { id: 'field-wrapper', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', gap: 6 } },
    'field-label': { id: 'field-label', type: 'text', tag: 'label', text: 'Email Address', style: { fontSize: 14, fontWeight: 600, color: '#dc2626', marginBottom: 2 } },
    'email-input': { id: 'email-input', type: 'input', tag: 'input', inputType: 'email', placeholder: 'Enter your email address', style: { padding: 10, fontSize: 14, border: '2px solid #dc2626', borderRadius: 6, outline: 'none', background: '#fef2f2' } },
    'error-message': { id: 'error-message', type: 'text', tag: 'span', text: 'Please enter a valid email address', style: { fontSize: 13, color: '#dc2626', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Email Address', 'Label updated');
  assertIncludes(patched, 'Enter your email address', 'Placeholder updated');
  assertIncludes(patched, 'valid email address', 'Error message updated');
  assertIncludes(patched, '#dc2626', 'Error color applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['field-label'].text, 'Email Address', 'Label round-tripped');
  assertEqual(parsed['error-message'].text, 'Please enter a valid email address', 'Error message round-tripped');
});

// Test 2: Multi-field form with success and error states
test('Form with mixed validation states (success/error)', () => {
  const code = `
export function SignupForm() {
  return (
    <form id="signup-form">
      <div id="name-field">
        <label id="name-label">Name</label>
        <input id="name-input" type="text" />
        <span id="name-success">Looks good!</span>
      </div>
      <div id="email-field">
        <label id="email-label">Email</label>
        <input id="email-input" type="email" />
        <span id="email-error">Required field</span>
      </div>
    </form>
  );
}`;

  const nodesMap = {
    'signup-form': { id: 'signup-form', type: 'container', tag: 'form', style: { display: 'flex', flexDirection: 'column', gap: 20, padding: 24, maxWidth: 400 } },
    'name-field': { id: 'name-field', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', gap: 6 } },
    'name-label': { id: 'name-label', type: 'text', tag: 'label', text: 'Full Name', style: { fontSize: 14, fontWeight: 600, color: '#16a34a' } },
    'name-input': { id: 'name-input', type: 'input', tag: 'input', inputType: 'text', style: { padding: 10, border: '2px solid #16a34a', borderRadius: 6, fontSize: 14, background: '#f0fdf4' } },
    'name-success': { id: 'name-success', type: 'text', tag: 'span', text: '✓ Valid', style: { fontSize: 13, color: '#16a34a', fontWeight: 500 } },
    'email-field': { id: 'email-field', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', gap: 6 } },
    'email-label': { id: 'email-label', type: 'text', tag: 'label', text: 'Email Address', style: { fontSize: 14, fontWeight: 600, color: '#dc2626' } },
    'email-input': { id: 'email-input', type: 'input', tag: 'input', inputType: 'email', style: { padding: 10, border: '2px solid #dc2626', borderRadius: 6, fontSize: 14, background: '#fef2f2' } },
    'email-error': { id: 'email-error', type: 'text', tag: 'span', text: '⚠ This field is required', style: { fontSize: 13, color: '#dc2626', fontWeight: 500 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Full Name', 'Success field label updated');
  assertIncludes(patched, '✓ Valid', 'Success message updated');
  assertIncludes(patched, '⚠ This field is required', 'Error message updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['name-success'].text, '✓ Valid', 'Success message round-tripped');
  assertEqual(parsed['email-error'].text, '⚠ This field is required', 'Error message round-tripped');
});

// Test 3: Password field with strength indicator
test('Password field with strength indicator', () => {
  const code = `
export function PasswordField() {
  return (
    <div id="password-wrapper">
      <label id="password-label">Password</label>
      <input id="password-input" type="password" placeholder="Password" />
      <div id="strength-bar">
        <div id="strength-fill"></div>
      </div>
      <span id="strength-text">Weak</span>
      <ul id="requirements-list">
        <li id="req-1">8+ characters</li>
        <li id="req-2">1 uppercase letter</li>
        <li id="req-3">1 number</li>
      </ul>
    </div>
  );
}`;

  const nodesMap = {
    'password-wrapper': { id: 'password-wrapper', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 } },
    'password-label': { id: 'password-label', type: 'text', tag: 'label', text: 'Create Password', style: { fontSize: 14, fontWeight: 600, color: '#374151' } },
    'password-input': { id: 'password-input', type: 'input', tag: 'input', inputType: 'password', placeholder: 'Enter a strong password', style: { padding: 10, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 } },
    'strength-bar': { id: 'strength-bar', type: 'container', tag: 'div', style: { width: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' } },
    'strength-fill': { id: 'strength-fill', type: 'container', tag: 'div', style: { width: '75%', height: '100%', background: '#f59e0b', transition: 'all 0.3s' } },
    'strength-text': { id: 'strength-text', type: 'text', tag: 'span', text: 'Medium', style: { fontSize: 13, fontWeight: 600, color: '#f59e0b' } },
    'requirements-list': { id: 'requirements-list', type: 'container', tag: 'ul', style: { margin: 0, padding: 0, paddingLeft: 20, fontSize: 13, color: '#6b7280' } },
    'req-1': { id: 'req-1', type: 'text', tag: 'li', text: '✓ At least 8 characters', style: { color: '#16a34a' } },
    'req-2': { id: 'req-2', type: 'text', tag: 'li', text: '✓ One uppercase letter', style: { color: '#16a34a' } },
    'req-3': { id: 'req-3', type: 'text', tag: 'li', text: '✗ One number or symbol', style: { color: '#dc2626' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Create Password', 'Label updated');
  assertIncludes(patched, 'Medium', 'Strength indicator updated');
  assertIncludes(patched, '75%', 'Strength bar width updated');
  assertIncludes(patched, 'number or symbol', 'Requirement updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['strength-text'].text, 'Medium', 'Strength text round-tripped');
});

// Test 4: Field with helper text tooltip
test('Form field with inline helper text', () => {
  const code = `
export function UsernameField() {
  return (
    <div id="username-field">
      <div id="label-row">
        <label id="username-label">Username</label>
        <span id="helper-icon">?</span>
      </div>
      <input id="username-input" type="text" placeholder="username" />
      <p id="helper-text">Your username will be visible to others.</p>
    </div>
  );
}`;

  const nodesMap = {
    'username-field': { id: 'username-field', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', gap: 6 } },
    'label-row': { id: 'label-row', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 6 } },
    'username-label': { id: 'username-label', type: 'text', tag: 'label', text: 'Choose Username', style: { fontSize: 14, fontWeight: 600, color: '#374151' } },
    'helper-icon': { id: 'helper-icon', type: 'text', tag: 'span', text: 'ℹ', style: { fontSize: 16, color: '#2563eb', cursor: 'pointer' } },
    'username-input': { id: 'username-input', type: 'input', tag: 'input', inputType: 'text', placeholder: 'e.g. johndoe123', style: { padding: 10, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 } },
    'helper-text': { id: 'helper-text', type: 'text', tag: 'p', text: 'Choose a unique username. This can be changed later in settings.', style: { margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Choose Username', 'Label updated');
  assertIncludes(patched, 'unique username', 'Helper text updated');
  assertIncludes(patched, 'johndoe123', 'Placeholder updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['helper-text'].text, 'Choose a unique username. This can be changed later in settings.', 'Helper text round-tripped');
});

// Test 5: Required field indicator
test('Form field with required indicator', () => {
  const code = `
export function RequiredField() {
  return (
    <div id="required-field">
      <div id="label-container">
        <label id="field-label">Company Name</label>
        <span id="required-badge">Required</span>
      </div>
      <input id="company-input" type="text" placeholder="Enter name" />
      <span id="char-count">0 / 100</span>
    </div>
  );
}`;

  const nodesMap = {
    'required-field': { id: 'required-field', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', gap: 6 } },
    'label-container': { id: 'label-container', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' } },
    'field-label': { id: 'field-label', type: 'text', tag: 'label', text: 'Organization Name', style: { fontSize: 14, fontWeight: 600, color: '#374151' } },
    'required-badge': { id: 'required-badge', type: 'text', tag: 'span', text: '*', style: { fontSize: 12, fontWeight: 700, color: '#dc2626', padding: '2px 6px', background: '#fee2e2', borderRadius: 4 } },
    'company-input': { id: 'company-input', type: 'input', tag: 'input', inputType: 'text', placeholder: 'Acme Corp', style: { padding: 10, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 } },
    'char-count': { id: 'char-count', type: 'text', tag: 'span', text: '15 / 100 characters', style: { fontSize: 12, color: '#6b7280', textAlign: 'right' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Organization Name', 'Label updated');
  assertIncludes(patched, 'Acme Corp', 'Placeholder updated');
  assertIncludes(patched, '15 / 100', 'Character count updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['field-label'].text, 'Organization Name', 'Label round-tripped');
  assertEqual(parsed['char-count'].text, '15 / 100 characters', 'Character count round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All form validation tests passed!');
