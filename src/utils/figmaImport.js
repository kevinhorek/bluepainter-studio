/** Extract Figma file key from a share URL or raw key. */
export function parseFigmaFileKey(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9]+$/.test(trimmed) && trimmed.length >= 10) return trimmed;
  const match = trimmed.match(/figma\.com\/(?:design|file|proto)\/([a-zA-Z0-9]+)/);
  return match?.[1] || null;
}

/** Extract node id from URL node-id param (123-456 → 123:456). */
export function parseFigmaNodeId(input) {
  const trimmed = (input || '').trim();
  const fromUrl = trimmed.match(/node-id=([0-9]+-[0-9]+)/);
  if (fromUrl) return fromUrl[1].replace('-', ':');
  if (/^[0-9]+:[0-9]+$/.test(trimmed)) return trimmed;
  return null;
}

function slugId(figmaId, index) {
  return `figma-${String(figmaId || index).replace(/[^a-zA-Z0-9]/g, '-')}`;
}

function figmaSolidColor(fills) {
  if (!fills || fills.length === 0) return undefined;
  const paint = fills.find((f) => f.visible !== false && f.type === 'SOLID');
  if (!paint?.color) return undefined;
  const { r, g, b, a = 1 } = paint.color;
  const ri = Math.round(Math.max(0, Math.min(255, r * 255)));
  const gi = Math.round(Math.max(0, Math.min(255, g * 255)));
  const bi = Math.round(Math.max(0, Math.min(255, b * 255)));
  const alpha = Math.max(0, Math.min(1, a));
  if (alpha < 0.99) return `rgba(${ri}, ${gi}, ${bi}, ${alpha.toFixed(2)})`;
  return `#${[ri, gi, bi].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function mapAlign(primary, counter) {
  const main = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', SPACE_BETWEEN: 'space-between' };
  const cross = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', STRETCH: 'stretch' };
  return {
    justifyContent: main[primary] || 'flex-start',
    alignItems: cross[counter] || 'stretch'
  };
}

function isTextNode(node) {
  return node.type === 'TEXT';
}

function isFrameLike(node) {
  return ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'SECTION', 'COMPONENT_SET'].includes(node.type);
}

function findImportRoot(figmaFile, nodeId) {
  if (nodeId && figmaFile.nodes?.[nodeId]?.document) {
    return { node: figmaFile.nodes[nodeId].document, name: figmaFile.nodes[nodeId].document.name };
  }

  const pages = figmaFile.document?.children || [];
  for (const page of pages) {
    const frames = (page.children || []).filter((c) => isFrameLike(c));
    if (frames.length) {
      const target = nodeId
        ? findNodeById(page, nodeId) || frames[0]
        : frames[0];
      if (target) return { node: target, name: target.name };
    }
  }
  return null;
}

function findNodeById(node, id) {
  if (node.id === id) return node;
  for (const child of node.children || []) {
    const hit = findNodeById(child, id);
    if (hit) return hit;
  }
  return null;
}

function convertNode(figmaNode, nodes, parentBox, index, { useAbsolute }) {
  if (!figmaNode || figmaNode.visible === false) return null;
  
  const id = slugId(figmaNode.id, index);
  const box = figmaNode.absoluteBoundingBox;
  const hasAutoLayout = Boolean(figmaNode.layoutMode && figmaNode.layoutMode !== 'NONE');
  const bg = figmaSolidColor(figmaNode.fills);
  const cornerRadius = figmaNode.cornerRadius ?? figmaNode.rectangleCornerRadii?.[0];

  if (isTextNode(figmaNode)) {
    const style = figmaNode.style || {};
    const textStyle = {
      fontSize: Math.max(8, Math.round(style.fontSize || 14)),
      fontWeight: Math.max(100, Math.min(900, Math.round((style.fontWeight || 400) / 100) * 100)),
      color: figmaSolidColor([{ type: 'SOLID', color: style.fills?.[0]?.color || figmaNode.fills?.[0]?.color }])
        || figmaSolidColor(figmaNode.fills)
        || '#1e293b',
      textAlign: (style.textAlignHorizontal || 'LEFT').toLowerCase(),
      lineHeight: style.lineHeightPx ? `${Math.max(1, Math.round(style.lineHeightPx))}px` : '1.4'
    };
    if (useAbsolute && box && parentBox) {
      textStyle.position = 'absolute';
      textStyle.left = Math.max(0, Math.round(box.x - parentBox.x));
      textStyle.top = Math.max(0, Math.round(box.y - parentBox.y));
      textStyle.width = Math.max(1, Math.round(box.width));
    }
    const text = (figmaNode.characters || '').trim();
    nodes[id] = {
      id,
      type: 'text',
      name: figmaNode.name || 'Text',
      tag: 'p',
      style: textStyle,
      text: text || 'Text'
    };
    return id;
  }

  if (figmaNode.type === 'LINE') {
    const strokeWidth = figmaNode.strokeWeight || 1;
    const lineStyle = {
      position: 'absolute',
      left: box && parentBox ? Math.max(0, Math.round(box.x - parentBox.x)) : 0,
      top: box && parentBox ? Math.max(0, Math.round(box.y - parentBox.y)) : 0,
      width: box ? Math.max(1, Math.round(box.width)) : 100,
      borderWidth: 0,
      borderTopWidth: Math.max(1, Math.round(strokeWidth)),
      borderColor: figmaSolidColor(figmaNode.strokes) || '#94a3b8',
      borderStyle: 'solid',
      height: Math.max(1, Math.round(strokeWidth))
    };
    nodes[id] = {
      id,
      type: 'line',
      name: figmaNode.name || 'Line',
      tag: 'hr',
      style: lineStyle,
      children: []
    };
    return id;
  }

  const childIds = [];
  const childUseAbsolute = !hasAutoLayout;

  (figmaNode.children || []).forEach((child, i) => {
    if (child && child.visible !== false) {
      const childId = convertNode(child, nodes, box || parentBox, i, { useAbsolute: childUseAbsolute });
      if (childId) childIds.push(childId);
    }
  });

  const style = {
    display: 'flex',
    flexDirection: figmaNode.layoutMode === 'HORIZONTAL' ? 'row' : 'column',
    gap: Math.max(0, Math.round(figmaNode.itemSpacing || 0)),
    padding: figmaNode.paddingLeft || figmaNode.paddingTop
      ? Math.max(0, Math.round(Math.max(figmaNode.paddingTop || 0, figmaNode.paddingLeft || 0)))
      : 0,
    borderRadius: Math.max(0, Math.round(cornerRadius || 0)),
    overflow: childIds.length > 0 ? 'hidden' : 'visible'
  };

  if (bg) style.background = bg;
  if (figmaNode.strokes?.length && figmaNode.strokeWeight) {
    style.borderWidth = Math.max(1, Math.round(figmaNode.strokeWeight));
    style.borderColor = figmaSolidColor(figmaNode.strokes) || '#cbd5e1';
    style.borderStyle = 'solid';
  }

  if (hasAutoLayout) {
    Object.assign(style, mapAlign(figmaNode.primaryAxisAlignItems, figmaNode.counterAxisAlignItems));
  }

  if (useAbsolute && box && parentBox && !hasAutoLayout) {
    style.position = 'absolute';
    style.left = Math.max(0, Math.round(box.x - parentBox.x));
    style.top = Math.max(0, Math.round(box.y - parentBox.y));
    style.width = Math.max(1, Math.round(box.width));
    if (box.height) style.height = Math.max(1, Math.round(box.height));
  } else if (box) {
    style.width = Math.max(1, Math.round(box.width));
    if (box.height) style.minHeight = Math.max(1, Math.round(box.height));
  }

  const tag = 'div';
  nodes[id] = {
    id,
    type: 'frame',
    name: figmaNode.name || 'Frame',
    tag,
    style,
    children: childIds,
    _figmaType: figmaNode.type,
    _hasAutoLayout: hasAutoLayout
  };

  return id;
}

/** Convert Figma REST API file JSON (or nodes endpoint) to BluePainter nodes map. */
export function figmaFileToNodes(figmaFile, { nodeId, pageName = 'FigmaImport' } = {}) {
  const found = findImportRoot(figmaFile, nodeId);
  if (!found?.node) {
    throw new Error('No frame found in Figma file. Ensure the file has at least one top-level frame on the first page, or use a specific node URL (right-click frame → Copy link).');
  }

  const rootFigma = found.node;
  const box = rootFigma.absoluteBoundingBox || { width: 1280, height: 800, x: 0, y: 0 };
  const rootId = 'figma-import-page';
  const nodes = {};

  const childIds = [];
  (rootFigma.children || []).forEach((child, i) => {
    if (child && child.visible !== false) {
      const cid = convertNode(child, nodes, box, i, { useAbsolute: !rootFigma.layoutMode || rootFigma.layoutMode === 'NONE' });
      if (cid) childIds.push(cid);
    }
  });

  nodes[rootId] = {
    id: rootId,
    type: 'frame',
    name: pageName || found.name || 'Figma Import',
    tag: 'div',
    style: {
      position: 'relative',
      width: Math.max(320, Math.round(box.width)) || 1280,
      height: Math.max(200, Math.round(box.height)) || 800,
      display: 'flex',
      flexDirection: rootFigma.layoutMode === 'HORIZONTAL' ? 'row' : 'column',
      gap: Math.max(0, Math.round(rootFigma.itemSpacing || 0)),
      padding: Math.max(0, Math.round(rootFigma.paddingLeft || 0)),
      background: figmaSolidColor(rootFigma.fills) || '#ffffff',
      overflow: childIds.length > 0 ? 'hidden' : 'visible',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderStyle: 'solid'
    },
    children: childIds,
    _figmaType: rootFigma.type,
    _hasAutoLayout: Boolean(rootFigma.layoutMode && rootFigma.layoutMode !== 'NONE')
  };

  return {
    nodes,
    rootId,
    componentName: 'FigmaImport',
    viewport: {
      width: Math.max(Math.round(box.width) || 1280, 320),
      height: Math.max(Math.round(box.height) || 800, 400)
    },
    frameName: found.name,
    nodeCount: Object.keys(nodes).length,
    childCount: childIds.length,
    hasContent: childIds.length > 0
  };
}

export function getEmptyFigmaImportNodes() {
  return {
    'figma-import-page': {
      id: 'figma-import-page',
      type: 'frame',
      name: 'Figma Import',
      tag: 'div',
      style: {
        position: 'relative',
        width: 1280,
        height: 800,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderStyle: 'solid'
      },
      children: ['figma-placeholder-title', 'figma-placeholder-hint']
    },
    'figma-placeholder-title': {
      id: 'figma-placeholder-title',
      type: 'text',
      name: 'Placeholder',
      tag: 'h2',
      style: { fontSize: 24, fontWeight: 700, color: '#64748b', textAlign: 'center' },
      text: 'Import a design from Figma'
    },
    'figma-placeholder-hint': {
      id: 'figma-placeholder-hint',
      type: 'text',
      name: 'Hint',
      tag: 'p',
      style: { fontSize: 14, color: '#94a3b8', textAlign: 'center', maxWidth: 480, lineHeight: '1.5' },
      text: 'Use ··· → Import from Figma with a file URL and access token (see FIGMA_TOKEN.md), or paste exported JSON. v2 is import-only — changes do NOT sync back to Figma.'
    }
  };
}
