import { useState } from 'react';
import CanvasView from '../CanvasView';
import CodeEditor from '../CodeEditor';
import ReceiptsPanel from '../ReceiptsPanel';
import LayersPanel from '../LayersPanel';
import InspectorPanel from '../InspectorPanel';
import DetailDrawer from '../DetailDrawer';
import ReceiptMessageBar from '../ReceiptMessageBar';
import { evaluateReceipts } from '../../utils/receiptPolicy';

import ComponentLibrary from '../ComponentLibrary';

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
  onAddComponentInstance,
  activeCanvasTool,
  setActiveCanvasTool,
  setFocusedPanel,
  activeFile,
  fileConfig,
  componentLibrary,
  onOpenComponentFile,
  receiptsConfig
}) {
  const node = nodesMap[selectedNodeId];
  const [paneLayout, setPaneLayout] = useState('split');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('inspect');
  const [highlightRuleId, setHighlightRuleId] = useState(null);

  const { policy, dismissedRules } = receiptsConfig;
  const { rules } = node
    ? evaluateReceipts(nodesMap, node, policy, dismissedRules)
    : { rules: [] };

  const openDrawer = (tab) => {
    setDrawerTab(tab);
    setDrawerOpen(true);
  };

  const handleSelectNode = (id) => {
    onSelectNode(id);
    if (id) openDrawer('inspect');
  };

  const expandDesign = () => {
    setPaneLayout((prev) => (prev === 'design' ? 'split' : 'design'));
    setFocusedPanel('canvas');
  };

  const expandCode = () => {
    setPaneLayout((prev) => (prev === 'code' ? 'split' : 'code'));
    setFocusedPanel('code');
  };

  const restoreFromCollapsed = (target) => {
    setPaneLayout(target === 'design' ? 'design' : 'code');
    setFocusedPanel(target);
  };

  const designCollapsed = paneLayout === 'code';
  const codeCollapsed = paneLayout === 'design';

  return (
    <div className="studio-shell">
      <div className={`studio-main studio-layout-${paneLayout}`}>
        <div className={`studio-canvas-pane ${designCollapsed ? 'is-collapsed' : ''}`}>
          {designCollapsed ? (
            <button
              type="button"
              className="studio-pane-collapsed"
              onClick={() => restoreFromCollapsed('design')}
              title="Expand design view"
            >
              <span className="vertical-label">Design</span>
              <span className="expand-arrow">▶</span>
            </button>
          ) : (
            <>
              <div className="studio-pane-bar">
                <div className="studio-pane-bar-title">
                  <span className="studio-pane-bar-kind">Design</span>
                  <span className="studio-pane-bar-file">{fileConfig?.label || 'Canvas'}</span>
                </div>
                <button
                  type="button"
                  className={`studio-pane-bar-btn ${paneLayout === 'design' ? 'active' : ''}`}
                  onClick={expandDesign}
                  title={paneLayout === 'design' ? 'Restore split view' : 'Expand design (~90%)'}
                  aria-pressed={paneLayout === 'design'}
                >
                  {paneLayout === 'design' ? '⊟' : '⊞'}
                </button>
              </div>

              <div className="studio-canvas-body" data-tour="layers">
                <CanvasView
                  rootNodeId={rootNodeId}
                  nodesMap={nodesMap}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={handleSelectNode}
                  onUpdateNode={onUpdateNode}
                  onAddNode={onAddNode}
                  onAddComponentInstance={onAddComponentInstance}
                  activeCanvasTool={activeCanvasTool}
                  setActiveCanvasTool={setActiveCanvasTool}
                  onFocus={() => setFocusedPanel('canvas')}
                  theme="dark"
                  pageViewport={fileConfig?.isPage ? fileConfig.viewport : null}
                  componentLibrary={componentLibrary}
                  onOpenComponentFile={onOpenComponentFile}
                />

                <ReceiptMessageBar
                  rules={rules}
                  onOpenReceipt={() => openDrawer('receipts')}
                  onOpenRule={(ruleId) => {
                    setHighlightRuleId(ruleId);
                    openDrawer('receipts');
                  }}
                />

                <div className="studio-rail">
                  <button
                    type="button"
                    className={`studio-rail-btn ${drawerOpen && drawerTab === 'layers' ? 'active' : ''}`}
                    onClick={() => openDrawer('layers')}
                    title="Layers"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`studio-rail-btn ${drawerOpen && drawerTab === 'receipts' ? 'active' : ''}`}
                    onClick={() => openDrawer('receipts')}
                    title="Receipts"
                    data-tour="receipts"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {rules.some((r) => !r.valid) && <span className="studio-rail-badge" />}
                  </button>
                  <button
                    type="button"
                    className={`studio-rail-btn ${drawerOpen && drawerTab === 'inspect' ? 'active' : ''}`}
                    onClick={() => openDrawer('inspect')}
                    title="Inspect"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`studio-rail-btn ${drawerOpen && drawerTab === 'library' ? 'active' : ''}`}
                    onClick={() => openDrawer('library')}
                    title="Component library"
                    data-tour="library"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16M4 12h16M4 17h10" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`studio-rail-btn ${paneLayout === 'code' ? 'active' : ''}`}
                    onClick={expandCode}
                    title={paneLayout === 'code' ? 'Restore split view' : 'Expand code (~90%)'}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={`studio-code-pane ${codeCollapsed ? 'is-collapsed' : ''}`}>
          {codeCollapsed ? (
            <button
              type="button"
              className="studio-pane-collapsed studio-pane-collapsed-code"
              onClick={() => restoreFromCollapsed('code')}
              title="Expand code view"
            >
              <span className="vertical-label">Code</span>
              <span className="expand-arrow">◀</span>
            </button>
          ) : (
            <CodeEditor
              code={code}
              onChange={onCodeChange}
              onFocus={() => setFocusedPanel('code')}
              activeFile={activeFile}
              paneLayout={paneLayout}
              onToggleExpand={expandCode}
            />
          )}
        </div>
      </div>

      <DetailDrawer
        open={drawerOpen}
        tab={drawerTab}
        onTabChange={setDrawerTab}
        onClose={() => setDrawerOpen(false)}
        layers={
          <LayersPanel
            rootNodeId={rootNodeId}
            nodesMap={nodesMap}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => {
              handleSelectNode(id);
            }}
            onUpdateNode={onUpdateNode}
            onDeleteNode={onDeleteNode}
          />
        }
        inspect={
          <InspectorPanel
            selectedNodeId={selectedNodeId}
            nodesMap={nodesMap}
            onUpdateNode={onUpdateNode}
            onOpenComponentFile={onOpenComponentFile}
          />
        }
        receipts={
          <ReceiptsPanel
            component={node}
            nodesMap={nodesMap}
            onUpdateNode={onUpdateNode}
            highlightRuleId={highlightRuleId}
            embedded
            {...receiptsConfig}
          />
        }
        library={
          <ComponentLibrary
            isPageFile={Boolean(fileConfig?.isPage)}
            componentLibrary={componentLibrary}
            onInsertComponent={(refFile) => {
              onAddComponentInstance?.(refFile);
              openDrawer('inspect');
            }}
            onOpenComponentFile={onOpenComponentFile}
          />
        }
      />
    </div>
  );
}
