import { useState, useRef, useEffect } from 'react';
import { CANVAS_TOOL_GROUPS, getCanvasTool, isPlacableTool } from '../data/canvasTools';

function ToolIcon({ toolId }) {
  const s = { width: 16, height: 16 };

  switch (toolId) {
    case 'select':
      return (
        <svg style={s} fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 3.01v17.98l4.47-4.47 3.53 7.5 2.12-1-3.53-7.5 6.41-.01L9 3.01z" />
        </svg>
      );
    case 'hand':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M7 11V7a2 2 0 114 0v4M11 11V6a2 2 0 114 0v6M15 11V8a2 2 0 114 0v7a5 5 0 01-5 5h-1a4 4 0 01-4-4v-1" strokeLinecap="round" />
        </svg>
      );
    case 'scale':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 3l-6 6M3 21l6-6M15 3h6v6M9 21H3v-6" strokeLinecap="round" />
        </svg>
      );
    case 'frame':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />
        </svg>
      );
    case 'section':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="2" y1="9" x2="22" y2="9" />
        </svg>
      );
    case 'slice':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" strokeDasharray="2 2" />
          <line x1="4" y1="4" x2="20" y2="20" />
        </svg>
      );
    case 'rectangle':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="4" y="6" width="16" height="12" rx="1" />
        </svg>
      );
    case 'line':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="4" y1="20" x2="20" y2="4" />
        </svg>
      );
    case 'arrow':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="4" y1="12" x2="18" y2="12" />
          <polyline points="14 8 18 12 14 16" />
        </svg>
      );
    case 'ellipse':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <ellipse cx="12" cy="12" rx="8" ry="6" />
        </svg>
      );
    case 'polygon':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polygon points="12,3 21,20 3,20" />
        </svg>
      );
    case 'star':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
        </svg>
      );
    case 'pen':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 20c4-8 8-12 16-16M14 6l4 4" strokeLinecap="round" />
        </svg>
      );
    case 'pencil':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 21l3-1 11-11-2-2L4 18l-1 3z" />
        </svg>
      );
    case 'text':
      return (
        <span style={{ fontSize: '1.05rem', fontWeight: 'bold', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>T</span>
      );
    case 'image':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    case 'comment':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
        </svg>
      );
    case 'button':
      return (
        <svg style={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="6" width="18" height="12" rx="3" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    default:
      return <span>?</span>;
  }
}

function ShapeFlyout({ activeTool, onSelect, isFigma, onClose }) {
  const shapes = CANVAS_TOOL_GROUPS.find((g) => g.id === 'shapes')?.tools || [];
  const activeBg = isFigma ? 'var(--purple-figma)' : 'var(--blue-primary)';

  return (
    <div className="canvas-tool-flyout" role="menu">
      {shapes.map((tool) => (
        <button
          key={tool.id}
          type="button"
          role="menuitem"
          className={`canvas-tool-flyout-item ${activeTool === tool.id ? 'active' : ''}`}
          style={activeTool === tool.id ? { background: activeBg } : undefined}
          onClick={() => { onSelect(tool.id); onClose(); }}
          title={tool.shortcut ? `${tool.name} (${tool.shortcut})` : tool.name}
        >
          <ToolIcon toolId={tool.id} />
          <span>{tool.name}</span>
          {tool.shortcut && <kbd>{tool.shortcut}</kbd>}
        </button>
      ))}
    </div>
  );
}

export default function CanvasToolbar({
  activeTool,
  setActiveTool,
  isFigma = false,
  className = ''
}) {
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const shapeRef = useRef(null);
  const activeBg = isFigma ? 'var(--purple-figma)' : 'var(--blue-primary)';
  const shapeGroup = CANVAS_TOOL_GROUPS.find((g) => g.id === 'shapes');
  const activeShapeTool = shapeGroup?.tools.find((t) => t.id === activeTool);
  const shapeButtonId = activeShapeTool?.id || 'rectangle';

  useEffect(() => {
    if (!shapeMenuOpen) return;
    const close = (e) => {
      if (shapeRef.current && !shapeRef.current.contains(e.target)) setShapeMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [shapeMenuOpen]);

  const selectTool = (toolId) => {
    setActiveTool?.(toolId);
    if (!shapeGroup?.tools.some((t) => t.id === toolId)) setShapeMenuOpen(false);
  };

  const toolTitle = (tool) => {
    const shortcut = tool.shortcut ? ` (${tool.shortcut})` : '';
    if (tool.mode === 'place') return `${tool.name}${shortcut} — click or drag onto canvas`;
    if (tool.id === 'hand') return `${tool.name}${shortcut} — drag to pan`;
    if (tool.id === 'scale') return `${tool.name}${shortcut} — resize selected layers`;
    return `${tool.name}${shortcut}`;
  };

  const placableActive = isPlacableTool(activeTool);
  const activeMeta = getCanvasTool(activeTool);

  return (
    <div className={`canvas-toolbar ${className}`}>
      {placableActive && activeMeta && (
        <div className="canvas-toolbar-hint" style={{ background: activeBg }}>
          Click a frame to place {activeMeta.name.toLowerCase()}
        </div>
      )}
      {activeTool === 'hand' && (
        <div className="canvas-toolbar-hint" style={{ background: activeBg }}>
          Drag to pan · Space to hold
        </div>
      )}

      <div className="canvas-toolbar-scroll">
        {CANVAS_TOOL_GROUPS.map((group, groupIndex) => (
          <div key={group.id} className="canvas-toolbar-group">
            {groupIndex > 0 && <div className="canvas-toolbar-divider" aria-hidden />}
            {group.id === 'shapes' ? (
              <div className="canvas-tool-shape-wrap" ref={shapeRef}>
                <button
                  type="button"
                  className={`canvas-tool-btn ${shapeGroup.tools.some((t) => t.id === activeTool) ? 'active' : ''}`}
                  style={shapeGroup.tools.some((t) => t.id === activeTool) ? { background: activeBg, color: '#fff' } : undefined}
                  onClick={() => selectTool(shapeButtonId)}
                  onContextMenu={(e) => { e.preventDefault(); setShapeMenuOpen(true); }}
                  onDoubleClick={() => setShapeMenuOpen((v) => !v)}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('layerType', shapeButtonId)}
                  title={`${getCanvasTool(shapeButtonId)?.name || 'Shapes'} — double-click for all shapes`}
                >
                  <ToolIcon toolId={shapeButtonId} />
                  <span className="canvas-tool-caret">▾</span>
                </button>
                <button
                  type="button"
                  className="canvas-tool-shape-menu-btn"
                  aria-label="All shape tools"
                  onClick={() => setShapeMenuOpen((v) => !v)}
                >
                  ▾
                </button>
                {shapeMenuOpen && (
                  <ShapeFlyout
                    activeTool={activeTool}
                    onSelect={selectTool}
                    isFigma={isFigma}
                    onClose={() => setShapeMenuOpen(false)}
                  />
                )}
              </div>
            ) : (
              group.tools.map((tool) => {
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    className={`canvas-tool-btn ${isActive ? 'active' : ''}`}
                    style={isActive ? { background: activeBg, color: '#fff' } : undefined}
                    onClick={() => selectTool(tool.id)}
                    draggable={tool.mode === 'place'}
                    onDragStart={(e) => {
                      if (tool.mode === 'place') e.dataTransfer.setData('layerType', tool.id);
                    }}
                    title={toolTitle(tool)}
                  >
                    <ToolIcon toolId={tool.id} />
                  </button>
                );
              })
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { ToolIcon };
