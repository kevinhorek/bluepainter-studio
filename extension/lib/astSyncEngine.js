// CommonJS port of src/utils/astSyncEngine.js — keep the two in sync.
const recast = require('recast');
const { parse } = require('@babel/parser');
const traverseModule = require('@babel/traverse');
const t = require('@babel/types');

const traverse = traverseModule.default || traverseModule;

const babelParser = {
  parse(source) {
    // Recast requires tokens on the AST; without them it throws
    // "Invalid regular expression: missing /" on ordinary JSX.
    return parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      tokens: true
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
  if (typeof val === 'number' && Number.isFinite(val)) {
    // Babel 8 rejects negative NumericLiterals — emit `-n` as a unary expression.
    return val < 0 ? t.unaryExpression('-', t.numericLiteral(-val)) : t.numericLiteral(val);
  }
  return t.stringLiteral(String(val ?? ''));
}

/** Read a static style value. Returns undefined for anything dynamic. */
function readLiteral(valueNode) {
  if (t.isNumericLiteral(valueNode) || t.isStringLiteral(valueNode)) return valueNode.value;
  if (
    t.isUnaryExpression(valueNode, { operator: '-' }) &&
    t.isNumericLiteral(valueNode.argument)
  ) {
    return -valueNode.argument.value;
  }
  if (t.isTemplateLiteral(valueNode) && valueNode.expressions.length === 0) {
    return valueNode.quasis[0]?.value?.cooked ?? '';
  }
  return undefined;
}

function propKey(prop) {
  if (!t.isObjectProperty(prop) || prop.computed) return null;
  if (t.isIdentifier(prop.key)) return prop.key.name;
  if (t.isStringLiteral(prop.key)) return prop.key.value;
  return null;
}

/**
 * Read a style object literal.
 * `values` holds static props; `dynamicKeys` are props whose value is an
 * expression we can't represent on the canvas; `opaque` is true when the
 * object contains spreads/computed keys, so absent keys can't be treated as deleted.
 */
function readObjectExpression(expr) {
  if (!t.isObjectExpression(expr)) return null;
  const values = {};
  const dynamicKeys = [];
  let opaque = false;
  for (const prop of expr.properties) {
    const key = propKey(prop);
    if (key == null) {
      opaque = true;
      continue;
    }
    const val = readLiteral(prop.value);
    if (val === undefined) dynamicKeys.push(key);
    else values[key] = val;
  }
  return { values, dynamicKeys, opaque };
}

function isStyleValuePresent(v) {
  return v !== undefined && v !== null && v !== '';
}

function findAttribute(openingElement, name) {
  return openingElement.attributes.findIndex(
    (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name })
  );
}

/**
 * Sync the style attribute to `styleObj`, touching only what changed so recast
 * can keep the author's formatting. Dynamic props and spreads are left alone.
 */
function upsertStyleAttribute(openingElement, styleObj) {
  const wanted = Object.entries(styleObj || {}).filter(([, v]) => isStyleValuePresent(v));
  const idx = findAttribute(openingElement, 'style');
  const existing = idx >= 0 ? openingElement.attributes[idx] : null;
  const objExpr =
    existing && t.isJSXExpressionContainer(existing.value) && t.isObjectExpression(existing.value.expression)
      ? existing.value.expression
      : null;

  if (!objExpr) {
    if (existing && !wanted.length) return;
    // A non-literal style (e.g. style={styles.card}) is the author's — don't clobber it.
    if (existing && t.isJSXExpressionContainer(existing.value)) return;
    if (!wanted.length) return;
    const attr = t.jsxAttribute(
      t.jsxIdentifier('style'),
      t.jsxExpressionContainer(
        t.objectExpression(
          wanted.map(([key, val]) => t.objectProperty(t.identifier(key), literalForValue(val)))
        )
      )
    );
    if (idx >= 0) openingElement.attributes[idx] = attr;
    else openingElement.attributes.push(attr);
    return;
  }

  const wantedMap = new Map(wanted);
  const seen = new Set();
  const nextProps = [];
  for (const prop of objExpr.properties) {
    const key = propKey(prop);
    if (key == null) {
      nextProps.push(prop);
      continue;
    }
    const current = readLiteral(prop.value);
    if (current === undefined) {
      // Dynamic value: keep the author's expression.
      seen.add(key);
      nextProps.push(prop);
      continue;
    }
    if (!wantedMap.has(key) || seen.has(key)) continue; // removed on canvas (or duplicate)
    seen.add(key);
    if (current !== wantedMap.get(key)) prop.value = literalForValue(wantedMap.get(key));
    nextProps.push(prop);
  }
  for (const [key, val] of wanted) {
    if (seen.has(key)) continue;
    const validIdent = /^[A-Za-z_$][\w$]*$/.test(key);
    nextProps.push(
      t.objectProperty(validIdent ? t.identifier(key) : t.stringLiteral(key), literalForValue(val))
    );
  }
  const changed =
    nextProps.length !== objExpr.properties.length ||
    nextProps.some((p, i) => p !== objExpr.properties[i]);
  if (changed) objExpr.properties = nextProps;
}

function upsertStringAttribute(openingElement, name, value) {
  const idx = findAttribute(openingElement, name);
  const next = String(value ?? '');
  if (idx >= 0) {
    const current = openingElement.attributes[idx].value;
    if (t.isStringLiteral(current) && current.value === next) return;
    if (t.isJSXExpressionContainer(current) && !t.isStringLiteral(current.expression)) return;
  }
  const attr = t.jsxAttribute(t.jsxIdentifier(name), t.stringLiteral(next));
  if (idx >= 0) openingElement.attributes[idx] = attr;
  else openingElement.attributes.push(attr);
}

function readStringAttribute(openingElement, name) {
  const idx = findAttribute(openingElement, name);
  if (idx < 0) return null;
  const value = openingElement.attributes[idx].value;
  if (t.isStringLiteral(value)) return value.value;
  if (t.isJSXExpressionContainer(value) && t.isStringLiteral(value.expression)) {
    return value.expression.value;
  }
  return null;
}

/** Collapse JSX text whitespace the way React does (roughly): trim + single spaces. */
function normalizeJsxText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function readJsxText(jsxElement) {
  const children = jsxElement.children || [];
  // Elements with nested markup aren't plain-text nodes; leave them alone.
  if (children.some((c) => t.isJSXElement(c) || t.isJSXFragment(c))) return null;
  let out = '';
  let sawText = false;
  for (const child of children) {
    if (t.isJSXText(child)) {
      out += child.value;
      sawText = true;
    } else if (t.isJSXExpressionContainer(child)) {
      if (t.isJSXEmptyExpression(child.expression)) continue;
      const val = readLiteral(child.expression);
      if (val === undefined) return null; // dynamic text, e.g. {price}
      out += String(val);
      sawText = true;
    }
  }
  if (!sawText) return children.length === 0 ? '' : null;
  return normalizeJsxText(out);
}

/** Characters that can't appear raw in JSX text. */
const JSX_UNSAFE_TEXT = /[{}<>&]/;

function jsxTextNeedsExpression(text) {
  return JSX_UNSAFE_TEXT.test(String(text ?? ''));
}

function setJsxText(jsxElement, text) {
  const next = String(text ?? '');
  const current = readJsxText(jsxElement);
  if (current === null && (jsxElement.children || []).length) {
    // Dynamic or nested content — the canvas can't own this text.
    return;
  }
  if (current === normalizeJsxText(next)) return;
  if (jsxElement.openingElement.selfClosing) {
    jsxElement.openingElement.selfClosing = false;
    jsxElement.closingElement = t.jsxClosingElement(jsxElement.openingElement.name);
  }
  // Keep the author's line breaks/indentation around multi-line text:
  //   <button>\n  Submit\n</button>  stays multi-line after a rename.
  const kids = jsxElement.children || [];
  const only = kids.length === 1 && t.isJSXText(kids[0]) ? kids[0].value : '';
  const lead = /^\s*\n\s*/.exec(only)?.[0] ?? '';
  const trail = /\s*\n\s*$/.exec(only)?.[0] ?? '';
  if (jsxTextNeedsExpression(next)) {
    jsxElement.children = lead || trail
      ? [t.jsxText(lead), t.jsxExpressionContainer(t.stringLiteral(next)), t.jsxText(trail)]
      : [t.jsxExpressionContainer(t.stringLiteral(next))];
  } else if (only) {
    // Mutate the existing text node in place so recast doesn't re-indent the element.
    kids[0].value = `${lead}${next}${trail}`;
    if (kids[0].extra) kids[0].extra = { ...kids[0].extra, raw: kids[0].value, rawValue: kids[0].value };
  } else {
    jsxElement.children = [t.jsxText(next)];
  }
}

const TEXT_NODE_TYPES = new Set(['text', 'button', 'list-item']);

/** Parse TSX → nodes map (AST). Returns null on failure. */
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

        const styleIdx = findAttribute(opening, 'style');
        if (styleIdx < 0) {
          // style attribute deleted in code → clear it on the canvas too
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
              // Code is the source of truth: keys removed in code are removed here.
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
    console.warn('[astSync] parse failed:', err.message);
    return null;
  }
}

/**
 * Patch existing TSX from nodes while preserving formatting/comments.
 *
 * `expectedIds` (optional) is the id order the node tree would render. When the
 * code's element structure differs (a layer was added/removed/reordered on the
 * canvas, or this code belongs to another file) we return null so the caller
 * regenerates instead of silently leaving the code out of sync.
 */
function patchTSXWithAST(code, nodesMap, expectedIds = null) {
  if (!code?.trim() || !nodesMap) return null;

  try {
    const ast = recast.parse(code, { parser: babelParser });
    const foundIds = [];

    traverse(ast, {
      JSXElement(path) {
        const opening = path.node.openingElement;
        const id = getJsxId(opening);
        if (!id) return;
        foundIds.push(id);
        if (!nodesMap[id]) return;

        const node = nodesMap[id];
        if (node.type === 'component-instance') {
          upsertStyleAttribute(opening, node.style || {});
          return;
        }

        upsertStyleAttribute(opening, node.style || {});

        if (TEXT_NODE_TYPES.has(node.type)) {
          setJsxText(path.node, node.text || '');
        }

        if (node.type === 'image' && node.src) {
          upsertStringAttribute(opening, 'src', node.src);
        }
      }
    });

    if (expectedIds) {
      const same =
        expectedIds.length === foundIds.length &&
        expectedIds.every((id, i) => id === foundIds[i]);
      if (!same) return null;
    }

    return recast.print(ast).code;
  } catch (err) {
    console.warn('[astSync] patch failed:', err.message);
    return null;
  }
}

module.exports = {
  parseTSXWithAST,
  patchTSXWithAST,
  getJsxId,
  // shared with babelPatch.js / bootstrap.js
  babelParser,
  TEXT_NODE_TYPES,
  findAttribute,
  readObjectExpression,
  readStringAttribute,
  readJsxText,
  setJsxText,
  jsxTextNeedsExpression,
  upsertStyleAttribute,
  upsertStringAttribute
};
