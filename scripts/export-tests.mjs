/**
 * Fast, offline checks of the exported projects (app export + marketing kit
 * landing-site): every generated source file must parse as TSX/TS, imports
 * must resolve inside the file map, and the scaffold must be a strict
 * TypeScript Vite project.
 *
 * Run: npm run test:export
 * The slow end-to-end version (npm install + tsc + vite build) is
 * scripts/verify-export.mjs, which reuses buildExportCases() from here.
 */
import assert from 'node:assert';
import { pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';
import {
  buildProjectFileMap,
  getExportPreview,
  getExportFileIds
} from '../src/utils/projectExport.js';
import { buildLandingSiteFileMap } from '../src/utils/marketingKit.js';
import { getFreshPricingNodes, getFreshHeroNodes, getFreshDashboardNodes } from '../src/utils/demoScenarios.js';
import { getFreshMarketingNodes } from '../src/data/marketingPage.js';
import { getEmptyFigmaImportNodes, figmaFileToNodes } from '../src/utils/figmaImport.js';
import { createNodeFromTool } from '../src/utils/nodeFactory.js';

export const AWKWARD_TEXT = 'Save {50%} <b> & more';

const FIGMA_FIXTURE = {
  document: {
    children: [
      {
        type: 'CANVAS',
        children: [
          {
            type: 'FRAME',
            name: 'Landing {v2} <draft>',
            absoluteBoundingBox: { x: 0, y: 0, width: 800, height: 600 },
            layoutMode: 'VERTICAL',
            itemSpacing: 12,
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 1 } }],
            children: [
              {
                type: 'TEXT',
                name: 'Title',
                characters: AWKWARD_TEXT,
                absoluteBoundingBox: { x: 10, y: 10, width: 200, height: 40 },
                style: { fontSize: 32, fontWeight: 700, textAlignHorizontal: 'CENTER', fontFamily: 'Inter' },
                fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }]
              },
              {
                type: 'FRAME',
                name: 'Row',
                layoutMode: 'HORIZONTAL',
                absoluteBoundingBox: { x: 10, y: 60, width: 400, height: 80 },
                cornerRadius: 8,
                strokes: [{ type: 'SOLID', color: { r: 0, g: 0, b: 1, a: 1 } }],
                strokeWeight: 2,
                children: [
                  { type: 'RECTANGLE', name: 'Box', absoluteBoundingBox: { x: 10, y: 60, width: 80, height: 80 }, fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 0.5 } }] },
                  { type: 'ELLIPSE', name: 'Dot', absoluteBoundingBox: { x: 100, y: 60, width: 80, height: 80 } },
                  { type: 'VECTOR', name: 'Squiggle', absoluteBoundingBox: { x: 200, y: 60, width: 80, height: 80 } },
                  { type: 'TEXT', name: 'Quote', characters: `It's "quoted" \\ and\nmulti-line`, style: { fontSize: 14 } }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};

function freshNodes() {
  return {
    pricing: getFreshPricingNodes(),
    hero: getFreshHeroNodes(),
    dashboard: getFreshDashboardNodes(),
    marketing: getFreshMarketingNodes(),
    figma: getEmptyFigmaImportNodes()
  };
}

/** Parent id of `childId` in a node map. */
function parentOf(nodes, childId) {
  return Object.keys(nodes).find((id) => (nodes[id].children || []).includes(childId));
}

/**
 * Awkward-but-legal canvas state: JSX-hostile text, quotes in style values, a
 * component placed twice on the page, one node from every placeable canvas
 * tool, and an imported Figma page.
 */
function awkwardNodes() {
  const n = freshNodes();

  n.pricing['header-text'].text = AWKWARD_TEXT;
  n.pricing['cta-button'].text = `{"json": true} </button> &amp; it's`;
  n.pricing['pricing-card-frame'].style.fontFamily = "'Inter', \"Helvetica Neue\", sans-serif";
  n.hero['hero-title'].text = `Ship <faster> {today} & "sleep"`;
  n.marketing['mkt-brand'].text = `Acme {Labs} <b> & "Co"`;
  n.marketing['mkt-seo-title'].text = `Acme <b> & "Co" — {launch}`;

  // Same component twice on the page → the export repeats its ids (documented in DEPLOY.md).
  const instanceParent = parentOf(n.dashboard, 'pricing-instance');
  n.dashboard['pricing-instance-2'] = { ...n.dashboard['pricing-instance'], id: 'pricing-instance-2', style: { ...n.dashboard['pricing-instance'].style } };
  n.dashboard[instanceParent].children = [...n.dashboard[instanceParent].children, 'pricing-instance-2'];

  // One node per canvas tool so every branch of the code generator is exercised.
  const tools = ['text', 'button', 'frame', 'section', 'slice', 'rectangle', 'line', 'arrow', 'ellipse', 'polygon', 'star', 'pen', 'pencil', 'image', 'comment'];
  const page = n.dashboard['dashboard-page'];
  tools.forEach((tool, i) => {
    const id = `tool-${tool}`;
    const node = createNodeFromTool(tool, id, 20 + i * 10, 20 + i * 10);
    if (!node) return;
    if (node.text !== undefined) node.text = `${AWKWARD_TEXT} */ (${tool})`;
    n.dashboard[id] = node;
    page.children = [...page.children, id];
  });

  n.figma = figmaFileToNodes(FIGMA_FIXTURE).nodes;
  return n;
}

/** Named export cases shared by the offline tests and verify-export.mjs. */
export function buildExportCases() {
  const fresh = freshNodes();
  const awkward = awkwardNodes();
  return [
    { name: 'app-fresh', nodesByFile: fresh, ...buildProjectFileMap(fresh, 'Fresh Demo') },
    { name: 'app-awkward', nodesByFile: awkward, ...buildProjectFileMap(awkward, 'Awkward {App} <1>') },
    { name: 'landing-fresh', nodesByFile: fresh, ...buildLandingSiteFileMap(fresh, { projectName: 'fresh-kit' }) },
    { name: 'landing-awkward', nodesByFile: awkward, ...buildLandingSiteFileMap(awkward, { projectName: 'awkward-kit' }) }
  ];
}

function parseSource(path, code) {
  if (path.endsWith('.d.ts')) return parse(code, { sourceType: 'module', plugins: [['typescript', { dts: true }]] });
  if (path.endsWith('.tsx')) return parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  return parse(code, { sourceType: 'module', plugins: ['typescript'] });
}

function relativeImports(ast) {
  return ast.program.body
    .filter((n) => n.type === 'ImportDeclaration' && n.source.value.startsWith('.'))
    .map((n) => n.source.value);
}

function checkProject({ name, files, projectName }) {
  const paths = Object.keys(files);
  assert.match(projectName, /^[a-z0-9-]+$/, `${name}: unsafe project name ${projectName}`);

  // No JavaScript sources left behind, and nothing refers to them.
  assert.deepStrictEqual(paths.filter((p) => /\.jsx?$/.test(p)), [], `${name}: JS files in a TypeScript export`);
  for (const [path, content] of Object.entries(files)) {
    assert.strictEqual(typeof content, 'string', `${name}: ${path} is not a string`);
    assert.ok(!/\.jsx\b/.test(content), `${name}: ${path} still mentions .jsx`);
  }

  // Every source file is syntactically valid TS/TSX and its relative imports resolve.
  const sources = paths.filter((p) => /\.tsx?$/.test(p));
  assert.ok(sources.length >= 5, `${name}: expected TS sources, got ${sources}`);
  for (const path of sources) {
    let ast;
    try {
      ast = parseSource(path, files[path]);
    } catch (err) {
      assert.fail(`${name}: ${path} does not parse: ${err.message}\n${files[path]}`);
    }
    const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : '';
    for (const spec of relativeImports(ast)) {
      const base = dir + spec.replace(/^\.\//, '');
      assert.ok(!/\.tsx?$/.test(spec), `${name}: ${path} imports ${spec} with a TS extension`);
      assert.ok(
        files[base] !== undefined || files[`${base}.tsx`] !== undefined || files[`${base}.ts`] !== undefined,
        `${name}: ${path} imports ${spec}, which is not in the export`
      );
    }
  }

  for (const required of ['src/App.tsx', 'src/main.tsx', 'src/vite-env.d.ts', 'src/index.css', 'index.html', 'vite.config.ts', 'tsconfig.json', 'package.json', 'vercel.json', 'DEPLOY.md']) {
    assert.ok(files[required], `${name}: missing ${required}`);
  }
  assert.ok(files['index.html'].includes('src="/src/main.tsx"'), `${name}: index.html entry`);
  assert.ok(files['src/main.tsx'].includes("document.getElementById('root')!"), `${name}: main.tsx non-null root`);
  assert.ok(files['src/vite-env.d.ts'].includes('vite/client'), `${name}: vite-env.d.ts`);

  const pkg = JSON.parse(files['package.json']);
  assert.strictEqual(pkg.type, 'module');
  assert.strictEqual(pkg.private, true);
  assert.strictEqual(pkg.scripts.build, 'vite build');
  assert.strictEqual(pkg.scripts.typecheck, 'tsc --noEmit');
  for (const dep of ['react', 'react-dom']) assert.ok(pkg.dependencies[dep], `${name}: dependency ${dep}`);
  for (const dep of ['typescript', '@types/react', '@types/react-dom', 'vite', '@vitejs/plugin-react']) {
    assert.ok(pkg.devDependencies[dep], `${name}: devDependency ${dep}`);
  }

  const { compilerOptions, include } = JSON.parse(files['tsconfig.json']);
  assert.strictEqual(compilerOptions.strict, true);
  assert.strictEqual(compilerOptions.jsx, 'react-jsx');
  assert.strictEqual(compilerOptions.noEmit, true);
  assert.strictEqual(compilerOptions.moduleResolution, 'bundler');
  assert.deepStrictEqual(include, ['src']);

  JSON.parse(files['vercel.json']);
}

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
  }
}

function run() {
  const cases = buildExportCases();
  const byName = Object.fromEntries(cases.map((c) => [c.name, c]));

  cases.forEach((c) => test(`${c.name}: valid strict-TS Vite project`, () => checkProject(c)));

  test('app export: file set and preview agree', () => {
    for (const name of ['app-fresh', 'app-awkward']) {
      const { files, nodesByFile } = byName[name];
      const preview = getExportPreview(nodesByFile);
      assert.deepStrictEqual(
        preview.map((p) => p.path),
        getExportFileIds(nodesByFile).map((id) => ({ dashboard: 'src/DashboardPage.tsx', pricing: 'src/PricingCard.tsx', hero: 'src/HeroSection.tsx', figma: 'src/FigmaImport.tsx' })[id])
      );
      for (const { path, lines } of preview) {
        assert.strictEqual(files[path].split('\n').length, lines, `${name}: ${path} line count`);
      }
    }
    assert.ok(!byName['app-fresh'].files['src/FigmaImport.tsx'], 'placeholder Figma page must not be exported');
    assert.ok(byName['app-awkward'].files['src/FigmaImport.tsx'], 'imported Figma page must be exported');
    assert.strictEqual(byName['app-awkward'].projectName, 'awkward--app---1-');
  });

  test('app export: awkward text survives as a JSX string expression', () => {
    const { files } = byName['app-awkward'];
    const literal = `{${JSON.stringify(AWKWARD_TEXT)}}`;
    assert.ok(files['src/PricingCard.tsx'].includes(`>${literal}</`), 'PricingCard header text');
    assert.ok(files['src/FigmaImport.tsx'].includes(literal), 'Figma text');
    assert.ok(files['src/PricingCard.tsx'].includes(JSON.stringify("'Inter', \"Helvetica Neue\", sans-serif")), 'quoted fontFamily');
  });

  test('app export: twice-instanced component renders twice and is documented', () => {
    const { files } = byName['app-awkward'];
    const page = files['src/DashboardPage.tsx'];
    assert.strictEqual(page.match(/<PricingCard \/>/g)?.length, 2);
    assert.strictEqual(page.match(/import \{ PricingCard \}/g)?.length, 1, 'imported once');
    assert.match(files['DEPLOY.md'], /duplicate DOM ids/i);
  });

  test('app export: component roots are in flow', () => {
    const root = byName['app-fresh'].files['src/PricingCard.tsx'].split('\n').find((l) => l.includes('id="pricing-card-frame"'));
    assert.ok(root.includes("position: 'relative'") && !root.includes('left:'), root);
  });

  test('landing-site: page, components and awkward brand copy', () => {
    const { files, projectName } = byName['landing-awkward'];
    assert.strictEqual(projectName, 'awkward-kit-landing');
    assert.strictEqual(JSON.parse(files['package.json']).name, 'awkward-kit-landing');
    for (const f of ['src/MarketingLanding.tsx', 'src/MarketingPage.tsx', 'src/HeroSection.tsx', 'src/PricingCard.tsx']) {
      assert.ok(files[f], `missing ${f}`);
    }
    assert.ok(files['src/MarketingLanding.tsx'].includes(`{${JSON.stringify('Acme {Labs} <b> & "Co"')}}`));
    assert.ok(files['index.html'].includes('&lt;b&gt;') && !files['index.html'].includes('<b>'), 'title is HTML-escaped');
  });

  const failed = results.filter((r) => !r.ok);
  results.forEach((r) => console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}${r.ok ? '' : `\n     ${r.error}`}`));
  console.log(`\n${results.length - failed.length}/${results.length} export tests passed`);
  if (failed.length) process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) run();
