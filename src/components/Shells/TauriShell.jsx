import { useState } from 'react';
import CanvasView from '../CanvasView';
import CodeEditor from '../CodeEditor';
import ReceiptsPanel from '../ReceiptsPanel';
import LayersPanel from '../LayersPanel';
import InspectorPanel from '../InspectorPanel';

export default function TauriShell({
  rootNodeId,
  nodesMap,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onDeleteNode,
  code,
  onCodeChange,
  onLoadComponent,
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
    let col3 = rightCollapsed ? '40px' : '300px';

    if (codeCollapsed) {
      col2 = '40px';
      col1 = '1fr';
    }
    return `${col1} ${col2} ${col3}`;
  };

  return (
    <div className="tauri-window">
      
      {/* 1. macOS Titlebar */}
      <div className="tauri-titlebar">
        <div className="tauri-window-controls">
          <div className="window-dot close"></div>
          <div className="window-dot minimize"></div>
          <div className="window-dot maximize"></div>
        </div>
        <div className="tauri-title">
          BluePainter Studio — marketing-site / {activeFile === 'pricing' ? 'PricingCard' : 'HeroSection'}
        </div>
        <div style={{ width: 50 }}></div>
      </div>

      {/* 2. Tauri Menubar */}
      <div className="tauri-menubar">
        <span className="tauri-menu-item" style={{ fontWeight: 700, color: 'var(--blue-primary)' }}>Studio</span>
        <span className="tauri-menu-item">File</span>
        <span className="tauri-menu-item">Edit</span>
        <span className="tauri-menu-item">View</span>
        <span className="tauri-menu-item">Component</span>
        <span className="tauri-menu-item">Help</span>
      </div>

      {/* 3. Main Split View: Sidebar (Library + Layers) | Canvas | Code | Receipts + Inspector */}
      <div className="tauri-main-layout">
        
        {/* Left Sidebar: Components Library AND Layers Panel */}
        <div 
          className="library-pane" 
          style={{ 
            width: leftCollapsed ? 40 : 240, 
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            borderRight: '1px solid var(--tauri-border)',
            background: '#ffffff'
          }}
        >
          {leftCollapsed ? (
            <div 
              className="collapsed-vertical-bar light-bar" 
              onClick={() => setLeftCollapsed(false)}
              title="Expand Library & Layers"
              style={{ background: '#ffffff' }}
            >
              <div className="vertical-label" style={{ color: '#64748b' }}>
                📁 LIBRARY & LAYERS
              </div>
              <div className="expand-arrow" style={{ color: '#64748b', fontSize: '0.85rem' }}>▶</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: 240, flexShrink: 0 }}>
              <div style={{ flex: 1, display: 'grid', gridTemplateRows: '1.2fr 1fr', overflow: 'hidden' }}>
                
                {/* Top Half: Component Library list */}
                <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--tauri-border)', overflowY: 'auto' }}>
                  <div className="library-header">
                    <div className="library-title">Templates & Vector Shapes</div>
                    <span style={{ fontSize: '0.6rem', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Drag Items</span>
                  </div>
                  
                  <div className="library-list" style={{ padding: 12, gap: 8, display: 'flex', flexDirection: 'column' }}>
                    {/* Components switches */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div 
                        className="library-item" 
                        style={{ flex: 1, minHeight: 50, padding: 6, cursor: 'pointer' }}
                        onClick={() => onLoadComponent('pricing')}
                      >
                        <div className="library-item-icon pricing" style={{ width: 20, height: 12 }}></div>
                        <div className="library-item-name" style={{ fontSize: '0.65rem' }}>PricingCard</div>
                      </div>
                      <div 
                        className="library-item" 
                        style={{ flex: 1, minHeight: 50, padding: 6, cursor: 'pointer' }}
                        onClick={() => onLoadComponent('hero')}
                      >
                        <div className="library-item-icon hero" style={{ width: 20, height: 12 }}></div>
                        <div className="library-item-name" style={{ fontSize: '0.65rem' }}>HeroSection</div>
                      </div>
                    </div>

                    {/* Draggable Vector Elements */}
                    <div 
                      className="library-item" 
                      style={{ minHeight: 48, padding: 6, cursor: 'grab', display: 'flex', flexDirection: 'row', gap: 10, justifyContent: 'flex-start' }}
                      draggable="true"
                      onDragStart={(e) => { e.dataTransfer.setData('layerType', 'frame'); }}
                    >
                      <div className="library-item-icon pricing" style={{ width: 20, height: 14, borderStyle: 'dashed' }}></div>
                      <div className="library-item-name" style={{ fontSize: '0.7rem' }}>📁 Frame Container</div>
                    </div>

                    <div 
                      className="library-item" 
                      style={{ minHeight: 48, padding: 6, cursor: 'grab', display: 'flex', flexDirection: 'row', gap: 10, justifyContent: 'flex-start' }}
                      draggable="true"
                      onDragStart={(e) => { e.dataTransfer.setData('layerType', 'text'); }}
                    >
                      <div className="library-item-icon hero" style={{ width: 20, height: 14, borderStyle: 'dotted' }}></div>
                      <div className="library-item-name" style={{ fontSize: '0.7rem' }}>📝 Text Box</div>
                    </div>

                    <div 
                      className="library-item" 
                      style={{ minHeight: 48, padding: 6, cursor: 'grab', display: 'flex', flexDirection: 'row', gap: 10, justifyContent: 'flex-start' }}
                      draggable="true"
                      onDragStart={(e) => { e.dataTransfer.setData('layerType', 'button'); }}
                    >
                      <div className="library-item-icon button" style={{ width: 20, height: 12 }}></div>
                      <div className="library-item-name" style={{ fontSize: '0.7rem' }}>🔘 CTA Button</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Half: Layers Panel */}
                <div style={{ overflowY: 'auto', background: '#1e1e24', color: 'white' }}>
                  <LayersPanel
                    rootNodeId={rootNodeId}
                    nodesMap={nodesMap}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={onSelectNode}
                    onUpdateNode={onUpdateNode}
                    onDeleteNode={onDeleteNode}
                  />
                </div>

              </div>
              <div 
                className="tauri-light-collapse-footer" 
                onClick={() => setLeftCollapsed(true)}
              >
                <span>◀ Collapse Panel</span>
              </div>
            </div>
          )}
        </div>

        {/* Center Canvas, Code, and Right Inspector Split */}
        <div style={{ 
          flex: 1, 
          display: 'grid', 
          gridTemplateColumns: getGridColumns(), 
          height: '100%',
          transition: 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}>
          
          {/* Canvas (Light Grid) */}
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
            theme="light"
          />

          {/* Code Editor */}
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
                background: 'var(--tauri-editor-bg)',
                borderRight: '1px solid var(--tauri-border)',
                borderLeft: '1px solid var(--tauri-border)',
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
              className="collapsed-vertical-bar light-bar" 
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
                background: '#ffffff',
                borderLeft: '1px solid var(--tauri-border)',
                boxSizing: 'border-box'
              }}
            >
              <div className="vertical-label" style={{ color: '#64748b' }}>
                📊 INSPECTOR & AUDITS
              </div>
              <div className="expand-arrow" style={{ color: '#64748b', fontSize: '0.85rem' }}>◀</div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              background: '#ffffff',
              borderLeft: '1px solid var(--tauri-border)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ flex: 1, display: 'grid', gridTemplateRows: '1fr 1fr', overflow: 'hidden', width: 300 }}>
                {/* Top: Designer Receipts */}
                <div style={{ overflowY: 'auto', borderBottom: '1px solid var(--tauri-border)' }}>
                  <ReceiptsPanel
                    component={node}
                    nodesMap={nodesMap}
                    onUpdateNode={onUpdateNode}
                    lightMode={true}
                  />
                </div>

                {/* Bottom: Figma Inspector */}
                <div style={{ overflowY: 'auto', background: '#f8fafc', color: '#1e293b' }}>
                  <InspectorPanel
                    selectedNodeId={selectedNodeId}
                    nodesMap={nodesMap}
                    onUpdateNode={onUpdateNode}
                  />
                </div>
              </div>
              
              <div 
                className="tauri-light-collapse-footer" 
                onClick={() => setRightCollapsed(true)}
              >
                <span>Collapse Panel ▶</span>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 4. Bottom status bar */}
      <div className="tauri-bottom-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
          <span style={{ color: '#10b981' }}>●</span>
          <span>marketing-site</span>
          <span style={{ color: '#94a3b8' }}>/</span>
          <span style={{ color: '#0f172a' }}>main</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="tauri-bottom-btn">
            Open in Figma ↗
          </button>
          <button className="tauri-bottom-btn">
            Open in VS Code ↗
          </button>
        </div>
      </div>

    </div>
  );
}
