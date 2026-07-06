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
  const [codeOpen, setCodeOpen] = useState(true);
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

  return (
    <div className="studio-shell">
      <div className="studio-main">
        <div className="studio-canvas-pane" data-tour="layers">
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
              className={`studio-rail-btn ${codeOpen ? 'active' : ''}`}
              onClick={() => setCodeOpen(!codeOpen)}
              title="Code"
              data-tour="code"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
          </div>
        </div>

        {codeOpen && (
          <div className="studio-code-pane">
            <CodeEditor
              code={code}
              onChange={onCodeChange}
              onFocus={() => setFocusedPanel('code')}
              activeFile={activeFile}
              onCollapse={() => setCodeOpen(false)}
            />
          </div>
        )}
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
