import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { generateTSX, parseTSX } from './utils/syncEngine';
import { exportComponentTSX } from './utils/componentExport';
import { batchExportComponents } from './utils/batchComponentExport';
import { applyBrokenDesignScenario, applyFixedDesignScenario, getFreshHeroNodes, getFreshPricingNodes, getFreshDashboardNodes } from './utils/demoScenarios';
import { getFreshMarketingNodes } from './data/marketingPage';
import { captureCanvasPageFrame } from './utils/canvasCapture';
import { getWorkspaceFile } from './data/workspaceFiles';
import { downloadValidationExport, downloadLearningLoopExport, downloadPilotPackExport, getFeedbackSummary } from './utils/validationExport';
import { loadReceiptPolicy, saveReceiptPolicy, loadLearningConfig, saveLearningConfig } from './data/defaultReceiptPolicy';
import { LearningLoop, getLearningSummary } from './utils/learningLoop';
import { runPresenterSequence } from './utils/presenterMode';
import { isFacilitatorMode } from './utils/facilitatorMode';
import VSCodeShell from './components/Shells/VSCodeShell';
import TauriShell from './components/Shells/TauriShell';
import FigmaShell from './components/Shells/FigmaShell';
import ResponsiveShell from './components/Shells/ResponsiveShell';
import ValidationScriptModal from './components/ValidationScriptModal';
import ValidationScorecardModal from './components/ValidationScorecardModal';
import SessionChecklistModal from './components/SessionChecklistModal';
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
import ConflictDialog from './components/ConflictDialog';
import ExportDeployModal from './components/ExportDeployModal';
import MarketingKitModal from './components/MarketingKitModal';
import { getEmptyFigmaImportNodes } from './utils/figmaImport';
import FigmaImportModal from './components/FigmaImportModal';
import FacilitatorDashboard from './components/FacilitatorDashboard';
import AIGeneratePanel from './components/AIGeneratePanel';
import RealFileLoader from './components/RealFileLoader';
import RestoreBackupModal from './components/RestoreBackupModal';
import GitContextModal from './components/GitContextModal';
import { createNodeFromTool, canDropIntoNode } from './utils/nodeFactory';
import { getToolByShortcut, isPlacableTool } from './data/canvasTools';
import { applyAIUpdates, getFirstUpdateTarget } from './utils/aiApply';
import { createBackup, AUTO_SAVE_INTERVAL_MS } from './utils/autoSaveBackup';

const VALID_PHASES = ['landing', 'phase1', 'phase2', 'phase3', 'phase4'];
const TOUR_SEEN_KEY = 'bluepainter-tour-seen';
const facilitator = isFacilitatorMode();

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return { phase: 'landing', startTour: false };
  if (hash === 'app' || hash === 'studio') return { phase: 'phase1', startTour: false };
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
  
  // Learning loop instance for comprehensive logging (SPEC §3)
  const learningLoop = useMemo(() => new LearningLoop(), []);
  
  const [aboutOpen, setAboutOpen] = useState(Boolean(initialRoute.openAbout));
  const [validationScriptOpen, setValidationScriptOpen] = useState(false);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [sessionChecklistOpen, setSessionChecklistOpen] = useState(false);
  const [facilitatorDashboardOpen, setFacilitatorDashboardOpen] = useState(false);
  const [exportDeployOpen, setExportDeployOpen] = useState(false);
  const [marketingKitOpen, setMarketingKitOpen] = useState(false);
  const [marketingActiveFieldId, setMarketingActiveFieldId] = useState(null);
  const [screenshotBlob, setScreenshotBlob] = useState(null);
  const [useScreenshotInImages, setUseScreenshotInImages] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiInitialType, setAiInitialType] = useState('full-marketing');
  const [figmaImportOpen, setFigmaImportOpen] = useState(false);
  const [realFileLoaderOpen, setRealFileLoaderOpen] = useState(false);
  const [restoreBackupOpen, setRestoreBackupOpen] = useState(false);
  const [realFileData, setRealFileData] = useState(null);
  const [fileViewports, setFileViewports] = useState({});
  const [activeViewportMode, setActiveViewportMode] = useState(() => {
    const saved = localStorage.getItem('bluepainter-viewport-mode');
    return saved || 'desktop';
  });
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
    figma: getEmptyFigmaImportNodes(),
    'real-file': null
  }));
  const [code, setCode] = useState('');
  const [lastSyncedCode, setLastSyncedCode] = useState('');
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingCanvasUpdate, setPendingCanvasUpdate] = useState(null);

  const [tourActive, setTourActive] = useState(initialRoute.startTour);
  const [tourStep, setTourStep] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackPromptShown, setFeedbackPromptShown] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [specOpen, setSpecOpen] = useState(false);
  const [gitContextModalOpen, setGitContextModalOpen] = useState(false);
  const [presenterMessage, setPresenterMessage] = useState(null);
  const [presenterRunning, setPresenterRunning] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(() => getFeedbackSummary().total);
  const [receiptPolicy, setReceiptPolicy] = useState(() => loadReceiptPolicy());
  const [learningConfig, setLearningConfig] = useState(() => loadLearningConfig());
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

  const handleViewportChange = useCallback((viewportId) => {
    setActiveViewportMode(viewportId);
    localStorage.setItem('bluepainter-viewport-mode', viewportId);
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
    learningLoop.log('figma_import', { targetFile, nodeCount, frameName });
    notify(`Imported "${frameName || 'frame'}" — ${nodeCount} layers`);
  }, [learningLoop, notify]);

  const handleRealFileLoaded = useCallback(({ fileName, code, nodes, rootId }) => {
    // Update the workspace file definition for real-file
    const workspaceFile = getWorkspaceFile('real-file');
    workspaceFile.label = fileName;
    workspaceFile.rootId = rootId;
    workspaceFile.defaultSelection = rootId;
    
    setRealFileData({ fileName, code, rootId });
    setNodesByFile((prev) => ({ ...prev, 'real-file': nodes }));
    setCode(code);
    setLastSyncedCode(code);
    setActiveFile('real-file');
    setSelectedNodeId(rootId);
    setFocusedPanel('canvas');
    learningLoop.log('real_file_loaded', { fileName, nodeCount: Object.keys(nodes).length });
    notify(`Loaded "${fileName}" — ${Object.keys(nodes).length} nodes`);
  }, [learningLoop, notify]);

  const handleRestoreBackup = useCallback((backup) => {
    if (!backup) return;
    
    // Update the workspace file definition for real-file
    const workspaceFile = getWorkspaceFile('real-file');
    workspaceFile.label = backup.fileName;
    workspaceFile.rootId = backup.rootId;
    workspaceFile.defaultSelection = backup.rootId;
    
    setRealFileData({ fileName: backup.fileName, code: backup.code, rootId: backup.rootId });
    setNodesByFile((prev) => ({ ...prev, 'real-file': backup.nodes }));
    setCode(backup.code);
    setLastSyncedCode(backup.code);
    setActiveFile('real-file');
    setSelectedNodeId(backup.rootId);
    setFocusedPanel('canvas');
    learningLoop.log('backup_restored', { fileName: backup.fileName, backupId: backup.id });
    notify(`Restored "${backup.fileName}" from backup`);
  }, [learningLoop, notify]);

  const handleDownloadRealFile = useCallback(() => {
    if (!realFileData || activeFile !== 'real-file') {
      notify('No real file loaded');
      return;
    }

    const currentCode = code;
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = realFileData.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    learningLoop.log('real_file_downloaded', { fileName: realFileData.fileName });
    notify(`Downloaded ${realFileData.fileName}`);
  }, [realFileData, activeFile, code, learningLoop, notify]);

  const handleApplyAI = useCallback(({ type, updates, message, source }) => {
    const { nodesByFile: next, applied } = applyAIUpdates(nodesByFile, updates, type);
    setNodesByFile(next);
    const target = getFirstUpdateTarget(updates, type);
    if (target) {
      setActiveFile(target.fileId);
      setSelectedNodeId(target.nodeId);
      setFocusedPanel('canvas');
    }
    learningLoop.log('ai_generate_applied', { type, applied, source });
    notify(message || `Applied ${applied} updates to canvas`);
  }, [learningLoop, nodesByFile, notify]);

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
      window.location.hash = '#/home';
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

  // Facilitator keyboard shortcuts
  useEffect(() => {
    if (!facilitator || phase === 'landing') return;
    
    const handleFacilitatorShortcuts = (e) => {
      // Cmd/Ctrl + K: Toggle session checklist
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        setSessionChecklistOpen(prev => !prev);
        return;
      }
      
      // Cmd/Ctrl + Shift + K: Toggle scorecard
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        setScorecardOpen(prev => !prev);
        return;
      }
    };
    
    window.addEventListener('keydown', handleFacilitatorShortcuts);
    return () => window.removeEventListener('keydown', handleFacilitatorShortcuts);
  }, [facilitator, phase, sessionChecklistOpen, scorecardOpen]);

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
      const nextCode = generateTSX(activeRootId, activeNodesMap, codeRef.current);
      if (nextCode === null) {
        notify('⚠️ Canvas sync paused — some edits could not update the code. Try editing simpler properties or switching to a different component.');
        return;
      }
      setCode(nextCode);
      setLastSyncedCode(nextCode);
      // Log canvas-to-code sync when code is actually updated
      if (codeRef.current) {
        learningLoop.logCanvasToCodeSync(activeRootId, activeFile, codeRef.current ? 'patch' : 'generate');
      }
    }
  }, [activeFile, activeRootId, activeNodesMap, notify, learningLoop]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Auto-save backup for crash recovery (SPEC §5)
  useEffect(() => {
    if (!realFileData || activeFile !== 'real-file' || !code || !activeNodesMap) {
      return;
    }

    const interval = setInterval(() => {
      const result = createBackup(
        realFileData.fileName,
        code,
        activeNodesMap,
        realFileData.rootId
      );
      
      if (result.success) {
        console.log('[AutoSave] Backup created:', result.backupId);
      }
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [realFileData, activeFile, code, activeNodesMap]);

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
    setLastSyncedCode(newCode);
    const updatedNodes = parseTSX(newCode, activeNodesMap);
    setActiveNodesMap(updatedNodes);
    learningLoop.logCodeToCanvasSync(activeFile, Object.keys(updatedNodes).length);
    refreshLearningSummary();
  };

  const handleUpdateNode = (nodeId, updatedFields) => {
    // Conflict detection: check if code has changed since last sync (CONFLICT_MODEL.md v2)
    if (lastSyncedCode && code !== lastSyncedCode) {
      setPendingCanvasUpdate({ 
        nodeId, 
        updatedFields,
        lastSyncedCode,
        currentCode: code 
      });
      setConflictDialogOpen(true);
      return;
    }

    applyNodeUpdate(nodeId, updatedFields);
  };

  const applyNodeUpdate = (nodeId, updatedFields) => {
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
    learningLoop.logCanvasToCodeSync(nodeId, activeFile, 'node_update');
    refreshLearningSummary();
  };

  const handleConflictResolve = (resolution) => {
    setConflictDialogOpen(false);

    if (resolution === 'overwrite_with_canvas' && pendingCanvasUpdate) {
      learningLoop.log('conflict_resolved', {
        resolution: 'overwrite_with_canvas',
        fileName: activeFile,
        nodeId: pendingCanvasUpdate.nodeId
      });
      applyNodeUpdate(pendingCanvasUpdate.nodeId, pendingCanvasUpdate.updatedFields);
    } else if (resolution === 'discard_canvas') {
      learningLoop.log('conflict_resolved', {
        resolution: 'discard_canvas',
        fileName: activeFile
      });
      // Re-sync canvas from current code
      const updatedNodes = parseTSX(code, activeNodesMap);
      setActiveNodesMap(updatedNodes);
      setLastSyncedCode(code);
    } else if (resolution === 'show_both') {
      learningLoop.log('conflict_resolved', {
        resolution: 'show_both_manual_fix',
        fileName: activeFile,
        nodeId: pendingCanvasUpdate?.nodeId
      });
      setToast({
        message: 'Review the diff and manually resolve the conflict in the code editor.',
        type: 'info',
        duration: 5000
      });
      // Don't apply either change - user must manually resolve
    }
    // 'cancel' - do nothing

    setPendingCanvasUpdate(null);
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
    learningLoop.log('component_instance_added', { refFile, page: activeFile });
    refreshLearningSummary();
  }, [learningLoop, activeFile, activeNodesMap, activeRootId, fileConfig.isPage, setActiveNodesMap, notify]);

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
    const oldPolicy = receiptPolicy;
    learningLoop.logPolicyChange('receiptPolicy', oldPolicy, nextPolicy);
    refreshLearningSummary();
  };

  const handleDismissRule = (ruleId) => {
    setDismissedRules((prev) => new Set([...prev, ruleId]));
    learningLoop.logReceiptDismissed(ruleId, selectedNodeId, activeFile);
    refreshLearningSummary();
  };

  const handleReceiptFix = (ruleId, fixKey) => {
    learningLoop.logReceiptFixApplied(fixKey, selectedNodeId, { ruleId }, ruleId);
    refreshLearningSummary();
  };

  const handleApplySuggestion = (suggestion) => {
    const updatedConfig = { ...learningConfig };

    if (suggestion.type === 'downgrade_rule') {
      if (!updatedConfig.hiddenRules.includes(suggestion.ruleId)) {
        updatedConfig.hiddenRules = [...updatedConfig.hiddenRules, suggestion.ruleId];
        setDismissedRules((prev) => new Set([...prev, suggestion.ruleId]));
        learningLoop.log('learning_rule_hidden', {
          ruleId: suggestion.ruleId,
          reason: suggestion.reason
        });
        notify(`Rule "${suggestion.ruleId}" hidden from receipts`);
      }
    } else if (suggestion.type === 'prefer_quick_fix') {
      updatedConfig.preferredFixes[suggestion.fixKey] = {
        priority: 'high',
        appliedCount: suggestion.fixCount,
        ruleIds: suggestion.ruleIds,
        timestamp: Date.now()
      };
      learningLoop.log('learning_fix_preferred', {
        fixKey: suggestion.fixKey,
        ruleIds: suggestion.ruleIds
      });
      notify(`Quick-fix preference saved for "${suggestion.fixKey}"`);
    }
    
    setLearningConfig(updatedConfig);
    saveLearningConfig(updatedConfig);
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
    const result = downloadValidationExport();
    if (result.success) {
      if (result.isEmpty) {
        notify('⚠️ Export created — no session data yet. Run validation sessions and collect feedback.');
      } else {
        notify(`✓ Validation export complete — ${result.sessionCount} session(s), ${result.eventCount} learning events`);
      }
    } else {
      notify(`❌ Export failed: ${result.error}`);
    }
    setFeedbackCount(getFeedbackSummary().total);
    refreshLearningSummary();
  };

  const handleExportLearningLoop = () => {
    const result = downloadLearningLoopExport(learningLoop);
    if (result.success) {
      if (result.isEmpty) {
        notify('⚠️ Learning loop exported — no events yet. Interact with receipts to log events.');
      } else {
        notify(`✓ Learning loop exported — ${result.eventCount} event(s)`);
      }
    } else {
      notify(`❌ Export failed: ${result.error}`);
    }
  };

  const handleExportPilotPack = () => {
    const result = downloadPilotPackExport();
    if (result.success) {
      if (result.isEmpty) {
        notify('⚠️ Pilot pack created — no session data yet. Run validation sessions first.');
      } else {
        notify(`✓ Pilot pack exported — ${result.sessionCount} session(s), ${result.recommendation} recommendation`);
      }
    } else {
      notify(`❌ Export failed: ${result.error}`);
    }
  };

  const handleExportComponent = () => {
    const nodesMap = nodesByFile[activeFile];
    const fileInfo = getWorkspaceFile(activeFile);
    const rootId = fileInfo.rootId;
    
    if (!rootId || !nodesMap || !nodesMap[rootId]) {
      notify('⚠️ No component loaded to export');
      return;
    }

    const existingCode = generateTSX(rootId, nodesMap, null);
    const result = exportComponentTSX(rootId, nodesMap, existingCode);
    
    if (result.success) {
      notify(`✓ ${result.filename} exported — ${result.linesOfCode} lines, ready for src/`);
      learningLoop.log('component_exported', {
        filename: result.filename,
        componentName: result.componentName,
        linesOfCode: result.linesOfCode,
        sourceFile: activeFile
      });
      refreshLearningSummary();
    } else {
      notify(`❌ Export failed: ${result.error}`);
    }
  };
  
  const handleBatchExportComponents = async () => {
    const result = await batchExportComponents(nodesByFile);
    
    if (result.success) {
      notify(`✓ Batch export complete — ${result.exported} component(s) in ${result.filename}`);
      learningLoop.log('batch_export', {
        exported: result.exported,
        failed: result.failed,
        components: result.components.map(c => c.componentName)
      });
      refreshLearningSummary();
    } else {
      notify(`❌ Batch export failed: ${result.error}`);
    }
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
    learningSummary,
    learningLoop,
    learningConfig,
    onApplySuggestion: handleApplySuggestion
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
    receiptsConfig,
    activeViewportMode,
    onViewportChange: handleViewportChange
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
        <FeedbackModal 
          isOpen={feedbackOpen} 
          onClose={handleFeedbackClose}
          onExport={facilitator ? handleExportFeedback : null}
        />
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
        onExportComponent={handleExportComponent}
        onBatchExport={handleBatchExportComponents}
        onOpenMarketingKit={handleOpenMarketingKit}
        onOpenFigmaImport={() => setFigmaImportOpen(true)}
        onOpenRealFile={() => setRealFileLoaderOpen(true)}
        onRestoreBackup={() => setRestoreBackupOpen(true)}
        onDownloadRealFile={handleDownloadRealFile}
        onOpenAI={() => handleOpenAI('full-marketing')}
        onCopyLink={handleCopyLink}
        onOpenGitContext={() => setGitContextModalOpen(true)}
        realFileLoaded={realFileData !== null}
        facilitatorActions={facilitator ? {
          onBreakDesign: handleBreakDesign,
          onFixAll: handleFixAll,
          onReset: handleResetDemo,
          onStartTour: () => { setTourActive(true); setTourStep(0); },
          onRunPresenter: handleRunPresenter,
          onOpenScript: () => setScriptOpen(true),
          onOpenSpec: () => setSpecOpen(true),
          onOpenDashboard: () => setFacilitatorDashboardOpen(true),
          onOpenScorecard: () => setScorecardOpen(true),
          onOpenSessionChecklist: () => setSessionChecklistOpen(true),
          onExportFeedback: handleExportFeedback,
          onExportLearningLoop: handleExportLearningLoop,
          onExportPilotPack: handleExportPilotPack,
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
      <SessionChecklistModal isOpen={sessionChecklistOpen} onClose={() => setSessionChecklistOpen(false)} />
      {facilitator && <FacilitatorDashboard isOpen={facilitatorDashboardOpen} onClose={() => setFacilitatorDashboardOpen(false)} learningLoop={learningLoop} />}
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
      <RealFileLoader
        isOpen={realFileLoaderOpen}
        onClose={() => setRealFileLoaderOpen(false)}
        onFileLoaded={handleRealFileLoaded}
      />
      <RestoreBackupModal
        isOpen={restoreBackupOpen}
        onClose={() => setRestoreBackupOpen(false)}
        onRestore={handleRestoreBackup}
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
      <GitContextModal key={gitContextModalOpen ? 'open' : 'closed'} isOpen={gitContextModalOpen} onClose={() => setGitContextModalOpen(false)} />
      
      <ConflictDialog
        isOpen={conflictDialogOpen}
        onResolve={handleConflictResolve}
        conflictContext={{
          lastSyncedCode: pendingCanvasUpdate?.lastSyncedCode,
          currentCode: pendingCanvasUpdate?.currentCode,
          pendingUpdate: pendingCanvasUpdate?.updatedFields,
          nodeId: pendingCanvasUpdate?.nodeId
        }}
      />
      
      <AppToast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
