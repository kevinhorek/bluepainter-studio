/**
 * Feature regression checks for BluePainter core utils.
 * Run: npm run test:features
 */
import assert from 'assert';
import { createRequire } from 'module';
import { generateTSX, parseTSX } from '../src/utils/syncEngine.js';
import {
  getFreshPricingNodes,
  getFreshHeroNodes,
  getFreshDashboardNodes,
  applyBrokenDesignScenario,
  applyFixedDesignScenario
} from '../src/utils/demoScenarios.js';
import { DEFAULT_RECEIPT_POLICY } from '../src/data/defaultReceiptPolicy.js';
import { applyAIUpdates, getFirstUpdateTarget, buildAIContext } from '../src/utils/aiApply.js';
import { createNodeFromTool, canDropIntoNode, isLeafNode } from '../src/utils/nodeFactory.js';
import { isPlacableTool, getToolByShortcut } from '../src/data/canvasTools.js';
import { getWorkspaceFile, FILE_ORDER, WORKSPACE_FILES } from '../src/data/workspaceFiles.js';
import { buildProjectFileMap } from '../src/utils/projectExport.js';
import { getFreshMarketingNodes } from '../src/data/marketingPage.js';
import { getEmptyFigmaImportNodes, figmaFileToNodes } from '../src/utils/figmaImport.js';
import { getAllowedNodeKeys } from '../src/utils/aiPrompts.js';
import { buildSessionScorecard } from '../src/utils/sessionScorecard.js';
import { getLearningSummary, logLearningEvent, clearLearningEvents } from '../src/utils/learningLoop.js';
import { importTSXFile } from '../src/utils/syncEngine.js';
import { createHistory, historyReducer, loadWorkspace, saveWorkspace, clearWorkspace } from '../src/utils/workspaceStore.js';

const require = createRequire(import.meta.url);
const { parseTSXWithAST, patchTSXWithAST } = require('@bluepainter/shared/astSyncEngine');
const { evaluateReceipts, applyReceiptFix } = require('@bluepainter/shared/receiptPolicy');

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
    console.log('PASS', name);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.error('FAIL', name, '\n ', e.message);
  }
}

test('workspace files present', () => {
  assert.ok(FILE_ORDER.length >= 3);
  for (const id of FILE_ORDER) {
    assert.ok(WORKSPACE_FILES[id], id);
    assert.ok(WORKSPACE_FILES[id].rootId);
  }
});

test('placeable tools and shortcuts', () => {
  assert.equal(isPlacableTool('select'), false);
  assert.equal(isPlacableTool('rectangle'), true);
  assert.equal(getToolByShortcut('r').id, 'rectangle');
});

test('createNodeFromTool + list-item is leaf', () => {
  const rect = createNodeFromTool('rectangle', 'rect-1', 10, 20);
  assert.equal(rect.type, 'shape');
  assert.equal(createNodeFromTool('select', 'x', 0, 0), null);
  assert.equal(canDropIntoNode({ type: 'frame', children: [] }), true);
  assert.equal(isLeafNode({ type: 'list-item', text: 'x' }), true);
});

test('pricing generateTSX includes feature text', () => {
  const file = getWorkspaceFile('pricing');
  const nodes = getFreshPricingNodes();
  const code = generateTSX(file.rootId, nodes);
  assert.ok(code.includes('PricingCard'), code.slice(0, 300));
  assert.ok(code.includes('Unlimited projects'), 'list-item text missing from export');
  assert.ok(code.includes('/month'));
});

test('AST parse + patch round-trip', () => {
  const file = getWorkspaceFile('pricing');
  const nodes = getFreshPricingNodes();
  const code = generateTSX(file.rootId, nodes);
  const parsed = parseTSXWithAST(code, nodes);
  assert.ok(parsed, 'AST parse failed');
  const edited = {
    ...parsed,
    'cta-button': { ...parsed['cta-button'], text: 'CHANGED_BY_TEST' },
    'feature-item-1': { ...parsed['feature-item-1'], text: 'Feature A' }
  };
  const patched = patchTSXWithAST(code, edited);
  assert.ok(patched, 'patch failed');
  assert.ok(patched.includes('CHANGED_BY_TEST'));
  assert.ok(patched.includes('Feature A'));
  const roundTrip = parseTSX(patched, nodes);
  assert.equal(roundTrip['cta-button']?.text, 'CHANGED_BY_TEST');
  assert.equal(roundTrip['feature-item-1']?.text, 'Feature A');
});

test('hero + dashboard generate', () => {
  const hero = generateTSX(getWorkspaceFile('hero').rootId, getFreshHeroNodes());
  assert.ok(hero.includes('HeroSection'), hero.slice(0, 200));
  const dash = generateTSX(getWorkspaceFile('dashboard').rootId, getFreshDashboardNodes());
  assert.ok(dash.includes('PricingCard') || dash.includes('HeroSection'), dash.slice(0, 400));
});

test('broken design triggers failing receipts', () => {
  const nodes = applyBrokenDesignScenario(getFreshPricingNodes());
  const { rules } = evaluateReceipts(nodes, nodes['pricing-card-frame'], DEFAULT_RECEIPT_POLICY);
  const failing = rules.filter((r) => !r.valid);
  assert.ok(failing.length >= 3, failing.map((r) => r.id).join(','));
  assert.ok(failing.some((r) => r.id === 'contrast'));
});

test('fixed design passes more rules', () => {
  const broken = applyBrokenDesignScenario(getFreshPricingNodes());
  const fixed = applyFixedDesignScenario();
  const brokenFail = evaluateReceipts(broken, broken['pricing-card-frame'], DEFAULT_RECEIPT_POLICY).rules.filter((r) => !r.valid);
  const fixedFail = evaluateReceipts(fixed, fixed['pricing-card-frame'], DEFAULT_RECEIPT_POLICY).rules.filter((r) => !r.valid);
  assert.ok(brokenFail.length > fixedFail.length);
});

test('applyReceiptFix updates via callback', () => {
  const nodes = applyBrokenDesignScenario(getFreshPricingNodes());
  const { rules } = evaluateReceipts(nodes, nodes['pricing-card-frame'], DEFAULT_RECEIPT_POLICY);
  const failing = rules.find((r) => !r.valid && r.fixKey === 'contrast');
  assert.ok(failing);
  let updated = null;
  applyReceiptFix(failing.fixKey, failing.fixMeta, nodes, (id, patch) => {
    updated = { id, patch };
  });
  assert.equal(updated.id, 'cta-button');
  assert.equal(updated.patch.style.background, DEFAULT_RECEIPT_POLICY.contrastFixColor);
});

test('applyAIUpdates', () => {
  const nodesByFile = {
    pricing: getFreshPricingNodes(),
    hero: getFreshHeroNodes(),
    dashboard: getFreshDashboardNodes(),
    marketing: getFreshMarketingNodes()
  };
  const type = 'full-marketing';
  const [fileId, nodeId] = [...getAllowedNodeKeys(type)][0].split(':');
  const { applied, nodesByFile: next } = applyAIUpdates(nodesByFile, [{ fileId, nodeId, text: 'AI_TEXT' }], type);
  assert.ok(applied >= 1);
  assert.equal(next[fileId][nodeId].text, 'AI_TEXT');
  assert.ok(getFirstUpdateTarget([{ fileId, nodeId }], type));
  assert.ok(buildAIContext(nodesByFile, 'marketing'));
});

test('buildProjectFileMap', () => {
  const nodesByFile = {
    pricing: getFreshPricingNodes(),
    hero: getFreshHeroNodes(),
    dashboard: getFreshDashboardNodes(),
    marketing: getFreshMarketingNodes(),
    figma: getEmptyFigmaImportNodes()
  };
  const { projectName, files } = buildProjectFileMap(nodesByFile, 'Test App');
  assert.equal(projectName, 'test-app');
  assert.ok(files['src/PricingCard.tsx']?.includes('Unlimited projects'));
  assert.ok(files['src/DashboardPage.tsx']);
  assert.ok(files['package.json']);
});

test('learning loop + scorecard', () => {
  clearLearningEvents();
  logLearningEvent('canvas_to_code_sync', { file: 'pricing' });
  logLearningEvent('receipt_fix_applied', { data: { ruleId: 'contrast' } });
  const summary = getLearningSummary();
  assert.equal(summary.roundTripsCanvas, 1);
  assert.equal(summary.fixesApplied, 1);
  assert.ok(buildSessionScorecard());
});

test('figmaFileToNodes', () => {
  const doc = {
    name: 'Demo',
    document: {
      id: '0:0',
      name: 'Document',
      type: 'DOCUMENT',
      children: [{
        id: '1:1',
        name: 'Page 1',
        type: 'CANVAS',
        children: [{
          id: '2:2',
          name: 'Card',
          type: 'FRAME',
          absoluteBoundingBox: { x: 0, y: 0, width: 320, height: 200 },
          children: [{
            id: '3:3',
            name: 'Title',
            type: 'TEXT',
            characters: 'Hello',
            absoluteBoundingBox: { x: 20, y: 20, width: 100, height: 24 },
            style: { fontSize: 16 }
          }]
        }]
      }]
    }
  };
  const result = figmaFileToNodes(doc, { nodeId: '2:2' });
  assert.ok(result.rootId || result.nodes);
  assert.ok(Object.keys(result.nodes || result).length > 0);
});

test('file switch: code from another file is never reused', () => {
  const dash = getFreshDashboardNodes();
  const pricing = getFreshPricingNodes();
  const dashCode = generateTSX('dashboard-page', dash);
  const out = generateTSX('pricing-card-frame', pricing, dashCode);
  assert.ok(out.includes('export function PricingCard'), 'should regenerate for the new file');
  assert.ok(!out.includes('dashboard-page'));
});

test('structural canvas edits reach the code (add + delete)', () => {
  const nodes = getFreshPricingNodes();
  const code = generateTSX('pricing-card-frame', nodes);
  const added = {
    ...nodes,
    'pricing-card-frame': {
      ...nodes['pricing-card-frame'],
      children: [...nodes['pricing-card-frame'].children, 'text-new']
    },
    'text-new': createNodeFromTool('text', 'text-new', 10, 10)
  };
  const withAdded = generateTSX('pricing-card-frame', added, code);
  assert.ok(withAdded.includes('id="text-new"'), 'added node missing from code');

  const removed = { ...nodes };
  removed['features-list'] = { ...nodes['features-list'], children: nodes['features-list'].children.slice(1) };
  const withRemoved = generateTSX('pricing-card-frame', removed, code);
  assert.ok(!withRemoved.includes(`id="${nodes['features-list'].children[0]}"`), 'deleted node still in code');
});

test('patch preserves author formatting, comments and dynamic style props', () => {
  const nodes = {
    root: { id: 'root', type: 'frame', tag: 'div', style: { padding: 12 }, children: ['title'] },
    title: { id: 'title', type: 'text', tag: 'h2', style: { fontSize: 20 }, text: 'Hello' }
  };
  const code = [
    'export function Card({ theme, ...rest }) {',
    '  // keep me',
    '  return (',
    "    <div id='root' style={{ padding: 12, color: theme.primary, ...rest }}>",
    "      <h2 id='title' style={{ fontSize: 20 }}>Hello</h2>",
    '    </div>',
    '  );',
    '}'
  ].join('\n');
  assert.strictEqual(generateTSX('root', nodes, code), code, 'no-op patch must not change the file');

  const edited = { ...nodes, root: { ...nodes.root, style: { padding: 16 } } };
  const out = generateTSX('root', edited, code);
  assert.ok(out.includes('padding: 16'));
  assert.ok(out.includes('color: theme.primary'), 'dynamic prop dropped');
  assert.ok(out.includes('...rest'), 'spread dropped');
  assert.ok(out.includes('// keep me'));
  assert.ok(out.includes("<h2 id='title' style={{ fontSize: 20 }}>Hello</h2>"), 'untouched element reformatted');
});

test('dynamic / nested text is not wiped by a patch', () => {
  const nodes = {
    root: { id: 'root', type: 'frame', tag: 'div', style: {}, children: ['btn', 'h'] },
    btn: { id: 'btn', type: 'button', tag: 'button', style: {}, text: '' },
    h: { id: 'h', type: 'text', tag: 'h2', style: {}, text: '' }
  };
  const code = 'export function A({ label }) {\n  return (\n    <div id="root">\n      <button id="btn">{label}</button>\n      <h2 id="h">Hi <b>there</b></h2>\n    </div>\n  );\n}';
  const out = generateTSX('root', nodes, code);
  assert.ok(out.includes('{label}'));
  assert.ok(out.includes('<b>there</b>'));
});

test('text with JSX-special characters round-trips', () => {
  const nodes = getFreshPricingNodes();
  const text = 'Save {50%} if a < b & c > d';
  nodes['cta-button'] = { ...nodes['cta-button'], text };
  const fresh = generateTSX('pricing-card-frame', nodes);
  assert.strictEqual(parseTSX(fresh, getFreshPricingNodes())['cta-button'].text, text);
  const base = generateTSX('pricing-card-frame', getFreshPricingNodes());
  const patched = generateTSX('pricing-card-frame', nodes, base);
  assert.strictEqual(parseTSX(patched, getFreshPricingNodes())['cta-button'].text, text);
});

test('code edits: image src, negative offsets, removed style keys', () => {
  const nodes = {
    root: { id: 'root', type: 'frame', tag: 'div', style: { padding: 8, background: '#fff' }, children: ['pic'] },
    pic: { id: 'pic', type: 'image', tag: 'img', style: { left: 4 }, src: 'a.png' }
  };
  const code = 'export function A() {\n  return (\n    <div id="root" style={{ padding: 8 }}>\n      <img id="pic" src="b.png" style={{ left: -12 }} />\n    </div>\n  );\n}';
  const parsed = parseTSX(code, nodes);
  assert.strictEqual(parsed.pic.src, 'b.png');
  assert.strictEqual(parsed.pic.style.left, -12);
  assert.strictEqual(parsed.root.style.background, undefined, 'style key deleted in code should clear');
  const moved = { ...parsed, pic: { ...parsed.pic, style: { left: -30 } } };
  assert.ok(generateTSX('root', moved, code).includes('left: -30'));
});

test('export: component roots are in-flow, Figma page included once imported', () => {
  const nodesByFile = {
    pricing: getFreshPricingNodes(),
    hero: getFreshHeroNodes(),
    dashboard: getFreshDashboardNodes(),
    marketing: getFreshMarketingNodes(),
    figma: getEmptyFigmaImportNodes()
  };
  const { files } = buildProjectFileMap(nodesByFile, 'demo');
  const pricingRoot = files['src/PricingCard.tsx'].split('\n').find((l) => l.includes('id="pricing-card-frame"'));
  assert.ok(pricingRoot.includes("position: 'relative'") && !pricingRoot.includes('left:'), pricingRoot);
  assert.ok(!files['src/FigmaImport.tsx'], 'placeholder Figma page should not be exported');

  const imported = figmaFileToNodes({ document: { children: [{ type: 'CANVAS', children: [{ type: 'FRAME', name: 'F', absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 }, children: [{ type: 'FRAME', children: [{ type: 'TEXT', characters: 'hi' }, { type: 'TEXT', characters: 'gone', visible: false }] }] }] }] } });
  assert.ok(Object.values(imported.nodes).every(Boolean), 'id-less Figma nodes must not collide');
  assert.ok(!JSON.stringify(imported.nodes).includes('gone'), 'hidden layer imported');
  const withFigma = buildProjectFileMap({ ...nodesByFile, figma: imported.nodes }, 'demo');
  assert.ok(withFigma.files['src/FigmaImport.tsx']);
});

test('text edit keeps multi-line formatting', () => {
  const nodes = {
    root: { id: 'root', type: 'frame', tag: 'div', style: {}, children: ['btn'] },
    btn: { id: 'btn', type: 'button', tag: 'button', style: {}, text: 'Go now' }
  };
  const code = 'export function A() {\n  return (\n    <div id="root">\n      <button id="btn">\n        Submit\n      </button>\n    </div>\n  );\n}';
  const out = generateTSX('root', nodes, code);
  // Only the words change: indentation, line breaks and every other byte stay put.
  assert.strictEqual(out, code.replace('Submit', 'Go now'));
  // Awkward formatting around the element survives too.
  const messy = 'export function A() {\n  return (\n    <div id="root">\n        <button   id="btn"\n          onClick={() => 1}\n        >\n            Submit\n            now\n        </button>\n    </div>\n  );\n}';
  assert.strictEqual(
    generateTSX('root', nodes, messy),
    messy.replace('Submit\n            now', 'Go now')
  );
  const special = generateTSX('root', { ...nodes, btn: { ...nodes.btn, text: 'A <b> & c' } }, code);
  assert.strictEqual(special, code.replace('Submit', '{"A <b> & c"}'));
  assert.strictEqual(parseTSX(out, nodes).btn.text, 'Go now');
});

test('code → canvas: add, remove, reorder and retag elements', () => {
  const nodes = getFreshPricingNodes();
  const code = generateTSX('pricing-card-frame', nodes);
  const [first, second] = nodes['features-list'].children;

  // add a paragraph + a nested frame with a button, in code
  const withNew = code.replace(
    '</ul>',
    '</ul>\n      <p id="fine-print" style={{ fontSize: 12 }}>Cancel anytime</p>\n      <div id="extras"><button id="secondary-cta">Talk to sales</button></div>'
  );
  const added = parseTSX(withNew, nodes, 'pricing-card-frame');
  assert.strictEqual(added['fine-print'].type, 'text');
  assert.strictEqual(added['fine-print'].text, 'Cancel anytime');
  assert.strictEqual(added['fine-print'].style.fontSize, 12);
  assert.strictEqual(added.extras.type, 'frame');
  assert.deepStrictEqual(added.extras.children, ['secondary-cta']);
  assert.strictEqual(added['secondary-cta'].type, 'button');
  const rootKids = added['pricing-card-frame'].children;
  assert.ok(rootKids.indexOf('fine-print') === rootKids.indexOf('features-list') + 1, 'new node placed where it was typed');
  // a later canvas edit must keep the user's code (patch, not regenerate)
  const edited = { ...added, 'fine-print': { ...added['fine-print'], text: 'No lock-in' } };
  const out = generateTSX('pricing-card-frame', edited, withNew);
  assert.ok(out.includes('<div id="extras"><button id="secondary-cta">Talk to sales</button></div>'), 'user code regenerated');
  assert.ok(out.includes('No lock-in'));

  // remove an element in code
  const line = code.split('\n').find((l) => l.includes(`id="${first}"`));
  const removed = parseTSX(code.replace(line + '\n', ''), nodes, 'pricing-card-frame');
  assert.ok(!removed[first], 'deleted element still on canvas');
  assert.ok(!removed['features-list'].children.includes(first));

  // reorder in code
  const l1 = code.split('\n').find((l) => l.includes(`id="${first}"`));
  const l2 = code.split('\n').find((l) => l.includes(`id="${second}"`));
  const swapped = code.replace(l1, '@@').replace(l2, l1).replace('@@', l2);
  const reordered = parseTSX(swapped, nodes, 'pricing-card-frame');
  assert.deepStrictEqual(reordered['features-list'].children.slice(0, 2), [second, first]);

  // without a rootId nothing structural happens (extension / legacy callers)
  assert.ok(!parseTSX(withNew, nodes)['fine-print']);
});

test('code → canvas: component usage becomes an instance; broken code changes nothing', () => {
  const nodes = getFreshDashboardNodes();
  const code = generateTSX('dashboard-page', nodes);
  const root = code.split('\n').find((l) => l.includes('id="dashboard-page"'));
  const withInstance = code.replace(root, root + '\n      <div id="second-pricing"><PricingCard /></div>');
  const parsed = parseTSX(withInstance, nodes, 'dashboard-page');
  assert.strictEqual(parsed['second-pricing'].type, 'component-instance');
  assert.strictEqual(parsed['second-pricing'].refFile, 'pricing');

  const broken = parseTSX(code.replace('</div>', '</di'), nodes, 'dashboard-page');
  assert.deepStrictEqual(Object.keys(broken).sort(), Object.keys(nodes).sort(), 'mid-typing syntax error must not delete layers');
});

test('canvas → code structure is patched in place (author code survives)', () => {
  const nodes = {
    root: { id: 'root', type: 'frame', tag: 'div', style: { padding: 8 }, children: ['title', 'list', 'cta'] },
    title: { id: 'title', type: 'text', tag: 'h2', style: {}, text: 'Hi' },
    list: { id: 'list', type: 'list', tag: 'ul', style: {}, children: ['a', 'b'] },
    a: { id: 'a', type: 'list-item', tag: 'li', style: {}, text: 'A' },
    b: { id: 'b', type: 'list-item', tag: 'li', style: {}, text: 'B' },
    cta: { id: 'cta', type: 'button', tag: 'button', style: {}, text: 'Go' }
  };
  const code = [
    "import { useState } from 'react';",
    '',
    'export function Card({ onGo }) {',
    '  const [n, setN] = useState(0); // keep me',
    '  return (',
    '    <div id="root" style={{ padding: 8 }}>',
    '      <h2 id="title">Hi</h2>',
    '      <ul id="list">',
    '        <li id="a">A</li>',
    '        <li id="b">B</li>',
    '      </ul>',
    '      <button id="cta" onClick={() => { setN(n + 1); onGo(); }}>Go</button>',
    '    </div>',
    '  );',
    '}'
  ].join('\n');
  assert.strictEqual(generateTSX('root', nodes, code), code);

  // add a layer on the canvas
  const added = {
    ...nodes,
    root: { ...nodes.root, children: ['title', 'note', 'list', 'cta'] },
    note: { id: 'note', type: 'text', tag: 'p', style: { fontSize: 12 }, text: 'New' }
  };
  const withAdd = generateTSX('root', added, code);
  assert.ok(withAdd.includes('useState(0); // keep me'), 'logic lost');
  assert.ok(withAdd.includes('onClick={() => { setN(n + 1); onGo(); }}'), 'handler lost');
  // the inserted element is pretty-printed by recast; everything else is untouched
  assert.ok(/id="title">Hi<\/h2>\s+<p\s+id="note"\s+style=\{\{\s*fontSize: 12\s*\}\}>New<\/p>\s+<ul id="list">/.test(withAdd), withAdd);
  assert.ok(withAdd.includes('      <ul id="list">\n        <li id="a">A</li>'), 'siblings reformatted');
  assert.deepStrictEqual(parseTSX(withAdd, added, 'root').root.children, ['title', 'note', 'list', 'cta']);

  // delete a layer
  const removed = { ...nodes, list: { ...nodes.list, children: ['b'] } };
  delete removed.a;
  const withRemove = generateTSX('root', removed, code);
  assert.ok(!withRemove.includes('id="a"') && withRemove.includes('// keep me'));
  assert.ok(withRemove.includes('      <ul id="list">\n        <li id="b">B</li>\n      </ul>'), withRemove);

  // reorder siblings
  const reordered = { ...nodes, list: { ...nodes.list, children: ['b', 'a'] } };
  const withOrder = generateTSX('root', reordered, code);
  assert.ok(withOrder.indexOf('id="b"') < withOrder.indexOf('id="a"') && withOrder.includes('// keep me'));

  // add into an empty / self-closing container
  const empty = { root: { id: 'root', type: 'frame', tag: 'div', style: {}, children: ['x'] }, x: { id: 'x', type: 'text', tag: 'p', style: {}, text: 'X' } };
  const selfClosing = 'export function E() {\n  // c\n  return <div id="root" />;\n}';
  const filled = generateTSX('root', empty, selfClosing);
  assert.ok(filled.includes('// c') && /<p\s+id="x">X<\/p>/.test(filled) && filled.includes('</div>'), filled);
});

test('className round-trips and dynamic classNames are left alone', () => {
  const nodes = {
    root: { id: 'root', type: 'frame', tag: 'div', style: {}, children: ['t'] },
    t: { id: 't', type: 'text', tag: 'p', style: {}, text: 'x' }
  };
  const code = 'export function A({ on }) {\n  return (\n    <div id="root" className={on ? "a" : "b"}>\n      <p id="t" className="text-sm font-bold">x</p>\n    </div>\n  );\n}';
  const parsed = parseTSX(code, nodes, 'root');
  assert.strictEqual(parsed.t.className, 'text-sm font-bold');
  assert.strictEqual(generateTSX('root', parsed, code), code);
  const edited = { ...parsed, t: { ...parsed.t, className: 'text-lg' } };
  const out = generateTSX('root', edited, code);
  assert.ok(out.includes('className="text-lg"') && out.includes('className={on ? "a" : "b"}'));
});

test('receipts work on arbitrary components (no demo ids)', () => {
  const nodes = {
    wrap: { id: 'wrap', type: 'frame', tag: 'section', style: { padding: 30, borderRadius: 7 }, children: ['h', 'menu', 'go'] },
    h: { id: 'h', type: 'text', tag: 'h2', style: {}, text: 'Plans' },
    menu: { id: 'menu', type: 'list', tag: 'ul', style: {}, children: ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'] },
    ...Object.fromEntries(['i1', 'i2', 'i3', 'i4', 'i5', 'i6'].map((id) => [id, { id, type: 'list-item', tag: 'li', style: {}, text: id }])),
    go: { id: 'go', type: 'button', tag: 'button', style: { background: '#e2e8f0', color: '#ffffff' }, text: 'Submit' }
  };
  for (const selected of ['wrap', 'h', 'i3', 'go']) {
    const { rules } = evaluateReceipts(nodes, nodes[selected], DEFAULT_RECEIPT_POLICY);
    const failing = rules.filter((r) => !r.valid).map((r) => r.id).sort();
    assert.deepStrictEqual(failing, ['brand-color', 'contrast', 'copy', 'features', 'radius', 'spacing'], `selected ${selected}: ${failing}`);
    rules.filter((r) => !r.valid).forEach((r) => assert.ok(nodes[r.fixMeta.nodeId], `${r.id} fix has no target`));
  }
  // fixes land on the right nodes
  const patches = {};
  const { rules } = evaluateReceipts(nodes, nodes.h, DEFAULT_RECEIPT_POLICY);
  rules.filter((r) => !r.valid && r.fixLabel).forEach((r) => applyReceiptFix(r.fixKey, r.fixMeta, nodes, (id, patch) => { patches[id] = { ...(patches[id] || {}), ...patch }; }));
  assert.ok(patches.wrap && patches.go && patches.menu);
});

test('undo/redo history coalesces bursts and is bounded', () => {
  let h = createHistory({ v: 0 });
  h = historyReducer(h, { type: 'set', updater: { v: 1 }, at: 1000 });
  h = historyReducer(h, { type: 'set', updater: (p) => ({ v: p.v + 1 }), at: 1100 }); // same burst (drag)
  h = historyReducer(h, { type: 'set', updater: { v: 3 }, at: 5000 });
  assert.strictEqual(h.past.length, 2);
  h = historyReducer(h, { type: 'undo' });
  assert.deepStrictEqual(h.present, { v: 2 });
  h = historyReducer(h, { type: 'undo' });
  assert.deepStrictEqual(h.present, { v: 0 });
  assert.strictEqual(historyReducer(h, { type: 'undo' }), h, 'undo past the start is a no-op');
  h = historyReducer(h, { type: 'redo' });
  h = historyReducer(h, { type: 'redo' });
  assert.deepStrictEqual(h.present, { v: 3 });
  h = historyReducer(h, { type: 'undo' });
  h = historyReducer(h, { type: 'set', updater: { v: 9 }, at: 9000 });
  assert.strictEqual(h.future.length, 0, 'a new edit clears redo');
  const same = historyReducer(h, { type: 'set', updater: (p) => p, at: 9999 });
  assert.strictEqual(same, h, 'no-op updates add no history');
  for (let i = 0; i < 300; i += 1) h = historyReducer(h, { type: 'set', updater: { v: i }, at: 20000 + i * 1000 });
  assert.ok(h.past.length <= 100);
});

test('workspace autosave round-trips and survives corrupt storage', () => {
  clearWorkspace();
  assert.strictEqual(loadWorkspace().restored, false);
  const nodes = loadWorkspace().nodesByFile;
  const edited = { ...nodes, pricing: { ...nodes.pricing, 'cta-button': { ...nodes.pricing['cta-button'], text: 'Saved!' } } };
  assert.ok(saveWorkspace({ nodesByFile: edited, codeByFile: { pricing: '// my formatting' }, fileViewports: {}, activeFile: 'pricing' }));
  const restored = loadWorkspace();
  assert.ok(restored.restored);
  assert.strictEqual(restored.activeFile, 'pricing');
  assert.strictEqual(restored.nodesByFile.pricing['cta-button'].text, 'Saved!');
  assert.strictEqual(restored.codeBaseByFile.pricing.code, '// my formatting');
  assert.strictEqual(restored.codeBaseByFile.pricing.nodes, restored.nodesByFile.pricing, 'code must be tied to the restored node map');

  localStorage.setItem('bluepainter-workspace-v1', '{not json');
  assert.strictEqual(loadWorkspace().restored, false);
  localStorage.setItem('bluepainter-workspace-v1', JSON.stringify({ version: 1, nodesByFile: { pricing: { nope: 1 }, hero: 'x' }, activeFile: 'ghost' }));
  const partial = loadWorkspace();
  assert.ok(partial.nodesByFile.pricing['pricing-card-frame'], 'corrupt file falls back to fresh');
  assert.strictEqual(partial.activeFile, 'dashboard');
  clearWorkspace();
});

test('open a real TSX file: ids added, logic preserved, edits patch in place', () => {
  const source = [
    "import { useState } from 'react';",
    '',
    'export default function Banner({ title, items }) {',
    '  const [open, setOpen] = useState(false);',
    '  return (',
    '    <section className="p-8 bg-slate-900">',
    '      <h1 className="text-3xl">Welcome back</h1>',
    '      <p>{title}</p>',
    '      <ul>{items.map((it) => <li key={it}>{it}</li>)}</ul>',
    '      <button onClick={() => setOpen(!open)}>Toggle</button>',
    '    </section>',
    '  );',
    '}'
  ].join('\n');
  const file = importTSXFile(source, 'Banner.tsx');
  assert.strictEqual(file.componentName, 'Banner');
  assert.ok(file.addedIds >= 5);
  const root = file.nodes[file.rootId];
  assert.strictEqual(root.className, 'p-8 bg-slate-900');
  const h1 = Object.values(file.nodes).find((n) => n.tag === 'h1');
  assert.strictEqual(h1.text, 'Welcome back');
  const p = Object.values(file.nodes).find((n) => n.tag === 'p');
  assert.strictEqual(p.dynamicSource, '{title}', 'dynamic content gets a stand-in');
  assert.strictEqual(generateTSX(file.rootId, file.nodes, file.code), file.code, 'opening must not rewrite the file');

  const edited = { ...file.nodes, [h1.id]: { ...h1, text: 'Hello again', style: { fontSize: 40 } } };
  const out = generateTSX(file.rootId, edited, file.code);
  assert.ok(out.includes('Hello again') && out.includes('fontSize: 40'));
  assert.ok(out.includes('const [open, setOpen] = useState(false);') && out.includes('onClick={() => setOpen(!open)}') && out.includes('{title}') && out.includes('items.map'));
  assert.throws(() => importTSXFile('export const x = 1;', 'x.ts'));
});

const failed = results.filter((r) => !r.ok);
test('reparent: a layer moved into the frame before it is moved in the code too', () => {
  // Document order of ids is identical before and after — only the parent changes.
  const code = 'import x from "x";\n\nexport function A() {\n  // keep me\n  return (\n    <div id="root">\n      <section id="box" style={{ padding: 8 }}>\n        <p id="one">One</p>\n      </section>\n      <button id="go" onClick={() => x()}>Go</button>\n    </div>\n  );\n}';
  const nodes = {
    root: { id: 'root', type: 'frame', tag: 'div', style: {}, children: ['box'] },
    box: { id: 'box', type: 'frame', tag: 'section', style: { padding: 8 }, children: ['one', 'go'] },
    one: { id: 'one', type: 'text', tag: 'p', style: {}, text: 'One' },
    go: { id: 'go', type: 'button', tag: 'button', style: {}, text: 'Go' }
  };
  const out = generateTSX('root', nodes, code);
  assert.ok(/<section id="box"[^>]*>[\s\S]*<button id="go" onClick=\{\(\) => x\(\)\}>Go<\/button>\s*<\/section>/.test(out), out);
  assert.ok(out.includes('import x from "x";') && out.includes('// keep me'), 'author code kept (patched, not regenerated)');
  const back = parseTSX(out, nodes, 'root');
  assert.deepStrictEqual(back.box.children, ['one', 'go']);
  assert.deepStrictEqual(back.root.children, ['box']);
  // and back out again, to the front of the root
  const outAgain = generateTSX('root', { ...nodes, root: { ...nodes.root, children: ['go', 'box'] }, box: { ...nodes.box, children: ['one'] } }, out);
  assert.deepStrictEqual(parseTSX(outAgain, nodes, 'root').root.children, ['go', 'box']);
  assert.ok(outAgain.includes('onClick={() => x()}') && outAgain.includes('// keep me'));
});

test('open a file with helper components: the exported component is the root and helpers survive edits', () => {
  const src = 'function Badge() {\n  return <span className="badge">New</span>;\n}\n\nconst Row = () => <li>row</li>;\n\nexport default function Card() {\n  return (\n    <div>\n      <Badge />\n      <h2>Title</h2>\n    </div>\n  );\n}\n';
  const opened = importTSXFile(src, 'Card.tsx');
  assert.strictEqual(opened.componentName, 'Card');
  assert.strictEqual(opened.nodes[opened.rootId].tag, 'div', 'root is the exported component, not the first helper');
  assert.ok(Object.values(opened.nodes).some((n) => n.text === 'Title'));
  assert.ok(!Object.values(opened.nodes).some((n) => n.text === 'New' || n.text === 'row'), 'helper JSX is not part of the layer tree');
  const title = Object.values(opened.nodes).find((n) => n.text === 'Title');
  const out = generateTSX(opened.rootId, { ...opened.nodes, [title.id]: { ...title, text: 'Hello' } }, opened.code);
  assert.ok(out.includes('Hello') && /function Badge\(\)[\s\S]*New<\/span>/.test(out) && out.includes('const Row = () =>'), out);
  // a structural edit must not delete the helpers either
  const without = { ...opened.nodes, [opened.rootId]: { ...opened.nodes[opened.rootId], children: [] } };
  delete without[title.id];
  const out2 = generateTSX(opened.rootId, without, opened.code);
  assert.ok(!out2.includes('Title') && out2.includes('>New</span>') && out2.includes('row</li>'), out2);
});

test('a comment pin never regenerates the author\'s file', () => {
  const code = 'import { useState } from "react";\n\nexport function A() {\n  const [n] = useState(0);\n  return (\n    <div id="root" data-n={n}>\n      <p id="one">One</p>\n    </div>\n  );\n}';
  const nodes = {
    root: { id: 'root', type: 'frame', tag: 'div', style: {}, children: ['one', 'pin'] },
    one: { id: 'one', type: 'text', tag: 'p', style: {}, text: 'Two' },
    pin: { id: 'pin', type: 'comment', tag: 'div', style: {}, text: 'check this' }
  };
  const out = generateTSX('root', nodes, code);
  assert.strictEqual(out, code.replace('One', 'Two'));
});

console.log('\n=== SUMMARY ===');
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  failed.forEach((f) => console.error('-', f.name, ':', f.error));
  process.exit(1);
}
