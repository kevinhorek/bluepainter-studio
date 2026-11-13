// syncEngine.js - Canvas ↔ TSX sync (AST-first with regex fallback)
import { getComponentName, getWorkspaceFile, getImportPath, collectComponentRefs, WORKSPACE_FILES } from '../data/workspaceFiles';
import { parseTSXWithAST, patchTSXWithAST, jsxTextNeedsExpression, prepareTSXForCanvas, getASTMeta } from '@bluepainter/shared/astSyncEngine';

function formatStyleValue(v) {
  if (typeof v === 'number') return v;
  const str = String(v);
  // Values like fontFamily: "'Inter', sans-serif" contain single quotes.
  return str.includes("'") || str.includes('\\') || str.includes('\n')
    ? JSON.stringify(str)
    : `'${str}'`;
}

function formatStyleAttr(styleObj) {
  const styleEntries = Object.entries(styleObj || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      const key = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
      return `${key}: ${formatStyleValue(v)}`;
    })
    .join(', ');
  return styleEntries ? ` style={{ ${styleEntries} }}` : '';
}

function formatJsxText(text) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  // Braces, angle brackets and ampersands would break (or change) the JSX.
  return jsxTextNeedsExpression(value) ? `{${JSON.stringify(value)}}` : value;
}

function escapeAttr(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * The element ids the node tree renders, in document order.
 * Returns null when the tree contains nodes the AST patcher can't keep in sync
 * (comment pins render as id-less JSX comments), forcing a full regenerate.
 */
function expectedIdOrder(rootNodeId, nodesMap) {
  const ids = [];
  const seen = new Set();
  let patchable = true;
  function walk(nodeId) {
    const node = nodesMap[nodeId];
    if (!node || seen.has(nodeId)) return;
    seen.add(nodeId);
    if (node.type === 'comment') {
      patchable = false;
      return;
    }
    ids.push(node.id);
    if (node.type === 'component-instance') return;
    const leaf = ['text', 'button', 'list-item', 'link', 'input', 'textarea', 'image', 'line', 'shape', 'vector'].includes(node.type);
    if (!leaf) (node.children || []).forEach(walk);
  }
  walk(rootNodeId);
  return patchable ? ids : null;
}

// 1. GENERATE TSX CODE FROM NODE TREE STATE
// Fail-loud: returns null when AST patch fails on existing code (SPEC §5)
export function generateTSX(rootNodeId, nodesMap, existingCode = null) {
  if (existingCode?.trim() && rootNodeId && nodesMap) {
    // Only patch when the code has exactly the tree's structure. If a layer was
    // added, removed or reordered — or the code belongs to another file — the
    // patcher can't express that, so regenerate from the tree.
    const expected = expectedIdOrder(rootNodeId, nodesMap);
    if (expected) {
      // The patcher inserts / removes / reorders elements for structural canvas
      // edits, so the author's file survives; it returns null if it can't.
      const patched = patchTSXWithAST(existingCode, nodesMap, expected, {
        renderNode: (id, indent) => renderNodeJSX(id, nodesMap, indent)
      });
      if (patched) return patched;
    }
  }
  // No existing code - generate from template (fresh component)
  return generateTSXFromTemplate(rootNodeId, nodesMap);
}

/** Render one node (and its subtree) as JSX source. */
export function renderNodeJSX(rootId, nodesMap, baseIndent = '    ') {
  function renderNode(nodeId, indent = '  ') {
    const node = nodesMap[nodeId];
    if (!node) return '';

    const tag = node.tag || 'div';
    const styleAttr = formatStyleAttr(node.style);
    const idAttr = ` id="${node.id}"`;
    const classAttr = node.className ? ` className="${node.className}"` : '';

    if (node.type === 'component-instance') {
      const compName = getWorkspaceFile(node.refFile).componentName;
      return `${indent}<div${idAttr}${styleAttr}>\n${indent}  <${compName} />\n${indent}</div>`;
    }

    if (node.type === 'text' || node.type === 'button' || node.type === 'list-item' || node.type === 'link') {
      const textVal = formatJsxText(node.text);
      const hrefAttr = node.type === 'link' && node.href ? ` href="${escapeAttr(node.href)}"` : '';
      return `${indent}<${tag}${idAttr}${hrefAttr}${styleAttr}${classAttr}>${textVal}</${tag}>`;
    }

    if (node.type === 'input' || node.type === 'textarea') {
      const typeAttr = node.type === 'input' && node.inputType ? ` type="${escapeAttr(node.inputType)}"` : '';
      const placeholderAttr = node.placeholder ? ` placeholder="${escapeAttr(node.placeholder)}"` : '';
      return `${indent}<${node.type}${idAttr}${typeAttr}${placeholderAttr}${styleAttr}${classAttr} />`;
    }

    if (node.type === 'image') {
      const imgSrc = node.src || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200';
      return `${indent}<img${idAttr} src="${escapeAttr(imgSrc)}" alt=""${styleAttr}${classAttr} />`;
    }

    if (node.type === 'line') {
      return `${indent}<hr${idAttr}${styleAttr}${classAttr} />`;
    }

    if (node.type === 'shape') {
      if (node.shapeKind === 'arrow') {
        return `${indent}<div${idAttr}${styleAttr}${classAttr} role="presentation" />`;
      }
      return `${indent}<div${idAttr}${styleAttr}${classAttr} />`;
    }

    if (node.type === 'vector') {
      const stroke = node.vectorKind === 'pencil' ? '#64748b' : '#2563eb';
      const path = node.path || 'M 8 60 Q 40 10, 80 40';
      return `${indent}<svg${idAttr} width="${node.style?.width || 140}" height="${node.style?.height || 80}" viewBox="0 0 140 80"><path d="${path}" fill="none" stroke="${stroke}" strokeWidth="2" /></svg>`;
    }

    if (node.type === 'comment') {
      return `${indent}{/* Comment: ${(node.text || '').replace(/\*\//g, '* /').replace(/\s+/g, ' ')} */}`;
    }

    const childrenJSX = (node.children || [])
      .map((childId) => renderNode(childId, indent + '  '))
      .join('\n');

    if (childrenJSX) {
      return `${indent}<${tag}${idAttr}${styleAttr}${classAttr}>\n${childrenJSX}\n${indent}</${tag}>`;
    }
    return `${indent}<${tag}${idAttr}${styleAttr}${classAttr} />`;
  }

  return renderNode(rootId, baseIndent);
}

function generateTSXFromTemplate(rootNodeId, nodesMap) {
  if (!rootNodeId || !nodesMap) return '';

  const renderedContent = renderNodeJSX(rootNodeId, nodesMap, '    ');
  const componentName = getComponentName(rootNodeId);
  const refs = collectComponentRefs(rootNodeId, nodesMap);
  const importLines = [...refs]
    .map((fileId) => {
      const file = getWorkspaceFile(fileId);
      return `import { ${file.componentName} } from '${getImportPath(fileId)}';`;
    })
    .join('\n');
  const importsBlock = importLines ? `${importLines}\n\n` : '';

  return `${importsBlock}export function ${componentName}() {
  return (
${renderedContent}
  );
}`;
}

// 2. PARSE TSX CODE BACK TO NODE TREE STATE
function resolveComponentByName(name) {
  const entry = Object.values(WORKSPACE_FILES).find((f) => !f.isPage && f.componentName === name);
  return entry ? entry.id : null;
}

/**
 * `rootId` turns on structural sync: elements added/removed/reordered in code
 * add/remove/reorder canvas layers. Without it only style/text/src are read.
 */
export function parseTSX(code, nodesMap, rootId = null) {
  if (!code || !nodesMap) return nodesMap;

  const astResult = parseTSXWithAST(code, nodesMap, rootId
    ? { structural: true, rootId, resolveComponent: resolveComponentByName }
    : {});
  if (astResult) return astResult;

  return parseTSXWithRegex(code, nodesMap);
}

export { getASTMeta };

function parseTSXWithRegex(code, nodesMap) {

  const updatedNodes = JSON.parse(JSON.stringify(nodesMap));

  try {
    Object.keys(updatedNodes).forEach((id) => {
      const node = updatedNodes[id];

      if (node.type === 'component-instance') {
        return;
      }

      const styleRegex = new RegExp(`<${node.tag}[^>]*id=["']${node.id}["'][^>]*style=\\{\\{\\s*([^}]+)\\s*\\}\\}`);
      const styleMatch = code.match(styleRegex);

      if (styleMatch) {
        const styleStr = styleMatch[1];
        const styleProps = styleStr.split(',');

        styleProps.forEach((prop) => {
          const parts = prop.split(':');
          if (parts.length === 2) {
            const key = parts[0].trim();
            let val = parts[1].trim().replace(/['"\s]/g, '');

            if (/^-?\d+(\.\d+)?$/.test(val)) {
              val = parseFloat(val);
            }

            node.style[key] = val;
          }
        });
      }

      if (node.type === 'text' || node.type === 'button' || node.type === 'list-item') {
        const textRegex = new RegExp(`<${node.tag}[^>]*id=["']${node.id}["'][^>]*>\\s*["']?([^"'\n<]+)["']?\\s*</${node.tag}>`);
        const textMatch = code.match(textRegex);
        if (textMatch) {
          node.text = textMatch[1].trim();
        }
      }

      if (node.type === 'image') {
        const srcRegex = new RegExp(`<img[^>]*id=["']${node.id}["'][^>]*src=["']([^"']+)["']`);
        const srcMatch = code.match(srcRegex);
        if (srcMatch) {
          node.src = srcMatch[1];
        }
      }
    });
  } catch (err) {
    console.error('Error parsing hierarchical TSX back to nodes: ', err);
  }

  return updatedNodes;
}

/**
 * Open an arbitrary TSX/JSX file on the canvas.
 * Returns { code, nodes, rootId, componentName, addedIds } or throws with a readable message.
 */
export function importTSXFile(source, fileName = 'Imported.tsx') {
  const prepared = prepareTSXForCanvas(source);
  if (!prepared) {
    throw new Error('Could not find JSX in that file — is it a React component (.tsx / .jsx)?');
  }
  const nodes = parseTSXWithAST(prepared.code, {}, {
    structural: true,
    rootId: prepared.rootId,
    resolveComponent: resolveComponentByName
  });
  if (!nodes || !nodes[prepared.rootId]) {
    throw new Error('That file parsed, but its JSX could not be mapped to canvas layers.');
  }
  const fallbackName = fileName.replace(/\.[jt]sx?$/i, '').replace(/[^A-Za-z0-9_$]/g, '') || 'Imported';
  return {
    code: prepared.code,
    nodes,
    rootId: prepared.rootId,
    componentName: prepared.componentName || fallbackName,
    addedIds: prepared.added
  };
}
