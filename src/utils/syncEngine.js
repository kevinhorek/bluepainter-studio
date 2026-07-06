// syncEngine.js - Hierarchical AST Sync Engine for Figma Canvas
import { getComponentName, getWorkspaceFile, getImportPath, collectComponentRefs } from '../data/workspaceFiles';

function formatStyleAttr(styleObj) {
  const styleEntries = Object.entries(styleObj || {})
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => {
      const formattedVal = typeof v === 'number' ? v : `'${v}'`;
      return `${k}: ${formattedVal}`;
    })
    .join(', ');
  return styleEntries ? ` style={{ ${styleEntries} }}` : '';
}

// 1. GENERATE TSX CODE FROM NODE TREE STATE
export function generateTSX(rootNodeId, nodesMap) {
  if (!rootNodeId || !nodesMap) return '';

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

    if (node.type === 'text' || node.type === 'button') {
      const textVal = node.text || '';
      return `${indent}<${tag}${idAttr}${styleAttr}${classAttr}>${textVal}</${tag}>`;
    }

    if (node.type === 'image') {
      const imgSrc = node.src || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200';
      return `${indent}<img${idAttr} src="${imgSrc}"${styleAttr}${classAttr} />`;
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
      return `${indent}{/* Comment: ${(node.text || '').replace(/\*/g, '')} */}`;
    }

    const childrenJSX = (node.children || [])
      .map((childId) => renderNode(childId, indent + '  '))
      .join('\n');

    if (childrenJSX) {
      return `${indent}<${tag}${idAttr}${styleAttr}${classAttr}>\n${childrenJSX}\n${indent}</${tag}>`;
    }
    return `${indent}<${tag}${idAttr}${styleAttr}${classAttr} />`;
  }

  const renderedContent = renderNode(rootNodeId, '    ');
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
export function parseTSX(code, nodesMap) {
  if (!code || !nodesMap) return nodesMap;

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

      if (node.type === 'text' || node.type === 'button') {
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
