/**
 * The VS Code extension runs CommonJS, the Studio runs ESM, and both need the
 * same sync engine + receipt policy. This generates the extension copies from
 * the Studio sources so they can't drift.
 *
 *   node scripts/sync-extension-libs.mjs          # write extension/lib/*.js
 *   node scripts/sync-extension-libs.mjs --check  # exit 1 if they are stale (CI)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = [
  {
    from: 'src/utils/astSyncEngine.js',
    to: 'extension/lib/astSyncEngine.js',
    // browser-only export
    drop: ['astSyncAvailable'],
    // internals the extension's bootstrap / fallback patcher reuse
    extra: [
      'getJsxId',
      'babelParser',
      'TEXT_NODE_TYPES',
      'findAttribute',
      'readObjectExpression',
      'readStringAttribute',
      'readJsxText',
      'setJsxText',
      'upsertStyleAttribute',
      'upsertStringAttribute'
    ]
  },
  { from: 'src/utils/receiptPolicy.js', to: 'extension/lib/receiptPolicy.js', drop: [], extra: [] }
];

function toCommonJS(source, { from, drop, extra }) {
  const exported = [];
  let out = source
    // import x from 'y'  /  import * as x from 'y'  /  import { a, b } from 'y'
    .replace(/^import\s+\*\s+as\s+(\w+)\s+from\s+'([^']+)';?$/gm, "const $1 = require('$2');")
    .replace(/^import\s+(\w+)\s+from\s+'([^']+)';?$/gm, "const $1 = require('$2');")
    .replace(/^import\s+\{([^}]+)\}\s+from\s+'([^']+)';?$/gm, "const {$1} = require('$2');")
    .replace(/^export\s+(async\s+function|function|const|let|class)\s+(\w+)/gm, (_, kind, name) => {
      exported.push(name);
      return `${kind} ${name}`;
    });

  if (/^\s*(import|export)\s/m.test(out)) {
    throw new Error(`${from}: unsupported import/export form — extend scripts/sync-extension-libs.mjs`);
  }

  for (const name of drop) {
    const re = new RegExp(`\\n(?:/\\*\\*[\\s\\S]*?\\*/\\n)?function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}\\n`);
    if (!re.test(out)) throw new Error(`${from}: could not find ${name} to drop`);
    out = out.replace(re, '\n');
  }

  const names = [...new Set([...exported.filter((n) => !drop.includes(n)), ...extra])];
  for (const name of names) {
    if (!new RegExp(`\\b(function|const|let|class)\\s+${name}\\b`).test(out)) {
      throw new Error(`${from}: ${name} is not defined — update the export list`);
    }
  }

  const header = `// GENERATED from ${from} by scripts/sync-extension-libs.mjs — do not edit.\n// Run \`npm run sync:extension\` after changing the source.\n`;
  return `${header}${out.trimEnd()}\n\nmodule.exports = {\n${names.map((n) => `  ${n}`).join(',\n')}\n};\n`;
}

const check = process.argv.includes('--check');
let stale = false;
for (const target of TARGETS) {
  const next = toCommonJS(readFileSync(path.join(root, target.from), 'utf8'), target);
  const dest = path.join(root, target.to);
  let current = '';
  try { current = readFileSync(dest, 'utf8'); } catch { /* first run */ }
  if (current === next) {
    console.log(`up to date  ${target.to}`);
  } else if (check) {
    stale = true;
    console.error(`STALE       ${target.to} — run: npm run sync:extension`);
  } else {
    writeFileSync(dest, next);
    console.log(`wrote       ${target.to}`);
  }
}
if (stale) process.exit(1);
