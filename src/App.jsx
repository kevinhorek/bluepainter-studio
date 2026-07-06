import { useState, useEffect, useCallback, useRef } from 'react';
import { generateTSX, parseTSX } from './utils/syncEngine';
import { applyBrokenDesignScenario, applyFixedDesignScenario, getFreshHeroNodes, getFreshPricingNodes, getFreshDashboardNodes } from './utils/demoScenarios';
import { getWorkspaceFile } from './data/workspaceFiles';
import { downloadValidationExport, getFeedbackSummary } from './utils/validationExport';
import { loadReceiptPolicy, saveReceiptPolicy } from './data/defaultReceiptPolicy';
import { logLearningEvent, getLearningSummary } from './utils/learningLoop';
import { runPresenterSequence } from './utils/presenterMode';
import { isFacilitatorMode } from './utils/facilitatorMode';
import VSCodeShell from './components/Shells/VSCodeShell';
import TauriShell from './components/Shells/TauriShell';
import FigmaShell from './components/Shells/FigmaShell';
import ResponsiveShell from './components/Shells/ResponsiveShell';
import ValidationScriptModal from './components/ValidationScriptModal';
import AboutPanel from './components/AboutPanel';
import WorkspaceHeader from './components/WorkspaceHeader';
import DemoTour from './components/DemoTour';
import FeedbackModal from './components/FeedbackModal';
import DemoScriptModal from './components/DemoScriptModal';
import SpecModal from './components/SpecModal';
import PresenterToast from './components/PresenterToast';

const VALID_PHASES = ['landing', 'phase1', 'phase2', 'phase3', 'phase4'];
const TOUR_SEEN_KEY = 'bluepainter-tour-seen';
const facilitator = isFacilitatorMode();

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash || hash === 'studio') return { phase: 'phase1', startTour: false };
  if (hash === 'about') return { phase: 'phase1', startTour: false, openAbout: true };
  if (hash === 'demo') {
    return { phase: 'phase1', startTour: facilitator };
  }
  if (hash.startsWith('demo/')) {
    const phase = hash.replace('demo/', '');
    return { phase: VALID_PHASES.includes(phase) ? phase : 'phase1', startTour: facilitator };
  }
  if (VALID_PHASES.includes(hash)) return { phase: hash, startTour: false };
  return { phase: 'phase1', startTour: false };
}

function phaseToHash(phase, tourActive) {
  if (phase === 'landing') return '#/about';
  if (tourActive) return '#/demo';
  return '#/studio';
}

export default function App() {
  const initialRoute = parseHash();
  const [phase, setPhase] = useState(initialRoute.phase === 'landing' ? 'phase1' : initialRoute.phase);
  const [aboutOpen, setAboutOpen] = useState(Boolean(initialRoute.openAbout));
  const [validationScriptOpen, setValidationScriptOpen] = useState(false);
  const [activeFile, setActiveFile] = useState('dashboard');
  const [selectedNodeId, setSelectedNodeId] = useState('dashboard-page');
  const [activeCanvasTool, setActiveCanvasTool] = useState('select');
  const [focusedPanel, setFocusedPanel] = useState('canvas');

  const [nodesByFile, setNodesByFile] = useState(() => ({
    pricing: getFreshPricingNodes(),
    hero: getFreshHeroNodes(),
    dashboard: getFreshDashboardNodes()
  }));
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

  const fileConfig = getWorkspaceFile(activeFile);
  const activeNodesMap = nodesByFile[activeFile];
  const activeRootId = fileConfig.rootId;
  const setActiveNodesMap = useCallback((updater) => {
    setNodesByFile((prev) => ({
      ...prev,
      [activeFile]: typeof updater === 'function' ? updater(prev[activeFile]) : updater
    }));
  }, [activeFile]);

  const handleSetActiveFile = useCallback((file) => {
    setActiveFile(file);
    setSelectedNodeId(getWorkspaceFile(file).defaultSelection);
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
    if (!facilitator) return;
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

  const handleAddComponentInstance = useCallback((refFile, parentId) => {
    if (!fileConfig.isPage) {
      alert('Open a page file (e.g. DashboardPage.tsx) to place components.');
      return;
    }

    const ref = getWorkspaceFile(refFile);
    if (ref.isPage) return;

    const dropParent = parentId
      || (activeNodesMap['components-row'] ? 'components-row' : null)
      || (activeNodesMap['page-content'] ? 'page-content' : null)
      || activeRootId;

    const parent = activeNodesMap[dropParent];
    if (!parent) return;
    if (['text', 'button', 'image', 'line', 'component-instance'].includes(parent.type)) {
      alert('Drop components onto a frame or page section, not a leaf element.');
      return;
    }

    const newId = `${refFile}-instance-${Date.now().toString().slice(-4)}`;
    const defaultStyle = refFile === 'hero'
      ? { flex: 1, minWidth: 420 }
      : { flexShrink: 0 };

    const newNode = {
      id: newId,
      type: 'component-instance',
      name: ref.componentName,
      refFile,
      tag: 'div',
      style: defaultStyle
    };

    setActiveNodesMap((prev) => ({
      ...prev,
      [dropParent]: { ...parent, children: [...(parent.children || []), newId] },
      [newId]: newNode
    }));
    setSelectedNodeId(newId);
    logLearningEvent('component_instance_added', { refFile, page: activeFile });
    refreshLearningSummary();
  }, [activeFile, activeNodesMap, activeRootId, fileConfig.isPage, setActiveNodesMap]);

  const handleBreakDesign = () => {
    handleSetActiveFile('pricing');
    setNodesByFile((prev) => ({
      ...prev,
      pricing: applyBrokenDesignScenario(prev.pricing)
    }));
    setSelectedNodeId('cta-button');
  };

  const handleFixAll = () => {
    handleSetActiveFile('pricing');
    setNodesByFile((prev) => ({ ...prev, pricing: applyFixedDesignScenario() }));
    setSelectedNodeId('cta-button');
  };

  const handleResetDemo = () => {
    setNodesByFile({
      pricing: getFreshPricingNodes(),
      hero: getFreshHeroNodes(),
      dashboard: getFreshDashboardNodes()
    });
    handleSetActiveFile('dashboard');
    setSelectedNodeId('dashboard-page');
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
        setPhaseWithHash('phase1');
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
    onAddComponentInstance: handleAddComponentInstance,
    activeCanvasTool,
    setActiveCanvasTool,
    focusedPanel,
    setFocusedPanel,
    activeFile,
    fileConfig,
    componentLibrary: {
      pricing: nodesByFile.pricing,
      hero: nodesByFile.hero
    },
    onOpenComponentFile: handleSetActiveFile,
    receiptsConfig
  };

  const workspacePhase = facilitator ? phase : 'phase1';

  return (
    <div className="app-container">
      <WorkspaceHeader
        activeFile={activeFile}
        onFileChange={handleSetActiveFile}
        onFeedback={() => setFeedbackOpen(true)}
        onShowAbout={() => setAboutOpen(true)}
        onOpenInterviewGuide={() => setValidationScriptOpen(true)}
        facilitatorActions={facilitator ? {
          onBreakDesign: handleBreakDesign,
          onFixAll: handleFixAll,
          onReset: handleResetDemo,
          onStartTour: () => { setTourActive(true); setTourStep(0); },
          onRunPresenter: handleRunPresenter,
          onOpenScript: () => setScriptOpen(true),
          onOpenSpec: () => setSpecOpen(true),
          onExportFeedback: handleExportFeedback,
          feedbackCount,
          presenterRunning
        } : null}
      />

      <main className="shell-viewport">
        {workspacePhase === 'phase1' && <VSCodeShell {...shellProps} />}
        {facilitator && workspacePhase === 'phase2' && <TauriShell {...shellProps} onLoadComponent={handleSetActiveFile} />}
        {facilitator && workspacePhase === 'phase3' && <FigmaShell {...shellProps} />}
        {facilitator && workspacePhase === 'phase4' && <ResponsiveShell {...shellProps} />}
      </main>

      <AboutPanel
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        onFeedback={() => setFeedbackOpen(true)}
      />

      {facilitator && (
        <DemoTour
          isActive={tourActive}
          currentStep={tourStep}
          setCurrentStep={setTourStep}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}

      <FeedbackModal isOpen={feedbackOpen} onClose={handleFeedbackClose} />
      <ValidationScriptModal isOpen={validationScriptOpen} onClose={() => setValidationScriptOpen(false)} />
      {facilitator && <DemoScriptModal isOpen={scriptOpen} onClose={() => setScriptOpen(false)} />}
      {facilitator && <SpecModal isOpen={specOpen} onClose={() => setSpecOpen(false)} />}
      {facilitator && <PresenterToast message={presenterMessage} />}
    </div>
  );
}
