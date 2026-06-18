import { useRef, useState, useEffect } from 'react';

export default function CanvasView({
  rootNodeId,
  nodesMap,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onAddNode,
  theme = 'dark',
  isFigma = false,
  activeCanvasTool = 'select',
  setActiveCanvasTool,
  hideToolbar = false,
  onFocus
}) {
  const canvasRef = useRef(null);
  
  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Drag-to-Move Positioning state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ nodeId: '', startX: 0, startY: 0, startLeft: 0, startTop: 0 });

  // Handle inline contentEditable changes
  const handleInlineTextBlur = (nodeId, event) => {
    const textVal = event.target.innerText;
    onUpdateNode(nodeId, { text: textVal });
  };

  // Handle Drag Resizing Start
  const handleResizeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    e.preventDefault();
    
    const node = nodesMap[nodeId];
    if (!node) return;

    const el = document.getElementById(nodeId);
    const currentWidth = typeof node.style.width === 'number' ? node.style.width : el.offsetWidth;
    const currentHeight = typeof node.style.height === 'number' ? node.style.height : el.offsetHeight;

    setIsResizing(true);
    setResizeStart({
      nodeId: nodeId,
      x: e.clientX,
      y: e.clientY,
      width: currentWidth,
      height: currentHeight
    });
  };

  // Handle Drag-to-Move Positioning Start
  const handleDragMoveMouseDown = (e, nodeId) => {
    // Disable drag triggers if clicking resize handle, contentEditable or button controls
    if (e.target.style.cursor === 'se-resize' || e.target.contentEditable === 'true' || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
      return;
    }
    
    e.stopPropagation();
    e.preventDefault();

    const node = nodesMap[nodeId];
    if (!node) return;

    // Check if the node is absolutely positioned (top-level elements)
    if (node.style.position === 'absolute') {
      const currentLeft = typeof node.style.left === 'number' ? node.style.left : 0;
      const currentTop = typeof node.style.top === 'number' ? node.style.top : 0;

      setIsDragging(true);
      setDragStart({
        nodeId: nodeId,
        startX: e.clientX,
        startY: e.clientY,
        startLeft: currentLeft,
        startTop: currentTop
      });

      // Automatically select node on drag click
      onSelectNode(nodeId);
    }
  };

  // Unified Document Mouse Tracking for resizing and absolute movement translation
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        const newWidth = Math.max(40, resizeStart.width + deltaX);
        const newHeight = Math.max(20, resizeStart.height + deltaY);

        const node = nodesMap[resizeStart.nodeId];
        if (node) {
          onUpdateNode(resizeStart.nodeId, {
            style: {
              ...node.style,
              width: newWidth,
              height: newHeight
            }
          });
        }
      } else if (isDragging) {
        const deltaX = e.clientX - dragStart.startX;
        const deltaY = e.clientY - dragStart.startY;

        const newLeft = dragStart.startLeft + deltaX;
        const newTop = dragStart.startTop + deltaY;

        const node = nodesMap[dragStart.nodeId];
        if (node) {
          onUpdateNode(dragStart.nodeId, {
            style: {
              ...node.style,
              left: newLeft,
              top: newTop
            }
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setIsDragging(false);
    };

    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isDragging, resizeStart, dragStart, nodesMap, onUpdateNode]);

  if (!rootNodeId || !nodesMap) {
    return (
      <div className={`canvas-container ${isFigma ? 'canvas-figma-dots' : (theme === 'light' ? 'canvas-grid-light' : 'canvas-grid-dark')}`}>
        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No component active</div>
      </div>
    );
  }

  // Click-to-place dynamic node insertion
  const handleCanvasClick = (e, targetNodeId) => {
    if (!activeCanvasTool || activeCanvasTool === 'select') return;

    e.stopPropagation();
    e.preventDefault();

    let parentId = targetNodeId;
    let targetNode = nodesMap[targetNodeId];
    
    // If we clicked a leaf node, find its parent container
    if (targetNode && (targetNode.type === 'text' || targetNode.type === 'button' || targetNode.type === 'image' || targetNode.type === 'line')) {
      const parent = Object.values(nodesMap).find(n => n.children && n.children.includes(targetNodeId));
      if (parent) {
        parentId = parent.id;
      } else {
        parentId = rootNodeId;
      }
    }

    const targetEl = document.getElementById(parentId);
    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();
    const clickX = Math.round(e.clientX - rect.left);
    const clickY = Math.round(e.clientY - rect.top);

    if (onAddNode) {
      onAddNode(activeCanvasTool, clickX, clickY, parentId);
    }
    if (setActiveCanvasTool) {
      setActiveCanvasTool('select');
    }
  };

  const handleOuterCanvasClick = (e) => {
    if (onFocus) onFocus();
    if (!activeCanvasTool || activeCanvasTool === 'select') {
      onSelectNode(null);
      return;
    }
    
    // Add it inside the root frame container relative to root position
    const rootEl = document.getElementById(rootNodeId);
    if (!rootEl) return;
    
    const rect = rootEl.getBoundingClientRect();
    const clickX = Math.round(e.clientX - rect.left);
    const clickY = Math.round(e.clientY - rect.top);
    
    if (onAddNode) {
      onAddNode(activeCanvasTool, clickX, clickY, rootNodeId);
    }
    if (setActiveCanvasTool) {
      setActiveCanvasTool('select');
    }
  };

  // Handle Drag-and-Drop item creation dropping onto the Canvas coordinates
  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('layerType');
    if (!type) return;

    // Compute coordinates relative to the root container bounds
    const rootEl = document.getElementById(rootNodeId);
    if (!rootEl) return;

    const rect = rootEl.getBoundingClientRect();
    const dropX = Math.round(e.clientX - rect.left - 40);
    const dropY = Math.round(e.clientY - rect.top - 40);

    if (onAddNode) {
      onAddNode(type, dropX, dropY, rootNodeId);
    }
  };

  // Recursive Renderer of tree-node JSX items
  const renderASTNode = (nodeId) => {
    const node = nodesMap[nodeId];
    if (!node) return null;

    const Tag = node.tag || 'div';
    const isSelected = selectedNodeId === nodeId;
    const selectionColor = isFigma ? 'var(--purple-figma)' : 'var(--blue-primary)';

    // Compile node style
    const baseStyle = {
      ...(node.style || {}),
      position: node.style.position || 'relative',
      outline: 'none',
      userSelect: 'none'
    };

    const isEditable = node.type === 'text' || node.type === 'button';
    const isLeaf = isEditable || node.type === 'image' || node.type === 'line';

    // Drag-over and drop handlers for containers (nested dropping support)
    const dragOverProps = !isLeaf ? {
      onDragOver: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      onDrop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const type = e.dataTransfer.getData('layerType');
        if (!type) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const dropX = Math.round(e.clientX - rect.left);
        const dropY = Math.round(e.clientY - rect.top);

        if (onAddNode) {
          onAddNode(type, dropX, dropY, nodeId);
        }
      }
    } : {};

    // Click handler for insertion or selection
    const clickHandler = (e) => {
      e.stopPropagation();
      if (onFocus) onFocus();
      if (activeCanvasTool && activeCanvasTool !== 'select') {
        handleCanvasClick(e, nodeId);
      } else {
        onSelectNode(nodeId);
      }
    };

    // Selection border markup
    const selectionBorderMarkup = isSelected && (
      <div 
        style={{
          position: 'absolute',
          top: -1.5,
          left: -1.5,
          right: -1.5,
          bottom: -1.5,
          border: `1.5px solid ${selectionColor}`,
          pointerEvents: 'none',
          zIndex: 30,
          boxShadow: `0 0 8px ${selectionColor}40`
        }}
      >
        {/* Corner resize handle square */}
        <div 
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 7,
            height: 7,
            background: 'white',
            border: `1.5px solid ${selectionColor}`,
            cursor: 'se-resize',
            pointerEvents: 'auto',
            zIndex: 40
          }}
          onMouseDown={(e) => handleResizeMouseDown(e, nodeId)}
        />
        {/* Outline dimension label */}
        <span 
          style={{
            position: 'absolute',
            top: -18,
            left: -1.5,
            background: selectionColor,
            color: 'white',
            fontSize: '0.55rem',
            fontWeight: 700,
            padding: '1px 4px',
            borderRadius: 2,
            whiteSpace: 'nowrap',
            lineHeight: 1
          }}
        >
          {node.name}
        </span>
      </div>
    );

    // Wrapper for image or line to allow correct overlay placement without violating HTML rules
    if (node.type === 'image' || node.type === 'line') {
      const innerElement = node.type === 'image' ? (
        <img
          src={node.src || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
          style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover', pointerEvents: 'none' }}
          alt=""
        />
      ) : (
        <hr style={{ width: '100%', height: '100%', border: 'none', borderTop: `${node.style.borderTopWidth || 1}px ${node.style.borderStyle || 'solid'} ${node.style.borderColor || '#94a3b8'}`, margin: 0 }} />
      );

      return (
        <div
          key={nodeId}
          id={nodeId}
          onClick={clickHandler}
          onMouseDown={(e) => handleDragMoveMouseDown(e, nodeId)}
          style={{
            ...baseStyle,
            display: 'block',
            overflow: 'visible'
          }}
          className={node.className || ''}
        >
          {innerElement}
          {selectionBorderMarkup}
        </div>
      );
    }

    return (
      <Tag
        key={nodeId}
        id={nodeId}
        onClick={clickHandler}
        onDoubleClick={(e) => {
          if (isLeaf) {
            e.stopPropagation();
          }
        }}
        onMouseDown={(e) => handleDragMoveMouseDown(e, nodeId)}
        contentEditable={isEditable}
        suppressContentEditableWarning={isEditable}
        onBlur={(e) => isEditable && handleInlineTextBlur(nodeId, e)}
        style={baseStyle}
        className={node.className || ''}
        {...dragOverProps}
      >
        {selectionBorderMarkup}

        {/* Leaf values vs children components recursion */}
        {isLeaf ? (
          node.text
        ) : (
          (node.children || []).map(childId => renderASTNode(childId))
        )}
      </Tag>
    );
  };

  const gridClass = isFigma 
    ? 'canvas-figma-dots' 
    : (theme === 'light' ? 'canvas-grid-light' : 'canvas-grid-dark');

  const tools = [
    { 
      id: 'select', 
      name: 'Move / Select', 
      icon: (
        <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 3.01v17.98l4.47-4.47 3.53 7.5 2.12-1-3.53-7.5 6.41-.01L9 3.01z"/>
        </svg>
      ) 
    },
    { 
      id: 'frame', 
      name: 'Frame Container', 
      icon: (
        <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3"/>
        </svg>
      ) 
    },
    { 
      id: 'text', 
      name: 'Text Box', 
      icon: (
        <span style={{ fontSize: '1.05rem', fontWeight: 'bold', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>T</span>
      ) 
    },
    { 
      id: 'button', 
      name: 'CTA Button', 
      icon: (
        <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="6" width="18" height="12" rx="3" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      ) 
    },
    { 
      id: 'image', 
      name: 'Rectangle Image', 
      icon: (
        <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ) 
    },
    { 
      id: 'line', 
      name: 'Line Divider', 
      icon: (
        <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="4" y1="20" x2="20" y2="4" />
        </svg>
      ) 
    }
  ];

  const getCursorStyle = () => {
    if (!activeCanvasTool || activeCanvasTool === 'select') return 'default';
    return 'crosshair';
  };

  return (
    <div 
      className={`canvas-container ${gridClass}`}
      data-tour="canvas"
      ref={canvasRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleCanvasDrop}
      onClick={handleOuterCanvasClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        height: '100%',
        cursor: getCursorStyle()
      }}
    >
      {/* Root board coordinate space */}
      <div style={{ position: 'relative', width: '100%', height: '100%', minWidth: 800, minHeight: 600 }}>
        {renderASTNode(rootNodeId)}
      </div>

      {/* Workspace top status indicator */}
      {!hideToolbar && (
        <div 
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            padding: '6px 12px',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            zIndex: 40,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
          }}
        >
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>WORKSPACE MODE:</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: activeCanvasTool !== 'select' ? '#a78bfa' : '#cbd5e1' }}>
            {activeCanvasTool !== 'select' ? `✏️ Placing ${activeCanvasTool}` : '🖱️ Pointer / Select'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
            {activeCanvasTool !== 'select' 
              ? 'Click inside a container to insert layer' 
              : 'Move elements, resize, or double-click to edit text'}
          </span>
        </div>
      )}

      {/* Figma Floating Bottom Toolbar */}
      {!hideToolbar && (
        <div 
          style={{
            position: 'absolute',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '6px 8px',
            display: 'flex',
            gap: 4,
            alignItems: 'center',
            zIndex: 100,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
          }}
        >
          {activeCanvasTool !== 'select' && (
            <div 
              style={{
                position: 'absolute',
                top: -36,
                left: '50%',
                transform: 'translateX(-50%)',
                background: isFigma ? 'var(--purple-figma)' : 'var(--blue-primary)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: 6,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none'
              }}
            >
              ✏️ Click container to place {activeCanvasTool}
            </div>
          )}

          {tools.map(tool => {
            const isActive = activeCanvasTool === tool.id;
            const activeBg = isFigma ? 'var(--purple-figma)' : 'var(--blue-primary)';
            return (
              <button
                key={tool.id}
                onClick={() => {
                  if (setActiveCanvasTool) {
                    setActiveCanvasTool(tool.id);
                  }
                }}
                draggable={tool.id !== 'select'}
                onDragStart={(e) => {
                  e.dataTransfer.setData('layerType', tool.id);
                }}
                title={`${tool.name} (Click to place or drag onto canvas)`}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: 'none',
                  background: isActive ? activeBg : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                {tool.icon}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}
