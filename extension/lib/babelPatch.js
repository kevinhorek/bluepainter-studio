const traverseModule = require('@babel/traverse');
const generateModule = require('@babel/generator');
const t = require('@babel/types');
const {
  getJsxId,
  babelParser,
  TEXT_NODE_TYPES,
  findAttribute,
  readObjectExpression,
  readStringAttribute,
  readJsxText,
  setJsxText,
  upsertStyleAttribute,
  upsertStringAttribute
} = require('./astSyncEngine');

const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;

/**
 * Fallback for when recast can't print the file. Same semantics as
 * patchTSXWithAST (shared helpers), but re-generates the whole file with
 * @babel/generator, so formatting is only approximately preserved.
 */
function patchTSXWithBabel(code, nodesMap) {
  if (!code?.trim() || !nodesMap) return null;

  try {
    const ast = babelParser.parse(code);

    traverse(ast, {
      JSXElement(path) {
        const opening = path.node.openingElement;
        const id = getJsxId(opening);
        if (!id || !nodesMap[id]) return;

        const node = nodesMap[id];
        upsertStyleAttribute(opening, node.style || {});
        if (node.type === 'component-instance') return;

        if (TEXT_NODE_TYPES.has(node.type)) {
          setJsxText(path.node, node.text || '');
        }

        if (node.type === 'image' && node.src) {
          upsertStringAttribute(opening, 'src', node.src);
        }
      }
    });

    return generate(ast, { retainLines: true, jsescOption: { minimal: true } }).code;
  } catch (err) {
    console.warn('[babelPatch] patch failed:', err.message);
    return null;
  }
}

function parseTSXWithBabel(code, nodesMap) {
  if (!code?.trim() || !nodesMap) return null;

  const updated = JSON.parse(JSON.stringify(nodesMap));

  try {
    const ast = babelParser.parse(code);

    traverse(ast, {
      JSXElement(path) {
        const opening = path.node.openingElement;
        const id = getJsxId(opening);
        if (!id || !updated[id]) return;

        const node = updated[id];

        const styleIdx = findAttribute(opening, 'style');
        if (styleIdx < 0) {
          node.style = {};
        } else {
          const styleAttr = opening.attributes[styleIdx];
          const parsed = t.isJSXExpressionContainer(styleAttr.value)
            ? readObjectExpression(styleAttr.value.expression)
            : null;
          if (parsed) {
            const prev = node.style || {};
            if (parsed.opaque) {
              node.style = { ...prev, ...parsed.values };
            } else {
              const next = { ...parsed.values };
              parsed.dynamicKeys.forEach((key) => {
                if (prev[key] !== undefined) next[key] = prev[key];
              });
              node.style = next;
            }
          }
        }

        if (TEXT_NODE_TYPES.has(node.type)) {
          const text = readJsxText(path.node);
          if (text != null) node.text = text;
        }

        if (node.type === 'image' && t.isJSXIdentifier(opening.name, { name: 'img' })) {
          const src = readStringAttribute(opening, 'src');
          if (src != null) node.src = src;
        }
      }
    });

    return updated;
  } catch (err) {
    console.warn('[babelPatch] parse failed:', err.message);
    return null;
  }
}

module.exports = { patchTSXWithBabel, parseTSXWithBabel };
