import { useState, useEffect, useCallback, useRef } from 'react';
import { generateTSX, parseTSX } from './utils/syncEngine';
import { applyBrokenDesignScenario, applyFixedDesignScenario, getFreshHeroNodes, getFreshPricingNodes } from './utils/demoScenarios';
import { downloadValidationExport, getFeedbackSummary } from './utils/validationExport';
import { loadReceiptPolicy, saveReceiptPolicy } from './data/defaultReceiptPolicy';
import { logLearningEvent, getLearningSummary } from './utils/learningLoop';
import { runPresenterSequence } from './utils/presenterMode';
import VSCodeShell from './components/Shells/VSCodeShell';
import TauriShell from './components/Shells/TauriShell';
import FigmaShell from './components/Shells/FigmaShell';
import ResponsiveShell from './components/Shells/ResponsiveShell';
import MarketingPage from './components/MarketingPage';
import DemoTour from './components/DemoTour';
import DemoControls from './components/DemoControls';
import FeedbackModal from './components/FeedbackModal';
import DemoScriptModal from './components/DemoScriptModal';
import SpecModal from './components/SpecModal';
import PresenterToast from './components/PresenterToast';

const VALID_PHASES = ['landing', 'phase1', 'phase2', 'phase3', 'phase4'];
const TOUR_SEEN_KEY = 'bluepainter-tour-seen';

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return { phase: 'landing', startTour: false };
  if (hash === 'demo') return { phase: 'phase1', startTour: true };
  if (hash.startsWith('demo/')) {
    const phase = hash.replace('demo/', '');
    return { phase: VALID_PHASES.includes(phase) ? phase : 'phase1', startTour: true };
  }
  if (VALID_PHASES.includes(hash)) return { phase: hash, startTour: false };
  return { phase: 'landing', startTour: false };
}

function phaseToHash(phase, tourActive) {
  if (phase === 'landing') return '#/';
  if (tourActive) return '#/demo';
  return `#/${phase}`;
}

export default function App() {
  const initialRoute = parseHash();
  const [phase, setPhase] = useState(initialRoute.phase);
  const [activeFile, setActiveFile] = useState('pricing');
  const [selectedNodeId, setSelectedNodeId] = useState('pricing-card-frame');
  const [activeCanvasTool, setActiveCanvasTool] = useState('select');
  const [focusedPanel, setFocusedPanel] = useState('canvas');

  const [pricingNodes, setPricingNodes] = useState(() => getFreshPricingNodes());
  const [heroNodes, setHeroNodes] = useState(() => getFreshHeroNodes());
  const [code, setCode] = useState('');

  const [tourActive, setTourActive] = useState(initialRoute.startTour);
  const [tourStep, setTourStep] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackPromptShown, setFeedbackPromptShown] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [specOpen, setSpecOpen] = useState(false);
  const [presenterMessage, setPresenterMessage] = useState(null);
  const [presenterRunning, setPresenterRunning] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(() => getFeedbackSummary().total);
  const [receiptPolicy, setReceiptPolicy] = useState(() => loadReceiptPolicy());
  const [dismissedRules, setDismissedRules] = useState(() => new Set());
  const [learningSummary, setLearningSummary] = useState(() => getLearningSummary());
  const presenterCancelRef = useRef(null);

  const refreshLearningSummary = () => setLearningSummary(getLearningSummary());

  const activeNodesMap = activeFile === 'pricing' ? pricingNodes : heroNodes;
  const activeRootId = activeFile === 'pricing' ? 'pricing-card-frame' : 'hero-frame';
  const setActiveNodesMap = activeFile === 'pricing' ? setPricingNodes : setHeroNodes;

  const handleSetActiveFile = useCallback((file) => {
    setActiveFile(file);
    setSelectedNodeId(file === 'pricing' ? 'pricing-card-frame' : 'hero-frame');
  }, []);

  const setPhaseWithHash = useCallback((nextPhase, options = {}) => {
    setPhase(nextPhase);
    window.location.hash = phaseToHash(nextPhase, options.startTour ?? false);
    if (options.startTour) {
      setTourActive(true);
      setTourStep(0);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const route = parseHash();
      setPhase(route.phase);
      if (route.startTour) {
        setTourActive(true);
        setTourStep(0);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Regenerate TSX when the canvas node tree changes (not from direct code edits).
  useEffect(() => {
    if (activeRootId && activeNodesMap) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync generated code from canvas state
      setCode(generateTSX(activeRootId, activeNodesMap));
    }
  }, [activeFile, activeRootId, activeNodesMap]);

  useEffect(() => {
    if (phase === 'landing') return;
    const timer = setTimeout(() => {
      if (!feedbackPromptShown && !localStorage.getItem('bluepainter-feedback-given')) {
        setFeedbackOpen(true);
        setFeedbackPromptShown(true);
      }
    }, 90000);
    return () => clearTimeout(timer);
  }, [phase, feedbackPromptShown]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setActiveNodesMap(parseTSX(newCode, activeNodesMap));
    logLearningEvent('round_trip_code', { source: 'editor' });
    refreshLearningSummary();
  };

  const handleUpdateNode = (nodeId, updatedFields) => {
    setActiveNodesMap(prev => {
      const node = prev[nodeId];
      if (!node) return prev;
      return {
        ...prev,
        [nodeId]: {
          ...node,
          ...updatedFields,
          style: { ...(node.style || {}), ...(updatedFields.style || {}) }
        }
      };
    });
    logLearningEvent('round_trip_canvas', { nodeId, source: 'canvas' });
    refreshLearningSummary();
  };

  const handleDeleteNode = (nodeId) => {
    if (nodeId === activeRootId) return;
    setActiveNodesMap(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        const parent = updated[id];
        if (parent.children?.includes(nodeId)) {
          parent.children = parent.children.filter(cid => cid !== nodeId);
        }
      });
      delete updated[nodeId];
      return updated;
    });
    setSelectedNodeId(activeRootId);
  };

  const handleAddNode = (type, leftOffset = 20, topOffset = 20, parentId = activeRootId) => {
    const parent = activeNodesMap[parentId];
    if (!parent) return;
    if (['text', 'button', 'image', 'line'].includes(parent.type)) {
      alert('Cannot insert children inside a leaf element! Select a Frame/Container first.');
      return;
    }

    const newId = `${type}-${Date.now().toString().slice(-4)}`;
    let newNode = {};

    if (type === 'text') {
      newNode = { id: newId, type: 'text', name: 'New Text Layer', tag: 'p', style: { position: 'absolute', left: leftOffset, top: topOffset, fontSize: 14, color: '#475569' }, text: 'New Text Layer' };
    } else if (type === 'button') {
      newNode = { id: newId, type: 'button', name: 'New Button Layer', tag: 'button', style: { position: 'absolute', left: leftOffset, top: topOffset, background: '#2563eb', color: '#ffffff', borderWidth: 0, padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }, text: 'Action Button' };
    } else if (type === 'frame') {
      newNode = { id: newId, type: 'frame', name: 'New Frame Group', tag: 'div', style: { position: 'absolute', left: leftOffset, top: topOffset, display: 'flex', flexDirection: 'column', padding: 24, gap: 12, background: '#f1f5f9', borderRadius: 8, width: 180, height: 120, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'solid' }, children: [] };
    } else if (type === 'image') {
      newNode = { id: newId, type: 'image', name: 'New Image Shape', tag: 'img', style: { position: 'absolute', left: leftOffset, top: topOffset, width: 120, height: 80, borderRadius: 6, objectFit: 'cover' }, src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200' };
    } else if (type === 'line') {
      newNode = { id: newId, type: 'line', name: 'New Line Divider', tag: 'hr', style: { position: 'absolute', left: leftOffset, top: topOffset, borderWidth: 0, borderTopWidth: 1, borderColor: '#94a3b8', borderStyle: 'solid', width: 150, height: 1 } };
    }

    setActiveNodesMap(prev => ({
      ...prev,
      [parentId]: { ...parent, children: [...(parent.children || []), newId] },
      [newId]: newNode
    }));
    setSelectedNodeId(newId);
  };

  const handleLaunchDemo = (targetPhase = 'phase1', withTour = false) => {
    handleSetActiveFile('pricing');
    setSelectedNodeId('cta-button');
    if (withTour) {
      setPhaseWithHash(targetPhase, { startTour: true });
    } else {
      setPhaseWithHash(targetPhase);
    }
  };

  const handleBreakDesign = () => {
    handleSetActiveFile('pricing');
    setPricingNodes((prev) => applyBrokenDesignScenario(prev));
    setSelectedNodeId('cta-button');
  };

  const handleFixAll = () => {
    handleSetActiveFile('pricing');
    setPricingNodes(applyFixedDesignScenario());
    setSelectedNodeId('cta-button');
  };

  const handleResetDemo = () => {
    setPricingNodes(getFreshPricingNodes());
    setHeroNodes(getFreshHeroNodes());
    handleSetActiveFile('pricing');
    setSelectedNodeId('pricing-card-frame');
    setDismissedRules(new Set());
  };

  const handlePolicyChange = (nextPolicy) => {
    setReceiptPolicy(nextPolicy);
    saveReceiptPolicy(nextPolicy);
    logLearningEvent('policy_updated', { policy: nextPolicy });
    refreshLearningSummary();
  };

  const handleDismissRule = (ruleId) => {
    setDismissedRules((prev) => new Set([...prev, ruleId]));
    logLearningEvent('rule_dismissed', { ruleId });
    refreshLearningSummary();
  };

  const handleReceiptFix = (ruleId, fixKey) => {
    logLearningEvent('fix_applied', { ruleId, fixKey });
    refreshLearningSummary();
  };

  const handleTourComplete = () => {
    setTourActive(false);
    setTourStep(0);
    localStorage.setItem(TOUR_SEEN_KEY, 'true');
    window.location.hash = phaseToHash(phase, false);
    setSelectedNodeId('cta-button');
  };

  const handleTourSkip = () => {
    setTourActive(false);
    setTourStep(0);
    localStorage.setItem(TOUR_SEEN_KEY, 'true');
    window.location.hash = phaseToHash(phase, false);
  };

  const handleFeedbackClose = () => {
    setFeedbackOpen(false);
    localStorage.setItem('bluepainter-feedback-given', 'true');
    setFeedbackCount(getFeedbackSummary().total);
  };

  const handleExportFeedback = () => {
    downloadValidationExport();
    setFeedbackCount(getFeedbackSummary().total);
    refreshLearningSummary();
  };

  const handleRunPresenter = () => {
    if (presenterRunning) return;

    if (presenterCancelRef.current) {
      presenterCancelRef.current();
    }

    setPresenterRunning(true);
    setPresenterMessage('Starting presenter mode…');

    presenterCancelRef.current = runPresenterSequence({
      ensureWorkspace: () => {
        if (phase === 'landing') {
          setPhaseWithHash('phase1');
        }
      },
      onReset: handleResetDemo,
      onBreak: handleBreakDesign,
      onFix: handleFixAll,
      onStep: (message) => {
        setPresenterMessage(message);
        if (message === null) {
          setPresenterRunning(false);
          presenterCancelRef.current = null;
        }
      }
    });
  };

  useEffect(() => {
    return () => {
      if (presenterCancelRef.current) {
        presenterCancelRef.current();
      }
    };
  }, []);

  const receiptsConfig = {
    policy: receiptPolicy,
    onPolicyChange: handlePolicyChange,
    dismissedRules,
    onDismissRule: handleDismissRule,
    onFixApplied: handleReceiptFix,
    learningSummary
  };

  const shellProps = {
    rootNodeId: activeRootId,
    nodesMap: activeNodesMap,
    selectedNodeId,
    onSelectNode: setSelectedNodeId,
    onUpdateNode: handleUpdateNode,
    onDeleteNode: handleDeleteNode,
    code,
    onCodeChange: handleCodeChange,
    onAddNode: handleAddNode,
    activeCanvasTool,
    setActiveCanvasTool,
    focusedPanel,
    setFocusedPanel,
    activeFile,
    receiptsConfig
  };

  return (
    <div className={`app-container ${phase === 'landing' ? 'app-landing' : ''}`}>
      {phase !== 'landing' && (
        <header className="global-header">
          <div className="logo-section">
            <div className="logo-icon"><div className="logo-dot"></div></div>
            <span>BluePainter <span style={{ fontWeight: 400, opacity: 0.8 }}>Studio</span></span>
            <span className="demo-badge">Interactive Demo</span>
          </div>

          <div className="phase-selector" data-tour="phases">
            {[
              { id: 'phase1', label: 'Phase 1', sub: 'VS Code / Cursor', v1: true },
              { id: 'phase2', label: 'Phase 2', sub: 'Tauri desktop', vision: true },
              { id: 'phase3', label: 'Phase 3', sub: 'Figma plugin', figma: true, vision: true },
              { id: 'phase4', label: 'Phase 4', sub: 'Responsive Canvas', vision: true }
            ].map((p) => (
              <button
                key={p.id}
                className={`phase-tab ${phase === p.id ? (p.figma ? 'active-figma' : 'active') : ''}`}
                onClick={() => setPhaseWithHash(p.id)}
              >
                {p.label}
                {p.v1 && <span className="phase-badge-v1">v1</span>}
                {p.vision && !p.v1 && <span className="phase-badge-vision">vision</span>}
                <span>{p.sub}</span>
              </button>
            ))}
          </div>

          <div className="header-right">
            <div className="component-switcher">
              <button
                className={`component-switch-btn ${activeFile === 'pricing' ? 'active' : ''}`}
                onClick={() => handleSetActiveFile('pricing')}
              >
                PricingCard
              </button>
              <button
                className={`component-switch-btn ${activeFile === 'hero' ? 'active' : ''}`}
                onClick={() => handleSetActiveFile('hero')}
              >
                HeroSection
              </button>
            </div>

            <span style={{ opacity: 0.3 }}>|</span>

            <DemoControls
              onBreakDesign={handleBreakDesign}
              onFixAll={handleFixAll}
              onReset={handleResetDemo}
              onStartTour={() => { setTourActive(true); setTourStep(0); }}
              onShowFeedback={() => setFeedbackOpen(true)}
              onRunPresenter={handleRunPresenter}
              onOpenScript={() => setScriptOpen(true)}
              onOpenSpec={() => setSpecOpen(true)}
              onExportFeedback={handleExportFeedback}
              feedbackCount={feedbackCount}
              presenterRunning={presenterRunning}
            />

            <span style={{ opacity: 0.3 }}>|</span>

            <div style={{ display: 'flex', gap: 6, background: '#1e293b', padding: '2px 6px', borderRadius: 6 }}>
              <button onClick={() => handleAddNode('frame')} draggable="true" onDragStart={(e) => e.dataTransfer.setData('layerType', 'frame')} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '0.75rem', cursor: 'grab', padding: '4px' }} title="Drag Frame Group onto Canvas">📁 +Frame</button>
              <button onClick={() => handleAddNode('text')} draggable="true" onDragStart={(e) => e.dataTransfer.setData('layerType', 'text')} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '0.75rem', cursor: 'grab', padding: '4px' }} title="Drag Text Layer onto Canvas">📝 +Text</button>
              <button onClick={() => handleAddNode('button')} draggable="true" onDragStart={(e) => e.dataTransfer.setData('layerType', 'button')} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '0.75rem', cursor: 'grab', padding: '4px' }} title="Drag Button Layer onto Canvas">🔘 +Button</button>
            </div>

            <span style={{ opacity: 0.3 }}>|</span>

            <button className="header-btn" onClick={() => setPhaseWithHash('landing')}>🏠 Landing</button>
            <span style={{ opacity: 0.3 }}>|</span>
            <span>⚡ Live Sync: Active</span>
          </div>
        </header>
      )}

      <main className="shell-viewport">
        {phase === 'landing' ? (
          <MarketingPage
            onLaunchDemo={handleLaunchDemo}
            onOpenScript={() => setScriptOpen(true)}
            onOpenSpec={() => setSpecOpen(true)}
            onRunPresenter={handleRunPresenter}
            onExportFeedback={handleExportFeedback}
            feedbackCount={feedbackCount}
            presenterRunning={presenterRunning}
          />
        ) : (
          <>
            {phase === 'phase1' && <VSCodeShell {...shellProps} />}
            {phase === 'phase2' && <TauriShell {...shellProps} onLoadComponent={handleSetActiveFile} />}
            {phase === 'phase3' && <FigmaShell {...shellProps} />}
            {phase === 'phase4' && <ResponsiveShell {...shellProps} />}
          </>
        )}
      </main>

      <DemoTour
        isActive={tourActive && phase !== 'landing'}
        currentStep={tourStep}
        setCurrentStep={setTourStep}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />

      <FeedbackModal isOpen={feedbackOpen} onClose={handleFeedbackClose} />
      <DemoScriptModal isOpen={scriptOpen} onClose={() => setScriptOpen(false)} />
      <SpecModal isOpen={specOpen} onClose={() => setSpecOpen(false)} />
      <PresenterToast message={presenterMessage} />
    </div>
  );
}
