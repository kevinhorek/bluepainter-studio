#!/usr/bin/env node
/**
 * AST sync tests for responsive design patterns
 * Tests mobile-first layouts, breakpoint patterns, flexible grids, responsive typography
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Responsive Design Patterns ===\n');

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

// Test 1: Mobile-first container with max-width
test('Mobile-first responsive container', () => {
  const code = `
export function ResponsiveContainer() {
  return (
    <div id="container">
      <h1 id="title">Title</h1>
      <p id="description">Description</p>
    </div>
  );
}`;

  const nodesMap = {
    'container': { id: 'container', type: 'container', tag: 'div', style: { width: '100%', maxWidth: 1200, margin: '0 auto', padding: '20px 16px' } },
    'title': { id: 'title', type: 'text', tag: 'h1', text: 'Responsive Layout', style: { margin: 0, fontSize: 32, fontWeight: 700, color: '#111827', lineHeight: 1.2 } },
    'description': { id: 'description', type: 'text', tag: 'p', text: 'This layout adapts from mobile (320px) to desktop (1200px max-width)', style: { margin: 0, marginTop: 12, fontSize: 18, color: '#6b7280', lineHeight: 1.6 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Responsive Layout', 'Title updated');
  assertIncludes(patched, 'maxWidth: 1200', 'Max-width applied');
  assertIncludes(patched, '20px 16px', 'Mobile-first padding applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['title'].text, 'Responsive Layout', 'Title round-tripped');
  assertEqual(parsed['container'].style.maxWidth, 1200, 'Max-width round-tripped');
});

// Test 2: Responsive grid that stacks on mobile
test('Responsive grid with stacking behavior', () => {
  const code = `
export function ResponsiveGrid() {
  return (
    <div id="grid">
      <div id="col-1">
        <h3 id="col-1-title">Column 1</h3>
        <p id="col-1-text">Content</p>
      </div>
      <div id="col-2">
        <h3 id="col-2-title">Column 2</h3>
        <p id="col-2-text">Content</p>
      </div>
      <div id="col-3">
        <h3 id="col-3-title">Column 3</h3>
        <p id="col-3-text">Content</p>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'grid': { id: 'grid', type: 'container', tag: 'div', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, padding: 16 } },
    'col-1': { id: 'col-1', type: 'container', tag: 'div', style: { padding: 20, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' } },
    'col-1-title': { id: 'col-1-title', type: 'text', tag: 'h3', text: 'Features', style: { margin: 0, fontSize: 20, fontWeight: 600, color: '#111827' } },
    'col-1-text': { id: 'col-1-text', type: 'text', tag: 'p', text: 'Powerful features for your workflow', style: { margin: 0, marginTop: 8, fontSize: 14, color: '#6b7280', lineHeight: 1.6 } },
    'col-2': { id: 'col-2', type: 'container', tag: 'div', style: { padding: 20, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' } },
    'col-2-title': { id: 'col-2-title', type: 'text', tag: 'h3', text: 'Integrations', style: { margin: 0, fontSize: 20, fontWeight: 600, color: '#111827' } },
    'col-2-text': { id: 'col-2-text', type: 'text', tag: 'p', text: 'Connect with your favorite tools', style: { margin: 0, marginTop: 8, fontSize: 14, color: '#6b7280', lineHeight: 1.6 } },
    'col-3': { id: 'col-3', type: 'container', tag: 'div', style: { padding: 20, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' } },
    'col-3-title': { id: 'col-3-title', type: 'text', tag: 'h3', text: 'Support', style: { margin: 0, fontSize: 20, fontWeight: 600, color: '#111827' } },
    'col-3-text': { id: 'col-3-text', type: 'text', tag: 'p', text: '24/7 customer support team', style: { margin: 0, marginTop: 8, fontSize: 14, color: '#6b7280', lineHeight: 1.6 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Features', 'Column 1 title updated');
  assertIncludes(patched, 'Integrations', 'Column 2 title updated');
  assertIncludes(patched, 'auto-fit', 'Auto-fit grid applied');
  assertIncludes(patched, 'minmax(280px, 1fr)', 'Responsive minmax applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['col-1-title'].text, 'Features', 'Column title round-tripped');
});

// Test 3: Flexible image with aspect ratio
test('Responsive image with aspect ratio', () => {
  const code = `
export function ResponsiveImage() {
  return (
    <div id="image-wrapper">
      <div id="image-container">
        <div id="image-placeholder"></div>
      </div>
      <p id="caption">Image caption</p>
    </div>
  );
}`;

  const nodesMap = {
    'image-wrapper': { id: 'image-wrapper', type: 'container', tag: 'div', style: { maxWidth: 640, margin: '0 auto' } },
    'image-container': { id: 'image-container', type: 'container', tag: 'div', style: { position: 'relative', width: '100%', paddingBottom: '56.25%', overflow: 'hidden', borderRadius: 12, background: '#e5e7eb' } },
    'image-placeholder': { id: 'image-placeholder', type: 'container', tag: 'div', style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } },
    'caption': { id: 'caption', type: 'text', tag: 'p', text: 'Product showcase in 16:9 aspect ratio', style: { margin: 0, marginTop: 12, fontSize: 14, color: '#6b7280', textAlign: 'center', fontStyle: 'italic' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, '56.25%', 'Aspect ratio padding applied');
  assertIncludes(patched, 'Product showcase', 'Caption updated');
  assertIncludes(patched, 'objectFit', 'Object-fit applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['caption'].text, 'Product showcase in 16:9 aspect ratio', 'Caption round-tripped');
});

// Test 4: Responsive typography scale
test('Fluid typography with scalable font sizes', () => {
  const code = `
export function ResponsiveTypography() {
  return (
    <div id="content">
      <h1 id="hero-heading">Hero</h1>
      <h2 id="section-heading">Section</h2>
      <p id="body-text">Body text</p>
      <span id="caption-text">Caption</span>
    </div>
  );
}`;

  const nodesMap = {
    'content': { id: 'content', type: 'container', tag: 'div', style: { padding: '24px 16px', maxWidth: 800, margin: '0 auto' } },
    'hero-heading': { id: 'hero-heading', type: 'text', tag: 'h1', text: 'Transform Your Workflow', style: { margin: 0, fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: '#111827', lineHeight: 1.1, letterSpacing: -0.02 } },
    'section-heading': { id: 'section-heading', type: 'text', tag: 'h2', text: 'Key Benefits', style: { margin: 0, marginTop: 32, fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, color: '#374151', lineHeight: 1.2 } },
    'body-text': { id: 'body-text', type: 'text', tag: 'p', text: 'Our platform scales seamlessly from mobile to desktop, ensuring optimal readability at every screen size.', style: { margin: 0, marginTop: 16, fontSize: 'clamp(16px, 2vw, 18px)', color: '#6b7280', lineHeight: 1.7 } },
    'caption-text': { id: 'caption-text', type: 'text', tag: 'span', text: 'Available on all devices', style: { display: 'block', marginTop: 12, fontSize: 14, color: '#9ca3af', fontStyle: 'italic' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Transform Your Workflow', 'Hero heading updated');
  assertIncludes(patched, 'clamp(32px, 5vw, 56px)', 'Fluid hero font size applied');
  assertIncludes(patched, 'clamp(24px, 3.5vw, 40px)', 'Fluid section font size applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['hero-heading'].text, 'Transform Your Workflow', 'Hero text round-tripped');
  assertEqual(parsed['body-text'].style.fontSize, 'clamp(16px, 2vw, 18px)', 'Clamp value round-tripped');
});

// Test 5: Responsive navigation (desktop horizontal, mobile stacked)
test('Responsive navigation bar', () => {
  const code = `
export function ResponsiveNav() {
  return (
    <nav id="navbar">
      <div id="nav-container">
        <div id="logo">Logo</div>
        <div id="nav-links">
          <a id="link-1" href="#">Link 1</a>
          <a id="link-2" href="#">Link 2</a>
          <a id="link-3" href="#">Link 3</a>
        </div>
        <button id="cta-button">CTA</button>
      </div>
    </nav>
  );
}`;

  const nodesMap = {
    'navbar': { id: 'navbar', type: 'container', tag: 'nav', style: { width: '100%', background: '#fff', borderBottom: '1px solid #e5e7eb' } },
    'nav-container': { id: 'nav-container', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto', padding: '16px 20px', flexWrap: 'wrap', gap: 16 } },
    'logo': { id: 'logo', type: 'text', tag: 'div', text: 'BluePainter', style: { fontSize: 20, fontWeight: 700, color: '#2563eb' } },
    'nav-links': { id: 'nav-links', type: 'container', tag: 'div', style: { display: 'flex', gap: 24, flexGrow: 1, justifyContent: 'center', flexWrap: 'wrap' } },
    'link-1': { id: 'link-1', type: 'text', tag: 'a', href: '#features', text: 'Features', style: { fontSize: 15, fontWeight: 500, color: '#374151', textDecoration: 'none' } },
    'link-2': { id: 'link-2', type: 'text', tag: 'a', href: '#pricing', text: 'Pricing', style: { fontSize: 15, fontWeight: 500, color: '#374151', textDecoration: 'none' } },
    'link-3': { id: 'link-3', type: 'text', tag: 'a', href: '#about', text: 'About', style: { fontSize: 15, fontWeight: 500, color: '#374151', textDecoration: 'none' } },
    'cta-button': { id: 'cta-button', type: 'button', tag: 'button', text: 'Get Started', style: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'BluePainter', 'Logo updated');
  assertIncludes(patched, 'Features', 'Nav link 1 updated');
  assertIncludes(patched, 'Get Started', 'CTA button updated');
  assertIncludes(patched, 'flexWrap', 'Flex-wrap for responsive layout applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['logo'].text, 'BluePainter', 'Logo round-tripped');
  assertEqual(parsed['link-1'].href, '#features', 'Link href round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All responsive design tests passed!');
