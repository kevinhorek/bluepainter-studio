import { useState, Fragment } from 'react';
import { getWorkspaceFile } from '../data/workspaceFiles';
import { canDropIntoNode } from '../utils/nodeFactory';

const LAYER_DRAG_TYPE = 'application/x-bluepainter-layers';

export default function LayersPanel({
  rootNodeId,
  nodesMap,
  selectedNodeId,
  selectedNodeIds = null,
  onSelectNode,
  onUpdateNode,
  onReparentNodes = null,
  onDeleteNode,
  onMoveNode,
  onDuplicateNode
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  // Where a dragged layer would land: { id, zone: 'before' | 'after' | 'into' }
  const [dropHint, setDropHint] = useState(null);
  const selectedIds = selectedNodeIds || (selectedNodeId ? [selectedNodeId] : []);

  if (!rootNodeId || !nodesMap) {
    return (
      <div style={{ padding: 16, color: '#64748b', fontSize: '0.8rem' }}>
        No layers available
      </div>
    );
  }

  // Handle layer name edit submit
  const handleRenameSubmit = (id) => {
    if (editName.trim()) {
      onUpdateNode(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  const parentIdOf = (nodeId) => Object.values(nodesMap).find((n) => n?.children?.includes(nodeId))?.id || null;

  // Top quarter = before, bottom quarter = after, middle = into (containers only).
  const dropZoneFor = (e, node) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / Math.max(1, rect.height);
    const intoAllowed = canDropIntoNode(node);
    if (node.id === rootNodeId) return intoAllowed ? 'into' : null;
    if (intoAllowed && ratio > 0.25 && ratio < 0.75) return 'into';
    return ratio < 0.5 ? 'before' : 'after';
  };

  const handleLayerDrop = (e, node) => {
    e.preventDefault();
    e.stopPropagation();
    const zone = dropZoneFor(e, node);
    setDropHint(null);
    let ids;
    try {
      ids = JSON.parse(e.dataTransfer.getData(LAYER_DRAG_TYPE) || '[]');
    } catch {
      return;
    }
    if (!zone || !Array.isArray(ids) || !ids.length || ids.includes(node.id)) return;
    if (zone === 'into') onReparentNodes(ids, node.id, {});
    else {
      const parentId = parentIdOf(node.id);
      if (parentId) onReparentNodes(ids, parentId, zone === 'before' ? { beforeId: node.id } : { afterId: node.id });
    }
  };

  // Icon selector based on node type
  const renderLayerIcon = (type) => {
    switch (type) {
      case 'frame':
        return (
          <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '0.8rem' }}>#</span>
        );
      case 'text':
        return (
          <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.85rem' }}>T</span>
        );
      case 'button':
        return (
          <span style={{ color: '#f43f5e', fontSize: '0.75rem', border: '1px solid #f43f5e', padding: '0 3px', borderRadius: 2 }}>btn</span>
        );
      case 'list':
        return (
          <span style={{ color: '#fbbf24', fontSize: '0.8rem' }}>☰</span>
        );
      case 'list-item':
        return (
          <span style={{ color: '#10b981', fontSize: '0.8rem' }}>•</span>
        );
      case 'component-instance':
        return (
          <span style={{ color: '#a78bfa', fontSize: '0.7rem', fontWeight: 700 }}>◆</span>
        );
      case 'shape':
        return (
          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>▢</span>
        );
      case 'line':
        return (
          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
        );
      case 'image':
        return (
          <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>🖼</span>
        );
      case 'comment':
        return (
          <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>💬</span>
        );
      case 'vector':
        return (
          <span style={{ color: '#a78bfa', fontSize: '0.75rem' }}>✎</span>
        );
      default:
        return <span>▪</span>;
    }
  };

  // Recursive tree walker
  const renderLayerTree = (nodeId, depth = 0) => {
    const node = nodesMap[nodeId];
    if (!node) return null;

    const isInstance = node.type === 'component-instance';
    const displayName = isInstance ? `${node.name} → ${getWorkspaceFile(node.refFile)?.label || node.refFile}` : node.name;
    const isSelected = selectedIds.includes(nodeId);
    const isEditing = editingId === nodeId;
    const canDrag = Boolean(onReparentNodes) && nodeId !== rootNodeId && !isEditing;
    const dropClass = dropHint?.id === nodeId ? `layer-row-drop-${dropHint.zone}` : '';

    return (
      <Fragment key={nodeId}>
        {/* Layer Row */}
        <div 
          className={dropClass}
          onClick={(e) => {
            e.stopPropagation();
            onSelectNode(nodeId, { additive: e.shiftKey || e.metaKey || e.ctrlKey });
          }}
          draggable={canDrag}
          onDragStart={(e) => {
            // Dragging a selected row moves the whole selection.
            const ids = selectedIds.includes(nodeId) ? selectedIds.filter((id) => id !== rootNodeId) : [nodeId];
            e.dataTransfer.setData(LAYER_DRAG_TYPE, JSON.stringify(ids));
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => {
            if (!onReparentNodes || !e.dataTransfer.types.includes(LAYER_DRAG_TYPE)) return;
            const zone = dropZoneFor(e, node);
            if (!zone) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (dropHint?.id !== nodeId || dropHint.zone !== zone) setDropHint({ id: nodeId, zone });
          }}
          onDragLeave={() => { if (dropHint?.id === nodeId) setDropHint(null); }}
          onDragEnd={() => setDropHint(null)}
          onDrop={(e) => onReparentNodes && handleLayerDrop(e, node)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 12px 6px ' + (12 + depth * 16) + 'px',
            background: isSelected ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
            borderLeft: isSelected ? '2px solid var(--purple-figma)' : '2px solid transparent',
            color: isSelected ? 'white' : '#cbd5e1',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: isSelected ? 600 : 400,
            transition: 'all 0.15s',
            userSelect: 'none',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            {renderLayerIcon(node.type)}
            
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleRenameSubmit(nodeId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(nodeId);
                }}
                autoFocus
                style={{
                  background: '#2c2c2c',
                  border: '1px solid var(--purple-figma)',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '2px 4px',
                  borderRadius: 3,
                  outline: 'none',
                  width: '100%'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span 
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingId(nodeId);
                  setEditName(node.name);
                }}
                style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                {displayName}
              </span>
            )}
          </div>

          {/* Reorder / duplicate (selected, non-root layers) */}
          {nodeId !== rootNodeId && isSelected && (onMoveNode || onDuplicateNode) && (
            <span style={{ display: 'inline-flex', gap: 2, marginRight: 4 }}>
              {onMoveNode && (
                <>
                  <button type="button" className="layer-action-btn" title="Move up" aria-label="Move layer up" onClick={(e) => { e.stopPropagation(); onMoveNode(nodeId, -1); }}>↑</button>
                  <button type="button" className="layer-action-btn" title="Move down" aria-label="Move layer down" onClick={(e) => { e.stopPropagation(); onMoveNode(nodeId, 1); }}>↓</button>
                </>
              )}
              {onDuplicateNode && (
                <button type="button" className="layer-action-btn" title="Duplicate" aria-label="Duplicate layer" onClick={(e) => { e.stopPropagation(); onDuplicateNode(nodeId); }}>⧉</button>
              )}
            </span>
          )}

          {/* Delete Layer button (except root frame) */}
          {nodeId !== rootNodeId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNode(nodeId);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '0.8rem',
                opacity: isSelected ? 1 : 0,
                transition: 'opacity 0.2s'
              }}
              className="delete-layer-btn"
              onMouseOver={(e) => e.target.style.color = '#ef4444'}
              onMouseOut={(e) => e.target.style.color = '#64748b'}
            >
              ✕
            </button>
          )}
        </div>

        {/* Render children recursively — component instances pull from source files */}
        {!isInstance && node.children && node.children.map((childId) => renderLayerTree(childId, depth + 1))}
      </Fragment>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #444',
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#94a3b8',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Layers List</span>
        <span style={{ fontSize: '0.65rem', background: '#334155', color: '#cbd5e1', padding: '1px 6px', borderRadius: 4 }}>
          JSX DOM
        </span>
      </div>

      {/* Layers List Tree Scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {renderLayerTree(rootNodeId)}
      </div>

      {/* Helper Footer */}
      <div style={{
        padding: 12,
        borderTop: '1px solid #444',
        fontSize: '0.65rem',
        color: '#64748b',
        lineHeight: 1.3
      }}>
        Double-click a name to rename. Shift-click to select several. Drag a layer to reorder it or drop it into a frame. ⧉ duplicates, Delete removes, ⌘Z undoes.
      </div>
    </div>
  );
}
