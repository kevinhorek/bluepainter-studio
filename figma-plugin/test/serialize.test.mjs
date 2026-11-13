/**
 * Plain-Node test for the Figma plugin serialiser.
 *
 *   node --import ./scripts/esm-resolve.mjs ./figma-plugin/test/serialize.test.mjs
 *
 * Loads figma-plugin/code.js (a classic script, as Figma runs it) in a vm with
 * a fake Plugin API, then feeds the output through the Studio's real
 * "Paste JSON" path (src/utils/figmaImportClient.js → figmaImport.js).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { importFromFigmaJsonString } from '../../src/utils/figmaImportClient.js';

const here = dirname(fileURLToPath(import.meta.url));
const pluginDir = join(here, '..');
const source = readFileSync(join(pluginDir, 'code.js'), 'utf8');

const MIXED = Symbol('figma.mixed');

/** Evaluate code.js the way Figma does: one script, optional `figma` global. */
function loadPlugin(globals = {}) {
  const sandbox = { module: { exports: {} }, ...globals };
  vm.runInNewContext(source, sandbox, { filename: 'code.js' });
  return sandbox.module.exports;
}

const plugin = loadPlugin();

// ── Fake Plugin API nodes ───────────────────────────────────────────────────

const solid = (r, g, b, extra = {}) => ({ type: 'SOLID', visible: true, opacity: 1, blendMode: 'NORMAL', color: { r, g, b }, ...extra });
const box = (x, y, width, height) => ({ x, y, width, height });

function textNode(props) {
  return {
    type: 'TEXT',
    visible: true,
    opacity: 1,
    strokes: [],
    textAlignHorizontal: 'LEFT',
    textAlignVertical: 'TOP',
    letterSpacing: { unit: 'PERCENT', value: 0 },
    ...props
  };
}

function buildFrame() {
  const title = textNode({
    id: '1:3',
    name: 'Title',
    characters: 'Pro plan',
    absoluteBoundingBox: box(124, 224, 200, 32),
    fills: [solid(0.1, 0.2, 0.3)],
    fontSize: 24,
    fontName: { family: 'Inter', style: 'Bold' },
    fontWeight: 700,
    lineHeight: { unit: 'PIXELS', value: 32 },
    textAlignHorizontal: 'CENTER'
  });

  // Several styles in one text layer: every style property reports figma.mixed.
  const mixedText = textNode({
    id: '1:4',
    name: 'Price',
    characters: '$29 / month',
    absoluteBoundingBox: box(124, 268, 200, 20),
    fills: MIXED,
    fontSize: MIXED,
    fontName: MIXED,
    fontWeight: MIXED,
    lineHeight: MIXED,
    getRangeFills: () => [solid(1, 0, 0)],
    getRangeFontSize: () => 18,
    getRangeFontName: () => ({ family: 'Inter', style: 'Semi Bold Italic' }),
    getRangeFontWeight: () => 600,
    getRangeLineHeight: () => ({ unit: 'PERCENT', value: 150 })
  });

  const hiddenNote = textNode({
    id: '1:5',
    name: 'Hidden note',
    visible: false,
    characters: 'do not export',
    absoluteBoundingBox: box(124, 300, 200, 20),
    fills: [solid(0, 0, 0)],
    fontSize: 12,
    fontName: { family: 'Inter', style: 'Regular' },
    lineHeight: { unit: 'AUTO' }
  });

  const button = {
    id: '1:6',
    name: 'Button',
    type: 'INSTANCE',
    visible: true,
    opacity: 1,
    absoluteBoundingBox: box(124, 310, 200, 40),
    fills: [solid(0, 0.4, 1, { opacity: 0.5 })],
    strokes: [solid(0, 0, 0, { opacity: 0.25 })],
    strokeWeight: MIXED,
    strokeTopWeight: 1,
    strokeRightWeight: 1,
    strokeBottomWeight: 3,
    strokeLeftWeight: 1,
    strokeAlign: 'INSIDE',
    cornerRadius: MIXED,
    topLeftRadius: 12,
    topRightRadius: 12,
    bottomRightRadius: 0,
    bottomLeftRadius: 0,
    layoutMode: 'HORIZONTAL',
    itemSpacing: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
    primaryAxisAlignItems: 'CENTER',
    counterAxisAlignItems: 'CENTER',
    children: [
      textNode({
        // Ids of layers nested in an instance are not `12:34` shaped.
        id: 'I1:6;9:1',
        name: 'Label',
        characters: 'Upgrade',
        absoluteBoundingBox: box(190, 320, 68, 20),
        fills: [solid(1, 1, 1)],
        fontSize: 14,
        fontName: { family: 'Inter', style: 'Medium' }, // no fontWeight: derive from style
        lineHeight: { unit: 'AUTO' }
      })
    ]
  };

  const photo = {
    id: '1:7',
    name: 'Photo',
    type: 'RECTANGLE',
    visible: true,
    opacity: 1,
    absoluteBoundingBox: box(124, 370, 200, 120),
    fills: [{ type: 'IMAGE', visible: true, opacity: 1, scaleMode: 'FILL', imageHash: 'abc123hash' }],
    strokes: [],
    cornerRadius: 8
  };

  const avatar = {
    id: '1:8',
    name: 'Avatar',
    type: 'ELLIPSE',
    visible: true,
    opacity: 1,
    absoluteBoundingBox: box(124, 500, 40, 40),
    fills: [
      solid(1, 0, 0, { visible: false }), // hidden paint: dropped
      { type: 'GRADIENT_LINEAR', visible: true, opacity: 1, gradientStops: [] },
      solid(0, 1, 0)
    ],
    strokes: [],
    cornerRadius: 0
  };

  const divider = {
    id: '1:9',
    name: 'Divider',
    type: 'LINE',
    visible: true,
    opacity: 1,
    absoluteBoundingBox: box(124, 550, 200, 0),
    fills: [],
    strokes: [solid(0.8, 0.8, 0.8)],
    strokeWeight: 2
  };

  return {
    id: '1:2',
    name: 'Pricing Card',
    type: 'FRAME',
    visible: true,
    opacity: 1,
    absoluteBoundingBox: box(100, 200, 400, 600),
    fills: [solid(1, 1, 1)],
    strokes: [],
    cornerRadius: 16,
    clipsContent: true,
    layoutMode: 'NONE',
    children: [title, mixedText, hiddenNote, button, photo, avatar, divider]
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}`);
    throw err;
  }
}

const byName = (nodes, name) => Object.values(nodes).find((n) => n && n.name === name);

console.log('figma-plugin serialiser');

test('rejects an empty selection', () => {
  const result = plugin.serializeSelection([]);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'no-selection');
});

test('rejects a multiple selection', () => {
  const result = plugin.serializeSelection([buildFrame(), buildFrame()]);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'multiple-selection');
  assert.match(result.error, /2 layers/);
});

test('rejects a non-frame root and a hidden root', () => {
  const text = plugin.serializeSelection([buildFrame().children[0]]);
  assert.equal(text.code, 'unsupported-root');
  const hidden = plugin.serializeSelection([{ ...buildFrame(), visible: false }]);
  assert.equal(hidden.code, 'hidden-root');
});

const result = plugin.serializeSelection([buildFrame()]);
// Read back through JSON: that is what the Studio receives (and it gives the
// assertions plain same-realm objects rather than ones from the vm context).
const payload = JSON.parse(result.json);
const doc = payload.nodes['1:2'].document;

function assertNoSymbols(value, path = 'payload') {
  assert.notEqual(typeof value, 'symbol', `${path} is figma.mixed`);
  assert.notEqual(value, undefined, `${path} is undefined`);
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) assertNoSymbols(child, `${path}.${key}`);
  }
}

test('emits a REST-shaped, JSON-safe payload', () => {
  assert.equal(result.ok, true);
  assert.equal(payload.source, 'bluepainter-figma-plugin');
  assert.equal(payload.nodeId, '1:2');
  assert.equal(doc.type, 'FRAME');
  assert.deepEqual(doc.absoluteBoundingBox, { x: 100, y: 200, width: 400, height: 600 });
  assert.equal(doc.layoutMode, undefined, 'layoutMode NONE is omitted, as in the REST API');
  // No symbol (figma.mixed) may survive: JSON would silently drop it.
  assertNoSymbols(result.payload);
  assert.equal(result.json.includes('do not export'), false);
});

test('counts layers and skips hidden ones', () => {
  assert.equal(doc.children.length, 6);
  assert.equal(result.stats.nodes, 8); // frame + 6 visible children + button label
  assert.equal(result.stats.textLayers, 3);
  assert.equal(result.stats.hiddenSkipped, 1);
  assert.equal(result.stats.imageLayers, 1);
  assert.equal(result.stats.autoLayoutFrames, 1);
  assert.equal(result.stats.unsupportedPaints, 1);
  assert.ok(result.stats.mixedValues >= 6);
  assert.ok(result.warnings.some((w) => /image layer/.test(w)));
});

test('serialises text styles, resolving mixed values from the first character', () => {
  const title = doc.children[0];
  assert.equal(title.characters, 'Pro plan');
  assert.deepEqual(
    title.style,
    { fontFamily: 'Inter', fontWeight: 700, fontSize: 24, textAlignHorizontal: 'CENTER', textAlignVertical: 'TOP', letterSpacing: 0, lineHeightPx: 32 }
  );
  const price = doc.children[1];
  assert.equal(price.style.fontSize, 18);
  assert.equal(price.style.fontWeight, 600);
  assert.equal(price.style.italic, true);
  assert.equal(price.style.lineHeightPx, 27); // 150% of 18
  assert.deepEqual(price.fills[0].color, { r: 1, g: 0, b: 0, a: 1 });
  const label = doc.children[2].children[0];
  assert.equal(label.style.fontWeight, 500, 'weight derived from the font style name');
  assert.equal(label.style.lineHeightPx, undefined, 'AUTO line height is omitted');
});

test('serialises auto-layout, paint opacity, mixed radii and mixed stroke weights', () => {
  const button = doc.children[2];
  assert.equal(button.type, 'INSTANCE');
  assert.equal(button.layoutMode, 'HORIZONTAL');
  assert.equal(button.itemSpacing, 8);
  assert.equal(button.paddingLeft, 16);
  assert.equal(button.paddingTop, 10);
  assert.equal(button.primaryAxisAlignItems, 'CENTER');
  assert.equal(button.fills[0].color.a, 0.5);
  assert.equal(button.strokes[0].color.a, 0.25);
  assert.equal(button.strokeWeight, 3);
  assert.equal(button.cornerRadius, undefined);
  assert.deepEqual(button.rectangleCornerRadii, [12, 12, 0, 0]);
});

test('serialises images as IMAGE-fill rectangles and drops hidden paints', () => {
  const photo = doc.children[3];
  assert.equal(photo.type, 'RECTANGLE');
  assert.deepEqual(photo.fills[0], { type: 'IMAGE', blendMode: 'NORMAL', scaleMode: 'FILL', imageRef: 'abc123hash' });
  assert.equal(photo.cornerRadius, 8);
  const avatar = doc.children[4];
  assert.deepEqual(avatar.fills.map((f) => f.type), ['GRADIENT_LINEAR', 'SOLID']);
  assert.equal(avatar.cornerRadius, 20);
});

test('the Studio "Paste JSON" path converts the plugin output into canvas nodes', () => {
  assert.ok(result.json.length >= 100, 'the paste tab rejects JSON under 100 characters');
  const imported = importFromFigmaJsonString(result.json, { pageName: 'PricingCard' });
  const { nodes, rootId } = imported;
  const root = nodes[rootId];

  assert.equal(imported.frameName, 'Pricing Card');
  assert.equal(imported.nodeCount, 8);
  assert.equal(imported.hasContent, true);
  assert.deepEqual(imported.viewport, { width: 400, height: 600 });
  assert.equal(root.style.background, '#ffffff');
  assert.equal(root.children.length, 6);
  assert.equal(Object.values(nodes).every(Boolean), true, 'no reserved-but-unfilled node ids');
  assert.equal(byName(nodes, 'Hidden note'), undefined);

  const title = byName(nodes, 'Title');
  assert.equal(title.type, 'text');
  assert.equal(title.text, 'Pro plan');
  assert.equal(title.style.fontSize, 24);
  assert.equal(title.style.fontWeight, 700);
  assert.equal(title.style.color, '#1a334d');
  assert.equal(title.style.textAlign, 'center');
  assert.equal(title.style.lineHeight, '32px');
  assert.equal(title.style.left, 24);
  assert.equal(title.style.top, 24);

  const price = byName(nodes, 'Price');
  assert.equal(price.style.fontSize, 18);
  assert.equal(price.style.color, '#ff0000');
  assert.equal(price.style.lineHeight, '27px');

  const button = byName(nodes, 'Button');
  assert.equal(button.type, 'frame');
  assert.equal(button._hasAutoLayout, true);
  assert.equal(button.style.flexDirection, 'row');
  assert.equal(button.style.gap, 8);
  assert.equal(button.style.padding, 16);
  assert.equal(button.style.justifyContent, 'center');
  assert.equal(button.style.background, 'rgba(0, 102, 255, 0.50)');
  assert.equal(button.style.borderWidth, 3);
  assert.equal(button.style.borderColor, 'rgba(0, 0, 0, 0.25)');
  assert.equal(button.style.borderRadius, 12);
  assert.equal(button.children.length, 1);
  assert.equal(nodes[button.children[0]].text, 'Upgrade');
  assert.equal(nodes[button.children[0]].style.position, undefined, 'auto-layout children are not absolute');

  const photo = byName(nodes, 'Photo');
  assert.equal(photo.type, 'frame');
  assert.equal(photo.style.background, undefined, 'IMAGE fills are tolerated, not painted');
  assert.equal(photo.style.width, 200);
  assert.equal(photo.style.height, 120);
  assert.equal(photo.style.borderRadius, 8);

  const avatar = byName(nodes, 'Avatar');
  assert.equal(avatar.style.background, '#00ff00');
  assert.equal(avatar.style.borderRadius, 20);

  const divider = byName(nodes, 'Divider');
  assert.equal(divider.type, 'line');
  assert.equal(divider.style.borderTopWidth, 2);
  assert.equal(divider.style.borderColor, '#cccccc');
});

test('a selection nested in an instance (non-numeric id) still imports', () => {
  const nested = { ...buildFrame(), id: 'I5:1;1:2' };
  const nestedResult = plugin.serializeSelection([nested]);
  assert.equal(nestedResult.payload.nodeId, '0:1');
  assert.equal(nestedResult.payload.nodes['0:1'].document.id, 'I5:1;1:2');
  const imported = importFromFigmaJsonString(nestedResult.json);
  assert.equal(imported.nodeCount, 8);
});

test('an empty frame still produces JSON the paste tab accepts', () => {
  const empty = plugin.serializeSelection([{ id: '2:1', name: 'A', type: 'FRAME', visible: true, fills: [], strokes: [], children: [] }]);
  assert.equal(empty.ok, true);
  assert.ok(empty.json.length >= 100);
  const imported = importFromFigmaJsonString(empty.json);
  assert.equal(imported.hasContent, false);
});

test('plugin entry point posts the selection to the UI and reacts to changes', () => {
  const posted = [];
  const handlers = {};
  const notices = [];
  const opened = [];
  const figma = {
    mixed: MIXED,
    currentPage: { selection: [] },
    showUI: (html, options) => { figma.shown = { html, options }; },
    ui: { postMessage: (message) => posted.push(message), onmessage: null },
    on: (event, handler) => { handlers[event] = handler; },
    notify: (text) => notices.push(text),
    openExternal: (url) => opened.push(url),
    closePlugin: () => {}
  };
  const live = loadPlugin({ figma, __html__: '<p>ui</p>' });

  assert.equal(figma.shown.html, '<p>ui</p>');
  assert.equal(posted.length, 1);
  assert.equal(posted[0].ok, false);
  assert.equal(posted[0].code, 'no-selection');

  figma.currentPage.selection = [buildFrame()];
  handlers.selectionchange();
  assert.equal(posted[1].ok, true);
  assert.equal(posted[1].stats.nodes, 8);
  assert.equal(posted[1].studioUrl, live.STUDIO_URL);
  assert.equal(importFromFigmaJsonString(posted[1].json).nodeCount, 8);

  figma.ui.onmessage({ type: 'open-studio' });
  assert.deepEqual(opened, [live.STUDIO_URL]);
  figma.ui.onmessage({ type: 'copied' });
  assert.equal(notices.length, 1);
});

test('manifest is loadable and requests no network access', () => {
  const manifest = JSON.parse(readFileSync(join(pluginDir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.main, 'code.js');
  assert.equal(manifest.ui, 'ui.html');
  assert.deepEqual(manifest.networkAccess, { allowedDomains: ['none'] });
  assert.match(plugin.STUDIO_URL, /^https:\/\//);
});

console.log(`figma-plugin: ${passed} passed, 0 failed`);
