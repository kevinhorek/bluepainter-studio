#!/usr/bin/env node
/**
 * AST sync tests for animation and transition patterns
 * Tests CSS transitions, keyframe animations, transform properties, motion design
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Animation & Transition Patterns ===\n');

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

// Test 1: Button with hover transition
test('Interactive button with smooth transitions', () => {
  const code = `
export function AnimatedButton() {
  return (
    <button id="animated-button">Click Me</button>
  );
}`;

  const nodesMap = {
    'animated-button': { 
      id: 'animated-button', 
      type: 'button', 
      tag: 'button', 
      text: 'Get Started Free', 
      style: { 
        padding: '14px 28px', 
        background: '#2563eb', 
        color: '#fff', 
        border: 'none', 
        borderRadius: 8, 
        fontSize: 16, 
        fontWeight: 600, 
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: 'scale(1)',
        boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)'
      } 
    }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Get Started Free', 'Button text updated');
  assertIncludes(patched, 'transition', 'Transition property added');
  assertIncludes(patched, '0.3s ease', 'Transition timing applied');
  assertIncludes(patched, 'transform', 'Transform property added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['animated-button'].text, 'Get Started Free', 'Button text round-tripped');
  assertEqual(parsed['animated-button'].style.transition, 'all 0.3s ease', 'Transition round-tripped');
});

// Test 2: Card with scale animation on hover
test('Card with scale transform and shadow transition', () => {
  const code = `
export function HoverCard() {
  return (
    <div id="hover-card">
      <h3 id="card-title">Title</h3>
      <p id="card-description">Description</p>
    </div>
  );
}`;

  const nodesMap = {
    'hover-card': { 
      id: 'hover-card', 
      type: 'container', 
      tag: 'div', 
      style: { 
        padding: 24, 
        background: '#fff', 
        border: '1px solid #e5e7eb', 
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: 'translateY(0px)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      } 
    },
    'card-title': { 
      id: 'card-title', 
      type: 'text', 
      tag: 'h3', 
      text: 'Smooth Animations', 
      style: { 
        margin: 0, 
        fontSize: 20, 
        fontWeight: 600, 
        color: '#111827',
        transition: 'color 0.2s ease'
      } 
    },
    'card-description': { 
      id: 'card-description', 
      type: 'text', 
      tag: 'p', 
      text: 'Hover effects enhance user experience', 
      style: { 
        margin: 0, 
        marginTop: 8, 
        fontSize: 14, 
        color: '#6b7280', 
        lineHeight: 1.6 
      } 
    }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Smooth Animations', 'Card title updated');
  assertIncludes(patched, 'translateY(0px)', 'Transform translateY applied');
  assertIncludes(patched, 'transform 0.2s ease', 'Transform transition applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['card-title'].text, 'Smooth Animations', 'Title round-tripped');
});

// Test 3: Loading spinner with rotation animation
test('Loading spinner with continuous rotation', () => {
  const code = `
export function LoadingSpinner() {
  return (
    <div id="spinner-wrapper">
      <div id="spinner-circle"></div>
      <p id="loading-text">Loading...</p>
    </div>
  );
}`;

  const nodesMap = {
    'spinner-wrapper': { 
      id: 'spinner-wrapper', 
      type: 'container', 
      tag: 'div', 
      style: { 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 16, 
        padding: 40 
      } 
    },
    'spinner-circle': { 
      id: 'spinner-circle', 
      type: 'container', 
      tag: 'div', 
      style: { 
        width: 48, 
        height: 48, 
        border: '4px solid #e5e7eb', 
        borderTop: '4px solid #2563eb', 
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      } 
    },
    'loading-text': { 
      id: 'loading-text', 
      type: 'text', 
      tag: 'p', 
      text: 'Processing your request...', 
      style: { 
        margin: 0, 
        fontSize: 14, 
        color: '#6b7280', 
        fontWeight: 500 
      } 
    }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Processing your request', 'Loading text updated');
  assertIncludes(patched, 'animation', 'Animation property applied');
  assertIncludes(patched, 'spin 1s linear infinite', 'Spin animation applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['loading-text'].text, 'Processing your request...', 'Loading text round-tripped');
  assertEqual(parsed['spinner-circle'].style.animation, 'spin 1s linear infinite', 'Animation round-tripped');
});

// Test 4: Fade-in content reveal
test('Content reveal with opacity fade transition', () => {
  const code = `
export function FadeInContent() {
  return (
    <div id="fade-container">
      <h2 id="fade-heading">Heading</h2>
      <p id="fade-paragraph">Content</p>
    </div>
  );
}`;

  const nodesMap = {
    'fade-container': { 
      id: 'fade-container', 
      type: 'container', 
      tag: 'div', 
      style: { 
        padding: 40, 
        opacity: 1,
        transition: 'opacity 0.6s ease-in',
        transform: 'translateY(0)'
      } 
    },
    'fade-heading': { 
      id: 'fade-heading', 
      type: 'text', 
      tag: 'h2', 
      text: 'Welcome to Our Platform', 
      style: { 
        margin: 0, 
        fontSize: 32, 
        fontWeight: 700, 
        color: '#111827',
        opacity: 1,
        transition: 'opacity 0.6s ease-in 0.1s'
      } 
    },
    'fade-paragraph': { 
      id: 'fade-paragraph', 
      type: 'text', 
      tag: 'p', 
      text: 'Experience seamless content transitions that guide user attention', 
      style: { 
        margin: 0, 
        marginTop: 12, 
        fontSize: 16, 
        color: '#6b7280', 
        lineHeight: 1.6,
        opacity: 1,
        transition: 'opacity 0.6s ease-in 0.2s'
      } 
    }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Welcome to Our Platform', 'Heading updated');
  assertIncludes(patched, 'seamless content transitions', 'Paragraph updated');
  assertIncludes(patched, 'opacity 0.6s ease-in', 'Opacity transition applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['fade-heading'].text, 'Welcome to Our Platform', 'Heading round-tripped');
  assertEqual(parsed['fade-heading'].style.transition, 'opacity 0.6s ease-in 0.1s', 'Staggered transition round-tripped');
});

// Test 5: Slide-in notification toast
test('Notification toast with slide animation', () => {
  const code = `
export function SlideNotification() {
  return (
    <div id="toast-notification">
      <div id="toast-icon">✓</div>
      <div id="toast-content">
        <h4 id="toast-title">Success</h4>
        <p id="toast-message">Message</p>
      </div>
      <button id="toast-close">×</button>
    </div>
  );
}`;

  const nodesMap = {
    'toast-notification': { 
      id: 'toast-notification', 
      type: 'container', 
      tag: 'div', 
      style: { 
        display: 'flex', 
        alignItems: 'start', 
        gap: 12, 
        padding: 16, 
        background: '#f0fdf4', 
        border: '1px solid #86efac', 
        borderRadius: 8, 
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        animation: 'slideInRight 0.3s ease-out',
        maxWidth: 400
      } 
    },
    'toast-icon': { 
      id: 'toast-icon', 
      type: 'text', 
      tag: 'div', 
      text: '✓', 
      style: { 
        width: 24, 
        height: 24, 
        background: '#22c55e', 
        color: '#fff', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: 16, 
        fontWeight: 700,
        flexShrink: 0
      } 
    },
    'toast-content': { 
      id: 'toast-content', 
      type: 'container', 
      tag: 'div', 
      style: { flex: 1 } 
    },
    'toast-title': { 
      id: 'toast-title', 
      type: 'text', 
      tag: 'h4', 
      text: 'Changes Saved', 
      style: { 
        margin: 0, 
        fontSize: 14, 
        fontWeight: 600, 
        color: '#16a34a' 
      } 
    },
    'toast-message': { 
      id: 'toast-message', 
      type: 'text', 
      tag: 'p', 
      text: 'Your preferences have been updated successfully', 
      style: { 
        margin: 0, 
        marginTop: 4, 
        fontSize: 13, 
        color: '#15803d', 
        lineHeight: 1.5 
      } 
    },
    'toast-close': { 
      id: 'toast-close', 
      type: 'button', 
      tag: 'button', 
      text: '×', 
      style: { 
        padding: 0, 
        width: 20, 
        height: 20, 
        background: 'transparent', 
        border: 'none', 
        color: '#16a34a', 
        fontSize: 20, 
        lineHeight: 1, 
        cursor: 'pointer',
        transition: 'opacity 0.2s ease',
        opacity: 0.7
      } 
    }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Changes Saved', 'Toast title updated');
  assertIncludes(patched, 'preferences have been updated', 'Toast message updated');
  assertIncludes(patched, 'slideInRight', 'Slide animation applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['toast-title'].text, 'Changes Saved', 'Toast title round-tripped');
  assertEqual(parsed['toast-notification'].style.animation, 'slideInRight 0.3s ease-out', 'Animation round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All animation & transition tests passed!');
