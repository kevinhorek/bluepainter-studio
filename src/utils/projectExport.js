import JSZip from 'jszip';
import { generateTSX } from './syncEngine';
import { FILE_ORDER, WORKSPACE_FILES, APP_EXPORT_FILE_IDS } from '../data/workspaceFiles';

function exportFilename(label) {
  return label.replace(/\.tsx$/, '.jsx');
}

function fixImportPaths(code) {
  return code.replace(/from '\.\/([^']+)'/g, (_, name) => `from './${name}.jsx'`);
}

function scaffoldPackageJson(name) {
  return JSON.stringify({
    name,
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0'
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.3.4',
      vite: '^6.0.0'
    }
  }, null, 2);
}

const VITE_CONFIG = `import { defineConfig } from 'vite';
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
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

const MAIN_JSX = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
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

Exported from [BluePainter Studio](https://bluepainter-studio.vercel.app).

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
`;

export function getExportPreview(nodesByFile) {
  return APP_EXPORT_FILE_IDS.map((fileId) => {
    const file = WORKSPACE_FILES[fileId];
    const code = fixImportPaths(generateTSX(file.rootId, nodesByFile[fileId]));
    return { path: `src/${exportFilename(file.label)}`, lines: code.split('\n').length };
  });
}

export function buildProjectFileMap(nodesByFile, projectName = 'my-bluepainter-app') {
  const safeName = projectName.trim().replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'my-bluepainter-app';
  const files = {};

  APP_EXPORT_FILE_IDS.forEach((fileId) => {
    const file = WORKSPACE_FILES[fileId];
    const code = fixImportPaths(generateTSX(file.rootId, nodesByFile[fileId]));
    files[`src/${exportFilename(file.label)}`] = code;
  });

  const pageId = FILE_ORDER.find((id) => WORKSPACE_FILES[id].isPage && id !== 'marketing') || 'dashboard';
  const page = WORKSPACE_FILES[pageId];

  files['src/App.jsx'] = `import { ${page.componentName} } from './${exportFilename(page.label)}';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <${page.componentName} />
    </div>
  );
}
`;
  files['src/main.jsx'] = MAIN_JSX;
  files['src/index.css'] = INDEX_CSS;
  files['index.html'] = INDEX_HTML.replace('My App — exported from BluePainter', `${safeName} — exported from BluePainter`);
  files['vite.config.js'] = VITE_CONFIG;
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
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeName}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);

  return { projectName: safeName, fileCount: Object.keys(files).length };
}
