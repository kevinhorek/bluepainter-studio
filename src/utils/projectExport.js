import JSZip from 'jszip';
import { generateTSX } from './syncEngine';
import { FILE_ORDER, WORKSPACE_FILES, APP_EXPORT_FILE_IDS } from '../data/workspaceFiles';

/** Studio labels are already `.tsx`; the export is a real TypeScript project. */
export function exportFilename(label) {
  return /\.tsx$/.test(label) ? label : `${label.replace(/\.[jt]sx?$/, '')}.tsx`;
}

/**
 * Generated imports are extensionless (`from './PricingCard'`), which is what
 * TypeScript's bundler resolution wants. Strip any explicit extension so older
 * saved code keeps resolving after the .jsx → .tsx move.
 */
export function fixImportPaths(code) {
  return code.replace(/from '\.\/([^']+?)\.[jt]sx?'/g, (_, name) => `from './${name}'`);
}

export function scaffoldPackageJson(name) {
  return JSON.stringify({
    name,
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      typecheck: 'tsc --noEmit',
      preview: 'vite preview'
    },
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0'
    },
    devDependencies: {
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@vitejs/plugin-react': '^4.3.4',
      typescript: '^5.6.0',
      vite: '^6.0.0'
    }
  }, null, 2);
}

export const TSCONFIG_JSON = JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    moduleResolution: 'bundler',
    jsx: 'react-jsx',
    strict: true,
    noEmit: true,
    isolatedModules: true,
    skipLibCheck: true
  },
  include: ['src']
}, null, 2);

export const VITE_ENV_DTS = '/// <reference types="vite/client" />\n';

export const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App — exported from BluePainter</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

export const MAIN_TSX = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;

const INDEX_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Inter, system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}
#root { min-height: 100vh; }
`;

const VERCEL_JSON = JSON.stringify({
  rewrites: [{ source: '/((?!assets/).*)', destination: '/index.html' }]
}, null, 2);

const DEPLOY_MD = `# Deploy this app to Vercel

Exported from [BluePainter](https://bluepainter-studio.vercel.app).

## Quick deploy

\`\`\`bash
npm install
npm run build
npx vercel --prod
\`\`\`

Follow the Vercel CLI prompts (login required on first run).

## Or use the Vercel website

1. Push this folder to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repo — Vercel auto-detects Vite
4. Click Deploy

## Local preview

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:5173

## TypeScript

The project is TypeScript (\`src/*.tsx\`, strict). \`npm run typecheck\` runs \`tsc --noEmit\`;
\`npm run build\` only bundles, so a type error never blocks a deploy.

## Notes

- Element \`id\`s come from the canvas. A component placed more than once on a page would repeat its ids, so such components carry \`data-bp-id\` instead of \`id\` (no duplicate DOM ids). BluePainter reads either attribute, so the files still open on the canvas; target them from CSS with \`[data-bp-id="…"]\` or add your own \`className\`.
`;

/**
 * The canvas shows a component's root at a free position on its artboard
 * (position:absolute; left/top). When the component is *used* — on a page or in
 * an exported app — the canvas renders it in flow, so the export must too,
 * otherwise every instance pins itself to the page corner and overlaps.
 */
export function normalizeComponentRoot(rootId, nodes) {
  const root = nodes?.[rootId];
  if (!root) return nodes;
  const style = { ...(root.style || {}) };
  delete style.left;
  delete style.top;
  style.position = 'relative';
  return { ...nodes, [rootId]: { ...root, style } };
}

function exportNodesFor(fileId, nodesByFile) {
  const file = WORKSPACE_FILES[fileId];
  return file.isPage ? nodesByFile[fileId] : normalizeComponentRoot(file.rootId, nodesByFile[fileId]);
}

/** Files that go into the export: the app files, plus the Figma import once it has content. */
export function getExportFileIds(nodesByFile) {
  const ids = [...APP_EXPORT_FILE_IDS];
  const figma = nodesByFile?.figma;
  const figmaRoot = figma?.[WORKSPACE_FILES.figma.rootId];
  const isPlaceholder = !figmaRoot || figma['figma-placeholder-title'] || !(figmaRoot.children || []).length;
  if (!isPlaceholder) ids.push('figma');
  return ids;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  // Revoking synchronously can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** How many times each component file is placed across the exported files. */
function countComponentInstances(fileIds, nodesByFile) {
  const counts = {};
  fileIds.forEach((fileId) => {
    Object.values(nodesByFile[fileId] || {}).forEach((node) => {
      if (node?.type === 'component-instance' && node.refFile) counts[node.refFile] = (counts[node.refFile] || 0) + 1;
    });
  });
  return counts;
}

/**
 * A component rendered more than once must not repeat DOM ids. Its elements keep
 * their layer identity in `data-bp-id`, which the sync engine reads like `id`.
 */
export function toLayerIdAttribute(code) {
  return code.replace(/(<[A-Za-z][\w.]*\s+)id="/g, '$1data-bp-id="');
}

function exportCodeFor(fileId, nodesByFile, instanceCounts) {
  const file = WORKSPACE_FILES[fileId];
  const code = fixImportPaths(generateTSX(file.rootId, exportNodesFor(fileId, nodesByFile)));
  return !file.isPage && (instanceCounts[fileId] || 0) > 1 ? toLayerIdAttribute(code) : code;
}

export function getExportPreview(nodesByFile) {
  const fileIds = getExportFileIds(nodesByFile);
  const instanceCounts = countComponentInstances(fileIds, nodesByFile);
  return fileIds.map((fileId) => {
    const file = WORKSPACE_FILES[fileId];
    const code = exportCodeFor(fileId, nodesByFile, instanceCounts);
    return { path: `src/${exportFilename(file.label)}`, lines: code.split('\n').length };
  });
}

export function buildProjectFileMap(nodesByFile, projectName = 'my-bluepainter-app') {
  const safeName = projectName.trim().replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'my-bluepainter-app';
  const files = {};

  const fileIds = getExportFileIds(nodesByFile);
  const instanceCounts = countComponentInstances(fileIds, nodesByFile);
  fileIds.forEach((fileId) => {
    const file = WORKSPACE_FILES[fileId];
    files[`src/${exportFilename(file.label)}`] = exportCodeFor(fileId, nodesByFile, instanceCounts);
  });

  const pageId = FILE_ORDER.find((id) => WORKSPACE_FILES[id].isPage && id !== 'marketing') || 'dashboard';
  const page = WORKSPACE_FILES[pageId];

  files['src/App.tsx'] = `import { ${page.componentName} } from './${page.label.replace(/\.[jt]sx?$/, '')}';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <${page.componentName} />
    </div>
  );
}
`;
  files['src/main.tsx'] = MAIN_TSX;
  files['src/vite-env.d.ts'] = VITE_ENV_DTS;
  files['src/index.css'] = INDEX_CSS;
  files['index.html'] = INDEX_HTML.replace('My App — exported from BluePainter', `${safeName} — exported from BluePainter`);
  files['vite.config.ts'] = VITE_CONFIG;
  files['tsconfig.json'] = TSCONFIG_JSON;
  files['package.json'] = scaffoldPackageJson(safeName);
  files['vercel.json'] = VERCEL_JSON;
  files['DEPLOY.md'] = DEPLOY_MD;
  files['.gitignore'] = 'node_modules\ndist\n.vercel\n';

  return { projectName: safeName, files };
}

export async function downloadProjectExport(nodesByFile, projectName = 'my-bluepainter-app') {
  const { projectName: safeName, files } = buildProjectFileMap(nodesByFile, projectName);
  const zip = new JSZip();

  Object.entries(files).forEach(([path, content]) => {
    zip.file(path, content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, `${safeName}.zip`);

  return { projectName: safeName, fileCount: Object.keys(files).length };
}
