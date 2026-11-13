#!/usr/bin/env node
/**
 * AST sync tests for form elements and links
 * Tests anchor tags, inputs, textareas, and form patterns
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Forms & Links ===\n');

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

// Test 1: Anchor links with href
test('Anchor links with href and text', () => {
  const code = `
export function Nav() {
  return (
    <nav id="nav">
      <a id="home-link" href="/" style={{ padding: 12 }}>Home</a>
      <a id="about-link" href="/about" style={{ color: '#333' }}>About</a>
      <a id="contact-link" href="/contact">Contact</a>
    </nav>
  );
}`;

  const nodesMap = {
    'nav': { id: 'nav', type: 'container', tag: 'nav', style: { display: 'flex', gap: 16 } },
    'home-link': { id: 'home-link', type: 'link', tag: 'a', text: 'Home', href: '/', style: { padding: 16, fontWeight: 600 } },
    'about-link': { id: 'about-link', type: 'link', tag: 'a', text: 'About Us', href: '/about-us', style: { color: '#000' } },
    'contact-link': { id: 'contact-link', type: 'link', tag: 'a', text: 'Get in Touch', href: '/contact-us', style: { textDecoration: 'underline' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'href="/"', 'Home link href updated');
  assertIncludes(patched, 'Home', 'Home link text preserved');
  assertIncludes(patched, 'About Us', 'About link text updated');
  assertIncludes(patched, 'href="/about-us"', 'About link href updated');
  assertIncludes(patched, 'Get in Touch', 'Contact link text updated');
  assertIncludes(patched, 'href="/contact-us"', 'Contact link href updated');
  assertIncludes(patched, 'padding: 16', 'Link padding updated');
  assertIncludes(patched, 'fontWeight: 600', 'Link font weight added');
  assertIncludes(patched, 'display', 'Nav display added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['home-link'].text, 'Home', 'Home link text round-tripped');
  assertEqual(parsed['home-link'].href, '/', 'Home link href round-tripped');
  assertEqual(parsed['about-link'].text, 'About Us', 'About link text round-tripped');
  assertEqual(parsed['about-link'].href, '/about-us', 'About link href round-tripped');
});

// Test 2: Form with input fields
test('Form with input fields and placeholders', () => {
  const code = `
export function ContactForm() {
  return (
    <form id="contact-form" style={{ padding: 32 }}>
      <input id="name-input" type="text" placeholder="Name" />
      <input id="email-input" type="email" placeholder="Email" />
      <input id="phone-input" type="tel" placeholder="Phone" />
      <button id="submit-btn">Submit</button>
    </form>
  );
}`;

  const nodesMap = {
    'contact-form': { id: 'contact-form', type: 'form', tag: 'form', style: { padding: 40, borderRadius: 8 } },
    'name-input': { id: 'name-input', type: 'input', tag: 'input', inputType: 'text', placeholder: 'Your Name', style: { padding: 12, marginBottom: 16 } },
    'email-input': { id: 'email-input', type: 'input', tag: 'input', inputType: 'email', placeholder: 'Your Email', style: { padding: 12, marginBottom: 16 } },
    'phone-input': { id: 'phone-input', type: 'input', tag: 'input', inputType: 'tel', placeholder: 'Phone Number', style: { padding: 12, marginBottom: 16 } },
    'submit-btn': { id: 'submit-btn', type: 'button', tag: 'button', text: 'Send Message', style: { padding: 16, background: '#2563eb' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'padding: 40', 'Form padding updated');
  assertIncludes(patched, 'borderRadius: 8', 'Form border radius added');
  assertIncludes(patched, 'Your Name', 'Name placeholder updated');
  assertIncludes(patched, 'Your Email', 'Email placeholder updated');
  assertIncludes(patched, 'Phone Number', 'Phone placeholder updated');
  assertIncludes(patched, 'marginBottom: 16', 'Input margin added');
  assertIncludes(patched, 'Send Message', 'Button text updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['name-input'].placeholder, 'Your Name', 'Name placeholder round-tripped');
  assertEqual(parsed['name-input'].inputType, 'text', 'Name input type round-tripped');
  assertEqual(parsed['email-input'].placeholder, 'Your Email', 'Email placeholder round-tripped');
  assertEqual(parsed['submit-btn'].text, 'Send Message', 'Button text round-tripped');
});

// Test 3: Textarea with placeholder
test('Textarea with placeholder', () => {
  const code = `
export function FeedbackForm() {
  return (
    <div id="form-container" style={{ maxWidth: 600 }}>
      <label id="label">Message</label>
      <textarea id="message-textarea" placeholder="Type your message..." style={{ width: '100%' }} />
    </div>
  );
}`;

  const nodesMap = {
    'form-container': { id: 'form-container', type: 'container', tag: 'div', style: { maxWidth: 800, padding: 24 } },
    'label': { id: 'label', type: 'text', tag: 'label', text: 'Your Feedback', style: { fontWeight: 600 } },
    'message-textarea': { id: 'message-textarea', type: 'textarea', tag: 'textarea', placeholder: 'Tell us what you think...', style: { width: '100%', height: 200, padding: 16 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'maxWidth: 800', 'Container max width updated');
  assertIncludes(patched, 'Your Feedback', 'Label text updated');
  assertIncludes(patched, 'Tell us what you think...', 'Textarea placeholder updated');
  assertIncludes(patched, 'height: 200', 'Textarea height added');
  assertIncludes(patched, 'padding: 16', 'Textarea padding added');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['message-textarea'].placeholder, 'Tell us what you think...', 'Textarea placeholder round-tripped');
  assertEqual(parsed['label'].text, 'Your Feedback', 'Label text round-tripped');
});

// Test 4: Navigation with links and nested structure
test('Navigation with links in nested containers', () => {
  const code = `
export function Header() {
  return (
    <header id="header" style={{ padding: 16 }}>
      <div id="logo-container">
        <a id="logo-link" href="/">Logo</a>
      </div>
      <nav id="nav">
        <ul id="nav-list" style={{ display: 'flex' }}>
          <li id="nav-item-1"><a id="link-1" href="/products">Products</a></li>
          <li id="nav-item-2"><a id="link-2" href="/pricing">Pricing</a></li>
          <li id="nav-item-3"><a id="link-3" href="/docs">Docs</a></li>
        </ul>
      </nav>
    </header>
  );
}`;

  const nodesMap = {
    'header': { id: 'header', type: 'container', tag: 'header', style: { padding: 24, background: '#fff' } },
    'logo-container': { id: 'logo-container', type: 'container', tag: 'div', style: { marginRight: 32 } },
    'logo-link': { id: 'logo-link', type: 'link', tag: 'a', text: 'Brand', href: '/', style: { fontSize: 24, fontWeight: 700 } },
    'nav': { id: 'nav', type: 'container', tag: 'nav', style: { flex: 1 } },
    'nav-list': { id: 'nav-list', type: 'list', tag: 'ul', style: { display: 'flex', gap: 24, listStyle: 'none' } },
    'nav-item-1': { id: 'nav-item-1', type: 'list-item', tag: 'li' },
    'link-1': { id: 'link-1', type: 'link', tag: 'a', text: 'Solutions', href: '/solutions', style: { color: '#333' } },
    'nav-item-2': { id: 'nav-item-2', type: 'list-item', tag: 'li' },
    'link-2': { id: 'link-2', type: 'link', tag: 'a', text: 'Plans', href: '/plans', style: { color: '#333' } },
    'nav-item-3': { id: 'nav-item-3', type: 'list-item', tag: 'li' },
    'link-3': { id: 'link-3', type: 'link', tag: 'a', text: 'Documentation', href: '/documentation', style: { color: '#333' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'padding: 24', 'Header padding updated');
  assertIncludes(patched, '#fff', 'Header background added');
  assertIncludes(patched, 'Brand', 'Logo text updated');
  assertIncludes(patched, 'fontSize: 24', 'Logo font size added');
  assertIncludes(patched, 'Solutions', 'Link 1 text updated');
  assertIncludes(patched, 'href="/solutions"', 'Link 1 href updated');
  assertIncludes(patched, 'Plans', 'Link 2 text updated');
  assertIncludes(patched, 'Documentation', 'Link 3 text updated');
  assertIncludes(patched, 'gap: 24', 'Nav gap updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['logo-link'].text, 'Brand', 'Logo text round-tripped');
  assertEqual(parsed['link-1'].text, 'Solutions', 'Link 1 text round-tripped');
  assertEqual(parsed['link-1'].href, '/solutions', 'Link 1 href round-tripped');
});

// Test 5: Login form with multiple input types
test('Login form with email and password inputs', () => {
  const code = `
export function LoginForm() {
  return (
    <form id="login-form" style={{ maxWidth: 400 }}>
      <h2 id="title">Sign In</h2>
      <input id="email" type="email" placeholder="Email" />
      <input id="password" type="password" placeholder="Password" />
      <button id="login-btn">Log In</button>
      <a id="forgot-link" href="/forgot-password">Forgot password?</a>
    </form>
  );
}`;

  const nodesMap = {
    'login-form': { id: 'login-form', type: 'form', tag: 'form', style: { maxWidth: 500, padding: 48, borderRadius: 12, background: '#f9fafb' } },
    'title': { id: 'title', type: 'text', tag: 'h2', text: 'Welcome Back', style: { fontSize: 32, marginBottom: 32 } },
    'email': { id: 'email', type: 'input', tag: 'input', inputType: 'email', placeholder: 'Enter your email', style: { width: '100%', padding: 16, marginBottom: 16 } },
    'password': { id: 'password', type: 'input', tag: 'input', inputType: 'password', placeholder: 'Enter your password', style: { width: '100%', padding: 16, marginBottom: 24 } },
    'login-btn': { id: 'login-btn', type: 'button', tag: 'button', text: 'Sign In', style: { width: '100%', padding: 16, background: '#2563eb', color: '#fff' } },
    'forgot-link': { id: 'forgot-link', type: 'link', tag: 'a', text: 'Reset password', href: '/reset-password', style: { display: 'block', textAlign: 'center', marginTop: 16, color: '#2563eb' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'maxWidth: 500', 'Form max width updated');
  assertIncludes(patched, 'padding: 48', 'Form padding updated');
  assertIncludes(patched, '#f9fafb', 'Form background added');
  assertIncludes(patched, 'Welcome Back', 'Title updated');
  assertIncludes(patched, 'fontSize: 32', 'Title font size added');
  assertIncludes(patched, 'Enter your email', 'Email placeholder updated');
  assertIncludes(patched, 'Enter your password', 'Password placeholder updated');
  assertIncludes(patched, 'Sign In', 'Button text updated');
  assertIncludes(patched, 'Reset password', 'Link text updated');
  assertIncludes(patched, 'href="/reset-password"', 'Link href updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['title'].text, 'Welcome Back', 'Title round-tripped');
  assertEqual(parsed['email'].placeholder, 'Enter your email', 'Email placeholder round-tripped');
  assertEqual(parsed['password'].placeholder, 'Enter your password', 'Password placeholder round-tripped');
  assertEqual(parsed['forgot-link'].text, 'Reset password', 'Link text round-tripped');
  assertEqual(parsed['forgot-link'].href, '/reset-password', 'Link href round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All forms & links tests passed!');
