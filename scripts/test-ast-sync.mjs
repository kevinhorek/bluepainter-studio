#!/usr/bin/env node
import { parseTSXWithAST, patchTSXWithAST } from '../src/utils/astSyncEngine.js';

const sampleTSX = `import { Button } from './components/Button';

// This is an important comment about the component
export function TestComponent() {
  return (
    <div id="root-1" style={{ padding: 24, backgroundColor: '#f0f0f0' }}>
      {/* Header section */}
      <h1 id="heading-1" style={{ color: '#000000', fontSize: 32 }}>
        Original Heading
      </h1>
      <p id="text-1" style={{ marginTop: 16 }}>
        Original paragraph text.
      </p>
      <Button id="button-1" />
    </div>
  );
}
`;

const nodesMap = {
  'root-1': {
    id: 'root-1',
    type: 'container',
    tag: 'div',
    style: { padding: 24, backgroundColor: '#f0f0f0' },
    children: ['heading-1', 'text-1', 'button-1']
  },
  'heading-1': {
    id: 'heading-1',
    type: 'text',
    tag: 'h1',
    style: { color: '#ff0000', fontSize: 32 }, // Changed color to red
    text: 'Updated Heading' // Changed text
  },
  'text-1': {
    id: 'text-1',
    type: 'text',
    tag: 'p',
    style: { marginTop: 16, color: '#0000ff' }, // Added blue color
    text: 'Updated paragraph text.' // Changed text
  },
  'button-1': {
    id: 'button-1',
    type: 'component-instance',
    refFile: 'Button.tsx'
  }
};

console.log('=== Testing AST-preserving canvas → code sync ===\n');

console.log('1. Testing patchTSXWithAST (canvas edits → code)...');
const patched = patchTSXWithAST(sampleTSX, nodesMap);

if (!patched) {
  console.error('❌ FAIL: patchTSXWithAST returned null (AST patch failed)');
  process.exit(1);
}

console.log('✓ patchTSXWithAST succeeded\n');

console.log('2. Verifying changes in patched code...');
const checks = [
  { name: 'Color changed to #ff0000', test: () => patched.includes('#ff0000') },
  { name: 'Text changed to "Updated Heading"', test: () => patched.includes('Updated Heading') },
  { name: 'Color added to paragraph (#0000ff)', test: () => patched.includes('#0000ff') },
  { name: 'Paragraph text changed', test: () => patched.includes('Updated paragraph text.') },
  { name: 'Original comment preserved', test: () => patched.includes('// This is an important comment') },
  { name: 'JSX comment preserved', test: () => patched.includes('{/* Header section */}') },
  { name: 'Import statement preserved', test: () => patched.includes("import { Button } from './components/Button'") }
];

let allPassed = true;
for (const check of checks) {
  const passed = check.test();
  console.log(`  ${passed ? '✓' : '❌'} ${check.name}`);
  if (!passed) allPassed = false;
}

if (!allPassed) {
  console.error('\n❌ FAIL: Some checks failed');
  console.log('\n=== Patched code ===');
  console.log(patched);
  process.exit(1);
}

console.log('\n3. Testing parseTSXWithAST (code → canvas)...');
const parsed = parseTSXWithAST(patched, nodesMap);

if (!parsed) {
  console.error('❌ FAIL: parseTSXWithAST returned null');
  process.exit(1);
}

console.log('✓ parseTSXWithAST succeeded');

console.log('\n4. Verifying round-trip integrity...');
const roundTripChecks = [
  { name: 'Heading color parsed back as #ff0000', test: () => parsed['heading-1'].style.color === '#ff0000' },
  { name: 'Heading text parsed back', test: () => parsed['heading-1'].text === 'Updated Heading' },
  { name: 'Paragraph color parsed back as #0000ff', test: () => parsed['text-1'].style.color === '#0000ff' },
  { name: 'Paragraph text parsed back', test: () => parsed['text-1'].text === 'Updated paragraph text.' }
];

let roundTripPassed = true;
for (const check of roundTripChecks) {
  const passed = check.test();
  console.log(`  ${passed ? '✓' : '❌'} ${check.name}`);
  if (!passed) roundTripPassed = false;
}

if (!roundTripPassed) {
  console.error('\n❌ FAIL: Round-trip checks failed');
  console.log('\n=== Parsed nodes ===');
  console.log(JSON.stringify(parsed, null, 2));
  process.exit(1);
}

console.log('\n=== ✓ All tests passed! AST sync is working correctly ===');
