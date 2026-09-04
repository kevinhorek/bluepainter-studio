#!/usr/bin/env node
/**
 * AST sync tests for media and visual content patterns
 * Tests images, videos, avatars, galleries, and media players
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');

console.log('=== AST Sync Tests: Media & Visual Content Patterns ===\n');

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

// Test 1: Image with caption
test('Image with caption and credits', () => {
  const code = `
export function ImageWithCaption() {
  return (
    <figure id="image-figure">
      <div id="image-container">
        <img id="main-image" src="/placeholder.jpg" alt="Description" />
      </div>
      <figcaption id="image-caption">
        <p id="caption-text">Caption</p>
        <p id="credit-text">Credit</p>
      </figcaption>
    </figure>
  );
}`;

  const nodesMap = {
    'image-figure': { id: 'image-figure', type: 'container', tag: 'figure', style: { margin: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' } },
    'image-container': { id: 'image-container', type: 'container', tag: 'div', style: { position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#f3f4f6' } },
    'image-caption': { id: 'image-caption', type: 'container', tag: 'figcaption', style: { padding: 16, background: '#f9fafb' } },
    'caption-text': { id: 'caption-text', type: 'text', tag: 'p', text: 'Beautiful sunset over the mountains captured during golden hour', style: { margin: 0, marginBottom: 8, fontSize: 14, lineHeight: 1.6, color: '#374151', fontWeight: 500 } },
    'credit-text': { id: 'credit-text', type: 'text', tag: 'p', text: 'Photo by Jane Photographer', style: { margin: 0, fontSize: 12, color: '#6b7280' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Beautiful sunset', 'Caption text updated');
  assertIncludes(patched, 'Jane Photographer', 'Credit text updated');
  assertIncludes(patched, 'paddingBottom:', 'Aspect ratio padding applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['caption-text'].text, 'Beautiful sunset over the mountains captured during golden hour', 'Caption round-tripped');
});

// Test 2: Avatar component
test('Avatar with name and status badge', () => {
  const code = `
export function Avatar() {
  return (
    <div id="avatar-container">
      <div id="avatar-wrapper">
        <div id="avatar-image">👤</div>
        <div id="status-badge"></div>
      </div>
      <div id="avatar-info">
        <p id="user-name">User</p>
        <p id="user-status">Online</p>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'avatar-container': { id: 'avatar-container', type: 'container', tag: 'div', style: { display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f9fafb', borderRadius: 8 } },
    'avatar-wrapper': { id: 'avatar-wrapper', type: 'container', tag: 'div', style: { position: 'relative' } },
    'avatar-image': { id: 'avatar-image', type: 'text', tag: 'div', text: '👤', style: { width: 48, height: 48, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600 } },
    'status-badge': { id: 'status-badge', type: 'container', tag: 'div', style: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, background: '#22c55e', border: '2px solid #fff', borderRadius: '50%' } },
    'avatar-info': { id: 'avatar-info', type: 'container', tag: 'div', style: {} },
    'user-name': { id: 'user-name', type: 'text', tag: 'p', text: 'Sarah Johnson', style: { margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' } },
    'user-status': { id: 'user-status', type: 'text', tag: 'p', text: 'Active now', style: { margin: 0, fontSize: 14, color: '#22c55e' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Sarah Johnson', 'User name updated');
  assertIncludes(patched, 'Active now', 'User status updated');
  assertIncludes(patched, '50%', 'Avatar circle shape applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['user-name'].text, 'Sarah Johnson', 'User name round-tripped');
});

// Test 3: Image gallery grid
test('Image gallery with grid layout', () => {
  const code = `
export function ImageGallery() {
  return (
    <div id="gallery-container">
      <div id="gallery-item-1">
        <div id="gallery-image-1">🖼️</div>
        <p id="gallery-title-1">Title 1</p>
      </div>
      <div id="gallery-item-2">
        <div id="gallery-image-2">🖼️</div>
        <p id="gallery-title-2">Title 2</p>
      </div>
      <div id="gallery-item-3">
        <div id="gallery-image-3">🖼️</div>
        <p id="gallery-title-3">Title 3</p>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'gallery-container': { id: 'gallery-container', type: 'container', tag: 'div', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, padding: 24 } },
    'gallery-item-1': { id: 'gallery-item-1', type: 'container', tag: 'div', style: { cursor: 'pointer' } },
    'gallery-image-1': { id: 'gallery-image-1', type: 'text', tag: 'div', text: '🏔️', style: { width: '100%', paddingBottom: '100%', background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, marginBottom: 8 } },
    'gallery-title-1': { id: 'gallery-title-1', type: 'text', tag: 'p', text: 'Mountain Vista', style: { margin: 0, fontSize: 14, fontWeight: 600, color: '#374151', textAlign: 'center' } },
    'gallery-item-2': { id: 'gallery-item-2', type: 'container', tag: 'div', style: { cursor: 'pointer' } },
    'gallery-image-2': { id: 'gallery-image-2', type: 'text', tag: 'div', text: '🌊', style: { width: '100%', paddingBottom: '100%', background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, marginBottom: 8 } },
    'gallery-title-2': { id: 'gallery-title-2', type: 'text', tag: 'p', text: 'Ocean Waves', style: { margin: 0, fontSize: 14, fontWeight: 600, color: '#374151', textAlign: 'center' } },
    'gallery-item-3': { id: 'gallery-item-3', type: 'container', tag: 'div', style: { cursor: 'pointer' } },
    'gallery-image-3': { id: 'gallery-image-3', type: 'text', tag: 'div', text: '🌲', style: { width: '100%', paddingBottom: '100%', background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, marginBottom: 8 } },
    'gallery-title-3': { id: 'gallery-title-3', type: 'text', tag: 'p', text: 'Forest Path', style: { margin: 0, fontSize: 14, fontWeight: 600, color: '#374151', textAlign: 'center' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Mountain Vista', 'Gallery title 1 updated');
  assertIncludes(patched, 'Ocean Waves', 'Gallery title 2 updated');
  assertIncludes(patched, 'Forest Path', 'Gallery title 3 updated');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['gallery-title-1'].text, 'Mountain Vista', 'Gallery title round-tripped');
});

// Test 4: Video player with controls
test('Video player with title and controls', () => {
  const code = `
export function VideoPlayer() {
  return (
    <div id="video-container">
      <div id="video-wrapper">
        <div id="video-placeholder">▶️</div>
      </div>
      <div id="video-info">
        <h3 id="video-title">Video Title</h3>
        <p id="video-meta">Duration</p>
      </div>
      <div id="video-controls">
        <button id="play-button">Play</button>
        <button id="fullscreen-button">Fullscreen</button>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'video-container': { id: 'video-container', type: 'container', tag: 'div', style: { background: '#000', borderRadius: 12, overflow: 'hidden' } },
    'video-wrapper': { id: 'video-wrapper', type: 'container', tag: 'div', style: { position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' } },
    'video-placeholder': { id: 'video-placeholder', type: 'text', tag: 'div', text: '▶️', style: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 64, cursor: 'pointer' } },
    'video-info': { id: 'video-info', type: 'container', tag: 'div', style: { padding: 16, background: '#1f2937' } },
    'video-title': { id: 'video-title', type: 'text', tag: 'h3', text: 'Introduction to React 19', style: { margin: 0, marginBottom: 8, fontSize: 18, fontWeight: 700, color: '#fff' } },
    'video-meta': { id: 'video-meta', type: 'text', tag: 'p', text: '15:32 • 1.2M views', style: { margin: 0, fontSize: 14, color: '#9ca3af' } },
    'video-controls': { id: 'video-controls', type: 'container', tag: 'div', style: { display: 'flex', gap: 12, padding: 16, background: '#111827', borderTop: '1px solid #374151' } },
    'play-button': { id: 'play-button', type: 'button', tag: 'button', text: 'Play', style: { padding: 10, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', flex: 1 } },
    'fullscreen-button': { id: 'fullscreen-button', type: 'button', tag: 'button', text: 'Fullscreen', style: { padding: 10, background: '#374151', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Introduction to React 19', 'Video title updated');
  assertIncludes(patched, '15:32', 'Video meta updated');
  assertIncludes(patched, 'transform:', 'Video placeholder positioned');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['video-title'].text, 'Introduction to React 19', 'Video title round-tripped');
});

// Test 5: Profile card with avatar and stats
test('Profile card with avatar and social stats', () => {
  const code = `
export function ProfileCard() {
  return (
    <div id="profile-card">
      <div id="profile-header">
        <div id="profile-avatar">👤</div>
        <h2 id="profile-name">Name</h2>
        <p id="profile-bio">Bio</p>
      </div>
      <div id="profile-stats">
        <div id="stat-1">
          <p id="stat-1-value">0</p>
          <p id="stat-1-label">Followers</p>
        </div>
        <div id="stat-2">
          <p id="stat-2-value">0</p>
          <p id="stat-2-label">Following</p>
        </div>
      </div>
    </div>
  );
}`;

  const nodesMap = {
    'profile-card': { id: 'profile-card', type: 'container', tag: 'div', style: { maxWidth: 400, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' } },
    'profile-header': { id: 'profile-header', type: 'container', tag: 'div', style: { padding: 32, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } },
    'profile-avatar': { id: 'profile-avatar', type: 'text', tag: 'div', text: '👤', style: { width: 96, height: 96, margin: '0 auto', marginBottom: 16, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, border: '4px solid #fff' } },
    'profile-name': { id: 'profile-name', type: 'text', tag: 'h2', text: 'Alex Rivera', style: { margin: 0, marginBottom: 8, fontSize: 24, fontWeight: 700, color: '#fff' } },
    'profile-bio': { id: 'profile-bio', type: 'text', tag: 'p', text: 'Full-stack developer and open source contributor', style: { margin: 0, fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.6 } },
    'profile-stats': { id: 'profile-stats', type: 'container', tag: 'div', style: { display: 'flex', padding: 24, borderTop: '1px solid #e5e7eb' } },
    'stat-1': { id: 'stat-1', type: 'container', tag: 'div', style: { flex: 1, textAlign: 'center', padding: 12 } },
    'stat-1-value': { id: 'stat-1-value', type: 'text', tag: 'p', text: '1,234', style: { margin: 0, marginBottom: 4, fontSize: 24, fontWeight: 700, color: '#111827' } },
    'stat-1-label': { id: 'stat-1-label', type: 'text', tag: 'p', text: 'Followers', style: { margin: 0, fontSize: 14, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 } },
    'stat-2': { id: 'stat-2', type: 'container', tag: 'div', style: { flex: 1, textAlign: 'center', padding: 12, borderLeft: '1px solid #e5e7eb' } },
    'stat-2-value': { id: 'stat-2-value', type: 'text', tag: 'p', text: '567', style: { margin: 0, marginBottom: 4, fontSize: 24, fontWeight: 700, color: '#111827' } },
    'stat-2-label': { id: 'stat-2-label', type: 'text', tag: 'p', text: 'Following', style: { margin: 0, fontSize: 14, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 } }
  };

  const patched = patchTSXWithAST(code, nodesMap);
  assertIncludes(patched, 'Alex Rivera', 'Profile name updated');
  assertIncludes(patched, 'Full-stack developer', 'Profile bio updated');
  assertIncludes(patched, '1,234', 'Follower count updated');
  assertIncludes(patched, 'linear-gradient', 'Gradient background applied');

  const parsed = parseTSXWithAST(patched, nodesMap);
  assertEqual(parsed['profile-name'].text, 'Alex Rivera', 'Profile name round-tripped');
  assertEqual(parsed['stat-1-value'].text, '1,234', 'Stat value round-tripped');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}

console.log('\n✅ All media & visual content tests passed!');
