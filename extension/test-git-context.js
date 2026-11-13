#!/usr/bin/env node

/**
 * Integration test for gitContext module
 * 
 * Run from extension/ directory:
 *   node test-git-context.js
 * 
 * Verifies git context detection works in a real git repo.
 */

const { getGitContext, getUserName, getUserEmail, getRepoUrl, getCurrentBranch, getCommitSha } = require('./lib/gitContext');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message);
    process.exit(1);
  }
  console.log('✓', message);
}

const testFilePath = path.join(__dirname, 'extension.js');

console.log('Testing git context detection...\n');
console.log('Test file path:', testFilePath);
console.log();

const ctx = getGitContext(testFilePath);

console.log('Detected context:');
console.log(JSON.stringify(ctx, null, 2));
console.log();

assert(ctx.userName !== null, 'userName should be detected');
assert(ctx.userEmail !== null, 'userEmail should be detected');
assert(ctx.repoUrl !== null, 'repoUrl should be detected');
assert(ctx.repoUrl.includes('bluepainter-studio'), 'repoUrl should contain repo name');
assert(ctx.branch !== null, 'branch should be detected');
assert(ctx.commitSha !== null, 'commitSha should be detected');
assert(ctx.commitSha.length === 40, 'commitSha should be 40 chars (full SHA)');

console.log('Testing individual functions...\n');

const userName = getUserName(__dirname);
assert(userName !== null, `getUserName returned: ${userName}`);

const userEmail = getUserEmail(__dirname);
assert(userEmail !== null, `getUserEmail returned: ${userEmail}`);

const repoUrl = getRepoUrl(__dirname);
assert(repoUrl !== null, `getRepoUrl returned: ${repoUrl}`);
assert(!repoUrl.includes('.git'), 'repoUrl should not end with .git');

const branch = getCurrentBranch(__dirname);
assert(branch !== null, `getCurrentBranch returned: ${branch}`);

const commitSha = getCommitSha(__dirname);
assert(commitSha !== null, `getCommitSha returned: ${commitSha}`);

console.log();
console.log('✅ All tests passed!');
