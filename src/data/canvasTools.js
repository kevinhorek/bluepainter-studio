/** Figma-aligned canvas tool definitions (metadata only — icons live in CanvasToolbar). */

export const CANVAS_TOOL_GROUPS = [
  {
    id: 'nav',
    label: 'Navigate',
    tools: [
      { id: 'select', name: 'Move / Select', shortcut: 'V', mode: 'nav' },
      { id: 'hand', name: 'Hand tool', shortcut: 'H', mode: 'nav' },
      { id: 'scale', name: 'Scale', shortcut: 'K', mode: 'nav' }
    ]
  },
  {
    id: 'containers',
    label: 'Containers',
    tools: [
      { id: 'frame', name: 'Frame', shortcut: 'F', mode: 'place' },
      { id: 'section', name: 'Section', shortcut: '', mode: 'place' },
      { id: 'slice', name: 'Slice', shortcut: 'S', mode: 'place' }
    ]
  },
  {
    id: 'shapes',
    label: 'Shapes',
    tools: [
      { id: 'rectangle', name: 'Rectangle', shortcut: 'R', mode: 'place', defaultShape: true },
      { id: 'line', name: 'Line', shortcut: 'L', mode: 'place' },
      { id: 'arrow', name: 'Arrow', shortcut: 'Shift+L', mode: 'place' },
      { id: 'ellipse', name: 'Ellipse', shortcut: 'O', mode: 'place' },
      { id: 'polygon', name: 'Polygon', shortcut: '', mode: 'place' },
      { id: 'star', name: 'Star', shortcut: '', mode: 'place' }
    ]
  },
  {
    id: 'draw',
    label: 'Draw & type',
    tools: [
      { id: 'pen', name: 'Pen', shortcut: 'P', mode: 'place' },
      { id: 'pencil', name: 'Pencil', shortcut: '', mode: 'place' },
      { id: 'text', name: 'Text', shortcut: 'T', mode: 'place' }
    ]
  },
  {
    id: 'media',
    label: 'Media & annotate',
    tools: [
      { id: 'image', name: 'Place image', shortcut: 'Shift+I', mode: 'place' },
      { id: 'comment', name: 'Comment', shortcut: 'C', mode: 'place' },
      { id: 'button', name: 'Button', shortcut: 'B', mode: 'place' }
    ]
  }
];

export const ALL_CANVAS_TOOLS = CANVAS_TOOL_GROUPS.flatMap((g) => g.tools);

export const PLACEABLE_TOOL_IDS = new Set(
  ALL_CANVAS_TOOLS.filter((t) => t.mode === 'place').map((t) => t.id)
);

export const NAV_TOOL_IDS = new Set(['select', 'hand', 'scale']);

export function getCanvasTool(toolId) {
  return ALL_CANVAS_TOOLS.find((t) => t.id === toolId);
}

export function getToolByShortcut(key, shiftKey = false) {
  const normalized = key.length === 1 ? key.toUpperCase() : key;
  return ALL_CANVAS_TOOLS.find((t) => {
    if (!t.shortcut) return false;
    const parts = t.shortcut.split('+');
    const needsShift = parts.includes('Shift');
    const letter = parts[parts.length - 1];
    if (needsShift !== shiftKey) return false;
    return letter.toUpperCase() === normalized;
  });
}

export function isPlacableTool(toolId) {
  return PLACEABLE_TOOL_IDS.has(toolId);
}
