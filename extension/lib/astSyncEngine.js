const recast = require('recast');
const { parse } = require('@babel/parser');
const traverseModule = require('@babel/traverse');
const t = require('@babel/types');

const traverse = traverseModule.default || traverseModule;

const babelParser = {
  parse(source) {
    return parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
  }
};

function getJsxId(openingElement) {
  if (!openingElement?.attributes) return null;
  for (const attr of openingElement.attributes) {
    if (!t.isJSXAttribute(attr) || !t.isJSXIdentifier(attr.name, { name: 'id' })) continue;
    if (t.isStringLiteral(attr.value)) return attr.value.value;
    if (t.isJSXExpressionContainer(attr.value) && t.isStringLiteral(attr.value.expression)) {
      return attr.value.expression.value;
    }
  }
  return null;
}

function literalForValue(val) {
  if (typeof val === 'number' && !Number.isNaN(val)) return t.numericLiteral(val);
  return t.stringLiteral(String(val ?? ''));
}

function readObjectExpression(expr) {
  if (!t.isObjectExpression(expr)) return null;
  const out = {};
  for (const prop of expr.properties) {
    if (!t.isObjectProperty(prop)) continue;
    let key;
    if (t.isIdentifier(prop.key)) key = prop.key.name;
    else if (t.isStringLiteral(prop.key)) key = prop.key.value;
    else continue;

    if (t.isNumericLiteral(prop.value)) out[key] = prop.value.value;
    else if (t.isStringLiteral(prop.value)) out[key] = prop.value.value;
  }
  return out;
}

function styleObjectExpression(styleObj) {
  const props = Object.entries(styleObj || {})
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([key, val]) => t.objectProperty(t.identifier(key), literalForValue(val), false, true));
  return t.objectExpression(props);
}

function upsertStyleAttribute(openingElement, styleObj) {
  const idx = openingElement.attributes.findIndex(
    (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'style' })
  );
  const styleAttr = t.jsxAttribute(
    t.jsxIdentifier('style'),
    t.jsxExpressionContainer(styleObjectExpression(styleObj))
  );
  if (idx >= 0) openingElement.attributes[idx] = styleAttr;
  else openingElement.attributes.push(styleAttr);
}

function upsertStringAttribute(openingElement, name, value) {
  const idx = openingElement.attributes.findIndex(
    (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name })
  );
  const attr = t.jsxAttribute(t.jsxIdentifier(name), t.stringLiteral(String(value ?? '')));
  if (idx >= 0) openingElement.attributes[idx] = attr;
  else openingElement.attributes.push(attr);
}

function readJsxText(jsxElement) {
  for (const child of jsxElement.children || []) {
    if (t.isJSXText(child)) return child.value.trim();
    if (t.isJSXExpressionContainer(child) && t.isStringLiteral(child.expression)) {
      return child.expression.value;
    }
  }
  return null;
}

function setJsxText(jsxElement, text) {
  jsxElement.children = [t.jsxText(String(text ?? ''))];
}

function parseTSXWithAST(code, nodesMap) {
  if (!code?.trim() || !nodesMap) return null;

  const updated = JSON.parse(JSON.stringify(nodesMap));

  try {
    const ast = recast.parse(code, { parser: babelParser });

    traverse(ast, {
      JSXElement(path) {
        const opening = path.node.openingElement;
        const id = getJsxId(opening);
        if (!id || !updated[id]) return;

        const node = updated[id];

        const styleAttr = opening.attributes.find(
          (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'style' })
        );
        if (styleAttr && t.isJSXExpressionContainer(styleAttr.value)) {
          const parsed = readObjectExpression(styleAttr.value.expression);
          if (parsed) node.style = { ...(node.style || {}), ...parsed };
        }

        if (node.type === 'text' || node.type === 'button') {
          const text = readJsxText(path.node);
          if (text != null) node.text = text;
        }

        if (node.type === 'image' && t.isJSXIdentifier(opening.name, { name: 'img' })) {
          const srcAttr = opening.attributes.find(
            (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'src' })
          );
          if (srcAttr && t.isStringLiteral(srcAttr.value)) node.src = srcAttr.value;
        }
      }
    });

    return updated;
  } catch (err) {
    console.warn('[astSync] parse failed:', err.message);
    return null;
  }
}

function patchTSXWithAST(code, nodesMap) {
  if (!code?.trim() || !nodesMap) return null;

  try {
    const ast = recast.parse(code, { parser: babelParser });

    traverse(ast, {
      JSXElement(path) {
        const opening = path.node.openingElement;
        const id = getJsxId(opening);
        if (!id || !nodesMap[id]) return;

        const node = nodesMap[id];
        if (node.type === 'component-instance') return;

        if (node.style && Object.keys(node.style).length) {
          upsertStyleAttribute(opening, node.style);
        }

        if (node.type === 'text' || node.type === 'button') {
          setJsxText(path.node, node.text || '');
        }

        if (node.type === 'image' && node.src) {
          upsertStringAttribute(opening, 'src', node.src);
        }
      }
    });

    return recast.print(ast).code;
  } catch (err) {
    console.warn('[astSync] patch failed:', err.message);
    return null;
  }
}

module.exports = {
  parseTSXWithAST,
  patchTSXWithAST,
  getJsxId
};
