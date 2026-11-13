#!/usr/bin/env node
/**
 * Expanded AST sync tests for real-world codebase patterns
 * Tests nested containers, arrays, complex trees, and style source detection
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST, detectStyleSources } = require('@bluepainter/shared/astSyncEngine');

console.log('=== Expanded AST Sync Tests (Real Codebase Patterns) ===\n');

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

function assertTruthy(value, message) {
  if (!value) {
    throw new Error(`${message}: expected truthy value, got ${value}`);
  }
}

// Test 1: Deeply nested container hierarchy (PricingCard-like)
test('Deeply nested container hierarchy with multiple levels', () => {
  const code = `
export function PricingCard() {
  return (
    <div id="card-outer" style={{ padding: 32, borderRadius: 12 }}>
      <div id="card-header" style={{ marginBottom: 24 }}>
        <div id="badge-container" style={{ display: 'flex' }}>
          <span id="badge-text" style={{ fontSize: 12 }}>PRO</span>
        </div>
        <h2 id="title" style={{ fontSize: 24, fontWeight: 700 }}>Professional</h2>
      </div>
      <div id="card-body" style={{ marginBottom: 32 }}>
        <p id="price" style={{ fontSize: 48 }}>$49</p>
        <p id="period" style={{ fontSize: 14, color: '#64748b' }}>per month</p>
      </div>
      <div id="card-footer">
        <button id="cta" style={{ width: '100%', padding: 16 }}>Get Started</button>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'card-outer': { id: 'card-outer', type: 'container', tag: 'div', style: { padding: 40, borderRadius: 16, background: '#fff' } },
    'card-header': { id: 'card-header', type: 'container', tag: 'div', style: { marginBottom: 32 } },
    'badge-container': { id: 'badge-container', type: 'container', tag: 'div', style: { display: 'flex', gap: 8 } },
    'badge-text': { id: 'badge-text', type: 'text', tag: 'span', text: 'PREMIUM', style: { fontSize: 10, fontWeight: 700 } },
    'title': { id: 'title', type: 'text', tag: 'h2', text: 'Premium Plan', style: { fontSize: 28 } },
    'card-body': { id: 'card-body', type: 'container', tag: 'div', style: { marginBottom: 40 } },
    'price': { id: 'price', type: 'text', tag: 'p', text: '$99', style: { fontSize: 64, fontWeight: 900 } },
    'period': { id: 'period', type: 'text', tag: 'p', text: 'per year', style: { fontSize: 16 } },
    'card-footer': { id: 'card-footer', type: 'container', tag: 'div', style: { padding: 8 } },
    'cta': { id: 'cta', type: 'button', tag: 'button', text: 'Upgrade Now', style: { width: '100%', padding: 20, background: '#2563eb' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'padding: 40', 'Outer padding updated');
  assertIncludes(patched, 'borderRadius: 16', 'Border radius updated');
  assertIncludes(patched, '#fff', 'Background added');
  assertIncludes(patched, 'gap: 8', 'Gap added to badge container');
  assertIncludes(patched, 'PREMIUM', 'Badge text updated');
  assertIncludes(patched, 'Premium Plan', 'Title updated');
  assertIncludes(patched, '$99', 'Price updated');
  assertIncludes(patched, 'fontSize: 64', 'Price font size updated');
  assertIncludes(patched, 'fontWeight: 900', 'Price font weight updated');
  assertIncludes(patched, 'per year', 'Period text updated');
  assertIncludes(patched, 'Upgrade Now', 'CTA text updated');
  assertIncludes(patched, '#2563eb', 'CTA background updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['card-outer'].style.padding, 40, 'Outer padding round-tripped');
  assertEqual(parsed['badge-text'].text, 'PREMIUM', 'Badge text round-tripped');
  assertEqual(parsed['price'].text, '$99', 'Price round-tripped');
});

// Test 2: Array of feature items (list pattern)
test('Array of feature items with icons and descriptions', () => {
  const code = `
export function FeatureList() {
  return (
    <div id="features-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div id="feature-1" style={{ display: 'flex', alignItems: 'center' }}>
        <span id="icon-1">✓</span>
        <span id="text-1">Unlimited projects</span>
      </div>
      <div id="feature-2" style={{ display: 'flex', alignItems: 'center' }}>
        <span id="icon-2">✓</span>
        <span id="text-2">24/7 support</span>
      </div>
      <div id="feature-3" style={{ display: 'flex', alignItems: 'center' }}>
        <span id="icon-3">✓</span>
        <span id="text-3">Advanced analytics</span>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'features-container': { id: 'features-container', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', gap: 24 } },
    'feature-1': { id: 'feature-1', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 12 } },
    'icon-1': { id: 'icon-1', type: 'text', tag: 'span', text: '✓', style: { color: '#10b981', fontSize: 20 } },
    'text-1': { id: 'text-1', type: 'text', tag: 'span', text: 'Unlimited everything', style: { fontSize: 16 } },
    'feature-2': { id: 'feature-2', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 12 } },
    'icon-2': { id: 'icon-2', type: 'text', tag: 'span', text: '✓', style: { color: '#10b981', fontSize: 20 } },
    'text-2': { id: 'text-2', type: 'text', tag: 'span', text: 'Priority support', style: { fontSize: 16 } },
    'feature-3': { id: 'feature-3', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 12 } },
    'icon-3': { id: 'icon-3', type: 'text', tag: 'span', text: '✓', style: { color: '#10b981', fontSize: 20 } },
    'text-3': { id: 'text-3', type: 'text', tag: 'span', text: 'Real-time analytics', style: { fontSize: 16 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'gap: 24', 'Container gap updated');
  assertIncludes(patched, 'gap: 12', 'Feature gap added');
  assertIncludes(patched, '#10b981', 'Icon color added');
  assertIncludes(patched, 'Unlimited everything', 'Feature 1 updated');
  assertIncludes(patched, 'Priority support', 'Feature 2 updated');
  assertIncludes(patched, 'Real-time analytics', 'Feature 3 updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['features-container'].style.gap, 24, 'Container gap round-tripped');
  assertEqual(parsed['text-1'].text, 'Unlimited everything', 'Feature 1 text round-tripped');
});

// Test 3: Complex grid layout
test('Complex grid layout with multiple cards', () => {
  const code = `
export function CardGrid() {
  return (
    <div id="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
      <div id="card-1" style={{ padding: 24, borderRadius: 8 }}>
        <h3 id="title-1">Card 1</h3>
        <p id="desc-1">Description 1</p>
      </div>
      <div id="card-2" style={{ padding: 24, borderRadius: 8 }}>
        <h3 id="title-2">Card 2</h3>
        <p id="desc-2">Description 2</p>
      </div>
      <div id="card-3" style={{ padding: 24, borderRadius: 8 }}>
        <h3 id="title-3">Card 3</h3>
        <p id="desc-3">Description 3</p>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'grid': { id: 'grid', type: 'container', tag: 'div', style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 } },
    'card-1': { id: 'card-1', type: 'container', tag: 'div', style: { padding: 32, borderRadius: 12, background: '#f9fafb' } },
    'title-1': { id: 'title-1', type: 'text', tag: 'h3', text: 'Feature A', style: { fontSize: 20, fontWeight: 600 } },
    'desc-1': { id: 'desc-1', type: 'text', tag: 'p', text: 'Amazing feature', style: { color: '#6b7280' } },
    'card-2': { id: 'card-2', type: 'container', tag: 'div', style: { padding: 32, borderRadius: 12, background: '#f9fafb' } },
    'title-2': { id: 'title-2', type: 'text', tag: 'h3', text: 'Feature B', style: { fontSize: 20, fontWeight: 600 } },
    'desc-2': { id: 'desc-2', type: 'text', tag: 'p', text: 'Great feature', style: { color: '#6b7280' } },
    'card-3': { id: 'card-3', type: 'container', tag: 'div', style: { padding: 32, borderRadius: 12, background: '#f9fafb' } },
    'title-3': { id: 'title-3', type: 'text', tag: 'h3', text: 'Feature C', style: { fontSize: 20, fontWeight: 600 } },
    'desc-3': { id: 'desc-3', type: 'text', tag: 'p', text: 'Awesome feature', style: { color: '#6b7280' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'repeat(4, 1fr)', 'Grid columns updated');
  assertIncludes(patched, 'gap: 32', 'Grid gap updated');
  assertIncludes(patched, 'padding: 32', 'Card padding updated');
  assertIncludes(patched, '#f9fafb', 'Card background added');
  assertIncludes(patched, 'Feature A', 'Title 1 updated');
  assertIncludes(patched, 'Amazing feature', 'Description 1 updated');
});

// Test 4: Boolean and null values in styles
test('Boolean and null values in style attributes', () => {
  const code = `
export function StyledDiv() {
  return <div id="test" style={{ padding: 16, opacity: 1 }}>Content</div>;
}`;

  const nodesMap = {
    'test': { 
      id: 'test', 
      type: 'container', 
      tag: 'div', 
      style: { 
        padding: 20, 
        opacity: 0.8,
        pointerEvents: 'none'
      } 
    }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'padding: 20', 'Padding updated');
  assertIncludes(patched, 'opacity: 0.8', 'Opacity updated');
  assertIncludes(patched, 'pointerEvents', 'Pointer events added');
});

// Test 5: Detect Tailwind-only component
test('Detect Tailwind-only component (no inline styles)', () => {
  const code = `
export function TailwindCard() {
  return (
    <div id="card" className="bg-white rounded-lg shadow-md p-6">
      <h3 id="title" className="text-xl font-bold mb-2">Title</h3>
      <p id="desc" className="text-gray-600">Description</p>
    </div>
  );
}`;

  const result = detectStyleSources(code);
  assertEqual(result.hasInlineStyles, false, 'No inline styles detected');
  assertEqual(result.hasClassNames, true, 'ClassNames detected');
  assertEqual(result.hasTailwind, true, 'Tailwind patterns detected');
});

// Test 6: Detect mixed inline + Tailwind
test('Detect mixed inline styles and Tailwind', () => {
  const code = `
export function MixedCard() {
  return (
    <div id="card" className="bg-white rounded-lg" style={{ padding: 32 }}>
      <h3 id="title" style={{ fontSize: 24 }}>Title</h3>
      <p id="desc" className="text-gray-600">Description</p>
    </div>
  );
}`;

  const result = detectStyleSources(code);
  assertEqual(result.hasInlineStyles, true, 'Inline styles detected');
  assertEqual(result.hasClassNames, true, 'ClassNames detected');
  assertEqual(result.hasTailwind, true, 'Tailwind patterns detected');
});

// Test 7: Detect CSS modules
test('Detect CSS modules usage', () => {
  const code = `
import styles from './Card.module.css';

export function CssModuleCard() {
  return (
    <div id="card" className={styles.card}>
      <h3 id="title" className={styles.title}>Title</h3>
      <p id="desc" className={styles.description}>Description</p>
    </div>
  );
}`;

  const result = detectStyleSources(code);
  assertEqual(result.hasInlineStyles, false, 'No inline styles');
  assertEqual(result.hasClassNames, true, 'ClassNames detected');
  assertEqual(result.hasCssModules, true, 'CSS modules detected');
});

// Test 8: Detect pure inline styles
test('Detect pure inline styles component', () => {
  const code = `
export function InlineCard() {
  return (
    <div id="card" style={{ padding: 32, borderRadius: 12, background: '#fff' }}>
      <h3 id="title" style={{ fontSize: 24, fontWeight: 700 }}>Title</h3>
      <p id="desc" style={{ color: '#64748b' }}>Description</p>
    </div>
  );
}`;

  const result = detectStyleSources(code);
  assertEqual(result.hasInlineStyles, true, 'Inline styles detected');
  assertEqual(result.hasClassNames, false, 'No classNames');
  assertEqual(result.hasTailwind, false, 'No Tailwind');
  assertEqual(result.hasCssModules, false, 'No CSS modules');
});

// Test 9: Complex pricing table with multiple tiers
test('Complex pricing table with three tiers', () => {
  const code = `
export function PricingTable() {
  return (
    <div id="table" style={{ display: 'flex', gap: 32 }}>
      <div id="tier-basic" style={{ flex: 1, padding: 40 }}>
        <h3 id="name-basic">Basic</h3>
        <p id="price-basic">$10</p>
        <button id="cta-basic">Choose Plan</button>
      </div>
      <div id="tier-pro" style={{ flex: 1, padding: 40 }}>
        <h3 id="name-pro">Pro</h3>
        <p id="price-pro">$30</p>
        <button id="cta-pro">Choose Plan</button>
      </div>
      <div id="tier-enterprise" style={{ flex: 1, padding: 40 }}>
        <h3 id="name-enterprise">Enterprise</h3>
        <p id="price-enterprise">$100</p>
        <button id="cta-enterprise">Choose Plan</button>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'table': { id: 'table', type: 'container', tag: 'div', style: { display: 'flex', gap: 48, justifyContent: 'center' } },
    'tier-basic': { id: 'tier-basic', type: 'container', tag: 'div', style: { flex: 1, padding: 48, borderRadius: 16 } },
    'name-basic': { id: 'name-basic', type: 'text', tag: 'h3', text: 'Starter', style: { fontSize: 20 } },
    'price-basic': { id: 'price-basic', type: 'text', tag: 'p', text: '$9', style: { fontSize: 48 } },
    'cta-basic': { id: 'cta-basic', type: 'button', tag: 'button', text: 'Get Started', style: { padding: 16 } },
    'tier-pro': { id: 'tier-pro', type: 'container', tag: 'div', style: { flex: 1, padding: 48, borderRadius: 16, background: '#f0f9ff' } },
    'name-pro': { id: 'name-pro', type: 'text', tag: 'h3', text: 'Professional', style: { fontSize: 20 } },
    'price-pro': { id: 'price-pro', type: 'text', tag: 'p', text: '$29', style: { fontSize: 48 } },
    'cta-pro': { id: 'cta-pro', type: 'button', tag: 'button', text: 'Get Started', style: { padding: 16, background: '#2563eb' } },
    'tier-enterprise': { id: 'tier-enterprise', type: 'container', tag: 'div', style: { flex: 1, padding: 48, borderRadius: 16 } },
    'name-enterprise': { id: 'name-enterprise', type: 'text', tag: 'h3', text: 'Custom', style: { fontSize: 20 } },
    'price-enterprise': { id: 'price-enterprise', type: 'text', tag: 'p', text: 'Contact', style: { fontSize: 48 } },
    'cta-enterprise': { id: 'cta-enterprise', type: 'button', tag: 'button', text: 'Contact Sales', style: { padding: 16 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'gap: 48', 'Table gap updated');
  assertIncludes(patched, 'justifyContent', 'Justify content added');
  assertIncludes(patched, 'Starter', 'Basic tier renamed');
  assertIncludes(patched, 'Professional', 'Pro tier renamed');
  assertIncludes(patched, 'Custom', 'Enterprise tier renamed');
  assertIncludes(patched, '$9', 'Basic price updated');
  assertIncludes(patched, '$29', 'Pro price updated');
  assertIncludes(patched, 'Contact', 'Enterprise price updated');
  assertIncludes(patched, '#f0f9ff', 'Pro tier background added');
  assertIncludes(patched, '#2563eb', 'Pro CTA background added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['name-pro'].text, 'Professional', 'Pro name round-tripped');
  assertEqual(parsed['price-pro'].text, '$29', 'Pro price round-tripped');
});

// Test 10: Preserve className when patching inline styles
test('Preserve className attribute when patching inline styles', () => {
  const code = `
export function MixedComponent() {
  return (
    <div id="container" className="wrapper layout-grid" style={{ padding: 16 }}>
      <h1 id="heading" className="title-lg font-bold" style={{ fontSize: 24 }}>Hello</h1>
    </div>
  );
}`;

  const nodesMap = {
    'container': { id: 'container', type: 'container', tag: 'div', style: { padding: 32, margin: 16 } },
    'heading': { id: 'heading', type: 'text', tag: 'h1', text: 'Welcome', style: { fontSize: 32, fontWeight: 900 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'wrapper layout-grid', 'Container className preserved');
  assertIncludes(patched, 'title-lg font-bold', 'Heading className preserved');
  assertIncludes(patched, 'padding: 32', 'Container padding updated');
  assertIncludes(patched, 'margin: 16', 'Container margin added');
  assertIncludes(patched, 'Welcome', 'Heading text updated');
  assertIncludes(patched, 'fontSize: 32', 'Heading font size updated');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All expanded AST tests passed!');
