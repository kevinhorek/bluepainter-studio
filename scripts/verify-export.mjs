/**
 * End-to-end check of what BluePainter exports: writes the real file maps
 * (app export from buildProjectFileMap, marketing kit landing-site from
 * buildLandingSiteFileMap) to a temp dir, then runs
 * `npm install`, `npm run typecheck` and `npm run build` in each.
 *
 * Run: npm run verify:export   (needs network for npm install; takes a minute)
 * The offline syntax/shape checks are in scripts/export-tests.mjs.
 *
 * Set KEEP_EXPORT=1 to keep the temp dir for inspection.
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import { buildExportCases } from './export-tests.mjs';

const root = mkdtempSync(join(tmpdir(), 'bluepainter-export-'));
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });

function writeProject(dir, files) {
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
}

let failed = null;
try {
  const cases = buildExportCases();
  // Every case has the same package.json dependencies: install once, share node_modules.
  let sharedModules = null;

  for (const { name, files } of cases) {
    const dir = join(root, name);
    console.log(`\n=== ${name} (${Object.keys(files).length} files) → ${dir}`);
    writeProject(dir, files);

    if (!sharedModules) {
      run('npm install --no-audit --no-fund', dir);
      sharedModules = join(dir, 'node_modules');
    } else {
      symlinkSync(sharedModules, join(dir, 'node_modules'), 'dir');
    }

    run('npm run typecheck', dir);
    run('npm run build', dir);
    if (!existsSync(join(dir, 'dist', 'index.html'))) throw new Error(`${name}: build produced no dist/index.html`);
  }
  console.log(`\nEXPORT OK — ${cases.map((c) => c.name).join(', ')}: install, typecheck and build passed`);
} catch (err) {
  failed = err;
} finally {
  if (process.env.KEEP_EXPORT) console.log(`Kept ${root}`);
  else rmSync(root, { recursive: true, force: true });
}

if (failed) {
  console.error(`\nEXPORT FAILED: ${failed.message}`);
  process.exit(1);
}
