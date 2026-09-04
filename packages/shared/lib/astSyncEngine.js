import * as recast from 'recast';
import { parse } from '@babel/parser';
import * as traverseModule from '@babel/traverse';
import * as t from '@babel/types';

const traverse = traverseModule.default || traverseModule;

const babelParser = {
  parse(source) {
    return parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      tokens: true,
      ranges: true
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
  if (val === null) return t.nullLiteral();
  if (val === undefined) return t.identifier('undefined');
  if (typeof val === 'boolean') return t.booleanLiteral(val);
  if (typeof val === 'number' && !Number.isNaN(val)) return t.numericLiteral(val);
  return t.stringLiteral(String(val));
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
    else if (t.isBooleanLiteral(prop.value)) out[key] = prop.value.value;
    else if (t.isNullLiteral(prop.value)) out[key] = null;
    else if (t.isTemplateLiteral(prop.value) && prop.value.expressions.length === 0) {
      out[key] = prop.value.quasis[0]?.value.cooked || '';
    }
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

        const classAttr = opening.attributes.find(
          (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'className' })
        );
        if (classAttr && t.isStringLiteral(classAttr.value)) {
          node.className = classAttr.value.value;
        }

        if (node.type === 'text' || node.type === 'button' || node.type === 'list-item' || node.type === 'link') {
          const text = readJsxText(path.node);
          if (text != null) node.text = text;
        }

        if (node.type === 'image' && t.isJSXIdentifier(opening.name, { name: 'img' })) {
          const srcAttr = opening.attributes.find(
            (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'src' })
          );
          if (srcAttr && t.isStringLiteral(srcAttr.value)) node.src = srcAttr.value.value;
        }

        if (node.type === 'link' && t.isJSXIdentifier(opening.name, { name: 'a' })) {
          const hrefAttr = opening.attributes.find(
            (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'href' })
          );
          if (hrefAttr && t.isStringLiteral(hrefAttr.value)) node.href = hrefAttr.value.value;
        }

        if ((node.type === 'input' || node.type === 'textarea') && (t.isJSXIdentifier(opening.name, { name: 'input' }) || t.isJSXIdentifier(opening.name, { name: 'textarea' }))) {
          const placeholderAttr = opening.attributes.find(
            (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'placeholder' })
          );
          if (placeholderAttr && t.isStringLiteral(placeholderAttr.value)) node.placeholder = placeholderAttr.value.value;

          const typeAttr = opening.attributes.find(
            (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'type' })
          );
          if (typeAttr && t.isStringLiteral(typeAttr.value)) {
            if (node.type === 'input') node.inputType = typeAttr.value.value;
            else if (node.type === 'button') node.buttonType = typeAttr.value.value;
          }
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

        if (node.type === 'text' || node.type === 'button' || node.type === 'list-item' || node.type === 'link') {
          if (node.text !== undefined && node.text !== null) {
            setJsxText(path.node, node.text);
          }
        }

        if (node.type === 'image' && node.src) {
          upsertStringAttribute(opening, 'src', node.src);
        }

        if (node.type === 'link' && node.href) {
          upsertStringAttribute(opening, 'href', node.href);
        }

        if ((node.type === 'input' || node.type === 'textarea') && node.placeholder) {
          upsertStringAttribute(opening, 'placeholder', node.placeholder);
        }

        if (node.type === 'input' && node.inputType) {
          upsertStringAttribute(opening, 'type', node.inputType);
        }

        if (node.type === 'button' && node.buttonType) {
          upsertStringAttribute(opening, 'type', node.buttonType);
        }
      }
    });

    return recast.print(ast).code;
  } catch (err) {
    console.warn('[astSync] patch failed:', err.message);
    return null;
  }
}

function astSyncAvailable() {
  return true;
}

function detectStyleSources(code) {
  if (!code?.trim()) return { hasInlineStyles: false, hasClassNames: false, hasTailwind: false, hasCssModules: false };

  try {
    const ast = recast.parse(code, { parser: babelParser });
    let hasInlineStyles = false;
    let hasClassNames = false;
    let hasTailwind = false;
    let hasCssModules = false;

    traverse(ast, {
      JSXElement(path) {
        const opening = path.node.openingElement;
        
        const styleAttr = opening.attributes.find(
          (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'style' })
        );
        if (styleAttr && t.isJSXExpressionContainer(styleAttr.value)) {
          const parsed = readObjectExpression(styleAttr.value.expression);
          if (parsed && Object.keys(parsed).length > 0) {
            hasInlineStyles = true;
          }
        }

        const classAttr = opening.attributes.find(
          (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'className' })
        );
        if (classAttr) {
          hasClassNames = true;
          if (t.isStringLiteral(classAttr.value)) {
            const classStr = classAttr.value.value;
            const tailwindPattern = /\b(bg-|text-|p-|m-|flex|grid|rounded|border|shadow|w-|h-)/;
            if (tailwindPattern.test(classStr)) {
              hasTailwind = true;
            }
          }
          if (t.isJSXExpressionContainer(classAttr.value)) {
            hasCssModules = true;
          }
        }
      }
    });

    return { hasInlineStyles, hasClassNames, hasTailwind, hasCssModules };
  } catch (err) {
    console.warn('[astSync] detectStyleSources failed:', err.message);
    return { hasInlineStyles: false, hasClassNames: false, hasTailwind: false, hasCssModules: false };
  }
}

export {
  parseTSXWithAST,
  patchTSXWithAST,
  getJsxId,
  astSyncAvailable,
  detectStyleSources
};
