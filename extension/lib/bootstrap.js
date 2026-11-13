const { parse } = require('@babel/parser');
const traverseModule = require('@babel/traverse');
const t = require('@babel/types');
const pricingNodes = require('../data/pricingNodes.json');
const heroNodes = require('../data/heroNodes.json');
const {
  getJsxId,
  TEXT_NODE_TYPES,
  findAttribute,
  readObjectExpression,
  readStringAttribute,
  readJsxText
} = require('./astSyncEngine');
const { parseTSX } = require('./syncEngine');

const traverse = traverseModule.default || traverseModule;

const FILE_TEMPLATES = [
  { match: /pricing/i, rootId: 'pricing-card-frame', nodes: pricingNodes },
  { match: /hero/i, rootId: 'hero-frame', nodes: heroNodes }
];

/** Id of the wrapper node created when a component returns several id'd roots. */
const SYNTHETIC_ROOT_ID = '__bp_root__';

function parseSource(code) {
  try {
    return parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch {
    return null;
  }
}

function inferNodeType(tagName) {
  if (tagName === 'button') return 'button';
  if (tagName === 'img') return 'image';
  if (tagName === 'li') return 'list-item';
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label', 'a'].includes(tagName)) return 'text';
  return 'frame';
}

/** Static style props only; dynamic props and spreads stay in the file untouched. */
function readStyleFromOpening(opening) {
  const idx = findAttribute(opening, 'style');
  if (idx < 0) return {};
  const value = opening.attributes[idx].value;
  if (!t.isJSXExpressionContainer(value)) return {};
  const parsed = readObjectExpression(value.expression);
  return parsed ? parsed.values : {};
}

function getTagName(opening) {
  if (t.isJSXIdentifier(opening.name)) return opening.name.name;
  return 'div';
}

function walkJsxChildren(parent, nodesMap, childIds) {
  for (const child of parent.children || []) {
    if (t.isJSXElement(child) || t.isJSXFragment(child)) walkJsx(child, nodesMap, childIds);
  }
}

function walkJsx(jsxNode, nodesMap, childIds) {
  if (t.isJSXFragment(jsxNode)) {
    walkJsxChildren(jsxNode, nodesMap, childIds);
    return;
  }

  const opening = jsxNode.openingElement;
  const id = getJsxId(opening);
  if (!id) {
    walkJsxChildren(jsxNode, nodesMap, childIds);
    return;
  }

  const tag = getTagName(opening);
  const type = inferNodeType(tag);
  const node = {
    id,
    type,
    name: id,
    tag,
    style: readStyleFromOpening(opening),
    children: []
  };

  if (TEXT_NODE_TYPES.has(type)) {
    // null = dynamic or nested content; the patcher leaves such text alone.
    node.text = readJsxText(jsxNode) ?? '';
  }

  if (type === 'image') {
    const src = readStringAttribute(opening, 'src');
    if (src != null) node.src = src;
  }

  const nestedChildIds = [];
  walkJsxChildren(jsxNode, nodesMap, nestedChildIds);
  node.children = nestedChildIds;
  nodesMap[id] = node;
  childIds.push(id);
}

function unwrapJsx(expr) {
  let node = expr;
  while (
    node &&
    (t.isParenthesizedExpression(node) || t.isTSAsExpression(node) || t.isTSNonNullExpression(node))
  ) {
    node = node.expression;
  }
  return t.isJSXElement(node) || t.isJSXFragment(node) ? node : null;
}

/** JSX returned by this function itself — not by callbacks nested inside it. */
function ownJsxReturn(fnPath) {
  const body = fnPath.node.body;
  if (!t.isBlockStatement(body)) return unwrapJsx(body); // arrow with implicit return

  let found = null;
  fnPath.traverse({
    Function(inner) {
      inner.skip();
    },
    ReturnStatement(ret) {
      const jsx = unwrapJsx(ret.node.argument);
      if (jsx) found = jsx; // keep the last one: early returns are usually guards
    }
  });
  return found;
}

function findComponentReturnRoot(ast) {
  let rootElement = null;

  traverse(ast, {
    Function(path) {
      // Pre-order: the outermost function that returns JSX is the component.
      const jsx = ownJsxReturn(path);
      if (jsx) {
        rootElement = jsx;
        path.stop();
      }
    }
  });

  return rootElement;
}

/** Build a nodes map from the JSX a component returns. Returns null if the code doesn't parse or has no ids. */
function buildNodesFromCode(code) {
  const ast = parseSource(code);
  if (!ast) return null;

  let rootElement;
  try {
    rootElement = findComponentReturnRoot(ast);
  } catch {
    return null;
  }
  if (!rootElement) return null;

  const nodesMap = {};
  const rootIds = [];
  walkJsx(rootElement, nodesMap, rootIds);
  if (!rootIds.length) return null;

  if (rootIds.length === 1) return { rootNodeId: rootIds[0], nodesMap };

  // Fragment (or id-less wrapper) with several id'd children: group them so the
  // canvas shows all of them. This node has no element in the file and is never written.
  nodesMap[SYNTHETIC_ROOT_ID] = {
    id: SYNTHETIC_ROOT_ID,
    type: 'frame',
    name: 'Root',
    tag: 'div',
    style: {},
    children: rootIds,
    synthetic: true
  };
  return { rootNodeId: SYNTHETIC_ROOT_ID, nodesMap };
}

/** Ids of every JSX element in the file, or null if it doesn't parse. */
function collectFileIds(code) {
  const ast = parseSource(code);
  if (!ast) return null;
  const ids = new Set();
  try {
    traverse(ast, {
      JSXOpeningElement(path) {
        const id = getJsxId(path.node);
        if (id) ids.add(id);
      }
    });
  } catch {
    return null;
  }
  return ids;
}

function matchFileTemplate(fileName, fileIds = null) {
  const base = (fileName || '').split(/[/\\]/).pop() || '';
  for (const tpl of FILE_TEMPLATES) {
    if (!tpl.match.test(base)) continue;
    // A matching file name isn't enough: the file must contain the template's root,
    // and no ids the template doesn't know (those would never reach the canvas).
    if (fileIds && !fileIds.has(tpl.rootId)) continue;
    if (fileIds && [...fileIds].some((id) => !tpl.nodes[id])) continue;
    return { rootNodeId: tpl.rootId, nodesMap: JSON.parse(JSON.stringify(tpl.nodes)) };
  }
  return null;
}

function savedStateMatchesFile(savedState, fileIds) {
  const savedIds = Object.keys(savedState.nodesMap).filter((id) => !savedState.nodesMap[id]?.synthetic);
  return savedIds.length === fileIds.size && savedIds.every((id) => fileIds.has(id));
}

function bootstrapFromFile(code, fileName, savedState) {
  const hasSaved = Boolean(savedState?.nodesMap && Object.keys(savedState.nodesMap).length);
  const fileIds = collectFileIds(code);

  if (!fileIds) {
    // Syntax error (e.g. mid-typing): keep what we had rather than blanking the canvas.
    if (hasSaved) {
      const nodesMap = JSON.parse(JSON.stringify(savedState.nodesMap));
      return {
        rootNodeId: savedState.rootNodeId || Object.keys(nodesMap)[0],
        nodesMap,
        source: 'saved',
        parseError: true
      };
    }
    return { rootNodeId: null, nodesMap: {}, source: 'empty', parseError: true };
  }

  // Saved state is only valid while it describes the same elements as the file.
  if (hasSaved && savedStateMatchesFile(savedState, fileIds)) {
    const nodesMap = parseTSX(code, JSON.parse(JSON.stringify(savedState.nodesMap)));
    const rootNodeId = nodesMap[savedState.rootNodeId] ? savedState.rootNodeId : Object.keys(nodesMap)[0];
    return { rootNodeId, nodesMap, source: 'saved' };
  }

  const template = matchFileTemplate(fileName, fileIds);
  if (template) {
    const nodesMap = parseTSX(code, template.nodesMap);
    return { rootNodeId: template.rootNodeId, nodesMap, source: 'template' };
  }

  const built = buildNodesFromCode(code);
  if (built) return { ...built, source: 'ast' };

  return { rootNodeId: null, nodesMap: {}, source: 'empty' };
}

function mergeNodeUpdate(nodesMap, nodeId, patch) {
  const next = JSON.parse(JSON.stringify(nodesMap));
  const node = next[nodeId];
  if (!node) return next;
  if (patch.text !== undefined) node.text = patch.text;
  if (patch.style) node.style = { ...(node.style || {}), ...patch.style };
  if (patch.children) node.children = patch.children;
  return next;
}

module.exports = {
  bootstrapFromFile,
  mergeNodeUpdate,
  buildNodesFromCode,
  matchFileTemplate,
  collectFileIds,
  SYNTHETIC_ROOT_ID
};
