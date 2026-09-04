#!/usr/bin/env node
/**
 * AST sync tests for e-commerce UI patterns
 * Tests product cards, shopping carts, checkout flows, reviews, wishlists
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: E-commerce UI Patterns ===\n');

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

// Test 1: Product card with image, price, and action buttons
test('Product card with image, pricing, and add-to-cart', () => {
  const code = `
export function ProductCard() {
  return (
    <div id="product-card">
      <div id="product-image"></div>
      <div id="product-info">
        <h3 id="product-name">Product</h3>
        <p id="product-description">Description</p>
        <div id="product-pricing">
          <span id="product-price">$0</span>
          <span id="product-original-price">$0</span>
        </div>
        <div id="product-rating">
          <span id="stars">★★★★★</span>
          <span id="reviews-count">(0)</span>
        </div>
        <button id="add-to-cart">Add</button>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'product-card': { id: 'product-card', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', maxWidth: 320, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', transition: 'box-shadow 0.2s ease' } },
    'product-image': { id: 'product-image', type: 'container', tag: 'div', style: { width: '100%', height: 240, background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    'product-info': { id: 'product-info', type: 'container', tag: 'div', style: { padding: 16, display: 'flex', flexDirection: 'column', gap: 8 } },
    'product-name': { id: 'product-name', type: 'text', tag: 'h3', text: 'Wireless Headphones', style: { margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' } },
    'product-description': { id: 'product-description', type: 'text', tag: 'p', text: 'Premium noise-cancelling wireless headphones with 40-hour battery life', style: { margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.5 } },
    'product-pricing': { id: 'product-pricing', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 } },
    'product-price': { id: 'product-price', type: 'text', tag: 'span', text: '$199.99', style: { fontSize: 24, fontWeight: 700, color: '#111827' } },
    'product-original-price': { id: 'product-original-price', type: 'text', tag: 'span', text: '$299.99', style: { fontSize: 16, color: '#9ca3af', textDecoration: 'line-through' } },
    'product-rating': { id: 'product-rating', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 4 } },
    'stars': { id: 'stars', type: 'text', tag: 'span', text: '★★★★☆', style: { color: '#f59e0b', fontSize: 14 } },
    'reviews-count': { id: 'reviews-count', type: 'text', tag: 'span', text: '(127 reviews)', style: { fontSize: 13, color: '#6b7280' } },
    'add-to-cart': { id: 'add-to-cart', type: 'button', tag: 'button', text: 'Add to Cart', style: { padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8, transition: 'background 0.2s ease' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Wireless Headphones', 'Product name updated');
  assertIncludes(patched, '$199.99', 'Product price updated');
  assertIncludes(patched, 'line-through', 'Original price strikethrough applied');
  assertIncludes(patched, '127 reviews', 'Reviews count updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['product-name'].text, 'Wireless Headphones', 'Product name round-tripped');
  assertEqual(parsed['product-price'].text, '$199.99', 'Price round-tripped');
});

// Test 2: Shopping cart item with quantity controls
test('Shopping cart item with quantity and remove button', () => {
  const code = `
export function CartItem() {
  return (
    <div id="cart-item">
      <div id="cart-item-image"></div>
      <div id="cart-item-details">
        <h4 id="cart-item-name">Item</h4>
        <p id="cart-item-variant">Variant</p>
        <div id="cart-item-quantity">
          <button id="qty-decrease">-</button>
          <span id="qty-display">1</span>
          <button id="qty-increase">+</button>
        </div>
      </div>
      <div id="cart-item-pricing">
        <span id="cart-item-price">$0</span>
        <button id="cart-item-remove">Remove</button>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'cart-item': { id: 'cart-item', type: 'container', tag: 'div', style: { display: 'flex', gap: 16, padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 } },
    'cart-item-image': { id: 'cart-item-image', type: 'container', tag: 'div', style: { width: 80, height: 80, flexShrink: 0, background: '#f3f4f6', borderRadius: 6 } },
    'cart-item-details': { id: 'cart-item-details', type: 'container', tag: 'div', style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8 } },
    'cart-item-name': { id: 'cart-item-name', type: 'text', tag: 'h4', text: 'Wireless Keyboard', style: { margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' } },
    'cart-item-variant': { id: 'cart-item-variant', type: 'text', tag: 'p', text: 'Color: Black', style: { margin: 0, fontSize: 14, color: '#6b7280' } },
    'cart-item-quantity': { id: 'cart-item-quantity', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' } },
    'qty-decrease': { id: 'qty-decrease', type: 'button', tag: 'button', text: '-', style: { width: 32, height: 32, background: '#f3f4f6', border: 'none', borderRadius: 6, fontSize: 18, fontWeight: 600, cursor: 'pointer', color: '#374151' } },
    'qty-display': { id: 'qty-display', type: 'text', tag: 'span', text: '2', style: { fontSize: 15, fontWeight: 500, minWidth: 24, textAlign: 'center' } },
    'qty-increase': { id: 'qty-increase', type: 'button', tag: 'button', text: '+', style: { width: 32, height: 32, background: '#f3f4f6', border: 'none', borderRadius: 6, fontSize: 18, fontWeight: 600, cursor: 'pointer', color: '#374151' } },
    'cart-item-pricing': { id: 'cart-item-pricing', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', alignItems: 'end', gap: 8, justifyContent: 'space-between' } },
    'cart-item-price': { id: 'cart-item-price', type: 'text', tag: 'span', text: '$89.99', style: { fontSize: 18, fontWeight: 700, color: '#111827' } },
    'cart-item-remove': { id: 'cart-item-remove', type: 'button', tag: 'button', text: 'Remove', style: { padding: '6px 12px', background: 'transparent', border: 'none', color: '#dc2626', fontSize: 14, fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Wireless Keyboard', 'Item name updated');
  assertIncludes(patched, 'Color: Black', 'Item variant updated');
  assertIncludes(patched, '$89.99', 'Item price updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['cart-item-name'].text, 'Wireless Keyboard', 'Item name round-tripped');
  assertEqual(parsed['qty-display'].text, '2', 'Quantity round-tripped');
});

// Test 3: Checkout summary with order total
test('Order summary with subtotal, tax, and total', () => {
  const code = `
export function OrderSummary() {
  return (
    <div id="order-summary">
      <h3 id="summary-title">Title</h3>
      <div id="summary-line-1">
        <span id="label-subtotal">Subtotal</span>
        <span id="value-subtotal">$0</span>
      </div>
      <div id="summary-line-2">
        <span id="label-shipping">Shipping</span>
        <span id="value-shipping">$0</span>
      </div>
      <div id="summary-line-3">
        <span id="label-tax">Tax</span>
        <span id="value-tax">$0</span>
      </div>
      <div id="summary-total">
        <span id="label-total">Total</span>
        <span id="value-total">$0</span>
      </div>
      <button id="checkout-button">Checkout</button>
    </div>
  );
}`;

  const nodesMap = {
    'order-summary': { id: 'order-summary', type: 'container', tag: 'div', style: { padding: 24, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12 } },
    'summary-title': { id: 'summary-title', type: 'text', tag: 'h3', text: 'Order Summary', style: { margin: 0, marginBottom: 16, fontSize: 18, fontWeight: 600, color: '#111827' } },
    'summary-line-1': { id: 'summary-line-1', type: 'container', tag: 'div', style: { display: 'flex', justifyContent: 'space-between', marginBottom: 12 } },
    'label-subtotal': { id: 'label-subtotal', type: 'text', tag: 'span', text: 'Subtotal', style: { fontSize: 15, color: '#6b7280' } },
    'value-subtotal': { id: 'value-subtotal', type: 'text', tag: 'span', text: '$289.98', style: { fontSize: 15, fontWeight: 500, color: '#111827' } },
    'summary-line-2': { id: 'summary-line-2', type: 'container', tag: 'div', style: { display: 'flex', justifyContent: 'space-between', marginBottom: 12 } },
    'label-shipping': { id: 'label-shipping', type: 'text', tag: 'span', text: 'Shipping', style: { fontSize: 15, color: '#6b7280' } },
    'value-shipping': { id: 'value-shipping', type: 'text', tag: 'span', text: 'FREE', style: { fontSize: 15, fontWeight: 600, color: '#16a34a' } },
    'summary-line-3': { id: 'summary-line-3', type: 'container', tag: 'div', style: { display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #e5e7eb' } },
    'label-tax': { id: 'label-tax', type: 'text', tag: 'span', text: 'Tax', style: { fontSize: 15, color: '#6b7280' } },
    'value-tax': { id: 'value-tax', type: 'text', tag: 'span', text: '$26.10', style: { fontSize: 15, fontWeight: 500, color: '#111827' } },
    'summary-total': { id: 'summary-total', type: 'container', tag: 'div', style: { display: 'flex', justifyContent: 'space-between', marginTop: 12, marginBottom: 20 } },
    'label-total': { id: 'label-total', type: 'text', tag: 'span', text: 'Total', style: { fontSize: 18, fontWeight: 700, color: '#111827' } },
    'value-total': { id: 'value-total', type: 'text', tag: 'span', text: '$316.08', style: { fontSize: 18, fontWeight: 700, color: '#111827' } },
    'checkout-button': { id: 'checkout-button', type: 'button', tag: 'button', text: 'Proceed to Checkout', style: { width: '100%', padding: '14px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s ease' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Order Summary', 'Summary title updated');
  assertIncludes(patched, '$289.98', 'Subtotal updated');
  assertIncludes(patched, 'FREE', 'Shipping updated');
  assertIncludes(patched, '$316.08', 'Total updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['value-subtotal'].text, '$289.98', 'Subtotal round-tripped');
  assertEqual(parsed['value-total'].text, '$316.08', 'Total round-tripped');
});

// Test 4: Product review card
test('Product review with rating, author, and content', () => {
  const code = `
export function ProductReview() {
  return (
    <div id="review-card">
      <div id="review-header">
        <div id="review-author-info">
          <div id="author-avatar"></div>
          <div id="author-details">
            <h4 id="author-name">Name</h4>
            <span id="review-date">Date</span>
          </div>
        </div>
        <div id="review-rating">★★★★★</div>
      </div>
      <p id="review-text">Review text</p>
      <div id="review-actions">
        <button id="helpful-button">Helpful</button>
        <span id="helpful-count">0 people</span>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'review-card': { id: 'review-card', type: 'container', tag: 'div', style: { padding: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 } },
    'review-header': { id: 'review-header', type: 'container', tag: 'div', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 } },
    'review-author-info': { id: 'review-author-info', type: 'container', tag: 'div', style: { display: 'flex', gap: 12 } },
    'author-avatar': { id: 'author-avatar', type: 'container', tag: 'div', style: { width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', flexShrink: 0 } },
    'author-details': { id: 'author-details', type: 'container', tag: 'div', style: {} },
    'author-name': { id: 'author-name', type: 'text', tag: 'h4', text: 'Sarah M.', style: { margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' } },
    'review-date': { id: 'review-date', type: 'text', tag: 'span', text: 'Verified Buyer • 3 days ago', style: { fontSize: 13, color: '#6b7280' } },
    'review-rating': { id: 'review-rating', type: 'text', tag: 'div', text: '★★★★★', style: { color: '#f59e0b', fontSize: 16 } },
    'review-text': { id: 'review-text', type: 'text', tag: 'p', text: 'Amazing product! The sound quality is incredible and the battery lasts all day. Would definitely recommend to anyone looking for premium headphones.', style: { margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 12 } },
    'review-actions': { id: 'review-actions', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 12 } },
    'helpful-button': { id: 'helpful-button', type: 'button', tag: 'button', text: '👍 Helpful', style: { padding: '6px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#374151', cursor: 'pointer' } },
    'helpful-count': { id: 'helpful-count', type: 'text', tag: 'span', text: '24 people found this helpful', style: { fontSize: 13, color: '#6b7280' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Sarah M.', 'Author name updated');
  assertIncludes(patched, 'Verified Buyer', 'Review date updated');
  assertIncludes(patched, 'Amazing product', 'Review text updated');
  assertIncludes(patched, '24 people', 'Helpful count updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['author-name'].text, 'Sarah M.', 'Author name round-tripped');
});

// Test 5: Wishlist item with save/share options
test('Wishlist item card with actions', () => {
  const code = `
export function WishlistItem() {
  return (
    <div id="wishlist-item">
      <div id="wishlist-image"></div>
      <div id="wishlist-info">
        <h4 id="wishlist-name">Item</h4>
        <p id="wishlist-price">$0</p>
        <span id="wishlist-stock">In stock</span>
      </div>
      <div id="wishlist-actions">
        <button id="wishlist-add-cart">Add to Cart</button>
        <button id="wishlist-remove">Remove</button>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'wishlist-item': { id: 'wishlist-item', type: 'container', tag: 'div', style: { display: 'flex', gap: 16, padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 } },
    'wishlist-image': { id: 'wishlist-image', type: 'container', tag: 'div', style: { width: 100, height: 100, flexShrink: 0, background: '#f3f4f6', borderRadius: 8 } },
    'wishlist-info': { id: 'wishlist-info', type: 'container', tag: 'div', style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 } },
    'wishlist-name': { id: 'wishlist-name', type: 'text', tag: 'h4', text: 'Designer Sunglasses', style: { margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' } },
    'wishlist-price': { id: 'wishlist-price', type: 'text', tag: 'p', text: '$149.99', style: { margin: 0, fontSize: 20, fontWeight: 700, color: '#2563eb' } },
    'wishlist-stock': { id: 'wishlist-stock', type: 'text', tag: 'span', text: 'Only 3 left in stock', style: { fontSize: 13, color: '#dc2626', fontWeight: 500 } },
    'wishlist-actions': { id: 'wishlist-actions', type: 'container', tag: 'div', style: { display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' } },
    'wishlist-add-cart': { id: 'wishlist-add-cart', type: 'button', tag: 'button', text: 'Add to Cart', style: { padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' } },
    'wishlist-remove': { id: 'wishlist-remove', type: 'button', tag: 'button', text: 'Remove', style: { padding: '10px 16px', background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Designer Sunglasses', 'Wishlist item name updated');
  assertIncludes(patched, '$149.99', 'Wishlist item price updated');
  assertIncludes(patched, 'Only 3 left', 'Stock status updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['wishlist-name'].text, 'Designer Sunglasses', 'Item name round-tripped');
  assertEqual(parsed['wishlist-price'].text, '$149.99', 'Price round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All e-commerce UI tests passed!');
