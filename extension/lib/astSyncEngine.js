// GENERATED from src/utils/astSyncEngine.js by scripts/sync-extension-libs.mjs — do not edit.
// Run `npm run sync:extension` after changing the source.
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

const INLINE_TEXT_TAGS = new Set(['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'label', 'strong', 'em', 'small', 'b', 'i']);

function jsxTagName(openingElement) {
  return t.isJSXIdentifier(openingElement.name) ? openingElement.name.name : null;
}

/** Guess a canvas node type for an element that exists in code but not on the canvas yet. */
function inferNodeType(tag, jsxElement) {
  if (tag === 'button') return 'button';
  if (tag === 'img') return 'image';
  if (tag === 'hr') return 'line';
  if (tag === 'li') return readJsxText(jsxElement) != null ? 'list-item' : 'frame';
  if (tag === 'ul' || tag === 'ol') return 'list';
  if (tag === 'svg') return 'vector';
  if (INLINE_TEXT_TAGS.has(tag)) {
    const kids = (jsxElement.children || []).filter((c) => !(t.isJSXText(c) && !c.value.trim()));
    if (kids.length && readJsxText(jsxElement) != null) return 'text';
  }
  return 'frame';
}

function nodeNameFromId(id, tag) {
  const words = String(id).replace(/[-_]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : tag;
}

/** Apply an element's style / text / src from code onto a canvas node. */
function readElementInto(node, jsxElement) {
  const opening = jsxElement.openingElement;
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

  const classIdx = findAttribute(opening, 'className');
  if (classIdx < 0) delete node.className;
  else if (t.isStringLiteral(opening.attributes[classIdx].value)) node.className = opening.attributes[classIdx].value.value;

  if (TEXT_NODE_TYPES.has(node.type)) {
    const text = readJsxText(jsxElement);
    if (text != null) node.text = text;
  }

  if (node.type === 'image' && t.isJSXIdentifier(opening.name, { name: 'img' })) {
    const src = readStringAttribute(opening, 'src');
    if (src != null) node.src = src;
  }
}

const NON_CONTAINER_TYPES = new Set(['text', 'button', 'list-item', 'image', 'line', 'shape', 'vector', 'comment', 'component-instance']);

/**
 * Parse TSX → nodes map (AST). Returns null on failure.
 *
 * With `options.structural` (and `options.rootId`), the element tree in the code
 * is authoritative too: elements with a new `id` become canvas layers, elements
 * removed from the code are removed from the canvas, and child order follows the
 * code. Elements without an `id` are transparent (their id'd children attach to
 * the nearest id'd ancestor). `options.resolveComponent(name)` maps a
 * `<PricingCard />` inside a wrapper to a component file id.
 */
function parseTSXWithAST(code, nodesMap, options = {}) {
  if (!code?.trim() || !nodesMap) return null;
  const { structural = false, rootId = null, resolveComponent = null } = options;

  const updated = JSON.parse(JSON.stringify(nodesMap));

  try {
    const ast = recast.parse(code, { parser: babelParser });
    const seen = new Set();
    const childrenOf = new Map(); // parent id → ordered child ids as written in code

    traverse(ast, {
      JSXElement(path) {
        const opening = path.node.openingElement;
        const id = getJsxId(opening);
        if (!id || seen.has(id)) return;

        if (!structural) {
          if (updated[id]) readElementInto(updated[id], path.node);
          return;
        }

        seen.add(id);
        const tag = jsxTagName(opening);

        // nearest ancestor element that carries an id
        const parentPath = path.findParent((p) => p.isJSXElement() && getJsxId(p.node.openingElement));
        const parentId = parentPath ? getJsxId(parentPath.node.openingElement) : null;
        if (parentId) {
          if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
          childrenOf.get(parentId).push(id);
        }

        const isNew = !updated[id];
        if (isNew) {
          // New element typed in code → new canvas layer.
          const componentChild = resolveComponent
            ? (path.node.children || []).find(
                (c) => t.isJSXElement(c) && t.isJSXIdentifier(c.openingElement.name) && resolveComponent(c.openingElement.name.name)
              )
            : null;
          if (componentChild) {
            const compName = componentChild.openingElement.name.name;
            updated[id] = { id, type: 'component-instance', name: compName, refFile: resolveComponent(compName), tag: 'div', style: {} };
          } else {
            const type = inferNodeType(tag, path.node);
            updated[id] = { id, type, name: nodeNameFromId(id, tag), tag: tag || 'div', style: {} };
            if (TEXT_NODE_TYPES.has(type)) updated[id].text = '';
            if (!NON_CONTAINER_TYPES.has(type)) updated[id].children = [];
          }
        }

        if (!isNew && tag && /^[a-z]/.test(tag) && updated[id].type !== 'component-instance' && updated[id].tag !== tag) {
          const node = updated[id];
          const swappable = (node.type === 'text' && INLINE_TEXT_TAGS.has(tag)) || (node.type === 'frame' && !['img', 'hr', 'svg', 'button'].includes(tag));
          if (swappable) node.tag = tag; // <h3> → <h2> in code
        }

        // Content the canvas can't evaluate ({title}, <Icon />, items.map(...)):
        // remember its source so the layer shows a readable stand-in instead of nothing.
        if (updated[id].type !== 'component-instance') {
          const opaque = (path.node.children || []).filter(
            (c) => !(t.isJSXText(c)) && !(t.isJSXExpressionContainer(c) && t.isJSXEmptyExpression(c.expression)) &&
              !(t.isJSXElement(c) && getJsxId(c.openingElement))
          );
          const hasIdDescendant = (path.node.children || []).some((c) => t.isJSXElement(c) && getJsxId(c.openingElement));
          if (opaque.length && !hasIdDescendant && readJsxText(path.node) == null && Number.isFinite(opaque[0].start)) {
            const src = code.slice(opaque[0].start, opaque[opaque.length - 1].end).replace(/\s+/g, ' ').trim();
            updated[id].placeholder = src.length > 48 ? `${src.slice(0, 47)}…` : src;
          } else {
            delete updated[id].placeholder;
          }
        }

        readElementInto(updated[id], path.node);
      }
    });

    if (structural && rootId && seen.has(rootId)) {
      // Child order and membership follow the code.
      Object.keys(updated).forEach((id) => {
        const node = updated[id];
        if (!seen.has(id) || NON_CONTAINER_TYPES.has(node.type)) return;
        const fromCode = childrenOf.get(id) || [];
        // Comment pins have no element in code; keep them where they were.
        const pins = (node.children || []).filter((cid) => updated[cid]?.type === 'comment');
        node.children = [...fromCode, ...pins];
      });

      // Drop layers whose element was deleted from the code.
      const reachable = new Set();
      const walk = (id) => {
        if (reachable.has(id) || !updated[id]) return;
        reachable.add(id);
        (updated[id].children || []).forEach(walk);
      };
      walk(rootId);
      Object.keys(updated).forEach((id) => {
        if (!reachable.has(id)) delete updated[id];
      });
    }

    return updated;
  } catch (err) {
    console.warn('[astSync] parse failed:', err.message);
    return null;
  }
}

function collectJsxIds(ast) {
  const ids = [];
  const paths = new Map();
  traverse(ast, {
    JSXElement(path) {
      const id = getJsxId(path.node.openingElement);
      if (!id) return;
      ids.push(id);
      if (!paths.has(id)) paths.set(id, path);
    }
  });
  return { ids, paths };
}

function sameOrder(a, b) {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

/** Parse a JSX snippet (one element) into an AST node. */
function parseJsxSnippet(source) {
  const file = parse(`<>${source}</>`, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  const fragment = file.program.body[0]?.expression;
  return (fragment?.children || []).find((c) => t.isJSXElement(c)) || null;
}

function elementIndent(path) {
  const col = path.node.loc?.start?.column;
  return ' '.repeat(Number.isFinite(col) ? col : 4);
}

function openElement(jsxElement) {
  if (!jsxElement.openingElement.selfClosing) return;
  jsxElement.openingElement.selfClosing = false;
  jsxElement.closingElement = t.jsxClosingElement(jsxElement.openingElement.name);
}

/** Remove a JSX child together with the whitespace line that preceded it. */
function removeJsxChild(path) {
  const parent = path.parentPath?.node;
  const list = parent && Array.isArray(parent.children) ? parent.children : null;
  if (!list) return false;
  const idx = list.indexOf(path.node);
  if (idx < 0) return false;
  const prev = list[idx - 1];
  if (prev && t.isJSXText(prev) && !prev.value.trim()) list.splice(idx - 1, 2);
  else list.splice(idx, 1);
  return true;
}

/**
 * Make the element tree in `ast` match the canvas tree: delete elements whose
 * layer was removed, insert JSX for new layers, and reorder siblings — touching
 * only the affected parents so the rest of the author's file is untouched.
 */
function applyStructure(ast, nodesMap, expectedIds, renderNode) {
  const expected = new Set(expectedIds);
  const parentOf = new Map();
  Object.values(nodesMap).forEach((node) => {
    if (!node || NON_CONTAINER_TYPES.has(node.type)) return;
    (node.children || []).forEach((cid) => { if (!parentOf.has(cid)) parentOf.set(cid, node.id); });
  });

  // 1. removals (outermost only — descendants go with their ancestor)
  let { ids, paths } = collectJsxIds(ast);
  const doomed = ids.filter((id) => !expected.has(id));
  doomed.forEach((id) => {
    const path = paths.get(id);
    const ancestor = path.findParent((p) => p.isJSXElement() && doomed.includes(getJsxId(p.node.openingElement)));
    if (!ancestor) removeJsxChild(path);
  });

  // 2. insertions, in document order so earlier siblings exist first
  ({ ids, paths } = collectJsxIds(ast));
  let present = new Set(ids);
  for (const id of expectedIds) {
    if (present.has(id)) continue;
    const parentId = parentOf.get(id);
    if (!parentId || !present.has(parentId)) continue; // arrives inside its parent's snippet, or can't be placed
    const parentPath = paths.get(parentId);
    const indent = `${elementIndent(parentPath)}  `;
    const element = parseJsxSnippet(renderNode(id, indent));
    if (!element) return false;

    openElement(parentPath.node);
    const list = parentPath.node.children;
    const siblings = nodesMap[parentId].children || [];
    // insert after the nearest earlier sibling that already exists in the code
    let at = -1;
    for (let i = siblings.indexOf(id) - 1; i >= 0 && at < 0; i -= 1) {
      const sibPath = paths.get(siblings[i]);
      if (sibPath) at = list.indexOf(sibPath.node);
    }
    const isWs = (c) => t.isJSXText(c) && !c.value.trim();
    const closeIndent = `\n${elementIndent(parentPath)}`;
    if (at >= 0) {
      list.splice(at + 1, 0, t.jsxText(`\n${indent}`), element);
    } else if (!list.some((c) => !isWs(c))) {
      // empty container → becomes a block with the new child on its own line
      list.splice(0, list.length, t.jsxText(`\n${indent}`), element, t.jsxText(closeIndent));
    } else if (siblings.indexOf(id) === 0) {
      // first child: before everything else
      list.unshift(t.jsxText(`\n${indent}`), element);
    } else if (isWs(list[list.length - 1])) {
      // last child: before the closing tag's indentation
      list.splice(list.length - 1, 0, t.jsxText(`\n${indent}`), element);
    } else {
      list.push(t.jsxText(`\n${indent}`), element, t.jsxText(closeIndent));
    }
    ({ ids, paths } = collectJsxIds(ast));
    present = new Set(ids);
  }

  // 3. sibling order
  Object.values(nodesMap).forEach((node) => {
    if (!node || NON_CONTAINER_TYPES.has(node.type) || !paths.has(node.id)) return;
    const list = paths.get(node.id).node.children || [];
    const slots = [];
    list.forEach((child, i) => {
      if (t.isJSXElement(child) && expected.has(getJsxId(child.openingElement))) slots.push(i);
    });
    if (slots.length < 2) return;
    const current = slots.map((i) => getJsxId(list[i].openingElement));
    const wanted = (node.children || []).filter((cid) => current.includes(cid));
    if (wanted.length !== current.length || sameOrder(current, wanted)) return;
    const byId = new Map(slots.map((i) => [getJsxId(list[i].openingElement), list[i]]));
    slots.forEach((slot, k) => { list[slot] = byId.get(wanted[k]); });
  });

  return true;
}

function patchClassName(openingElement, node) {
  // Nodes that never tracked a className (e.g. built without reading the code)
  // must not strip the author's classes.
  if (!Object.prototype.hasOwnProperty.call(node, 'className')) return;
  const idx = findAttribute(openingElement, 'className');
  const current = idx >= 0 ? openingElement.attributes[idx].value : null;
  // Leave dynamic classNames (clsx(...), template strings with expressions) to the author.
  if (current && !t.isStringLiteral(current)) return;
  const wanted = typeof node.className === 'string' ? node.className.trim() : '';
  if (!wanted) {
    if (idx >= 0) openingElement.attributes.splice(idx, 1);
    return;
  }
  upsertStringAttribute(openingElement, 'className', wanted);
}

/**
 * Patch existing TSX from nodes while preserving formatting/comments.
 *
 * `expectedIds` (optional) is the id order the node tree would render. When the
 * code's element structure differs and `options.renderNode(id, indent)` is given,
 * elements are inserted / removed / reordered in place. If the structure still
 * doesn't match afterwards (e.g. the code belongs to another file) we return
 * null so the caller regenerates instead of leaving the code out of sync.
 */
function patchTSXWithAST(code, nodesMap, expectedIds = null, options = {}) {
  if (!code?.trim() || !nodesMap) return null;
  const { renderNode = null } = options;

  try {
    const ast = recast.parse(code, { parser: babelParser });

    if (expectedIds) {
      let { ids } = collectJsxIds(ast);
      if (!sameOrder(ids, expectedIds)) {
        // Only restructure code that is recognisably this component.
        const overlap = ids.filter((id) => expectedIds.includes(id)).length;
        const sameRoot = ids[0] === expectedIds[0];
        if (!renderNode || !sameRoot || overlap === 0) return null;
        if (!applyStructure(ast, nodesMap, expectedIds, renderNode)) return null;
        ({ ids } = collectJsxIds(ast));
        if (!sameOrder(ids, expectedIds)) return null;
      }
    }

    traverse(ast, {
      JSXElement(path) {
        const opening = path.node.openingElement;
        const id = getJsxId(opening);
        if (!id || !nodesMap[id]) return;

        const node = nodesMap[id];
        upsertStyleAttribute(opening, node.style || {});
        if (node.type === 'component-instance') return;

        patchClassName(opening, node);

        if (TEXT_NODE_TYPES.has(node.type)) {
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

const SKIP_ID_TAGS = new Set(['br', 'wbr', 'script', 'style', 'meta', 'link', 'title', 'head', 'html', 'body', 'option', 'source', 'track']);

/**
 * Prepare a file for the canvas: give every plain HTML element an `id` so it can
 * be selected and edited. Existing ids, component elements, anything inside an
 * <svg>, and elements with spread props are left alone.
 * Returns { code, rootId, componentName, added } or null if the file can't be parsed / has no JSX.
 */
function prepareTSXForCanvas(code) {
  if (!code?.trim()) return null;
  try {
    const ast = recast.parse(code, { parser: babelParser });
    const used = new Set();
    traverse(ast, {
      JSXOpeningElement(path) {
        const id = getJsxId(path.node);
        if (id) used.add(id);
      }
    });

    let added = 0;
    const counters = {};
    traverse(ast, {
      JSXOpeningElement(path) {
        const opening = path.node;
        const tag = jsxTagName(opening);
        if (!tag || !/^[a-z]/.test(tag) || SKIP_ID_TAGS.has(tag)) return;
        if (findAttribute(opening, 'id') >= 0) return;
        if (opening.attributes.some((a) => t.isJSXSpreadAttribute(a))) return;
        // (start above this element so the <svg> itself still gets an id)
        const inSvg = path.parentPath.findParent((p) => p.isJSXElement() && jsxTagName(p.node.openingElement) === 'svg');
        if (inSvg) return;
        let id;
        do {
          counters[tag] = (counters[tag] || 0) + 1;
          id = `${tag}-${counters[tag]}`;
        } while (used.has(id));
        used.add(id);
        opening.attributes.unshift(t.jsxAttribute(t.jsxIdentifier('id'), t.stringLiteral(id)));
        added += 1;
      }
    });

    const out = added ? recast.print(ast).code : code;
    const { ids } = collectJsxIds(added ? recast.parse(out, { parser: babelParser }) : ast);
    if (!ids.length) return null;

    let componentName = null;
    traverse(ast, {
      ExportNamedDeclaration(path) {
        const decl = path.node.declaration;
        if (componentName) return;
        if (t.isFunctionDeclaration(decl) && decl.id) componentName = decl.id.name;
        else if (t.isVariableDeclaration(decl) && t.isIdentifier(decl.declarations[0]?.id)) componentName = decl.declarations[0].id.name;
      },
      ExportDefaultDeclaration(path) {
        const decl = path.node.declaration;
        if (componentName) return;
        if ((t.isFunctionDeclaration(decl) || t.isClassDeclaration(decl)) && decl.id) componentName = decl.id.name;
        else if (t.isIdentifier(decl)) componentName = decl.name;
      }
    });

    return { code: out, rootId: ids[0], componentName, added };
  } catch (err) {
    console.warn('[astSync] prepare failed:', err.message);
    return null;
  }
}

module.exports = {
  jsxTextNeedsExpression,
  parseTSXWithAST,
  patchTSXWithAST,
  prepareTSXForCanvas,
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
};
