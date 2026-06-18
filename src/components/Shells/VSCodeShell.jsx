import { useState } from 'react';
import CanvasView from '../CanvasView';
import CodeEditor from '../CodeEditor';
import ReceiptsPanel from '../ReceiptsPanel';
import LayersPanel from '../LayersPanel';
import InspectorPanel from '../InspectorPanel';

export default function VSCodeShell({
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
  activeFile
}) {
  const node = nodesMap[selectedNodeId];

  // Collapse states
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [codeCollapsed, setCodeCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Dynamic layout grid: code takes up more space if focused, otherwise canvas does.
  // Shrinks collapsed panels to 40px.
  const getGridColumns = () => {
    let col1 = focusedPanel === 'canvas' ? '1.4fr' : '0.8fr';
    let col2 = focusedPanel === 'canvas' ? '0.8fr' : '1.4fr';
    let col3 = rightCollapsed ? '40px' : '320px';

    if (codeCollapsed) {
      col2 = '40px';
      col1 = '1fr';
    }
    return `${col1} ${col2} ${col3}`;
  };

  return (
    <div className="vscode-workspace">
      
      {/* 1. Left Activity Bar */}
      <div className="vscode-activitybar">
        <div className="activity-icon active">
          <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
          </svg>
        </div>
        <div className="activity-icon">
          <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="activity-icon" style={{ marginTop: 'auto', marginBottom: '16px' }}>
          <div style={{ width: 20, height: 20, background: 'var(--purple-figma)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>BP</span>
          </div>
        </div>
      </div>

      {/* 2. VS Code Left Sidebar (Renders Left Layers Panel Tree) */}
      <div 
        className="vscode-sidebar" 
        style={{ 
          width: leftCollapsed ? 40 : 230,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}
      >
        {leftCollapsed ? (
          <div 
            className="collapsed-vertical-bar" 
            onClick={() => setLeftCollapsed(false)}
            title="Expand Layers Panel"
            style={{ background: 'var(--vscode-sidebar)' }}
          >
            <div className="vertical-label" style={{ color: '#94a3b8' }}>
              📁 LAYERS
            </div>
            <div className="expand-arrow" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>▶</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: 230, flexShrink: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
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
      </div>

      {/* 3. Main Split Viewport: Canvas | Code | Receipts & Inspector split */}
      <div 
        className="vscode-editor-area" 
        style={{ 
          gridTemplateColumns: getGridColumns(),
          transition: 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        
        {/* Left Canvas (Dark) */}
        <CanvasView
          rootNodeId={rootNodeId}
          nodesMap={nodesMap}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          onUpdateNode={onUpdateNode}
          onAddNode={onAddNode}
          activeCanvasTool={activeCanvasTool}
          setActiveCanvasTool={setActiveCanvasTool}
          onFocus={() => setFocusedPanel('canvas')}
          theme="dark"
        />

        {/* Middle Code Editor */}
        {codeCollapsed ? (
          <div 
            className="collapsed-vertical-bar" 
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
              borderRight: '1px solid rgba(255,255,255,0.08)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
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

        {/* Right Pane: Split vertically between Receipts (Audits) and Figma Inspector */}
        {rightCollapsed ? (
          <div 
            className="collapsed-vertical-bar" 
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
              borderLeft: '1px solid rgba(255,255,255,0.08)',
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
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateRows: '1fr 1fr', overflow: 'hidden', width: 320 }}>
              {/* Top: Designer Receipts */}
              <div style={{ overflowY: 'auto', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <ReceiptsPanel
                  component={node}
                  nodesMap={nodesMap}
                  onUpdateNode={onUpdateNode}
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

            {/* Collapse Footer */}
            <div 
              className="panel-collapse-footer" 
              onClick={() => setRightCollapsed(true)}
            >
              <span>Collapse Panel ▶</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
