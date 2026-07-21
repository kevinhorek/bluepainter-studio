const { parseTSXWithAST, patchTSXWithAST } = require('./astSyncEngine');
const { patchTSXWithBabel, parseTSXWithBabel } = require('./babelPatch');

function parseTSX(code, nodesMap) {
  if (!code || !nodesMap) return nodesMap;
  const astResult = parseTSXWithAST(code, nodesMap) || parseTSXWithBabel(code, nodesMap);
  if (astResult) return astResult;
  return JSON.parse(JSON.stringify(nodesMap));
}

function generateTSX(nodesMap, existingCode) {
  if (existingCode?.trim()) {
    const patched = patchTSXWithAST(existingCode, nodesMap) || patchTSXWithBabel(existingCode, nodesMap);
    if (patched) return patched;
  }
  return null;
}

module.exports = { parseTSX, generateTSX, patchTSXWithAST, patchTSXWithBabel };
