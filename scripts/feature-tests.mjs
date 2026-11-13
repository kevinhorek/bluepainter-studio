/**
 * Feature regression checks for BluePainter core utils.
 * Run: npm run test:features
 */
import assert from 'assert';
import { generateTSX, parseTSX } from '../src/utils/syncEngine.js';
import { parseTSXWithAST, patchTSXWithAST } from '../src/utils/astSyncEngine.js';
import {
  getFreshPricingNodes,
  getFreshHeroNodes,
  getFreshDashboardNodes,
  applyBrokenDesignScenario,
  applyFixedDesignScenario
} from '../src/utils/demoScenarios.js';
import { evaluateReceipts, applyReceiptFix } from '../src/utils/receiptPolicy.js';
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
  assert.ok(files['src/PricingCard.jsx']?.includes('Unlimited projects'));
  assert.ok(files['src/DashboardPage.jsx']);
  assert.ok(files['package.json']);
});

test('learning loop + scorecard', () => {
  clearLearningEvents();
  logLearningEvent('round_trip_canvas', { file: 'pricing' });
  logLearningEvent('fix_applied', { ruleId: 'contrast' });
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
  const pricingRoot = files['src/PricingCard.jsx'].split('\n').find((l) => l.includes('id="pricing-card-frame"'));
  assert.ok(pricingRoot.includes("position: 'relative'") && !pricingRoot.includes('left:'), pricingRoot);
  assert.ok(!files['src/FigmaImport.jsx'], 'placeholder Figma page should not be exported');

  const imported = figmaFileToNodes({ document: { children: [{ type: 'CANVAS', children: [{ type: 'FRAME', name: 'F', absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 }, children: [{ type: 'FRAME', children: [{ type: 'TEXT', characters: 'hi' }, { type: 'TEXT', characters: 'gone', visible: false }] }] }] }] } });
  assert.ok(Object.values(imported.nodes).every(Boolean), 'id-less Figma nodes must not collide');
  assert.ok(!JSON.stringify(imported.nodes).includes('gone'), 'hidden layer imported');
  const withFigma = buildProjectFileMap({ ...nodesByFile, figma: imported.nodes }, 'demo');
  assert.ok(withFigma.files['src/FigmaImport.jsx']);
});

test('text edit keeps multi-line formatting', () => {
  const nodes = {
    root: { id: 'root', type: 'frame', tag: 'div', style: {}, children: ['btn'] },
    btn: { id: 'btn', type: 'button', tag: 'button', style: {}, text: 'Go now' }
  };
  const code = 'export function A() {\n  return (\n    <div id="root">\n      <button id="btn">\n        Submit\n      </button>\n    </div>\n  );\n}';
  const out = generateTSX('root', nodes, code);
  // recast may re-indent the changed text, but it must stay on its own line
  assert.ok(/<button id="btn">\n\s+Go now\n\s+<\/button>/.test(out), out);
  assert.ok(out.includes('<div id="root">\n      <button id="btn">'), 'untouched lines reformatted');
  assert.strictEqual(parseTSX(out, nodes).btn.text, 'Go now');
});

const failed = results.filter((r) => !r.ok);
console.log('\n=== SUMMARY ===');
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  failed.forEach((f) => console.error('-', f.name, ':', f.error));
  process.exit(1);
}
