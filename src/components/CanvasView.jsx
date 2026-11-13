import { useRef, useState, useEffect } from 'react';
import { getWorkspaceFile } from '../data/workspaceFiles';
import { isPlacableTool, getCanvasTool } from '../data/canvasTools';
import { isLeafNode } from '../utils/nodeFactory';
import CanvasToolbar from './CanvasToolbar';

export default function CanvasView({
  rootNodeId,
  nodesMap,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onAddNode,
  onAddComponentInstance = null,
  theme = 'dark',
  isFigma = false,
  activeCanvasTool = 'select',
  setActiveCanvasTool,
  hideToolbar = false,
  onFocus,
  pageViewport = null,
  componentLibrary = null,
  onOpenComponentFile = null
}) {
  const canvasRef = useRef(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const [zoom, setZoom] = useState(1);
  const clampZoom = (z) => Math.min(4, Math.max(0.25, Math.round(z * 100) / 100));
  const zoomBy = (factor) => setZoom((z) => clampZoom(z * factor));

  // Ctrl/⌘ + wheel (and trackpad pinch) zooms the artboard instead of the page.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => Math.min(4, Math.max(0.25, Math.round(z * (e.deltaY < 0 ? 1.1 : 1 / 1.1) * 100) / 100)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);
  
  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Drag-to-Move Positioning state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ nodeId: '', startX: 0, startY: 0, startLeft: 0, startTop: 0 });

  // Handle inline contentEditable changes
  const handleInlineTextBlur = (nodeId, event) => {
    // The selection outline + name label live inside the editable element, so
    // read the text from a copy with that chrome removed (otherwise the layer
    // name gets appended to the text on every blur).
    const clone = event.currentTarget.cloneNode(true);
    clone.querySelectorAll('[data-canvas-chrome]').forEach((el) => el.remove());
    const textVal = (clone.innerText ?? clone.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (textVal === (nodesMap[nodeId]?.text ?? '')) return;
    onUpdateNode(nodeId, { text: textVal });
  };

  // Handle Drag Resizing Start
  const handleResizeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    e.preventDefault();
    
    const node = nodesMap[nodeId];
    if (!node) return;

    const el = document.getElementById(nodeId);
    const style = node.style || {};
    const currentWidth = typeof style.width === 'number' ? style.width : (el?.offsetWidth ?? 40);
    const currentHeight = typeof style.height === 'number' ? style.height : (el?.offsetHeight ?? 20);

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
    if (node.style?.position === 'absolute') {
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
        const deltaX = (e.clientX - resizeStart.x) / zoom;
        const deltaY = (e.clientY - resizeStart.y) / zoom;

        const newWidth = Math.round(Math.max(40, resizeStart.width + deltaX));
        const newHeight = Math.round(Math.max(20, resizeStart.height + deltaY));

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
        const deltaX = (e.clientX - dragStart.startX) / zoom;
        const deltaY = (e.clientY - dragStart.startY) / zoom;

        const newLeft = Math.round(dragStart.startLeft + deltaX);
        const newTop = Math.round(dragStart.startTop + deltaY);

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
  }, [isResizing, isDragging, resizeStart, dragStart, nodesMap, onUpdateNode, zoom]);

  useEffect(() => {
    if (activeCanvasTool !== 'hand') return;

    const handlePanMove = (e) => {
      if (!isPanning) return;
      setPanOffset({
        x: panStartRef.current.offsetX + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.offsetY + (e.clientY - panStartRef.current.y)
      });
    };

    const handlePanUp = () => setIsPanning(false);

    if (isPanning) {
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanUp);
    }
    return () => {
      document.removeEventListener('mousemove', handlePanMove);
      document.removeEventListener('mouseup', handlePanUp);
    };
  }, [activeCanvasTool, isPanning]);

  const handlePanStart = (e) => {
    if (activeCanvasTool !== 'hand') return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: panOffset.x,
      offsetY: panOffset.y
    };
  };

  if (!rootNodeId || !nodesMap) {
    return (
      <div className={`canvas-container ${isFigma ? 'canvas-figma-dots' : (theme === 'light' ? 'canvas-grid-light' : 'canvas-grid-dark')}`}>
        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No component active</div>
      </div>
    );
  }

  // Click-to-place dynamic node insertion
  const handleCanvasClick = (e, targetNodeId) => {
    if (activeCanvasTool === 'hand' || activeCanvasTool === 'scale') return;
    if (!isPlacableTool(activeCanvasTool)) return;

    e.stopPropagation();
    e.preventDefault();

    let parentId = targetNodeId;
    let targetNode = nodesMap[targetNodeId];
    
    // If we clicked a leaf node, find its parent container
    if (targetNode && isLeafNode(targetNode)) {
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
    const clickX = Math.round((e.clientX - rect.left) / zoom);
    const clickY = Math.round((e.clientY - rect.top) / zoom);

    if (onAddNode) {
      onAddNode(activeCanvasTool, clickX, clickY, parentId);
    }
    if (setActiveCanvasTool) {
      setActiveCanvasTool('select');
    }
  };

  const handleOuterCanvasClick = (e) => {
    if (onFocus) onFocus();
    if (activeCanvasTool === 'hand') return;
    if (activeCanvasTool === 'scale') {
      zoomBy(e.altKey ? 1 / 1.25 : 1.25); // Zoom tool: click to zoom in, Alt-click to zoom out
      return;
    }
    if (!isPlacableTool(activeCanvasTool)) {
      if (activeCanvasTool === 'select') onSelectNode(null);
      return;
    }
    
    // Add it inside the root frame container relative to root position
    const rootEl = document.getElementById(rootNodeId);
    if (!rootEl) return;
    
    const rect = rootEl.getBoundingClientRect();
    const clickX = Math.round((e.clientX - rect.left) / zoom);
    const clickY = Math.round((e.clientY - rect.top) / zoom);
    
    if (onAddNode) {
      onAddNode(activeCanvasTool, clickX, clickY, rootNodeId);
    }
    if (setActiveCanvasTool) {
      setActiveCanvasTool('select');
    }
  };

  // Handle Drag-and-Drop item creation dropping onto the Canvas coordinates
  const tryComponentDrop = (e, parentId) => {
    const componentRef = e.dataTransfer.getData('componentRef');
    if (!componentRef || !onAddComponentInstance) return false;
    onAddComponentInstance(componentRef, parentId);
    return true;
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    if (tryComponentDrop(e, rootNodeId)) return;

    const type = e.dataTransfer.getData('layerType');
    if (!type) return;

    // Compute coordinates relative to the root container bounds
    const rootEl = document.getElementById(rootNodeId);
    if (!rootEl) return;

    const rect = rootEl.getBoundingClientRect();
    const dropX = Math.round((e.clientX - rect.left) / zoom - 40);
    const dropY = Math.round((e.clientY - rect.top) / zoom - 40);

    if (onAddNode) {
      onAddNode(type, dropX, dropY, rootNodeId);
    }
  };

  // Recursive Renderer of tree-node JSX items
  const renderASTNode = (nodeId, sourceMap = nodesMap, embedRootId = null) => {
    const node = sourceMap[nodeId];
    if (!node) return null;

    const isEmbeddedRoot = embedRootId === nodeId;
    const isSelected = selectedNodeId === nodeId && sourceMap === nodesMap;
    const selectionColor = isFigma ? 'var(--purple-figma)' : 'var(--blue-primary)';

    if (node.type === 'component-instance') {
      const refConfig = getWorkspaceFile(node.refFile);
      const refNodes = componentLibrary?.[node.refFile];
      const wrapperStyle = {
        ...(node.style || {}),
        position: 'relative',
        outline: 'none',
        userSelect: 'none'
      };

      const clickHandler = (e) => {
        e.stopPropagation();
        if (onFocus) onFocus();
        onSelectNode(nodeId);
      };

      const selectionBorderMarkup = isSelected && (
        <div
          data-canvas-chrome=""
          style={{
            position: 'absolute',
            inset: -1.5,
            border: `1.5px solid ${selectionColor}`,
            pointerEvents: 'none',
            zIndex: 30,
            boxShadow: `0 0 8px ${selectionColor}40`,
            borderRadius: 4
          }}
        >
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
            {refConfig.label}
          </span>
        </div>
      );

      return (
        <div
          key={nodeId}
          id={nodeId}
          onClick={clickHandler}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onOpenComponentFile?.(node.refFile);
          }}
          style={wrapperStyle}
          className="component-instance-wrap"
          title={`Double-click to edit ${refConfig.label}`}
        >
          {selectionBorderMarkup}
          {refNodes ? (
            <div className="component-instance-preview" style={{ pointerEvents: 'none' }}>
              {renderASTNode(refConfig.rootId, refNodes, refConfig.rootId)}
            </div>
          ) : (
            <div className="component-instance-missing">Missing {refConfig.label}</div>
          )}
        </div>
      );
    }

    const Tag = node.tag || 'div';
    // Compile node style
    const baseStyle = {
      ...(node.style || {}),
      position: isEmbeddedRoot ? 'relative' : (node.style?.position || 'relative'),
      left: isEmbeddedRoot ? 0 : node.style?.left,
      top: isEmbeddedRoot ? 0 : node.style?.top,
      outline: 'none',
      userSelect: 'none'
    };

    const isEditable = node.type === 'text' || node.type === 'button' || node.type === 'list-item' || node.type === 'comment';
    const isLeaf = isLeafNode(node);
    const dragOverProps = !isLeaf ? {
      onDragOver: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      onDrop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (tryComponentDrop(e, nodeId)) return;

        const type = e.dataTransfer.getData('layerType');
        if (!type) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const dropX = Math.round((e.clientX - rect.left) / zoom);
        const dropY = Math.round((e.clientY - rect.top) / zoom);

        if (onAddNode) {
          onAddNode(type, dropX, dropY, nodeId);
        }
      }
    } : {};

    // Click handler for insertion or selection
    const clickHandler = (e) => {
      e.stopPropagation();
      if (onFocus) onFocus();
      if (activeCanvasTool === 'scale') {
        zoomBy(e.altKey ? 1 / 1.25 : 1.25);
      } else if (activeCanvasTool && isPlacableTool(activeCanvasTool)) {
        handleCanvasClick(e, nodeId);
      } else {
        onSelectNode(nodeId);
      }
    };

    // Selection border markup
    const selectionBorderMarkup = isSelected && (
      <span 
        data-canvas-chrome=""
        contentEditable={false}
        style={{
          display: 'block',
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
        <span 
          style={{
            display: 'block',
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
      </span>
    );

    // Wrapper for image, line, shape, comment, vector
    if (node.type === 'image' || node.type === 'line' || node.type === 'shape' || node.type === 'comment' || node.type === 'vector') {
      let innerElement = null;

      if (node.type === 'image') {
        innerElement = (
          <img
            src={node.src || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
            style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover', pointerEvents: 'none' }}
            alt=""
          />
        );
      } else if (node.type === 'line') {
        innerElement = (
          <hr style={{ width: '100%', height: '100%', border: 'none', borderTop: `${node.style.borderTopWidth || 1}px ${node.style.borderStyle || 'solid'} ${node.style.borderColor || '#94a3b8'}`, margin: 0 }} />
        );
      } else if (node.type === 'shape' && node.shapeKind === 'arrow') {
        innerElement = (
          <svg width="100%" height="100%" viewBox="0 0 120 24" preserveAspectRatio="none" style={{ pointerEvents: 'none' }}>
            <line x1="4" y1="12" x2="100" y2="12" stroke={node.style.borderColor || '#64748b'} strokeWidth="2" />
            <polyline points="92,6 104,12 92,18" fill="none" stroke={node.style.borderColor || '#64748b'} strokeWidth="2" />
          </svg>
        );
      } else if (node.type === 'shape') {
        innerElement = null;
      } else if (node.type === 'comment') {
        innerElement = (
          <div className="canvas-comment-pin" style={{ pointerEvents: 'none' }}>
            <span className="canvas-comment-dot" />
            <div className="canvas-comment-bubble">{node.text || 'Comment'}</div>
          </div>
        );
      } else if (node.type === 'vector') {
        innerElement = (
          <svg width="100%" height="100%" viewBox="0 0 140 80" preserveAspectRatio="none" style={{ pointerEvents: 'none' }}>
            <path
              d={node.path || 'M 8 60 Q 40 10, 80 40'}
              fill="none"
              stroke={node.vectorKind === 'pencil' ? '#64748b' : 'var(--blue-primary)'}
              strokeWidth={node.vectorKind === 'pencil' ? 1.5 : 2}
              strokeLinecap="round"
            />
          </svg>
        );
      }

      return (
        <div
          key={nodeId}
          id={nodeId}
          onClick={clickHandler}
          onMouseDown={(e) => handleDragMoveMouseDown(e, nodeId)}
          style={{
            ...baseStyle,
            display: 'block',
            overflow: node.type === 'comment' ? 'visible' : 'visible'
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
        // Remount editable leaves when their text changes: the browser rewrites the
        // DOM inside contentEditable, so React can't safely patch the old text node.
        key={isEditable ? `${nodeId}:${node.text ?? ''}` : nodeId}
        id={nodeId}
        onClick={clickHandler}
        onDoubleClick={(e) => {
          if (isLeaf) {
            e.stopPropagation();
          }
        }}
        onMouseDown={(e) => handleDragMoveMouseDown(e, nodeId)}
        contentEditable={isEditable && sourceMap === nodesMap}
        suppressContentEditableWarning={isEditable}
        onBlur={(e) => isEditable && sourceMap === nodesMap && handleInlineTextBlur(nodeId, e)}
        onKeyDown={(e) => {
          if (!isEditable) return;
          // Enter commits instead of inserting <div>/<br> into a single-line label.
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        style={baseStyle}
        className={node.className || ''}
        {...dragOverProps}
      >
        {selectionBorderMarkup}

        {/* Leaf values vs children components recursion */}
        {isLeaf ? (
          node.text || (node.placeholder ? (
            <span data-canvas-chrome="" contentEditable={false} className="canvas-dynamic-placeholder">{node.placeholder}</span>
          ) : node.text)
        ) : !(node.children || []).length && node.placeholder ? (
          <span data-canvas-chrome="" className="canvas-dynamic-placeholder">{node.placeholder}</span>
        ) : (
          (node.children || []).map((childId) => renderASTNode(childId, sourceMap, embedRootId))
        )}
      </Tag>
    );
  };

  const gridClass = isFigma 
    ? 'canvas-figma-dots' 
    : (theme === 'light' ? 'canvas-grid-light' : 'canvas-grid-dark');

  const getCursorStyle = () => {
    if (activeCanvasTool === 'hand') return isPanning ? 'grabbing' : 'grab';
    if (activeCanvasTool === 'scale') return 'zoom-in';
    if (isPlacableTool(activeCanvasTool)) return 'crosshair';
    return 'default';
  };

  const activeToolMeta = getCanvasTool(activeCanvasTool);
  const isPageView = Boolean(pageViewport);

  return (
    <div 
      className={`canvas-container ${gridClass} ${isPageView ? 'canvas-page-view' : ''}`}
      data-tour="canvas"
      ref={canvasRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleCanvasDrop}
      onClick={handleOuterCanvasClick}
      onMouseDown={handlePanStart}
      style={{
        display: 'flex',
        // Start-aligned + auto margins on the board: centres when there's room, but
        // never overflows off the top/left edge where it can't be scrolled to.
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        padding: isPageView ? 24 : 40,
        height: '100%',
        cursor: getCursorStyle()
      }}
    >
      {/* Root board coordinate space */}
      <div
        id={isPageView ? 'canvas-page-frame' : undefined}
        style={{
        position: 'relative',
        width: isPageView ? pageViewport.width : '100%',
        height: isPageView ? pageViewport.height : '100%',
        minWidth: isPageView ? pageViewport.width : 800,
        minHeight: isPageView ? pageViewport.height : 600,
        flexShrink: 0,
        zoom,
        margin: isPageView ? 0 : 'auto',
        transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
      }}>
        {renderASTNode(rootNodeId)}
      </div>

      {/* Canvas status */}
      {!hideToolbar && (
        <div className="canvas-status-bar">
          {isPageView ? (
            <>
              <span className="canvas-status-label">Page</span>
              <span className="canvas-status-value">{pageViewport.width} × {pageViewport.height}</span>
            </>
          ) : (
            <>
              <span className="canvas-status-label">Component</span>
              <span className="canvas-status-value">
                {activeToolMeta ? activeToolMeta.name : 'Select'}
              </span>
            </>
          )}
        </div>
      )}

      <div className="canvas-zoom" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => zoomBy(1 / 1.25)} title="Zoom out (⌘ + scroll)" aria-label="Zoom out">−</button>
        <button type="button" className="canvas-zoom-value" onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }} title="Reset zoom and pan">
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" onClick={() => zoomBy(1.25)} title="Zoom in (⌘ + scroll)" aria-label="Zoom in">+</button>
      </div>

      {!hideToolbar && (
        <CanvasToolbar
          activeTool={activeCanvasTool}
          setActiveTool={setActiveCanvasTool}
          isFigma={isFigma}
        />
      )}

    </div>
  );
}
