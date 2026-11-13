/**
 * Plain-Node tests for the desktop file-access rules (no Electron needed):
 *   node desktop/test/ipc.test.cjs
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  OPEN_EXTENSIONS,
  SAVE_EXTENSIONS,
  MAX_FILE_BYTES,
  createFileAccess,
  hasExtension,
  isTrustedAppUrl,
  resolveSaveDialogPath,
  sanitizeSuggestedName
} = require('../fileAccess.cjs');

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

const root = path.resolve(path.sep, 'projects', 'app');
const file = (...parts) => path.join(root, ...parts);

console.log('desktop file access');

test('extension lists', () => {
  assert.deepEqual(OPEN_EXTENSIONS, ['tsx', 'jsx']);
  assert.deepEqual(SAVE_EXTENSIONS, ['tsx', 'jsx', 'ts', 'js']);
  assert.equal(hasExtension('A.TSX', SAVE_EXTENSIONS), true);
  assert.equal(hasExtension('a.tsx.sh', SAVE_EXTENSIONS), false);
  assert.equal(hasExtension('.tsx', SAVE_EXTENSIONS), false, 'a dotfile named .tsx has no extension');
});

test('saveFile is refused until the path came from a dialog', () => {
  const access = createFileAccess();
  const target = file('src', 'Card.tsx');
  const before = access.validateSave(target, 'x');
  assert.equal(before.ok, false);
  assert.match(before.error, /file dialog/);

  access.allow(target);
  assert.deepEqual(access.validateSave(target, 'export {}'), { ok: true, path: target });
  assert.equal(access.isAllowed(target), true);
  assert.equal(access.size, 1);
});

test('the allow-list is per path, not per folder', () => {
  const access = createFileAccess();
  access.allow(file('src', 'Card.tsx'));
  assert.equal(access.validateSave(file('src', 'Other.tsx'), 'x').ok, false);
  assert.equal(access.validateSave(file('src'), 'x').ok, false);
  assert.equal(access.validateSave(file('src', 'Card.tsx.bak'), 'x').ok, false);
});

test('paths are normalised before comparison (no traversal around the list)', () => {
  const access = createFileAccess();
  access.allow(file('src', 'Card.tsx'));
  const dotted = path.join(root, 'src', 'nested', '..', 'Card.tsx');
  assert.deepEqual(access.validateSave(dotted, 'x'), { ok: true, path: file('src', 'Card.tsx') });
  const escape = path.join(root, 'src', 'Card.tsx', '..', '..', 'secrets.js');
  assert.equal(access.validateSave(escape, 'x').ok, false);
});

test('only .tsx/.jsx/.ts/.js may be written, even when allow-listed', () => {
  const access = createFileAccess();
  for (const name of ['a.tsx', 'a.jsx', 'a.ts', 'a.js']) {
    access.allow(file(name));
    assert.equal(access.validateSave(file(name), 'x').ok, true, name);
  }
  for (const name of ['.zshrc', 'a.json', 'a.sh', 'a.html', 'a.mjs', 'a']) {
    access.allow(file(name));
    const result = access.validateSave(file(name), 'x');
    assert.equal(result.ok, false, name);
    assert.match(result.error, /Only \.tsx/);
  }
});

test('argument types and shapes are validated', () => {
  const access = createFileAccess();
  const target = access.allow(file('a.tsx'));
  for (const [p, c] of [
    [undefined, 'x'], [null, 'x'], [42, 'x'], [{ toString: () => target }, 'x'], [[target], 'x'],
    [target, undefined], [target, null], [target, 42], [target, { length: 1 }], [target, Buffer.from('x')]
  ]) {
    const result = access.validateSave(p, c);
    assert.equal(result.ok, false);
    assert.match(result.error, /expects/);
  }
  assert.equal(access.validateSave('', 'x').ok, false);
  assert.equal(access.validateSave('a.tsx', 'x').ok, false, 'relative paths are refused');
  assert.equal(access.validateSave(`${target}\0.txt`, 'x').ok, false);
  assert.equal(access.validateSave(target, '').ok, true, 'empty content is a valid save');
  assert.throws(() => access.allow('relative.tsx'), TypeError);
  assert.equal(access.isAllowed(undefined), false);
});

test('oversized content is refused', () => {
  const access = createFileAccess();
  const target = access.allow(file('a.tsx'));
  assert.equal(access.validateSave(target, 'x'.repeat(MAX_FILE_BYTES)).ok, true);
  const tooBig = access.validateSave(target, 'x'.repeat(MAX_FILE_BYTES + 1));
  assert.equal(tooBig.ok, false);
  assert.match(tooBig.error, /too large/);
});

test('each session (createFileAccess call) has its own list', () => {
  const first = createFileAccess();
  const second = createFileAccess();
  first.allow(file('a.tsx'));
  assert.equal(second.isAllowed(file('a.tsx')), false);
});

test('Windows paths compare with Windows rules', () => {
  const access = createFileAccess({ pathModule: path.win32 });
  access.allow('C:\\work\\Card.tsx');
  assert.equal(access.validateSave('C:\\work\\sub\\..\\Card.tsx', 'x').ok, true);
  assert.equal(access.validateSave('C:/work/Card.tsx', 'x').ok, true);
  assert.equal(access.validateSave('C:\\work\\Other.tsx', 'x').ok, false);
});

test('save-dialog results get an allowed extension or are refused', () => {
  assert.deepEqual(resolveSaveDialogPath(file('New')), { ok: true, path: file('New.tsx') });
  assert.deepEqual(resolveSaveDialogPath(file('New.jsx')), { ok: true, path: file('New.jsx') });
  assert.equal(resolveSaveDialogPath(file('New.json')).ok, false);
  assert.equal(resolveSaveDialogPath('New.tsx').ok, false);
  assert.equal(resolveSaveDialogPath(undefined).ok, false);
});

test('suggested names are reduced to a safe file name', () => {
  assert.equal(sanitizeSuggestedName('PricingCard.tsx'), 'PricingCard.tsx');
  assert.equal(sanitizeSuggestedName('PricingCard'), 'PricingCard.tsx');
  assert.equal(sanitizeSuggestedName('notes.txt'), 'notes.tsx');
  assert.equal(sanitizeSuggestedName('../../etc/passwd'), 'passwd.tsx');
  assert.equal(sanitizeSuggestedName('C:\\Users\\me\\Card.jsx'), 'Card.jsx');
  assert.equal(sanitizeSuggestedName('.bashrc'), 'bashrc.tsx');
  assert.equal(sanitizeSuggestedName('a<b>:c?.ts'), 'abc.ts');
  for (const bad of [undefined, null, 42, {}, '', '   ', '///']) {
    assert.equal(sanitizeSuggestedName(bad), 'Component.tsx');
  }
  assert.ok(sanitizeSuggestedName('x'.repeat(500)).length <= 124);
});

test('only the Studio itself is a trusted IPC sender', () => {
  const dev = { isDev: true, devUrl: 'http://127.0.0.1:5173', indexPath: file('dist', 'index.html') };
  assert.equal(isTrustedAppUrl('http://127.0.0.1:5173/#/app', dev), true);
  assert.equal(isTrustedAppUrl('http://127.0.0.1:5173/anything?x=1', dev), true);
  assert.equal(isTrustedAppUrl('http://127.0.0.1:5174/#/app', dev), false);
  assert.equal(isTrustedAppUrl('http://localhost:5173/#/app', dev), false);
  assert.equal(isTrustedAppUrl('https://evil.example/#/app', dev), false);
  assert.equal(isTrustedAppUrl('http://127.0.0.1:5173.evil.example/', dev), false);

  const indexPath = path.join(root, 'BluePainter Studio', 'dist', 'index.html');
  const prod = { isDev: false, devUrl: dev.devUrl, indexPath };
  const indexUrl = pathToFileURL(indexPath).href;
  assert.equal(isTrustedAppUrl(`${indexUrl}#/app`, prod), true);
  assert.equal(isTrustedAppUrl(indexUrl, prod), true);
  assert.equal(isTrustedAppUrl(pathToFileURL(path.join(root, 'other.html')).href, prod), false);
  assert.equal(isTrustedAppUrl('http://127.0.0.1:5173/#/app', prod), false);
  for (const bad of ['', 'about:blank', 'not a url', undefined, null, 42]) {
    assert.equal(isTrustedAppUrl(bad, dev), false);
    assert.equal(isTrustedAppUrl(bad, prod), false);
  }
});

console.log(`desktop: ${passed} passed, 0 failed`);
