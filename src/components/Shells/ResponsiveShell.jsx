import { useState } from 'react';
import CodeEditor from '../CodeEditor';
import ReceiptsPanel from '../ReceiptsPanel';
import LayersPanel from '../LayersPanel';
import InspectorPanel from '../InspectorPanel';
import CanvasView from '../CanvasView';
import CanvasToolbar from '../CanvasToolbar';

export default function ResponsiveShell({
  rootNodeId,
  nodesMap,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onDeleteNode,
  code,
  onCodeChange,
  onAddNode,
  activeCanvasTool,
  setActiveCanvasTool,
  focusedPanel,
  setFocusedPanel,
  activeFile,
  receiptsConfig
}) {
  const node = nodesMap[selectedNodeId];

  // Collapse states
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [codeCollapsed, setCodeCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Dynamic layout grid: code takes up more space if focused, otherwise canvas does.
  // Account for left/right collapses.
  const getGridColumns = () => {
    let col1 = leftCollapsed ? '40px' : '230px';
    let col2 = focusedPanel === 'canvas' ? '1.4fr' : '0.8fr';
    let col3 = focusedPanel === 'canvas' ? '0.8fr' : '1.4fr';
    let col4 = rightCollapsed ? '40px' : '320px';

    if (codeCollapsed) {
      col3 = '40px';
      col2 = '1fr';
    }
    return `${col1} ${col2} ${col3} ${col4}`;
  };

  return (
    <div 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: getGridColumns(), 
        height: '100%', 
        background: '#0b0f19',
        transition: 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      
      {/* 1. Left Layers Panel Sidebar */}
      {leftCollapsed ? (
        <div 
          onClick={() => setLeftCollapsed(false)}
          title="Expand Layers Panel"
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 0',
            cursor: 'pointer',
            background: '#0b0f19',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="vertical-label" style={{ color: '#94a3b8' }}>
            📁 LAYERS
          </div>
          <div className="expand-arrow" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>▶</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255, 255, 255, 0.08)', height: '100%', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', width: 230 }}>
            <LayersPanel
              rootNodeId={rootNodeId}
              nodesMap={nodesMap}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onUpdateNode={onUpdateNode}
              onDeleteNode={onDeleteNode}
            />
          </div>
          <div 
            className="panel-collapse-footer" 
            onClick={() => setLeftCollapsed(true)}
          >
            <span>◀ Collapse Panel</span>
          </div>
        </div>
      )}

      {/* 2. Middle: Multi-device Responsive Viewports */}
      <div 
        onClick={() => setFocusedPanel('canvas')}
        style={{
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          height: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          background: '#090d16',
          minWidth: 0,
          overflow: 'hidden'
        }}
      >
        {/* Workspace top status indicator (single shared) */}
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

        <div 
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '56px 16px 180px 16px',
            backgroundSize: '20px 20px',
            backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Responsive Workbenches (Click layers to resize and position)
          </div>

          {/* Viewports Container */}
          <div 
            style={{ 
              display: 'flex', 
              gap: '24px', 
              alignItems: 'flex-start',
              overflowX: 'auto',
              paddingBottom: '24px'
            }}
          >
            {/* A. MOBILE VIEWPORT (375px) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                <span>📱 Mobile</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>375px</span>
              </div>
              <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: 375, height: 600, overflow: 'auto', border: '1px solid #1e293b', borderRadius: 8 }}>
                <CanvasView
                  rootNodeId={rootNodeId}
                  nodesMap={nodesMap}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={onSelectNode}
                  onUpdateNode={onUpdateNode}
                  onAddNode={onAddNode}
                  activeCanvasTool={activeCanvasTool}
                  setActiveCanvasTool={setActiveCanvasTool}
                  theme="dark"
                  hideToolbar={true}
                  onFocus={() => setFocusedPanel('canvas')}
                />
              </div>
            </div>

            {/* B. TABLET VIEWPORT (768px) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                <span>📟 Tablet</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>768px</span>
              </div>
              <div style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: 422, height: 600, overflow: 'auto', border: '1px solid #1e293b', borderRadius: 8 }}>
                <CanvasView
                  rootNodeId={rootNodeId}
                  nodesMap={nodesMap}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={onSelectNode}
                  onUpdateNode={onUpdateNode}
                  onAddNode={onAddNode}
                  activeCanvasTool={activeCanvasTool}
                  setActiveCanvasTool={setActiveCanvasTool}
                  theme="dark"
                  hideToolbar={true}
                  onFocus={() => setFocusedPanel('canvas')}
                />
              </div>
            </div>

            {/* C. DESKTOP VIEWPORT (1200px) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                <span>🖥️ Desktop</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>1200px</span>
              </div>
              <div style={{ transform: 'scale(0.40)', transformOrigin: 'top left', width: 480, height: 600, overflow: 'auto', border: '1px solid #1e293b', borderRadius: 8 }}>
                <CanvasView
                  rootNodeId={rootNodeId}
                  nodesMap={nodesMap}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={onSelectNode}
                  onUpdateNode={onUpdateNode}
                  onAddNode={onAddNode}
                  activeCanvasTool={activeCanvasTool}
                  setActiveCanvasTool={setActiveCanvasTool}
                  theme="dark"
                  hideToolbar={true}
                  onFocus={() => setFocusedPanel('canvas')}
                />
              </div>
            </div>
          </div>
        </div>

        <CanvasToolbar
          activeTool={activeCanvasTool}
          setActiveTool={setActiveCanvasTool}
        />
      </div>

      {/* 3. Code Editor (middle right) */}
      {codeCollapsed ? (
        <div 
          onClick={() => setCodeCollapsed(false)}
          title="Expand Code Editor"
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 0',
            cursor: 'pointer',
            background: 'var(--vscode-bg-editor)',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            boxSizing: 'border-box'
          }}
        >
          <div className="vertical-label" style={{ color: '#94a3b8' }}>
            📝 {activeFile === 'pricing' ? 'PricingCard.tsx' : 'HeroSection.tsx'}
          </div>
          <div className="expand-arrow" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>◀</div>
        </div>
      ) : (
        <CodeEditor 
          code={code} 
          onChange={onCodeChange} 
          onFocus={() => setFocusedPanel('code')}
          activeFile={activeFile}
          onCollapse={() => setCodeCollapsed(true)}
        />
      )}

      {/* 4. Right Sidebar: Split vertically between Receipts (Audits) and Figma Inspector */}
      {rightCollapsed ? (
        <div 
          onClick={() => setRightCollapsed(false)}
          title="Expand Inspector & Audits"
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 0',
            cursor: 'pointer',
            background: '#111827',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            boxSizing: 'border-box'
          }}
        >
          <div className="vertical-label" style={{ color: '#94a3b8' }}>
            📊 INSPECTOR & AUDITS
          </div>
          <div className="expand-arrow" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>◀</div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: '#111827',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateRows: '1fr 1fr', overflow: 'hidden', width: 320 }}>
            {/* Top: Designer Receipts */}
            <div style={{ overflowY: 'auto', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <ReceiptsPanel
                component={node}
                nodesMap={nodesMap}
                onUpdateNode={onUpdateNode}
                {...receiptsConfig}
              />
            </div>

            {/* Bottom: Figma Inspector */}
            <div style={{ overflowY: 'auto' }}>
              <InspectorPanel
                selectedNodeId={selectedNodeId}
                nodesMap={nodesMap}
                onUpdateNode={onUpdateNode}
              />
            </div>
          </div>
          
          <div 
            className="panel-collapse-footer" 
            onClick={() => setRightCollapsed(true)}
          >
            <span>Collapse Panel ▶</span>
          </div>
        </div>
      )}

    </div>
  );
}
