import { useState, useEffect, useCallback, useRef } from 'react';
import { generateTSX, parseTSX } from './utils/syncEngine';
import { applyBrokenDesignScenario, applyFixedDesignScenario, getFreshHeroNodes, getFreshPricingNodes, getFreshDashboardNodes } from './utils/demoScenarios';
import { getFreshMarketingNodes } from './data/marketingPage';
import { captureCanvasPageFrame } from './utils/canvasCapture';
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
import ValidationScorecardModal from './components/ValidationScorecardModal';
import WelcomeModal from './components/WelcomeModal';
import { hasSeenWelcome, markWelcomeSeen } from './utils/welcomeStorage';
import AppToast from './components/AppToast';
import { copyDemoLink, DEMO_URL } from './utils/shareDemo';
import AboutPanel from './components/AboutPanel';
import MarketingSite from './components/MarketingPage';
import WorkspaceHeader from './components/WorkspaceHeader';
import DemoTour from './components/DemoTour';
import FeedbackModal from './components/FeedbackModal';
import DemoScriptModal from './components/DemoScriptModal';
import PresenterToast from './components/PresenterToast';
import SpecModal from './components/SpecModal';
import ExportDeployModal from './components/ExportDeployModal';
import MarketingKitModal from './components/MarketingKitModal';
import { getEmptyFigmaImportNodes } from './utils/figmaImport';
import FigmaImportModal from './components/FigmaImportModal';
import AIGeneratePanel from './components/AIGeneratePanel';
import { createNodeFromTool, canDropIntoNode, isLeafNode } from './utils/nodeFactory';
import { getToolByShortcut } from './data/canvasTools';

const VALID_PHASES = ['landing', 'phase1', 'phase2', 'phase3', 'phase4'];
const TOUR_SEEN_KEY = 'bluepainter-tour-seen';
const facilitator = isFacilitatorMode();

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash || hash === 'app' || hash === 'studio') return { phase: 'phase1', startTour: false };
  if (hash === 'home' || hash === 'landing') return { phase: 'landing', startTour: false };
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
  if (phase === 'landing') return '#/home';
  if (tourActive) return '#/demo';
  return '#/app';
}

export default function App() {
  const initialRoute = parseHash();
  const [phase, setPhase] = useState(() => {
    const route = initialRoute.phase === 'landing' ? 'landing' : initialRoute.phase;
    return route;
  });
  const [aboutOpen, setAboutOpen] = useState(Boolean(initialRoute.openAbout));
  const [validationScriptOpen, setValidationScriptOpen] = useState(false);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [exportDeployOpen, setExportDeployOpen] = useState(false);
  const [marketingKitOpen, setMarketingKitOpen] = useState(false);
  const [marketingActiveFieldId, setMarketingActiveFieldId] = useState(null);
  const [screenshotBlob, setScreenshotBlob] = useState(null);
  const [useScreenshotInImages, setUseScreenshotInImages] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiInitialType, setAiInitialType] = useState('full-marketing');
  const [figmaImportOpen, setFigmaImportOpen] = useState(false);
  const [fileViewports, setFileViewports] = useState({});
  const [welcomeOpen, setWelcomeOpen] = useState(() => !hasSeenWelcome());
  const [toast, setToast] = useState(null);
  const [activeFile, setActiveFile] = useState('dashboard');
  const [selectedNodeId, setSelectedNodeId] = useState('dashboard-page');
  const [activeCanvasTool, setActiveCanvasTool] = useState('select');
  const [focusedPanel, setFocusedPanel] = useState('canvas');

  const [nodesByFile, setNodesByFile] = useState(() => ({
    pricing: getFreshPricingNodes(),
    hero: getFreshHeroNodes(),
    dashboard: getFreshDashboardNodes(),
    marketing: getFreshMarketingNodes(),
    figma: getEmptyFigmaImportNodes()
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
  const toolBeforeSpaceRef = useRef('select');
  const skipCodegenRef = useRef(false);
  const codeRef = useRef('');

  const refreshLearningSummary = () => setLearningSummary(getLearningSummary());

  const fileConfig = {
    ...getWorkspaceFile(activeFile),
    ...(fileViewports[activeFile] ? { viewport: fileViewports[activeFile] } : {})
  };
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

  const notify = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleUpdateNodeByFile = useCallback((fileId, nodeId, updatedFields) => {
    setNodesByFile((prev) => {
      const map = prev[fileId];
      const node = map?.[nodeId];
      if (!node) return prev;
      return {
        ...prev,
        [fileId]: {
          ...map,
          [nodeId]: {
            ...node,
            ...updatedFields,
            style: { ...(node.style || {}), ...(updatedFields.style || {}) }
          }
        }
      };
    });
  }, []);

  const handleSelectMarketingField = useCallback((field) => {
    setMarketingActiveFieldId(field.id);
    setActiveFile(field.fileId);
    setSelectedNodeId(field.nodeId);
    setFocusedPanel('canvas');
  }, []);

  const handleEditMarketingOnCanvas = useCallback((field) => {
    handleSelectMarketingField(field);
    setMarketingKitOpen(true);
  }, [handleSelectMarketingField]);

  const handleOpenMarketingPage = useCallback(() => {
    setActiveFile('marketing');
    setSelectedNodeId('marketing-page');
    setFocusedPanel('canvas');
  }, []);

  const handleOpenMarketingKit = useCallback(() => {
    setAiPanelOpen(false);
    setMarketingKitOpen(true);
    setActiveFile('marketing');
    setSelectedNodeId('marketing-page');
  }, []);

  const handleOpenAI = useCallback((type = 'full-marketing') => {
    setMarketingKitOpen(false);
    setAiInitialType(type);
    setAiPanelOpen(true);
  }, []);

  const handleFigmaImported = useCallback(({ targetFile, nodes, rootId, viewport, frameName, nodeCount }) => {
    const file = getWorkspaceFile(targetFile);
    let finalNodes = { ...nodes };
    let selectionId = rootId;

    if (targetFile !== 'figma' && rootId !== file.rootId && finalNodes[rootId]) {
      finalNodes[file.rootId] = { ...finalNodes[rootId], id: file.rootId };
      delete finalNodes[rootId];
      selectionId = file.rootId;
    }

    setNodesByFile((prev) => ({ ...prev, [targetFile]: finalNodes }));
    if (viewport) {
      setFileViewports((prev) => ({ ...prev, [targetFile]: viewport }));
    }
    setActiveFile(targetFile);
    setSelectedNodeId(selectionId);
    setFocusedPanel('canvas');
    logLearningEvent('figma_import', { targetFile, nodeCount, frameName });
    notify(`Imported "${frameName || 'frame'}" — ${nodeCount} layers`);
  }, [notify]);

  const handleApplyAI = useCallback(({ type, updates, message, source }) => {
    const { nodesByFile: next, applied } = applyAIUpdates(nodesByFile, updates, type);
    setNodesByFile(next);
    const target = getFirstUpdateTarget(updates, type);
    if (target) {
      setActiveFile(target.fileId);
      setSelectedNodeId(target.nodeId);
      setFocusedPanel('canvas');
    }
    logLearningEvent('ai_generate_applied', { type, applied, source });
    notify(message || `Applied ${applied} updates to canvas`);
  }, [nodesByFile, notify]);

  const handleCaptureDashboardScreenshot = useCallback(async () => {
    if (activeFile !== 'dashboard') {
      setActiveFile('dashboard');
      setSelectedNodeId('dashboard-page');
      await new Promise((r) => setTimeout(r, 350));
    }
    const blob = await captureCanvasPageFrame();
    if (blob) {
      setScreenshotBlob(blob);
      notify('Dashboard captured for social images');
    } else {
      notify('Open DashboardPage on canvas, then capture again');
    }
  }, [activeFile, notify]);

  const setPhaseWithHash = useCallback((nextPhase, options = {}) => {
    setPhase(nextPhase);
    window.location.hash = phaseToHash(nextPhase, options.startTour ?? false);
    if (options.startTour) {
      setTourActive(true);
      setTourStep(0);
    }
  }, []);

  useEffect(() => {
    if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
      window.location.hash = '#/app';
    }
  }, []);

  useEffect(() => {
    const isTypingTarget = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    };

    const onKeyDown = (e) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        toolBeforeSpaceRef.current = activeCanvasTool;
        setActiveCanvasTool('hand');
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tool = getToolByShortcut(e.key, e.shiftKey);
      if (tool) {
        e.preventDefault();
        setActiveCanvasTool(tool.id);
      }
    };

    const onKeyUp = (e) => {
      if (e.key === ' ' && activeCanvasTool === 'hand') {
        setActiveCanvasTool(toolBeforeSpaceRef.current || 'select');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [activeCanvasTool]);

  const handleGoHome = useCallback(() => {
    setMarketingKitOpen(false);
    setAiPanelOpen(false);
    setAboutOpen(false);
    setPhase('landing');
    window.location.hash = '#/home';
  }, []);

  const handleLaunchApp = useCallback((nextPhase = 'phase1') => {
    setPhase(nextPhase);
    window.location.hash = '#/app';
    markWelcomeSeen();
    setWelcomeOpen(false);
  }, []);

  const handleWelcomeStart = () => {
    handleLaunchApp('phase1');
  };

  const handleWelcomeShowReceipts = () => {
    markWelcomeSeen();
    setWelcomeOpen(false);
    setNodesByFile((prev) => ({
      ...prev,
      pricing: applyBrokenDesignScenario(prev.pricing)
    }));
    handleSetActiveFile('pricing');
    setSelectedNodeId('cta-button');
    notify('Select the button — receipt messages appear at the bottom');
  };

  const handleCopyLink = async () => {
    const ok = await copyDemoLink();
    notify(ok ? 'Demo link copied!' : `Copy this link: ${DEMO_URL}/#/app`);
  };

  useEffect(() => {
    const onHashChange = () => {
      const route = parseHash();
      setPhase(route.phase);
      if (route.openAbout) setAboutOpen(true);
      if (route.phase === 'landing') {
        setAboutOpen(false);
        setMarketingKitOpen(false);
        setAiPanelOpen(false);
      }
      if (route.startTour) {
        setTourActive(true);
        setTourStep(0);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Regenerate TSX when canvas changes — patch existing code via AST to preserve formatting.
  useEffect(() => {
    if (skipCodegenRef.current) {
      skipCodegenRef.current = false;
      return;
    }
    if (activeRootId && activeNodesMap) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync generated code from canvas state
      setCode(generateTSX(activeRootId, activeNodesMap, codeRef.current));
    }
  }, [activeFile, activeRootId, activeNodesMap]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

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
    skipCodegenRef.current = true;
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
    if (!isPlacableTool(type)) return;

    const parent = activeNodesMap[parentId];
    if (!parent) return;
    if (!canDropIntoNode(parent)) {
      notify('Select a frame or container first, not a leaf element.');
      return;
    }

    const newId = `${type}-${Date.now().toString().slice(-4)}`;
    const newNode = createNodeFromTool(type, newId, leftOffset, topOffset);
    if (!newNode) return;

    setActiveNodesMap(prev => ({
      ...prev,
      [parentId]: { ...parent, children: [...(parent.children || []), newId] },
      [newId]: newNode
    }));
    setSelectedNodeId(newId);
  };

  const handleAddComponentInstance = useCallback((refFile, parentId) => {
    if (!fileConfig.isPage) {
      notify('Open a page file (DashboardPage.tsx) to place components.');
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
    if (['text', 'button', 'image', 'line', 'shape', 'comment', 'vector', 'component-instance'].includes(parent.type)) {
      notify('Drop onto a frame or page section.');
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
  }, [activeFile, activeNodesMap, activeRootId, fileConfig.isPage, setActiveNodesMap, notify]);

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
      dashboard: getFreshDashboardNodes(),
      marketing: getFreshMarketingNodes(),
      figma: getEmptyFigmaImportNodes()
    });
    setFileViewports({});
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
      onPricing: () => {
        handleSetActiveFile('pricing');
        setSelectedNodeId('pricing-card-frame');
      },
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
  const showLanding = phase === 'landing';

  if (showLanding) {
    return (
      <div className="app-container app-landing">
        <MarketingSite
          onLaunchDemo={handleLaunchApp}
          onShowFeedback={() => setFeedbackOpen(true)}
        />
        <FeedbackModal isOpen={feedbackOpen} onClose={handleFeedbackClose} />
        <AppToast message={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  return (
    <div className={`app-container ${marketingKitOpen ? 'marketing-kit-open' : ''} ${aiPanelOpen ? 'ai-panel-open' : ''}`}>
      <WorkspaceHeader
        activeFile={activeFile}
        onFileChange={handleSetActiveFile}
        onGoHome={handleGoHome}
        onFeedback={() => setFeedbackOpen(true)}
        onShowAbout={() => setAboutOpen(true)}
        onOpenInterviewGuide={() => setValidationScriptOpen(true)}
        onOpenExportDeploy={() => setExportDeployOpen(true)}
        onOpenMarketingKit={handleOpenMarketingKit}
        onOpenFigmaImport={() => setFigmaImportOpen(true)}
        onOpenAI={() => handleOpenAI('full-marketing')}
        onCopyLink={handleCopyLink}
        facilitatorActions={facilitator ? {
          onBreakDesign: handleBreakDesign,
          onFixAll: handleFixAll,
          onReset: handleResetDemo,
          onStartTour: () => { setTourActive(true); setTourStep(0); },
          onRunPresenter: handleRunPresenter,
          onOpenScript: () => setScriptOpen(true),
          onOpenSpec: () => setSpecOpen(true),
          onOpenScorecard: () => setScorecardOpen(true),
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

      {welcomeOpen && (
        <WelcomeModal
          onStart={handleWelcomeStart}
          onShowReceipts={handleWelcomeShowReceipts}
        />
      )}

      <AppToast message={toast} onDismiss={() => setToast(null)} />

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
      <ValidationScorecardModal isOpen={scorecardOpen} onClose={() => setScorecardOpen(false)} />
      <ExportDeployModal
        isOpen={exportDeployOpen}
        onClose={() => setExportDeployOpen(false)}
        nodesByFile={nodesByFile}
        onExported={() => setToast('Project downloaded — see DEPLOY.md in the zip')}
      />
      <MarketingKitModal
        isOpen={marketingKitOpen}
        onClose={() => { setMarketingKitOpen(false); setMarketingActiveFieldId(null); }}
        nodesByFile={nodesByFile}
        activeFieldId={marketingActiveFieldId}
        onSelectField={handleSelectMarketingField}
        onUpdateField={handleUpdateNodeByFile}
        onEditOnCanvas={handleEditMarketingOnCanvas}
        onCaptureScreenshot={handleCaptureDashboardScreenshot}
        screenshotBlob={screenshotBlob}
        useScreenshot={useScreenshotInImages}
        onToggleScreenshot={setUseScreenshotInImages}
        onOpenMarketingPage={handleOpenMarketingPage}
        onOpenAI={handleOpenAI}
        onExported={() => notify('Marketing kit downloaded')}
        onCopyToast={notify}
      />
      <FigmaImportModal
        isOpen={figmaImportOpen}
        onClose={() => setFigmaImportOpen(false)}
        onImported={handleFigmaImported}
        onNotify={notify}
      />
      <AIGeneratePanel
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        nodesByFile={nodesByFile}
        activeFile={activeFile}
        initialType={aiInitialType}
        onApply={handleApplyAI}
        onNotify={notify}
      />
      {facilitator && <DemoScriptModal isOpen={scriptOpen} onClose={() => setScriptOpen(false)} />}
      {facilitator && <SpecModal isOpen={specOpen} onClose={() => setSpecOpen(false)} />}
      {facilitator && <PresenterToast message={presenterMessage} />}
    </div>
  );
}
