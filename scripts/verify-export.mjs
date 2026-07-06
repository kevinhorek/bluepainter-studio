import JSZip from 'jszip';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { generateTSX } from '../src/utils/syncEngine.js';
import { FILE_ORDER, WORKSPACE_FILES } from '../src/data/workspaceFiles.js';
import { getFreshPricingNodes, getFreshHeroNodes, getFreshDashboardNodes } from '../src/utils/demoScenarios.js';

const nodesByFile = {
  pricing: getFreshPricingNodes(),
  hero: getFreshHeroNodes(),
  dashboard: getFreshDashboardNodes()
};

function exportFilename(label) {
  return label.replace(/\.tsx$/, '.jsx');
}

function fixImportPaths(code) {
  return code.replace(/from '\.\/([^']+)'/g, (_, n) => `from './${n}.jsx'`);
}

const zip = new JSZip();
FILE_ORDER.forEach((fileId) => {
  const file = WORKSPACE_FILES[fileId];
  zip.file(`src/${exportFilename(file.label)}`, fixImportPaths(generateTSX(file.rootId, nodesByFile[fileId])));
});
zip.file('src/App.jsx', `import { DashboardPage } from './DashboardPage.jsx';\nexport default function App() { return <DashboardPage />; }\n`);
zip.file('src/main.jsx', `import { createRoot } from 'react-dom/client';\nimport App from './App.jsx';\ncreateRoot(document.getElementById('root')).render(<App />);\n`);
zip.file('index.html', '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>');
zip.file('vite.config.js', `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });\n`);
zip.file('package.json', JSON.stringify({
  name: 'test-export',
  private: true,
  type: 'module',
  scripts: { build: 'vite build' },
  dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
  devDependencies: { '@vitejs/plugin-react': '^4.3.4', vite: '^6.0.0' }
}, null, 2));

const buf = await zip.generateAsync({ type: 'nodebuffer' });
const out = '/tmp/bp-export-test';
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
const extracted = await JSZip.loadAsync(buf);
for (const [path, file] of Object.entries(extracted.files)) {
  if (!file.dir) {
    const content = await file.async('nodebuffer');
    const full = `${out}/${path}`;
    mkdirSync(full.substring(0, full.lastIndexOf('/')), { recursive: true });
    writeFileSync(full, content);
  }
}
execSync('npm install && npm run build', { cwd: out, stdio: 'inherit' });
console.log('EXPORT BUILD OK');
