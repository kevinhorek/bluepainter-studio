/**
 * Write-back round trip on the bundled fixture — plain Node, no VS Code host.
 * Uses the same lib entry points extension.js calls (bootstrapFromFile →
 * mergeNodeUpdate → generateTSX).
 *
 * Run: npm test
 */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { bootstrapFromFile, mergeNodeUpdate } = require('../lib/bootstrap');
const { generateTSX, parseTSX } = require('../lib/syncEngine');
const { evaluateReceipts } = require('@bluepainter/shared/receiptPolicy');

const fixturePath = path.join(__dirname, '..', 'test-fixtures', 'PricingCard.tsx');
const source = fs.readFileSync(fixturePath, 'utf8');

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
  }
}

/** Indexes of lines that differ; throws if the line count changed. */
function changedLines(before, after) {
  const a = before.split('\n');
  const b = after.split('\n');
  assert.strictEqual(b.length, a.length, `line count changed: ${a.length} → ${b.length}`);
  return a.map((line, i) => (line === b[i] ? -1 : i)).filter((i) => i >= 0);
}

const boot = bootstrapFromFile(source, fixturePath, null);

test('bootstrap finds the fixture nodes', () => {
  assert.ok(!boot.parseError, 'fixture should parse');
  assert.strictEqual(boot.rootNodeId, 'pricing-card-frame');
  for (const id of ['pricing-card-frame', 'header-text', 'cta-button']) {
    assert.ok(boot.nodesMap[id], `missing node ${id}`);
  }
  assert.strictEqual(boot.nodesMap['pricing-card-frame'].style.padding, 32);
  assert.strictEqual(boot.nodesMap['cta-button'].text, 'Submit');
});

test('no-op write-back is byte-identical', () => {
  const out = generateTSX(boot.nodesMap, source);
  assert.strictEqual(typeof out, 'string', 'write-back returned no code');
  assert.ok(Buffer.from(out, 'utf8').equals(Buffer.from(source, 'utf8')), 'no-op write-back changed the file');
});

test('padding edit changes exactly one line', () => {
  const edited = mergeNodeUpdate(boot.nodesMap, 'pricing-card-frame', { style: { padding: 24 } });
  const out = generateTSX(edited, source);
  const changed = changedLines(source, out);
  assert.strictEqual(changed.length, 1, `expected 1 changed line, got ${changed.length}`);
  const before = source.split('\n')[changed[0]];
  const after = out.split('\n')[changed[0]];
  assert.strictEqual(before.trim(), 'padding: 32,');
  assert.strictEqual(after, before.replace('32', '24'), 'indentation and punctuation are preserved');
});

test('text edit only touches the button text and re-parses', () => {
  const edited = mergeNodeUpdate(boot.nodesMap, 'cta-button', { text: 'Start free trial' });
  const out = generateTSX(edited, source);
  const changed = changedLines(source, out);
  const lines = out.split('\n');
  // Text is spliced into the source, so exactly the text line changes.
  assert.strictEqual(changed.length, 1, `expected 1 changed line, got ${changed.length}`);
  assert.strictEqual(lines[changed[0]].trim(), 'Start free trial');
  assert.strictEqual(lines[changed[0]].match(/^\s*/)[0], source.split('\n')[changed[0]].match(/^\s*/)[0], 'indentation kept');
  assert.strictEqual(parseTSX(out, boot.nodesMap)['cta-button'].text, 'Start free trial');
});

test('receipts evaluate against the fixture', () => {
  const receipts = evaluateReceipts(boot.nodesMap);
  assert.ok(receipts && typeof receipts === 'object');
});

const failed = results.filter((r) => !r.ok);
results.forEach((r) => console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}${r.ok ? '' : `\n     ${r.error}`}`));
console.log(`\n${results.length - failed.length}/${results.length} extension tests passed`);
process.exit(failed.length ? 1 : 0);
