import { useState } from 'react';
import CanvasView from '../CanvasView';
import CodeEditor from '../CodeEditor';
import ReceiptsPanel from '../ReceiptsPanel';
import LayersPanel from '../LayersPanel';
import InspectorPanel from '../InspectorPanel';

export default function FigmaShell({
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
  setActiveCanvasTool
}) {
  const [activePluginTab, setActivePluginTab] = useState('canvas'); // 'canvas' (Layers + Inspector), 'code', 'receipts'
  const [syncBack, setSyncBack] = useState(true);
  const node = nodesMap[selectedNodeId];

  return (
    <div className="figma-editor">
      
      {/* 1. Figma Toolbar on Top */}
      <div className="figma-toolbar">
        <div className="figma-toolbar-left">
          <div className="figma-tool-icon">
            <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </div>
          <div className="figma-tool-icon" style={{ color: 'var(--purple-figma)' }}>
            <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 3.01v17.98l4.47-4.47 3.53 7.5 2.12-1-3.53-7.5 6.41-.01L9 3.01z"/>
            </svg>
          </div>
          <div className="figma-tool-icon">
            <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h7v7H4zm0 9h7v7H4zm9-9h7v7h-7zm0 9h7v7h-7z"/>
            </svg>
          </div>
          <div className="figma-tool-icon">
            <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </div>
          <div className="figma-tool-icon">
            <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 4v3h5.5v12h3V7H19V4H5z"/>
            </svg>
          </div>
        </div>

        {/* Path Label */}
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ color: 'var(--purple-figma)' }}>●</span>
          <span>Figma</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>Marketing Site</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: '#a78bfa' }}>PricingCard frame</span>
        </div>

        {/* Toolbar Right */}
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>100%</span>
          <span style={{ background: '#1e1e1e', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>⌘+/</span>
        </div>
      </div>

      {/* 2. Figma Canvas Work Area */}
      <div className="figma-canvas-area">
        
        {/* Render Canvas in Figma Grid Mode */}
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', paddingRight: '440px' }}>
          <CanvasView
            rootNodeId={rootNodeId}
            nodesMap={nodesMap}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            onUpdateNode={onUpdateNode}
            onAddNode={onAddNode}
            activeCanvasTool={activeCanvasTool}
            setActiveCanvasTool={setActiveCanvasTool}
            isFigma={true}
          />
        </div>

        {/* 3. FLOATING FIGMA PLUGIN WINDOW */}
        <div className="figma-plugin-window">
          
          {/* Plugin Header */}
          <div className="figma-plugin-header">
            <div className="figma-plugin-logo">
              <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: 700 }}>BP</span>
            </div>
            <div className="figma-plugin-title">BluePainter</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 500 }}>v0.4.2</span>
              <span className="figma-plugin-tag">Plugin</span>
            </div>
          </div>

          {/* Sync Header Info */}
          <div className="figma-banner">
            <div className="figma-banner-title">
              <span>✨ Round-trip this frame to React code</span>
            </div>
            <div className="figma-banner-text">
              Figma layer edits compile immediately to AST code, and code edits sync back to Figma vector elements.
            </div>
          </div>

          {/* Plugin Window Tabs */}
          <div className="figma-tabs">
            <button 
              className={`figma-tab-btn ${activePluginTab === 'canvas' ? 'active' : ''}`}
              onClick={() => setActivePluginTab('canvas')}
            >
              Layers & Props
            </button>
            <button 
              className={`figma-tab-btn ${activePluginTab === 'code' ? 'active' : ''}`}
              onClick={() => setActivePluginTab('code')}
            >
              Code
            </button>
            <button 
              className={`figma-tab-btn ${activePluginTab === 'receipts' ? 'active' : ''}`}
              onClick={() => setActivePluginTab('receipts')}
            >
              Receipts
            </button>
          </div>

          {/* Plugin Tab Content Container */}
          <div className="figma-plugin-content">
            {activePluginTab === 'code' && (
              <CodeEditor 
                code={code} 
                onChange={onCodeChange} 
              />
            )}

            {activePluginTab === 'receipts' && (
              <ReceiptsPanel 
                component={node} 
                nodesMap={nodesMap}
                onUpdateNode={onUpdateNode}
                lightMode={true} 
              />
            )}

            {activePluginTab === 'canvas' && (
              <div style={{ display: 'grid', gridTemplateRows: '1.2fr 2fr', height: '100%', overflow: 'hidden' }}>
                {/* Layers Tree */}
                <div style={{ overflowY: 'auto', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <LayersPanel
                    rootNodeId={rootNodeId}
                    nodesMap={nodesMap}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={onSelectNode}
                    onUpdateNode={onUpdateNode}
                    onDeleteNode={onDeleteNode}
                  />
                </div>

                {/* CSS Inspector Controls (with light background style) */}
                <div style={{ overflowY: 'auto', background: '#ffffff', color: '#1f2937' }}>
                  <InspectorPanel
                    selectedNodeId={selectedNodeId}
                    nodesMap={nodesMap}
                    onUpdateNode={onUpdateNode}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Plugin Footer controls */}
          <div className="figma-plugin-footer">
            <div className="figma-toggle-group">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={syncBack} 
                  onChange={(e) => setSyncBack(e.target.checked)} 
                />
                <span className="slider-round"></span>
              </label>
              <span>Sync changes back to Figma</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
