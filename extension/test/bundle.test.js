// The packaged extension is one bundled file (dist/extension.js) with no node_modules.
// Load it with a stubbed `vscode` module to prove every other dependency is inside.
const Module = require('module');
const path = require('path');
const assert = require('assert');

const stub = () => new Proxy(function () {}, { get: () => stub(), apply: () => stub() });
const load = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'vscode') return stub();
  // Anything else must be a Node built-in or part of the bundle itself.
  if (!request.startsWith('.') && !path.isAbsolute(request) && !request.startsWith('node:') && !Module.builtinModules.includes(request)) {
    throw new Error(`bundle still requires "${request}" at runtime`);
  }
  return load.call(this, request, ...rest);
};

const extension = require(path.join(__dirname, '..', 'dist', 'extension.js'));
assert.strictEqual(typeof extension.activate, 'function');
assert.strictEqual(typeof extension.deactivate, 'function');
console.log('ok   bundled extension loads without node_modules');
