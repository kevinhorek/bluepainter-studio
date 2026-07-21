const { parse } = require('@babel/parser');
const traverseModule = require('@babel/traverse');
const t = require('@babel/types');
const pricingNodes = require('../data/pricingNodes.json');
const heroNodes = require('../data/heroNodes.json');
const { getJsxId } = require('./astSyncEngine');
const { parseTSX } = require('./syncEngine');

const traverse = traverseModule.default || traverseModule;

const FILE_TEMPLATES = [
  { match: /pricing/i, rootId: 'pricing-card-frame', nodes: pricingNodes },
  { match: /hero/i, rootId: 'hero-frame', nodes: heroNodes }
];

function inferNodeType(tagName) {
  if (tagName === 'button') return 'button';
  if (tagName === 'img') return 'image';
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label', 'a'].includes(tagName)) return 'text';
  return 'frame';
}

function readStyleFromOpening(opening) {
  const styleAttr = opening.attributes.find(
    (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'style' })
  );
  if (!styleAttr || !t.isJSXExpressionContainer(styleAttr.value) || !t.isObjectExpression(styleAttr.value.expression)) {
    return {};
  }
  const style = {};
  for (const prop of styleAttr.value.expression.properties) {
    if (!t.isObjectProperty(prop)) continue;
    let key;
    if (t.isIdentifier(prop.key)) key = prop.key.name;
    else if (t.isStringLiteral(prop.key)) key = prop.key.value;
    else continue;
    if (t.isNumericLiteral(prop.value)) style[key] = prop.value.value;
    else if (t.isStringLiteral(prop.value)) style[key] = prop.value.value;
  }
  return style;
}

function readJsxText(jsxElement) {
  for (const child of jsxElement.children || []) {
    if (t.isJSXText(child)) {
      const val = child.value.trim();
      if (val) return val;
    }
    if (t.isJSXExpressionContainer(child) && t.isStringLiteral(child.expression)) {
      return child.expression.value;
    }
  }
  return '';
}

function getTagName(opening) {
  if (t.isJSXIdentifier(opening.name)) return opening.name.name;
  return 'div';
}

function walkJsxElement(jsxElement, nodesMap, childIds) {
  const opening = jsxElement.openingElement;
  const id = getJsxId(opening);
  const tag = getTagName(opening);

  if (id) {
    const type = inferNodeType(tag);
    const style = readStyleFromOpening(opening);
    const node = {
      id,
      type,
      name: id,
      tag,
      style: { position: 'relative', ...style },
      children: []
    };

    if (type === 'text' || type === 'button') {
      node.text = readJsxText(jsxElement);
    }

    if (type === 'image') {
      const srcAttr = opening.attributes.find(
        (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'src' })
      );
      if (srcAttr && t.isStringLiteral(srcAttr.value)) node.src = srcAttr.value;
    }

    const nestedChildIds = [];
    for (const child of jsxElement.children || []) {
      if (t.isJSXElement(child)) walkJsxElement(child, nodesMap, nestedChildIds);
    }
    node.children = nestedChildIds;
    nodesMap[id] = node;
    childIds.push(id);
  } else {
    for (const child of jsxElement.children || []) {
      if (t.isJSXElement(child)) walkJsxElement(child, nodesMap, childIds);
    }
  }
}

function findComponentReturnRoot(ast) {
  let rootElement = null;

  traverse(ast, {
    ReturnStatement(path) {
      if (rootElement) return;
      const arg = path.node.argument;
      if (t.isJSXElement(arg)) {
        rootElement = arg;
        return;
      }
      if (t.isParenthesizedExpression(arg) && t.isJSXElement(arg.expression)) {
        rootElement = arg.expression;
      }
    }
  });

  return rootElement;
}

function buildNodesFromCode(code) {
  const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  const rootElement = findComponentReturnRoot(ast);
  if (!rootElement) return null;

  const nodesMap = {};
  const rootIds = [];
  walkJsxElement(rootElement, nodesMap, rootIds);
  const rootNodeId = rootIds[0] || Object.keys(nodesMap)[0];
  if (!rootNodeId) return null;

  return { rootNodeId, nodesMap };
}

function matchFileTemplate(fileName) {
  const base = (fileName || '').split(/[/\\]/).pop() || '';
  for (const tpl of FILE_TEMPLATES) {
    if (tpl.match.test(base)) {
      return { rootNodeId: tpl.rootId, nodesMap: JSON.parse(JSON.stringify(tpl.nodes)) };
    }
  }
  return null;
}

function bootstrapFromFile(code, fileName, savedState) {
  if (savedState?.nodesMap && Object.keys(savedState.nodesMap).length) {
    const nodesMap = parseTSX(code, JSON.parse(JSON.stringify(savedState.nodesMap)));
    return {
      rootNodeId: savedState.rootNodeId || Object.keys(nodesMap)[0],
      nodesMap,
      source: 'saved'
    };
  }

  const template = matchFileTemplate(fileName);
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
  matchFileTemplate
};
