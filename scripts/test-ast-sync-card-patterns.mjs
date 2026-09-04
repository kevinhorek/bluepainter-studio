#!/usr/bin/env node
/**
 * AST sync tests for card patterns (pricing, feature, testimonial cards)
 * Tests badges, icons, feature lists, and complete card layouts
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Card Patterns ===\n');

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

// Test 1: Complete PricingCard with badge, price, features, CTA
test('Complete PricingCard with badge and feature list', () => {
  const code = `
export function PricingCard() {
  return (
    <div id="card-frame" style={{ padding: 32, borderRadius: 12 }}>
      <span id="badge" style={{ fontSize: 12, fontWeight: 700 }}>PRO</span>
      <div id="price-container">
        <span id="price" style={{ fontSize: 48 }}>$49</span>
        <span id="period">/mo</span>
      </div>
      <ul id="features-list" style={{ listStyle: 'none', padding: 0 }}>
        <li id="feature-1">✓ Unlimited projects</li>
        <li id="feature-2">✓ Priority support</li>
        <li id="feature-3">✓ Advanced analytics</li>
      </ul>
      <button id="cta">Get Started</button>
    </div>
  );
}`;

  const nodesMap = {
    'card-frame': { id: 'card-frame', type: 'container', tag: 'div', style: { padding: 40, borderRadius: 16, background: '#fff', border: '1px solid #e5e7eb' } },
    'badge': { id: 'badge', type: 'text', tag: 'span', text: 'PREMIUM', style: { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#2563eb' } },
    'price-container': { id: 'price-container', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'baseline', gap: 4 } },
    'price': { id: 'price', type: 'text', tag: 'span', text: '$99', style: { fontSize: 64, fontWeight: 900 } },
    'period': { id: 'period', type: 'text', tag: 'span', text: '/year', style: { fontSize: 16, color: '#64748b' } },
    'features-list': { id: 'features-list', type: 'list', tag: 'ul', style: { listStyle: 'none', padding: 0, margin: 0 } },
    'feature-1': { id: 'feature-1', type: 'list-item', tag: 'li', text: '✓ Everything in Pro', style: { marginBottom: 12 } },
    'feature-2': { id: 'feature-2', type: 'list-item', tag: 'li', text: '✓ 24/7 dedicated support', style: { marginBottom: 12 } },
    'feature-3': { id: 'feature-3', type: 'list-item', tag: 'li', text: '✓ Real-time analytics', style: { marginBottom: 12 } },
    'cta': { id: 'cta', type: 'button', tag: 'button', text: 'Upgrade Now', style: { width: '100%', padding: 20, background: '#2563eb', color: '#fff', borderRadius: 8 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'PREMIUM', 'Badge text updated');
  assertIncludes(patched, 'textTransform', 'Badge text transform added');
  assertIncludes(patched, '$99', 'Price updated');
  assertIncludes(patched, '/year', 'Period updated');
  assertIncludes(patched, 'Everything in Pro', 'Feature 1 updated');
  assertIncludes(patched, '24/7 dedicated support', 'Feature 2 updated');
  assertIncludes(patched, 'Real-time analytics', 'Feature 3 updated');
  assertIncludes(patched, 'Upgrade Now', 'CTA updated');
  assertIncludes(patched, '#2563eb', 'CTA background added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['badge'].text, 'PREMIUM', 'Badge text round-tripped');
  assertEqual(parsed['price'].text, '$99', 'Price round-tripped');
  assertEqual(parsed['period'].text, '/year', 'Period round-tripped');
  assertEqual(parsed['cta'].text, 'Upgrade Now', 'CTA round-tripped');
});

// Test 2: Three-tier pricing comparison
test('Three-tier pricing table layout', () => {
  const code = `
export function PricingTiers() {
  return (
    <div id="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
      <div id="tier-basic" style={{ padding: 32 }}>
        <h3 id="name-basic">Basic</h3>
        <p id="price-basic">$10</p>
        <button id="cta-basic">Choose Plan</button>
      </div>
      <div id="tier-pro" style={{ padding: 32 }}>
        <h3 id="name-pro">Pro</h3>
        <p id="price-pro">$30</p>
        <button id="cta-pro">Choose Plan</button>
      </div>
      <div id="tier-enterprise" style={{ padding: 32 }}>
        <h3 id="name-enterprise">Enterprise</h3>
        <p id="price-enterprise">$100</p>
        <button id="cta-enterprise">Choose Plan</button>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'pricing-grid': { id: 'pricing-grid', type: 'container', tag: 'div', style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, maxWidth: 1200 } },
    'tier-basic': { id: 'tier-basic', type: 'container', tag: 'div', style: { padding: 40, borderRadius: 12, border: '1px solid #e5e7eb' } },
    'name-basic': { id: 'name-basic', type: 'text', tag: 'h3', text: 'Starter', style: { fontSize: 24, fontWeight: 600 } },
    'price-basic': { id: 'price-basic', type: 'text', tag: 'p', text: '$9/mo', style: { fontSize: 36 } },
    'cta-basic': { id: 'cta-basic', type: 'button', tag: 'button', text: 'Start Free Trial', style: { width: '100%', padding: 16 } },
    'tier-pro': { id: 'tier-pro', type: 'container', tag: 'div', style: { padding: 40, borderRadius: 12, border: '2px solid #2563eb', background: '#eff6ff' } },
    'name-pro': { id: 'name-pro', type: 'text', tag: 'h3', text: 'Professional', style: { fontSize: 24, fontWeight: 700, color: '#2563eb' } },
    'price-pro': { id: 'price-pro', type: 'text', tag: 'p', text: '$29/mo', style: { fontSize: 48, fontWeight: 900 } },
    'cta-pro': { id: 'cta-pro', type: 'button', tag: 'button', text: 'Start Free Trial', style: { width: '100%', padding: 20, background: '#2563eb', color: '#fff' } },
    'tier-enterprise': { id: 'tier-enterprise', type: 'container', tag: 'div', style: { padding: 40, borderRadius: 12, border: '1px solid #e5e7eb' } },
    'name-enterprise': { id: 'name-enterprise', type: 'text', tag: 'h3', text: 'Enterprise', style: { fontSize: 24, fontWeight: 600 } },
    'price-enterprise': { id: 'price-enterprise', type: 'text', tag: 'p', text: 'Custom', style: { fontSize: 36 } },
    'cta-enterprise': { id: 'cta-enterprise', type: 'button', tag: 'button', text: 'Contact Sales', style: { width: '100%', padding: 16 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Starter', 'Basic tier renamed');
  assertIncludes(patched, '$9/mo', 'Basic price updated');
  assertIncludes(patched, 'Professional', 'Pro tier renamed');
  assertIncludes(patched, '$29/mo', 'Pro price updated');
  assertIncludes(patched, '#eff6ff', 'Pro tier background added');
  assertIncludes(patched, 'Enterprise', 'Enterprise name preserved');
  assertIncludes(patched, 'Custom', 'Enterprise price updated');
  assertIncludes(patched, 'Contact Sales', 'Enterprise CTA updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['name-pro'].text, 'Professional', 'Pro name round-tripped');
  assertEqual(parsed['price-pro'].text, '$29/mo', 'Pro price round-tripped');
});

// Test 3: Feature card with icon and description
test('Feature card with checkmark icon', () => {
  const code = `
export function FeatureCard() {
  return (
    <div id="feature-card" style={{ padding: 24, borderRadius: 8 }}>
      <div id="icon-container" style={{ marginBottom: 16 }}>
        <span id="icon">✓</span>
      </div>
      <h4 id="title">Fast Performance</h4>
      <p id="description">Lightning-fast load times</p>
    </div>
  );
}`;

  const nodesMap = {
    'feature-card': { id: 'feature-card', type: 'container', tag: 'div', style: { padding: 32, borderRadius: 12, background: '#f9fafb' } },
    'icon-container': { id: 'icon-container', type: 'container', tag: 'div', style: { marginBottom: 24, width: 48, height: 48, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    'icon': { id: 'icon', type: 'text', tag: 'span', text: '✓', style: { fontSize: 24, color: '#fff' } },
    'title': { id: 'title', type: 'text', tag: 'h4', text: 'Blazing Speed', style: { fontSize: 20, fontWeight: 700, marginBottom: 8 } },
    'description': { id: 'description', type: 'text', tag: 'p', text: 'Sub-second load times guaranteed', style: { color: '#6b7280', lineHeight: 1.6 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Blazing Speed', 'Title updated');
  assertIncludes(patched, 'Sub-second load times', 'Description updated');
  assertIncludes(patched, '#10b981', 'Icon background added');
  assertIncludes(patched, '50%', 'Icon circle shape added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['title'].text, 'Blazing Speed', 'Title round-tripped');
  assertEqual(parsed['description'].text, 'Sub-second load times guaranteed', 'Description round-tripped');
});

// Test 4: Testimonial card
test('Testimonial card with quote and author', () => {
  const code = `
export function TestimonialCard() {
  return (
    <div id="testimonial-card" style={{ padding: 32, borderRadius: 12 }}>
      <p id="quote">This product is amazing!</p>
      <div id="author-container">
        <p id="author-name">John Doe</p>
        <p id="author-title">CEO, Company Inc</p>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'testimonial-card': { id: 'testimonial-card', type: 'container', tag: 'div', style: { padding: 40, borderRadius: 16, background: '#fff', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' } },
    'quote': { id: 'quote', type: 'text', tag: 'p', text: '"This tool transformed our workflow. Highly recommended!"', style: { fontSize: 18, lineHeight: 1.8, marginBottom: 24, fontStyle: 'italic' } },
    'author-container': { id: 'author-container', type: 'container', tag: 'div', style: { borderTop: '1px solid #e5e7eb', paddingTop: 16 } },
    'author-name': { id: 'author-name', type: 'text', tag: 'p', text: 'Sarah Johnson', style: { fontWeight: 700, marginBottom: 4 } },
    'author-title': { id: 'author-title', type: 'text', tag: 'p', text: 'VP of Engineering, Tech Corp', style: { fontSize: 14, color: '#6b7280' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'This tool transformed our workflow', 'Quote updated');
  assertIncludes(patched, 'italic', 'Quote italic style added');
  assertIncludes(patched, 'Sarah Johnson', 'Author name updated');
  assertIncludes(patched, 'VP of Engineering', 'Author title updated');
  assertIncludes(patched, 'boxShadow', 'Card shadow added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['quote'].text, '"This tool transformed our workflow. Highly recommended!"', 'Quote round-tripped');
  assertEqual(parsed['author-name'].text, 'Sarah Johnson', 'Author name round-tripped');
});

// Test 5: Product card with image and details
test('Product card with image, title, price', () => {
  const code = `
export function ProductCard() {
  return (
    <div id="product-card" style={{ borderRadius: 8 }}>
      <img id="product-image" src="/placeholder.jpg" style={{ width: '100%' }} />
      <div id="product-details" style={{ padding: 16 }}>
        <h3 id="product-title">Product Name</h3>
        <p id="product-price">$99</p>
        <button id="add-to-cart">Add to Cart</button>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'product-card': { id: 'product-card', type: 'container', tag: 'div', style: { borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' } },
    'product-image': { id: 'product-image', type: 'image', tag: 'img', src: '/products/laptop.jpg', style: { width: '100%', height: 200, objectFit: 'cover' } },
    'product-details': { id: 'product-details', type: 'container', tag: 'div', style: { padding: 24 } },
    'product-title': { id: 'product-title', type: 'text', tag: 'h3', text: 'MacBook Pro 16"', style: { fontSize: 18, fontWeight: 600, marginBottom: 8 } },
    'product-price': { id: 'product-price', type: 'text', tag: 'p', text: '$2,499', style: { fontSize: 24, fontWeight: 700, color: '#2563eb', marginBottom: 16 } },
    'add-to-cart': { id: 'add-to-cart', type: 'button', tag: 'button', text: 'Buy Now', style: { width: '100%', padding: 16, background: '#2563eb', color: '#fff', borderRadius: 8 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, '/products/laptop.jpg', 'Image src updated');
  assertIncludes(patched, 'MacBook Pro 16"', 'Product title updated');
  assertIncludes(patched, '$2,499', 'Price updated');
  assertIncludes(patched, 'Buy Now', 'Button text updated');
  assertIncludes(patched, 'objectFit', 'Image object fit added');
  assertIncludes(patched, 'cover', 'Image object fit value correct');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['product-image'].src, '/products/laptop.jpg', 'Image src round-tripped');
  assertEqual(parsed['product-title'].text, 'MacBook Pro 16"', 'Title round-tripped');
  assertEqual(parsed['product-price'].text, '$2,499', 'Price round-tripped');
  assertEqual(parsed['add-to-cart'].text, 'Buy Now', 'Button round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All card pattern tests passed!');
