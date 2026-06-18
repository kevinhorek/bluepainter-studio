import { useState, Fragment } from 'react';

export default function LayersPanel({
  rootNodeId,
  nodesMap,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onDeleteNode
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

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
      default:
        return <span>▪</span>;
    }
  };

  // Recursive tree walker
  const renderLayerTree = (nodeId, depth = 0) => {
    const node = nodesMap[nodeId];
    if (!node) return null;

    const isSelected = selectedNodeId === nodeId;
    const isEditing = editingId === nodeId;

    return (
      <Fragment key={nodeId}>
        {/* Layer Row */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onSelectNode(nodeId);
          }}
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
                {node.name}
              </span>
            )}
          </div>

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

        {/* Render children recursively */}
        {node.children && node.children.map(childId => renderLayerTree(childId, depth + 1))}
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
        💡 Double-click layer name to rename. Selected layer will highlight in Canvas.
      </div>
    </div>
  );
}
