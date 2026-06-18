// syncEngine.js - Hierarchical AST Sync Engine for Figma Canvas

// 1. GENERATE TSX CODE FROM NODE TREE STATE
export function generateTSX(rootNodeId, nodesMap) {
  if (!rootNodeId || !nodesMap) return '';

  function renderNode(nodeId, indent = '  ') {
    const node = nodesMap[nodeId];
    if (!node) return '';

    const tag = node.tag || 'div';
    
    // Format style properties
    const styleObj = node.style || {};
    const styleEntries = Object.entries(styleObj)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => {
        const formattedVal = typeof v === 'number' ? v : `'${v}'`;
        return `${k}: ${formattedVal}`;
      })
      .join(', ');

    const styleAttr = styleEntries ? ` style={{ ${styleEntries} }}` : '';
    const idAttr = ` id="${node.id}"`;
    const classAttr = node.className ? ` className="${node.className}"` : '';

    if (node.type === 'text' || node.type === 'button') {
      const textVal = node.text || '';
      return `${indent}<${tag}${idAttr}${styleAttr}${classAttr}>"${textVal}"</${tag}>`;
    }

    if (node.type === 'image') {
      const imgSrc = node.src || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200';
      return `${indent}<img${idAttr} src="${imgSrc}"${styleAttr}${classAttr} />`;
    }

    if (node.type === 'line') {
      return `${indent}<hr${idAttr}${styleAttr}${classAttr} />`;
    }

    // Recursive children rendering
    const childrenJSX = (node.children || [])
      .map(childId => renderNode(childId, indent + '  '))
      .join('\n');

    if (childrenJSX) {
      return `${indent}<${tag}${idAttr}${styleAttr}${classAttr}>\n${childrenJSX}\n${indent}</${tag}>`;
    } else {
      return `${indent}<${tag}${idAttr}${styleAttr}${classAttr} />`;
    }
  }

  const renderedContent = renderNode(rootNodeId, '    ');
  const componentName = rootNodeId === 'hero-frame' ? 'HeroSection' : 'PricingCard';

  return `export function ${componentName}() {
  return (
${renderedContent}
  );
}`;
}

// 2. PARSE TSX CODE BACK TO NODE TREE STATE
export function parseTSX(code, nodesMap) {
  if (!code || !nodesMap) return nodesMap;
  
  // Clone the nodes map to avoid mutation
  const updatedNodes = JSON.parse(JSON.stringify(nodesMap));

  try {
    Object.keys(updatedNodes).forEach(id => {
      const node = updatedNodes[id];

      // A. Parse style block: style={{ ... }} on the tag matching id="node.id"
      const styleRegex = new RegExp(`<${node.tag}[^>]*id=["']${node.id}["'][^>]*style=\\{\\{\\s*([^}]+)\\s*\\}\\}`);
      const styleMatch = code.match(styleRegex);

      if (styleMatch) {
        const styleStr = styleMatch[1];
        const styleProps = styleStr.split(',');

        styleProps.forEach(prop => {
          const parts = prop.split(':');
          if (parts.length === 2) {
            const key = parts[0].trim();
            let val = parts[1].trim().replace(/['"\s]/g, '');
            
            // Convert to number if numeric (supports negative and decimals)
            if (/^-?\d+(\.\d+)?$/.test(val)) {
              val = parseFloat(val);
            }
            
            node.style[key] = val;
          }
        });
      }

      // B. Parse text value inside simple tags (only text or button)
      if (node.type === 'text' || node.type === 'button') {
        const textRegex = new RegExp(`<${node.tag}[^>]*id=["']${node.id}["'][^>]*>\\s*["']?([^"'\n<]+)["']?\\s*</${node.tag}>`);
        const textMatch = code.match(textRegex);
        if (textMatch) {
          node.text = textMatch[1].trim();
        }
      }

      // C. Parse Image src path
      if (node.type === 'image') {
        const srcRegex = new RegExp(`<img[^>]*id=["']${node.id}["'][^>]*src=["']([^"']+)["']`);
        const srcMatch = code.match(srcRegex);
        if (srcMatch) {
          node.src = srcMatch[1];
        }
      }
    });

  } catch (err) {
    console.error("Error parsing hierarchical TSX back to nodes: ", err);
  }

  return updatedNodes;
}
