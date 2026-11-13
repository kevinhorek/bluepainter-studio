#!/usr/bin/env node
/**
 * AST sync tests for hero sections, forms, and navigation patterns
 * Tests common landing page and app UI patterns
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Hero / Form / Navigation Patterns ===\n');

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

// Test 1: Hero section with headline, subheadline, and CTA
test('Hero section with headline, subheadline, CTA', () => {
  const code = `
export function HeroSection() {
  return (
    <section id="hero" style={{ padding: 80 }}>
      <h1 id="headline">Welcome</h1>
      <p id="subheadline">Get started today</p>
      <button id="cta">Sign Up</button>
    </section>
  );
}`;

  const nodesMap = {
    'hero': { id: 'hero', type: 'container', tag: 'section', style: { padding: 120, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } },
    'headline': { id: 'headline', type: 'text', tag: 'h1', text: 'Build Amazing Products', style: { fontSize: 64, fontWeight: 900, color: '#fff', marginBottom: 24 } },
    'subheadline': { id: 'subheadline', type: 'text', tag: 'p', text: 'The fastest way to ship beautiful, production-ready apps', style: { fontSize: 24, color: '#e0e7ff', marginBottom: 40, maxWidth: 700 } },
    'cta': { id: 'cta', type: 'button', tag: 'button', text: 'Get Started Free', style: { padding: 20, fontSize: 18, fontWeight: 700, background: '#fff', color: '#667eea', borderRadius: 12, border: 'none', cursor: 'pointer' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Build Amazing Products', 'Headline updated');
  assertIncludes(patched, 'production-ready apps', 'Subheadline updated');
  assertIncludes(patched, 'Get Started Free', 'CTA updated');
  assertIncludes(patched, 'linear-gradient', 'Hero background gradient added');
  assertIncludes(patched, 'textAlign', 'Text align added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['headline'].text, 'Build Amazing Products', 'Headline round-tripped');
  assertEqual(parsed['subheadline'].text, 'The fastest way to ship beautiful, production-ready apps', 'Subheadline round-tripped');
  assertEqual(parsed['cta'].text, 'Get Started Free', 'CTA round-tripped');
});

// Test 2: Contact form with labels, inputs, textarea
test('Complete contact form with labels and textarea', () => {
  const code = `
export function ContactForm() {
  return (
    <form id="contact-form">
      <div id="name-field">
        <label id="name-label">Name</label>
        <input id="name-input" type="text" />
      </div>
      <div id="message-field">
        <label id="message-label">Message</label>
        <textarea id="message-textarea" />
      </div>
      <button id="submit-btn" type="submit">Submit</button>
    </form>
  );
}`;

  const nodesMap = {
    'contact-form': { id: 'contact-form', type: 'container', tag: 'form', style: { padding: 32, maxWidth: 600, background: '#fff', borderRadius: 12 } },
    'name-field': { id: 'name-field', type: 'container', tag: 'div', style: { marginBottom: 24 } },
    'name-label': { id: 'name-label', type: 'text', tag: 'label', text: 'Full Name', style: { display: 'block', marginBottom: 8, fontWeight: 600, color: '#1f2937' } },
    'name-input': { id: 'name-input', type: 'input', tag: 'input', inputType: 'text', placeholder: 'Enter your full name', style: { width: '100%', padding: 16, fontSize: 16, border: '1px solid #d1d5db', borderRadius: 8 } },
    'message-field': { id: 'message-field', type: 'container', tag: 'div', style: { marginBottom: 24 } },
    'message-label': { id: 'message-label', type: 'text', tag: 'label', text: 'Your Message', style: { display: 'block', marginBottom: 8, fontWeight: 600, color: '#1f2937' } },
    'message-textarea': { id: 'message-textarea', type: 'textarea', tag: 'textarea', placeholder: 'Tell us what you\'re thinking...', style: { width: '100%', padding: 16, fontSize: 16, border: '1px solid #d1d5db', borderRadius: 8, minHeight: 150, resize: 'vertical' } },
    'submit-btn': { id: 'submit-btn', type: 'button', tag: 'button', text: 'Send Message', buttonType: 'submit', style: { width: '100%', padding: 16, fontSize: 16, fontWeight: 600, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Full Name', 'Name label updated');
  assertIncludes(patched, 'placeholder', 'Name placeholder attribute added');
  assertIncludes(patched, 'Enter your full name', 'Name placeholder updated');
  assertIncludes(patched, 'Your Message', 'Message label updated');
  assertIncludes(patched, 'Tell us what', 'Textarea placeholder updated');
  assertIncludes(patched, 'Send Message', 'Submit button updated');
  assertIncludes(patched, 'resize', 'Textarea resize property added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['name-label'].text, 'Full Name', 'Label round-tripped');
  assertEqual(parsed['name-input'].placeholder, 'Enter your full name', 'Input placeholder round-tripped');
  assertEqual(parsed['message-textarea'].placeholder, 'Tell us what you\'re thinking...', 'Textarea placeholder round-tripped');
});

// Test 3: Navigation bar with logo and links
test('Navigation bar with logo and multiple links', () => {
  const code = `
export function NavBar() {
  return (
    <nav id="nav-bar">
      <div id="logo">Logo</div>
      <div id="nav-links">
        <a id="link-home" href="/">Home</a>
        <a id="link-about" href="/about">About</a>
        <a id="link-contact" href="/contact">Contact</a>
      </div>
    </nav>
  );
}`;

  const nodesMap = {
    'nav-bar': { id: 'nav-bar', type: 'container', tag: 'nav', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 24, background: '#fff', borderBottom: '1px solid #e5e7eb' } },
    'logo': { id: 'logo', type: 'text', tag: 'div', text: 'BluePainter', style: { fontSize: 24, fontWeight: 900, color: '#2563eb' } },
    'nav-links': { id: 'nav-links', type: 'container', tag: 'div', style: { display: 'flex', gap: 32 } },
    'link-home': { id: 'link-home', type: 'link', tag: 'a', text: 'Home', href: '/', style: { color: '#1f2937', textDecoration: 'none', fontWeight: 600 } },
    'link-about': { id: 'link-about', type: 'link', tag: 'a', text: 'About Us', href: '/about', style: { color: '#1f2937', textDecoration: 'none', fontWeight: 600 } },
    'link-contact': { id: 'link-contact', type: 'link', tag: 'a', text: 'Get in Touch', href: '/contact', style: { color: '#1f2937', textDecoration: 'none', fontWeight: 600 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'BluePainter', 'Logo text updated');
  assertIncludes(patched, 'About Us', 'About link text updated');
  assertIncludes(patched, 'Get in Touch', 'Contact link text updated');
  assertIncludes(patched, 'justifyContent', 'Nav flexbox layout added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['logo'].text, 'BluePainter', 'Logo round-tripped');
  assertEqual(parsed['link-about'].text, 'About Us', 'Link text round-tripped');
  assertEqual(parsed['link-contact'].href, '/contact', 'Link href round-tripped');
});

// Test 4: Footer with multiple columns
test('Footer with multi-column layout', () => {
  const code = `
export function Footer() {
  return (
    <footer id="footer">
      <div id="col-company">
        <h4 id="heading-company">Company</h4>
        <ul id="list-company">
          <li id="item-about"><a id="link-about" href="/about">About</a></li>
          <li id="item-careers"><a id="link-careers" href="/careers">Careers</a></li>
        </ul>
      </div>
      <div id="col-product">
        <h4 id="heading-product">Product</h4>
        <ul id="list-product">
          <li id="item-features"><a id="link-features" href="/features">Features</a></li>
          <li id="item-pricing"><a id="link-pricing" href="/pricing">Pricing</a></li>
        </ul>
      </div>
    </footer>
  );
}`;

  const nodesMap = {
    'footer': { id: 'footer', type: 'container', tag: 'footer', style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 48, padding: 64, background: '#111827', color: '#fff' } },
    'col-company': { id: 'col-company', type: 'container', tag: 'div', style: {} },
    'heading-company': { id: 'heading-company', type: 'text', tag: 'h4', text: 'Company', style: { fontSize: 16, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 } },
    'list-company': { id: 'list-company', type: 'list', tag: 'ul', style: { listStyle: 'none', padding: 0, margin: 0 } },
    'item-about': { id: 'item-about', type: 'list-item', tag: 'li', style: { marginBottom: 12 } },
    'link-about': { id: 'link-about', type: 'link', tag: 'a', text: 'About Us', href: '/about', style: { color: '#9ca3af', textDecoration: 'none' } },
    'item-careers': { id: 'item-careers', type: 'list-item', tag: 'li', style: { marginBottom: 12 } },
    'link-careers': { id: 'link-careers', type: 'link', tag: 'a', text: 'Join Our Team', href: '/careers', style: { color: '#9ca3af', textDecoration: 'none' } },
    'col-product': { id: 'col-product', type: 'container', tag: 'div', style: {} },
    'heading-product': { id: 'heading-product', type: 'text', tag: 'h4', text: 'Product', style: { fontSize: 16, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 } },
    'list-product': { id: 'list-product', type: 'list', tag: 'ul', style: { listStyle: 'none', padding: 0, margin: 0 } },
    'item-features': { id: 'item-features', type: 'list-item', tag: 'li', style: { marginBottom: 12 } },
    'link-features': { id: 'link-features', type: 'link', tag: 'a', text: 'Features', href: '/features', style: { color: '#9ca3af', textDecoration: 'none' } },
    'item-pricing': { id: 'item-pricing', type: 'list-item', tag: 'li', style: { marginBottom: 12 } },
    'link-pricing': { id: 'link-pricing', type: 'link', tag: 'a', text: 'Pricing', href: '/pricing', style: { color: '#9ca3af', textDecoration: 'none' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'About Us', 'About link updated');
  assertIncludes(patched, 'Join Our Team', 'Careers link updated');
  assertIncludes(patched, 'gridTemplateColumns', 'Grid layout added');
  assertIncludes(patched, 'letterSpacing', 'Letter spacing added to headings');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['link-about'].text, 'About Us', 'Footer link round-tripped');
  assertEqual(parsed['heading-company'].text, 'Company', 'Footer heading round-tripped');
});

// Test 5: Stats section with numbers and labels
test('Stats section with numbers and descriptions', () => {
  const code = `
export function StatsSection() {
  return (
    <section id="stats">
      <div id="stat-1">
        <div id="stat-1-number">100</div>
        <div id="stat-1-label">Customers</div>
      </div>
      <div id="stat-2">
        <div id="stat-2-number">50</div>
        <div id="stat-2-label">Countries</div>
      </div>
      <div id="stat-3">
        <div id="stat-3-number">24/7</div>
        <div id="stat-3-label">Support</div>
      </div>
    </section>
  );
}`;

  const nodesMap = {
    'stats': { id: 'stats', type: 'container', tag: 'section', style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, padding: 80, background: '#f9fafb', textAlign: 'center' } },
    'stat-1': { id: 'stat-1', type: 'container', tag: 'div', style: {} },
    'stat-1-number': { id: 'stat-1-number', type: 'text', tag: 'div', text: '10,000+', style: { fontSize: 56, fontWeight: 900, color: '#2563eb', marginBottom: 8 } },
    'stat-1-label': { id: 'stat-1-label', type: 'text', tag: 'div', text: 'Happy Customers', style: { fontSize: 18, color: '#6b7280' } },
    'stat-2': { id: 'stat-2', type: 'container', tag: 'div', style: {} },
    'stat-2-number': { id: 'stat-2-number', type: 'text', tag: 'div', text: '150+', style: { fontSize: 56, fontWeight: 900, color: '#2563eb', marginBottom: 8 } },
    'stat-2-label': { id: 'stat-2-label', type: 'text', tag: 'div', text: 'Countries Worldwide', style: { fontSize: 18, color: '#6b7280' } },
    'stat-3': { id: 'stat-3', type: 'container', tag: 'div', style: {} },
    'stat-3-number': { id: 'stat-3-number', type: 'text', tag: 'div', text: '99.9%', style: { fontSize: 56, fontWeight: 900, color: '#2563eb', marginBottom: 8 } },
    'stat-3-label': { id: 'stat-3-label', type: 'text', tag: 'div', text: 'Uptime Guarantee', style: { fontSize: 18, color: '#6b7280' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, '10,000+', 'Stat 1 number updated');
  assertIncludes(patched, 'Happy Customers', 'Stat 1 label updated');
  assertIncludes(patched, '150+', 'Stat 2 number updated');
  assertIncludes(patched, '99.9%', 'Stat 3 number updated');
  assertIncludes(patched, 'Uptime Guarantee', 'Stat 3 label updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['stat-1-number'].text, '10,000+', 'Stat number round-tripped');
  assertEqual(parsed['stat-2-label'].text, 'Countries Worldwide', 'Stat label round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All hero/form/nav tests passed!');
