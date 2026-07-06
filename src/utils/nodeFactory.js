import { isPlacableTool } from '../data/canvasTools';

export const LEAF_NODE_TYPES = new Set([
  'text',
  'button',
  'image',
  'line',
  'shape',
  'comment',
  'vector'
]);

export function isLeafNode(node) {
  if (!node) return false;
  return LEAF_NODE_TYPES.has(node.type);
}

export function canDropIntoNode(node) {
  if (!node) return false;
  return !isLeafNode(node) && node.type !== 'component-instance';
}

export function createNodeFromTool(type, newId, leftOffset = 20, topOffset = 20) {
  const pos = { position: 'absolute', left: leftOffset, top: topOffset };

  switch (type) {
    case 'text':
      return {
        id: newId,
        type: 'text',
        name: 'Text',
        tag: 'p',
        style: { ...pos, fontSize: 14, color: '#475569', minWidth: 80 },
        text: 'Text'
      };
    case 'button':
      return {
        id: newId,
        type: 'button',
        name: 'Button',
        tag: 'button',
        style: {
          ...pos,
          background: '#2563eb',
          color: '#ffffff',
          borderWidth: 0,
          padding: '8px 16px',
          borderRadius: 6,
          cursor: 'pointer'
        },
        text: 'Button'
      };
    case 'frame':
      return {
        id: newId,
        type: 'frame',
        name: 'Frame',
        tag: 'div',
        style: {
          ...pos,
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
          gap: 12,
          background: '#f8fafc',
          borderRadius: 8,
          width: 200,
          height: 140,
          borderWidth: 1,
          borderColor: '#cbd5e1',
          borderStyle: 'solid'
        },
        children: []
      };
    case 'section':
      return {
        id: newId,
        type: 'frame',
        name: 'Section',
        tag: 'section',
        style: {
          ...pos,
          display: 'flex',
          flexDirection: 'column',
          padding: 32,
          gap: 16,
          background: '#f1f5f9',
          borderRadius: 12,
          width: 360,
          height: 240,
          borderWidth: 2,
          borderColor: '#94a3b8',
          borderStyle: 'dashed'
        },
        children: []
      };
    case 'slice':
      return {
        id: newId,
        type: 'frame',
        name: 'Slice',
        tag: 'div',
        className: 'canvas-slice',
        style: {
          ...pos,
          width: 160,
          height: 120,
          background: 'rgba(124, 58, 237, 0.08)',
          borderWidth: 1,
          borderColor: '#a78bfa',
          borderStyle: 'dashed',
          borderRadius: 4
        },
        children: []
      };
    case 'rectangle':
      return {
        id: newId,
        type: 'shape',
        shapeKind: 'rectangle',
        name: 'Rectangle',
        tag: 'div',
        style: { ...pos, width: 120, height: 80, background: '#e2e8f0', borderRadius: 0 }
      };
    case 'ellipse':
      return {
        id: newId,
        type: 'shape',
        shapeKind: 'ellipse',
        name: 'Ellipse',
        tag: 'div',
        style: { ...pos, width: 100, height: 100, background: '#e2e8f0', borderRadius: '50%' }
      };
    case 'polygon':
      return {
        id: newId,
        type: 'shape',
        shapeKind: 'polygon',
        name: 'Polygon',
        tag: 'div',
        style: {
          ...pos,
          width: 100,
          height: 100,
          background: '#e2e8f0',
          clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)'
        }
      };
    case 'star':
      return {
        id: newId,
        type: 'shape',
        shapeKind: 'star',
        name: 'Star',
        tag: 'div',
        style: {
          ...pos,
          width: 100,
          height: 100,
          background: '#fbbf24',
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
        }
      };
    case 'line':
      return {
        id: newId,
        type: 'line',
        name: 'Line',
        tag: 'hr',
        style: {
          ...pos,
          borderWidth: 0,
          borderTopWidth: 2,
          borderColor: '#64748b',
          borderStyle: 'solid',
          width: 150,
          height: 2
        }
      };
    case 'arrow':
      return {
        id: newId,
        type: 'shape',
        shapeKind: 'arrow',
        name: 'Arrow',
        tag: 'div',
        style: {
          ...pos,
          width: 120,
          height: 24,
          background: 'transparent',
          borderTopWidth: 2,
          borderColor: '#64748b',
          borderStyle: 'solid'
        }
      };
    case 'image':
      return {
        id: newId,
        type: 'image',
        name: 'Image',
        tag: 'img',
        style: { ...pos, width: 120, height: 80, borderRadius: 6, objectFit: 'cover' },
        src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'
      };
    case 'comment':
      return {
        id: newId,
        type: 'comment',
        name: 'Comment',
        tag: 'div',
        style: { ...pos, width: 28, height: 28, zIndex: 50 },
        text: 'Add a comment…'
      };
    case 'pen':
      return {
        id: newId,
        type: 'vector',
        name: 'Vector',
        tag: 'div',
        vectorKind: 'pen',
        style: { ...pos, width: 140, height: 80 },
        path: 'M 8 60 Q 40 10, 80 40 T 132 20'
      };
    case 'pencil':
      return {
        id: newId,
        type: 'vector',
        name: 'Pencil stroke',
        tag: 'div',
        vectorKind: 'pencil',
        style: { ...pos, width: 120, height: 60 },
        path: 'M 4 50 C 20 40, 40 20, 60 35 S 100 10, 116 30'
      };
    default:
      return null;
  }
}

export function validateToolPlacement(type) {
  return isPlacableTool(type);
}
