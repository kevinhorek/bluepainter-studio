#!/usr/bin/env node
/**
 * AST sync tests for status indicators and state displays
 * Tests status badges, progress indicators, step indicators, alerts, banners
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Status Indicators & State Displays ===\n');

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

// Test 1: Status badge with different states
test('Status badges with success/warning/error states', () => {
  const code = `
export function StatusBadges() {
  return (
    <div id="status-container">
      <span id="badge-success">Active</span>
      <span id="badge-warning">Pending</span>
      <span id="badge-error">Failed</span>
    </div>
  );
}`;

  const nodesMap = {
    'status-container': { id: 'status-container', type: 'container', tag: 'div', style: { display: 'flex', gap: 12 } },
    'badge-success': { id: 'badge-success', type: 'text', tag: 'span', text: 'Deployed', style: { padding: 8, fontSize: 12, fontWeight: 600, background: '#d1fae5', color: '#065f46', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5 } },
    'badge-warning': { id: 'badge-warning', type: 'text', tag: 'span', text: 'Building', style: { padding: 8, fontSize: 12, fontWeight: 600, background: '#fef3c7', color: '#92400e', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5 } },
    'badge-error': { id: 'badge-error', type: 'text', tag: 'span', text: 'Build Failed', style: { padding: 8, fontSize: 12, fontWeight: 600, background: '#fee2e2', color: '#991b1b', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Deployed', 'Success badge updated');
  assertIncludes(patched, 'Building', 'Warning badge updated');
  assertIncludes(patched, 'Build Failed', 'Error badge updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['badge-success'].text, 'Deployed', 'Success badge round-tripped');
  assertEqual(parsed['badge-warning'].text, 'Building', 'Warning badge round-tripped');
});

// Test 2: Step indicator for multi-step processes
test('Step indicator with current, completed, and pending steps', () => {
  const code = `
export function StepIndicator() {
  return (
    <div id="steps-container">
      <div id="step-1">
        <div id="step-1-circle">✓</div>
        <p id="step-1-label">Setup</p>
      </div>
      <div id="step-2">
        <div id="step-2-circle">2</div>
        <p id="step-2-label">Configure</p>
      </div>
      <div id="step-3">
        <div id="step-3-circle">3</div>
        <p id="step-3-label">Deploy</p>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'steps-container': { id: 'steps-container', type: 'container', tag: 'div', style: { display: 'flex', gap: 24, alignItems: 'center' } },
    'step-1': { id: 'step-1', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 } },
    'step-1-circle': { id: 'step-1-circle', type: 'text', tag: 'div', text: '✓', style: { width: 40, height: 40, borderRadius: '50%', background: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 } },
    'step-1-label': { id: 'step-1-label', type: 'text', tag: 'p', text: 'Account Created', style: { margin: 0, fontSize: 14, fontWeight: 600, color: '#22c55e' } },
    'step-2': { id: 'step-2', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 } },
    'step-2-circle': { id: 'step-2-circle', type: 'text', tag: 'div', text: '2', style: { width: 40, height: 40, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 } },
    'step-2-label': { id: 'step-2-label', type: 'text', tag: 'p', text: 'Profile Setup', style: { margin: 0, fontSize: 14, fontWeight: 600, color: '#2563eb' } },
    'step-3': { id: 'step-3', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 } },
    'step-3-circle': { id: 'step-3-circle', type: 'text', tag: 'div', text: '3', style: { width: 40, height: 40, borderRadius: '50%', background: '#e5e7eb', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 } },
    'step-3-label': { id: 'step-3-label', type: 'text', tag: 'p', text: 'Complete', style: { margin: 0, fontSize: 14, fontWeight: 500, color: '#6b7280' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Account Created', 'Step 1 label updated');
  assertIncludes(patched, 'Profile Setup', 'Step 2 label updated');
  assertIncludes(patched, '50%', 'Circle shape applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['step-1-label'].text, 'Account Created', 'Step label round-tripped');
});

// Test 3: Alert banner with icon and action
test('Alert banner with dismissible action', () => {
  const code = `
export function AlertBanner() {
  return (
    <div id="alert">
      <div id="alert-icon">ℹ</div>
      <div id="alert-content">
        <h4 id="alert-title">Information</h4>
        <p id="alert-message">Message here</p>
      </div>
      <button id="alert-dismiss">×</button>
    </div>
  );
}`;

  const nodesMap = {
    'alert': { id: 'alert', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'start', gap: 16, padding: 16, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, borderLeft: '4px solid #2563eb' } },
    'alert-icon': { id: 'alert-icon', type: 'text', tag: 'div', text: '⚠️', style: { fontSize: 24, color: '#f59e0b', flexShrink: 0 } },
    'alert-content': { id: 'alert-content', type: 'container', tag: 'div', style: { flex: 1 } },
    'alert-title': { id: 'alert-title', type: 'text', tag: 'h4', text: 'Action Required', style: { margin: 0, marginBottom: 4, fontSize: 16, fontWeight: 700, color: '#1e40af' } },
    'alert-message': { id: 'alert-message', type: 'text', tag: 'p', text: 'Your payment method will expire soon. Please update your billing information to avoid service interruption.', style: { margin: 0, fontSize: 14, lineHeight: 1.6, color: '#1e40af' } },
    'alert-dismiss': { id: 'alert-dismiss', type: 'button', tag: 'button', text: '×', style: { padding: 0, width: 24, height: 24, background: 'transparent', border: 'none', color: '#1e40af', fontSize: 24, cursor: 'pointer', flexShrink: 0 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Action Required', 'Alert title updated');
  assertIncludes(patched, 'payment method', 'Alert message updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['alert-title'].text, 'Action Required', 'Alert title round-tripped');
});

// Test 4: Progress ring/circle indicator
test('Circular progress indicator with percentage', () => {
  const code = `
export function CircularProgress() {
  return (
    <div id="progress-wrapper">
      <div id="progress-ring">
        <div id="progress-inner">
          <span id="progress-text">0%</span>
        </div>
      </div>
      <p id="progress-label">Upload Progress</p>
    </div>
  );
}`;

  const nodesMap = {
    'progress-wrapper': { id: 'progress-wrapper', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 } },
    'progress-ring': { id: 'progress-ring', type: 'container', tag: 'div', style: { position: 'relative', width: 120, height: 120, borderRadius: '50%', background: 'conic-gradient(#2563eb 0% 68%, #e5e7eb 68% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    'progress-inner': { id: 'progress-inner', type: 'container', tag: 'div', style: { width: 96, height: 96, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    'progress-text': { id: 'progress-text', type: 'text', tag: 'span', text: '68%', style: { fontSize: 24, fontWeight: 700, color: '#2563eb' } },
    'progress-label': { id: 'progress-label', type: 'text', tag: 'p', text: 'Processing Files', style: { margin: 0, fontSize: 14, fontWeight: 500, color: '#374151' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, '68%', 'Progress percentage updated');
  assertIncludes(patched, 'Processing Files', 'Progress label updated');
  assertIncludes(patched, 'conic-gradient', 'Circular progress gradient applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['progress-text'].text, '68%', 'Progress text round-tripped');
});

// Test 5: Connection status indicator
test('Connection status with live indicator dot', () => {
  const code = `
export function ConnectionStatus() {
  return (
    <div id="connection-bar">
      <div id="status-dot"></div>
      <span id="status-text">Connected</span>
      <span id="status-detail">Last updated: 2s ago</span>
    </div>
  );
}`;

  const nodesMap = {
    'connection-bar': { id: 'connection-bar', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' } },
    'status-dot': { id: 'status-dot', type: 'container', tag: 'div', style: { width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.2)', animation: 'pulse 2s infinite' } },
    'status-text': { id: 'status-text', type: 'text', tag: 'span', text: 'Live', style: { fontSize: 14, fontWeight: 600, color: '#22c55e' } },
    'status-detail': { id: 'status-detail', type: 'text', tag: 'span', text: 'Updating in real-time', style: { fontSize: 13, color: '#6b7280', marginLeft: 'auto' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Live', 'Status text updated');
  assertIncludes(patched, 'real-time', 'Status detail updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['status-text'].text, 'Live', 'Status text round-tripped');
  assertEqual(parsed['status-detail'].text, 'Updating in real-time', 'Status detail round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All status indicator tests passed!');
