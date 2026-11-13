import { useState, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import { generateTSX, parseTSX, importTSXFile, getASTMeta } from './utils/syncEngine';
import { createHistory, historyReducer, loadWorkspace, saveWorkspace, clearWorkspace, getFreshNodesByFile } from './utils/workspaceStore';
import { registerCustomFile, USER_FILE_ID } from './data/workspaceFiles';
import { exportComponentTSX } from './utils/componentExport';
import { batchExportComponents } from './utils/batchComponentExport';
import { applyBrokenDesignScenario, applyFixedDesignScenario } from './utils/demoScenarios';
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
import PricingPage from './components/PricingPage';
import WorkspaceHeader from './components/WorkspaceHeader';
import DemoTour from './components/DemoTour';
import FeedbackModal from './components/FeedbackModal';
import DemoScriptModal from './components/DemoScriptModal';
import PresenterToast from './components/PresenterToast';
import SpecModal from './components/SpecModal';
import ConflictDialog from './components/ConflictDialog';
import ExportDeployModal from './components/ExportDeployModal';
import MarketingKitModal from './components/MarketingKitModal';
import FigmaImportModal from './components/FigmaImportModal';
import FacilitatorDashboard from './components/FacilitatorDashboard';
import AIGeneratePanel from './components/AIGeneratePanel';
import RealFileLoader from './components/RealFileLoader';
import RestoreBackupModal from './components/RestoreBackupModal';
import ExportConfirmationModal from './components/ExportConfirmationModal';
import GitContextModal from './components/GitContextModal';
import { createNodeFromTool, canDropIntoNode } from './utils/nodeFactory';
import { getToolByShortcut, isPlacableTool } from './data/canvasTools';
import { applyAIUpdates, getFirstUpdateTarget } from './utils/aiApply';
import { createBackup, AUTO_SAVE_INTERVAL_MS } from './utils/autoSaveBackup';
import { isDesktop, openTsxFile, saveTsxFile, saveTsxFileAs } from './utils/desktopBridge';
import AuthModal from './lib/auth/AuthModal';
import ProjectPicker from './components/ProjectPicker';
import { useAuth } from './lib/auth/AuthContext';
import { updateProjectState } from './lib/projects/projectsApi';

const VALID_PHASES = ['landing', 'phase1', 'phase2', 'phase3', 'phase4'];
const TOUR_SEEN_KEY = 'bluepainter-tour-seen';
const facilitator = isFacilitatorMode();

// localStorage throws in some private-browsing / embedded contexts.
function safeStorageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
/**
 * Opened files often style with Tailwind classes, which the canvas can't see
 * without the CSS. Load the Tailwind Play CDN for preview only — with preflight
 * off so it can't restyle the Studio's own UI.
 */
function enableTailwindPreview() {
  if (typeof document === 'undefined' || document.getElementById('bp-tailwind-preview')) return;
  window.tailwind = window.tailwind || {};
  window.tailwind.config = { corePlugins: { preflight: false } };
  const script = document.createElement('script');
  script.id = 'bp-tailwind-preview';
  script.src = 'https://cdn.tailwindcss.com';
  script.async = true;
  document.head.appendChild(script);
}

function safeStorageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return { phase: 'landing', startTour: false };
  if (hash === 'app' || hash === 'studio') return { phase: 'phase1', startTour: false };
  if (hash === 'home' || hash === 'landing') return { phase: 'landing', startTour: false };
  if (hash === 'pricing') return { phase: 'pricing', startTour: false };
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
  const { user, loading: authLoading, enabled: authEnabled } = useAuth();
  
  const initialRoute = parseHash();
  const [phase, setPhase] = useState(() => {
    const route = initialRoute.phase === 'landing' ? 'landing' : initialRoute.phase;
    return route;
  });
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  
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
  // Restored once from localStorage (or fresh demo files on first visit).
  const [initialWorkspace] = useState(loadWorkspace);
  const [realFileLoaderOpen, setRealFileLoaderOpen] = useState(false);
  const [restoreBackupOpen, setRestoreBackupOpen] = useState(false);
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);
  const [exportConfirmResult, setExportConfirmResult] = useState(null);
  const [fileViewports, setFileViewports] = useState(initialWorkspace.fileViewports);
  const [activeViewportMode, setActiveViewportMode] = useState(() => safeStorageGet('bluepainter-viewport-mode') || 'desktop');
  const [welcomeOpen, setWelcomeOpen] = useState(() => !hasSeenWelcome());
  const [toast, setToast] = useState(null);
  const [activeFile, setActiveFile] = useState(initialWorkspace.activeFile);
  const [selectedNodeId, setSelectedNodeId] = useState(() => getWorkspaceFile(initialWorkspace.activeFile).defaultSelection);
  // Extra selected layers beside `selectedNodeId` (the primary). Tied to the primary
  // they were built around, so any plain setSelectedNodeId() drops them.
  const [extraSelection, setExtraSelection] = useState({ anchor: null, ids: [] });
  const [activeCanvasTool, setActiveCanvasTool] = useState('select');
  const [focusedPanel, setFocusedPanel] = useState('canvas');

  // All file node maps live in one undo/redo history.
  const [history, dispatchHistory] = useReducer(historyReducer, initialWorkspace.nodesByFile, createHistory);
  const nodesByFile = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const setNodesByFile = useCallback((updater) => {
    dispatchHistory({ type: 'set', updater, at: Date.now() });
  }, []);
  // What the user last typed in the code editor, per file, with the node map it
  // parsed to. Canvas edits are patched onto this so formatting/comments survive.
  const [codeBaseByFile, setCodeBaseByFile] = useState(initialWorkspace.codeBaseByFile);
  // Canvas edit held back because the code panel has text the canvas can't read (CONFLICT_MODEL.md).
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
  const toastTimerRef = useRef(null);
  const lastLearningRef = useRef({ key: '', at: 0 });
  const deleteNodeRef = useRef(null);
  const nudgeRef = useRef(null);
  const saveFileRef = useRef(null);
  // Desktop app only: where the opened file lives on disk, so Save writes back to it.
  const [userFilePath, setUserFilePath] = useState(null);
  const backupStateRef = useRef(null);

  const refreshLearningSummary = () => setLearningSummary(getLearningSummary());

  const fileConfig = {
    ...getWorkspaceFile(activeFile),
    ...(fileViewports[activeFile] ? { viewport: fileViewports[activeFile] } : {})
  };
  const activeNodesMap = nodesByFile[activeFile];
  const activeRootId = fileConfig.rootId;

  const selectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return [];
    const extras = extraSelection.anchor === selectedNodeId
      ? extraSelection.ids.filter((id) => id !== selectedNodeId && activeNodesMap?.[id])
      : [];
    return [selectedNodeId, ...extras];
  }, [selectedNodeId, extraSelection, activeNodesMap]);

  /**
   * Select a layer. `additive` (shift / ⌘-click) toggles it in the selection;
   * `ids` replaces the selection with a set (rubber-band).
   */
  const handleSelectNode = useCallback((nodeId, options = {}) => {
    if (Array.isArray(options.ids)) {
      const [first = null, ...rest] = options.ids;
      setSelectedNodeId(first);
      setExtraSelection({ anchor: first, ids: rest });
      return;
    }
    if (!options.additive || !nodeId || !selectedNodeIds.length) {
      setSelectedNodeId(nodeId);
      setExtraSelection({ anchor: nodeId, ids: [] });
      return;
    }
    if (selectedNodeIds.includes(nodeId)) {
      const rest = selectedNodeIds.filter((id) => id !== nodeId);
      if (!rest.length) return;
      setSelectedNodeId(rest[0]);
      setExtraSelection({ anchor: rest[0], ids: rest.slice(1) });
    } else {
      setSelectedNodeId(nodeId);
      setExtraSelection({ anchor: nodeId, ids: selectedNodeIds });
    }
  }, [selectedNodeIds]);

  // The code panel is derived from the active file's nodes. Keeping it per file
  // means switching files can never show — or patch — another file's code.
  const activeCodeBase = codeBaseByFile[activeFile];
  const code = useMemo(() => {
    if (!activeRootId || !activeNodesMap) return '';
    // The editor's own text is authoritative until the canvas changes the nodes.
    if (activeCodeBase && activeCodeBase.nodes === activeNodesMap) return activeCodeBase.code;
    return generateTSX(activeRootId, activeNodesMap, activeCodeBase?.code);
  }, [activeRootId, activeNodesMap, activeCodeBase]);

  // A restored/opened file that styles with classes needs the Tailwind preview CSS.
  const userFileNodes = nodesByFile[USER_FILE_ID];
  const userFileUsesClasses = useMemo(
    () => Object.values(userFileNodes || {}).some((n) => typeof n?.className === 'string' && n.className.trim()),
    [userFileNodes]
  );
  useEffect(() => {
    if (activeFile === USER_FILE_ID && userFileUsesClasses) enableTailwindPreview();
  }, [activeFile, userFileUsesClasses]);

  // Autosave (debounced) so a refresh or crash never loses work.
  useEffect(() => {
    const timer = setTimeout(() => {
      const codeByFile = {};
      Object.entries(codeBaseByFile).forEach(([fileId, base]) => {
        // Only keep editor text that still matches the nodes it was parsed into.
        if (base && base.nodes === nodesByFile[fileId]) codeByFile[fileId] = base.code;
      });
      // The active file's current code keeps its formatting across reloads too.
      if (code) codeByFile[activeFile] = code;
      saveWorkspace({ nodesByFile, codeByFile, fileViewports, activeFile });
    }, 600);
    return () => clearTimeout(timer);
  }, [nodesByFile, codeBaseByFile, fileViewports, activeFile, code]);
  const setActiveNodesMap = useCallback((updater) => {
    setNodesByFile((prev) => {
      const next = typeof updater === 'function' ? updater(prev[activeFile]) : updater;
      return next === prev[activeFile] ? prev : { ...prev, [activeFile]: next };
    });
  }, [activeFile, setNodesByFile]);

  const handleSetActiveFile = useCallback((file) => {
    setActiveFile(file);
    setSelectedNodeId(getWorkspaceFile(file).defaultSelection);
  }, []);

  const handleViewportChange = useCallback((viewportId) => {
    setActiveViewportMode(viewportId);
    safeStorageSet('bluepainter-viewport-mode', viewportId);
  }, []);

  const notify = useCallback((message) => {
    setToast(message);
    // Restart the timer so an older toast's timeout can't dismiss a newer one early.
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  /**
   * Log a sync event at most once per burst. Dragging, resizing and typing fire
   * dozens of updates a second; logging each one rewrote localStorage every frame.
   */
  const logLearningOnce = useCallback((type, key, logEvent) => {
    const now = Date.now();
    const last = lastLearningRef.current;
    const burstKey = `${type}:${key}`;
    if (last.key === burstKey && now - last.at < 1500) {
      last.at = now;
      return;
    }
    lastLearningRef.current = { key: burstKey, at: now };
    logEvent();
    setLearningSummary(getLearningSummary());
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
  }, [setNodesByFile]);

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
  }, [learningLoop, notify, setNodesByFile]);

  // Put a user's file (already parsed to layers) in the `real-file` slot and show it.
  const showUserFile = useCallback(({ fileName, code: fileCode, nodes, rootId, componentName }) => {
    registerCustomFile({ label: fileName, rootId, componentName });
    setNodesByFile((prev) => ({ ...prev, [USER_FILE_ID]: nodes }));
    setCodeBaseByFile((prev) => ({ ...prev, [USER_FILE_ID]: { code: fileCode, nodes } }));
    setActiveFile(USER_FILE_ID);
    setSelectedNodeId(rootId);
    setFocusedPanel('canvas');
    if (/\bclassName=/.test(fileCode)) enableTailwindPreview();
  }, [setNodesByFile]);

  const handleRealFileLoaded = useCallback(({ fileName, code: fileCode, nodes, rootId, componentName, addedIds }) => {
    showUserFile({ fileName, code: fileCode, nodes, rootId, componentName });
    setUserFilePath(null);
    const nodeCount = Object.keys(nodes).length;
    learningLoop.log('real_file_loaded', { fileName, nodeCount });
    notify(addedIds
      ? `Loaded "${fileName}" — ${nodeCount} layers (added ${addedIds} id attribute${addedIds === 1 ? '' : 's'} so they are editable)`
      : `Loaded "${fileName}" — ${nodeCount} layers`);
  }, [learningLoop, notify, showUserFile]);

  // Desktop app: native open dialog. Web: the drag-and-drop loader.
  const handleOpenRealFile = useCallback(async () => {
    if (!isDesktop()) {
      setRealFileLoaderOpen(true);
      return;
    }
    const picked = await openTsxFile();
    if (!picked) return;
    try {
      const imported = importTSXFile(picked.content, picked.name);
      showUserFile({ fileName: picked.name, ...imported });
      setUserFilePath(picked.path);
      learningLoop.log('real_file_loaded', { fileName: picked.name, nodeCount: Object.keys(imported.nodes).length, desktop: true });
      notify(`Opened ${picked.name} — Save (⌘S) writes back to the file`);
    } catch (err) {
      notify(err.message || 'Could not open that file');
    }
  }, [learningLoop, notify, showUserFile]);

  const handleRestoreBackup = useCallback((backup) => {
    if (!backup) return;
    let restored = { code: backup.code, nodes: backup.nodes, rootId: backup.rootId, componentName: backup.componentName };
    try {
      // Rebuild the layers from the saved code so older backups get the full tree.
      restored = importTSXFile(backup.code, backup.fileName);
    } catch {
      // fall back to the layer map stored with the backup
    }
    if (!restored.nodes || !restored.nodes[restored.rootId]) {
      notify(`Could not restore "${backup.fileName}" — the backup has no readable layers`);
      return;
    }
    showUserFile({ fileName: backup.fileName, ...restored });
    setUserFilePath(null);
    learningLoop.log('backup_restored', { fileName: backup.fileName, backupId: backup.id });
    notify(`Restored "${backup.fileName}" from backup`);
  }, [learningLoop, notify, showUserFile]);

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
  }, [learningLoop, nodesByFile, notify, setNodesByFile]);

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
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };
    // Space/Enter must keep activating focused buttons and links.
    const isActivatable = (el) => Boolean(el?.closest?.('button, a, summary, [role="button"]'));
    const isModalOpen = () => Boolean(document.querySelector('.feedback-modal-overlay, .export-modal-overlay, .demo-script-overlay, .welcome-overlay'));

    const onKeyDown = (e) => {
      // ⌘S saves to disk in the desktop app (even while typing in the code editor).
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 's' && isDesktop()) {
        e.preventDefault();
        saveFileRef.current?.();
        return;
      }
      if (isTypingTarget(e.target) || isModalOpen()) return;
      if (e.key === ' ') {
        if (isActivatable(e.target)) return;
        e.preventDefault(); // also stops the page scrolling while space is held
        if (e.repeat || activeCanvasTool === 'hand') return;
        toolBeforeSpaceRef.current = activeCanvasTool;
        setActiveCanvasTool('hand');
        return;
      }
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        dispatchHistory({ type: e.shiftKey ? 'redo' : 'undo' });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        dispatchHistory({ type: 'redo' });
        return;
      }
      if (e.key.startsWith('Arrow') && !e.metaKey && !e.ctrlKey && !e.altKey && !isActivatable(e.target)) {
        const step = e.shiftKey ? 10 : 1;
        const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
        if (delta && nudgeRef.current?.(delta[0], delta[1])) e.preventDefault();
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.metaKey && !e.ctrlKey && !isActivatable(e.target)) {
        if (selectedNodeId && selectedNodeId !== activeRootId) {
          e.preventDefault();
          deleteNodeRef.current?.(selectedNodeId);
        }
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
  }, [activeCanvasTool, selectedNodeId, activeRootId]);

  const handleExportLearningLoop = useCallback(() => {
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
  }, [learningLoop, notify]);

  const handleExportPilotPack = useCallback(() => {
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
  }, [notify]);

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
      
      // Cmd/Ctrl + E: Quick export pilot pack
      if ((e.metaKey || e.ctrlKey) && e.key === 'e' && !e.shiftKey) {
        e.preventDefault();
        handleExportPilotPack();
        return;
      }
      
      // Cmd/Ctrl + Shift + L: Export learning loop
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        handleExportLearningLoop();
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
  }, [phase, handleExportLearningLoop, handleExportPilotPack]);

  const handleGoHome = useCallback(() => {
    setMarketingKitOpen(false);
    setAiPanelOpen(false);
    setAboutOpen(false);
    setPhase('landing');
    window.location.hash = '#/home';
  }, []);

  const handleLaunchApp = useCallback((nextPhase = 'phase1') => {
    if (authLoading) return;

    // Without Supabase configured (local dev, self-hosted demo) the Studio runs
    // signed-out and keeps the workspace in this browser only.
    if (authEnabled) {
      if (!user) {
        setAuthModalOpen(true);
        return;
      }
      if (!currentProject) {
        setProjectPickerOpen(true);
        return;
      }
    }
    
    setPhase(nextPhase);
    window.location.hash = '#/app';
    markWelcomeSeen();
    setWelcomeOpen(false);
  }, [user, authLoading, authEnabled, currentProject]);

  const handleWelcomeStart = () => {
    handleLaunchApp('phase1');
  };

  const handleProjectSelected = useCallback((project, studioState) => {
    setCurrentProject(project);
    setProjectPickerOpen(false);
    
    // A project replaces the workspace: start from the demo files, lay the saved
    // files over them, and start a fresh undo history.
    const next = getFreshNodesByFile();
    if (studioState && typeof studioState === 'object') {
      Object.entries(studioState).forEach(([fileId, nodes]) => {
        const file = getWorkspaceFile(fileId);
        if (fileId !== USER_FILE_ID && file.id === fileId && nodes && nodes[file.rootId]) next[fileId] = nodes;
      });
    }
    dispatchHistory({ type: 'reset', value: next });
    setCodeBaseByFile({});

    const openFile = project.studio_active_file && next[project.studio_active_file] ? project.studio_active_file : 'dashboard';
    setActiveFile(openFile);
    setSelectedNodeId(getWorkspaceFile(openFile).defaultSelection);
    
    setPhase('phase1');
    window.location.hash = '#/app';
    markWelcomeSeen();
    setWelcomeOpen(false);
    notify(`Opened project: ${project.name}`);
  }, [notify]);

  const handleAuthSuccess = useCallback(() => {
    setAuthModalOpen(false);
    setProjectPickerOpen(true);
  }, []);

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

  // Crash-recovery backups of the opened file (SPEC §5). The interval reads the
  // latest state from a ref so typing doesn't keep restarting it.
  useEffect(() => {
    backupStateRef.current = activeFile === USER_FILE_ID && code && activeNodesMap
      ? { fileName: fileConfig.label, code, nodes: activeNodesMap, rootId: activeRootId }
      : null;
  });
  useEffect(() => {
    if (activeFile !== USER_FILE_ID) return undefined;
    let lastSaved = null;
    const interval = setInterval(() => {
      const snap = backupStateRef.current;
      if (!snap || snap.code === lastSaved) return;
      if (createBackup(snap.fileName, snap.code, snap.nodes, snap.rootId).success) lastSaved = snap.code;
    }, AUTO_SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeFile]);

  // Auto-save project state to Supabase
  useEffect(() => {
    if (!currentProject || !user || phase === 'landing') return undefined;
    const timer = setTimeout(async () => {
      try {
        await updateProjectState(currentProject.id, nodesByFile, activeFile);
      } catch (error) {
        console.error('[AutoSave] Failed to save project:', error);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentProject, user, nodesByFile, activeFile, phase]);

  useEffect(() => {
    if (!facilitator) return;
    const timer = setTimeout(() => {
      if (!feedbackPromptShown && !safeStorageGet('bluepainter-feedback-given')) {
        setFeedbackOpen(true);
        setFeedbackPromptShown(true);
      }
    }, 90000);
    return () => clearTimeout(timer);
  }, [phase, feedbackPromptShown]);

  const handleCodeChange = (newCode) => {
    const parsedNodes = parseTSX(newCode, activeNodesMap, activeRootId);
    // No AST coverage means the canvas could not read this text (syntax error, or no ids).
    const unsynced = !getASTMeta(parsedNodes);
    setCodeBaseByFile((prev) => ({ ...prev, [activeFile]: { code: newCode, nodes: parsedNodes, unsynced } }));
    setActiveNodesMap(parsedNodes);
    logLearningOnce('code', 'editor', () => learningLoop.logCodeToCanvasSync(activeFile, Object.keys(parsedNodes).length));
  };

  const handleUpdateNode = (nodeId, updatedFields, options = {}) => {
    // Conflict detection (CONFLICT_MODEL.md v2): the code panel holds text the
    // canvas could not read, so a canvas edit would regenerate over it. Ask first.
    if (activeCodeBase?.unsynced && activeCodeBase.nodes === activeNodesMap) {
      if (!conflictDialogOpen) {
        setPendingCanvasUpdate({
          nodeId,
          updatedFields,
          lastSyncedCode: generateTSX(activeRootId, activeNodesMap, null),
          currentCode: code
        });
        setConflictDialogOpen(true);
      }
      return;
    }

    applyNodeUpdate(nodeId, updatedFields);

    // With several layers selected, a style change made on the primary (inspector,
    // receipt fix) applies to the rest. Drags and resizes pass `single`.
    if (!options.single && updatedFields.style && nodeId === selectedNodeId && selectedNodeIds.length > 1) {
      const before = activeNodesMap[nodeId]?.style || {};
      const changed = Object.fromEntries(
        Object.entries(updatedFields.style).filter(([key, value]) => before[key] !== value)
      );
      if (Object.keys(changed).length) {
        selectedNodeIds.slice(1).forEach((id) => applyNodeUpdate(id, { style: changed }));
      }
    }
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
    logLearningOnce('canvas', nodeId, () => learningLoop.logCanvasToCodeSync(nodeId, activeFile, 'node_update'));
  };

  const handleConflictResolve = (resolution) => {
    setConflictDialogOpen(false);
    const pending = pendingCanvasUpdate;
    setPendingCanvasUpdate(null);

    if (resolution === 'overwrite_with_canvas' && pending) {
      learningLoop.log('conflict_resolved', { resolution, fileName: activeFile, nodeId: pending.nodeId });
      // Drop the unreadable editor text; the code is regenerated from the canvas.
      setCodeBaseByFile((prev) => {
        const next = { ...prev };
        delete next[activeFile];
        return next;
      });
      applyNodeUpdate(pending.nodeId, pending.updatedFields);
    } else if (resolution === 'discard_canvas') {
      learningLoop.log('conflict_resolved', { resolution, fileName: activeFile });
      // Keep the code as typed; the canvas edit is dropped.
    } else if (resolution === 'show_both') {
      learningLoop.log('conflict_resolved', { resolution: 'show_both_manual_fix', fileName: activeFile, nodeId: pending?.nodeId });
      notify('Review the diff and fix the code in the editor, then edit on the canvas again.');
    }
    refreshLearningSummary();
  };

  const handleDeleteNode = (nodeId) => {
    // Deleting one of several selected layers deletes the whole selection.
    const targets = (selectedNodeIds.includes(nodeId) ? selectedNodeIds : [nodeId]).filter((id) => id !== activeRootId);
    if (!targets.length) return;
    setActiveNodesMap(prev => {
      if (!targets.some((id) => prev[id])) return prev;
      // Remove the nodes and everything under them, without mutating previous state.
      const doomed = new Set();
      const collect = (id) => {
        if (doomed.has(id) || !prev[id]) return;
        doomed.add(id);
        (prev[id].children || []).forEach(collect);
      };
      targets.forEach(collect);

      const updated = {};
      Object.keys(prev).forEach(id => {
        if (doomed.has(id)) return;
        const node = prev[id];
        updated[id] = node.children?.some(cid => doomed.has(cid))
          ? { ...node, children: node.children.filter(cid => !doomed.has(cid)) }
          : node;
      });
      return updated;
    });
    setSelectedNodeId(activeRootId);
  };

  useEffect(() => {
    deleteNodeRef.current = handleDeleteNode;
  });

  // Arrow keys move the selected free-positioned layers (1px, or 10px with Shift).
  useEffect(() => {
    nudgeRef.current = (dx, dy) => {
      const movable = selectedNodeIds.filter((id) => id !== activeRootId && activeNodesMap?.[id]?.style?.position === 'absolute');
      if (!movable.length) return false;
      movable.forEach((id) => {
        const style = activeNodesMap[id].style;
        handleUpdateNode(id, { style: { left: (Number(style.left) || 0) + dx, top: (Number(style.top) || 0) + dy } }, { single: true });
      });
      return true;
    };
  });

  /**
   * Move layers into another container (drag on the canvas or in the layers panel).
   * options.beforeId / afterId place them next to a sibling; options.positions gives
   * new left/top per layer so they stay where they were dropped.
   */
  const handleReparentNodes = (nodeIds, newParentId, options = {}) => {
    setActiveNodesMap((prev) => {
      const target = prev[newParentId];
      if (!target || !canDropIntoNode(target)) return prev;
      const parentOf = {};
      Object.values(prev).forEach((n) => (n?.children || []).forEach((cid) => { parentOf[cid] = n.id; }));
      const isWithin = (id, ancestorId) => {
        for (let cur = id, guard = 0; cur && guard < 500; cur = parentOf[cur], guard += 1) {
          if (cur === ancestorId) return true;
        }
        return false;
      };
      // Never the root, never into itself or its own subtree; and a layer whose
      // ancestor is also moving just travels with that ancestor.
      const candidates = nodeIds.filter((id) => prev[id] && id !== activeRootId && !isWithin(newParentId, id));
      const moving = candidates.filter((id) => !candidates.some((other) => other !== id && isWithin(id, other)));
      if (!moving.length) return prev;

      const next = { ...prev };
      Object.values(prev).forEach((n) => {
        if (n?.children?.some((cid) => moving.includes(cid))) {
          next[n.id] = { ...n, children: n.children.filter((cid) => !moving.includes(cid)) };
        }
      });
      const siblings = next[newParentId].children || [];
      let at = siblings.length;
      if (options.beforeId && siblings.includes(options.beforeId)) at = siblings.indexOf(options.beforeId);
      else if (options.afterId && siblings.includes(options.afterId)) at = siblings.indexOf(options.afterId) + 1;
      const children = [...siblings.slice(0, at), ...moving, ...siblings.slice(at)];

      const sameOrder = (prev[newParentId].children || []).join('|') === children.join('|');
      if (sameOrder && !options.positions) return prev;
      next[newParentId] = { ...next[newParentId], children };

      moving.forEach((id) => {
        const pos = options.positions?.[id];
        const style = next[id].style || {};
        if (pos) {
          next[id] = { ...next[id], style: { ...style, position: 'absolute', left: pos.left, top: pos.top } };
        } else if (style.position === 'absolute' && parentOf[id] !== newParentId) {
          // Old coordinates mean nothing in the new parent; put it near the corner.
          next[id] = { ...next[id], style: { ...style, left: 16, top: 16 } };
        }
      });
      return next;
    });
  };

  useEffect(() => {
    saveFileRef.current = handleDownloadActiveFile;
  });

  // Reorder a layer among its siblings (dir: -1 = up/earlier, 1 = down/later).
  const handleMoveNode = (nodeId, dir) => {
    setActiveNodesMap((prev) => {
      const parent = Object.values(prev).find((n) => n.children?.includes(nodeId));
      if (!parent) return prev;
      const from = parent.children.indexOf(nodeId);
      const to = from + dir;
      if (to < 0 || to >= parent.children.length) return prev;
      const children = [...parent.children];
      children.splice(from, 1);
      children.splice(to, 0, nodeId);
      return { ...prev, [parent.id]: { ...parent, children } };
    });
  };

  // Duplicate a layer (and everything inside it) right after the original.
  const handleDuplicateNode = (nodeId) => {
    if (nodeId === activeRootId) return;
    let newRootId = null;
    setActiveNodesMap((prev) => {
      const parent = Object.values(prev).find((n) => n.children?.includes(nodeId));
      if (!parent || !prev[nodeId]) return prev;
      const next = { ...prev };
      const taken = new Set(Object.keys(prev));
      const freshId = (base) => {
        const stem = base.replace(/-copy(-\d+)?$/, '');
        let id = `${stem}-copy`;
        for (let n = 2; taken.has(id); n += 1) id = `${stem}-copy-${n}`;
        taken.add(id);
        return id;
      };
      const clone = (id) => {
        const source = prev[id];
        if (!source) return null;
        const copyId = freshId(id);
        const copy = { ...source, id: copyId, style: { ...(source.style || {}) } };
        if (source.children) copy.children = source.children.map(clone).filter(Boolean);
        next[copyId] = copy;
        return copyId;
      };
      const copyRoot = clone(nodeId);
      if (next[copyRoot].style.position === 'absolute') {
        next[copyRoot].style.left = (Number(next[copyRoot].style.left) || 0) + 16;
        next[copyRoot].style.top = (Number(next[copyRoot].style.top) || 0) + 16;
      }
      const children = [...parent.children];
      children.splice(children.indexOf(nodeId) + 1, 0, copyRoot);
      next[parent.id] = { ...parent, children };
      newRootId = copyRoot;
      return next;
    });
    // the updater runs synchronously for the first of a batch; select when known
    setTimeout(() => { if (newRootId) setSelectedNodeId(newRootId); }, 0);
  };

  const makeNodeId = useCallback((prefix) => {
    let id;
    do {
      id = `${prefix}-${Math.random().toString(36).slice(2, 6)}`;
    } while (activeNodesMap?.[id]);
    return id;
  }, [activeNodesMap]);

  const handleAddNode = (type, leftOffset = 20, topOffset = 20, parentId = activeRootId) => {
    if (!isPlacableTool(type)) return;

    const parent = activeNodesMap[parentId];
    if (!parent) return;
    if (!canDropIntoNode(parent)) {
      notify('Select a frame or container first, not a leaf element.');
      return;
    }

    const newId = makeNodeId(type);
    const newNode = createNodeFromTool(type, newId, leftOffset, topOffset);
    if (!newNode) return;

    setActiveNodesMap(prev => {
      const latestParent = prev[parentId];
      if (!latestParent) return prev;
      return {
        ...prev,
        [parentId]: { ...latestParent, children: [...(latestParent.children || []), newId] },
        [newId]: newNode
      };
    });
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

    const newId = makeNodeId(`${refFile}-instance`);
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
  }, [learningLoop, activeFile, activeNodesMap, activeRootId, fileConfig.isPage, setActiveNodesMap, notify, makeNodeId]);

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
    clearWorkspace();
    dispatchHistory({ type: 'reset', value: getFreshNodesByFile() });
    setCodeBaseByFile({});
    setFileViewports({});
    handleSetActiveFile('dashboard');
    setSelectedNodeId('dashboard-page');
    setDismissedRules(new Set());
  };

  const handleUndo = useCallback(() => dispatchHistory({ type: 'undo' }), []);
  const handleRedo = useCallback(() => dispatchHistory({ type: 'redo' }), []);

  // Save the active file's current code: straight to disk in the desktop app,
  // as a download in the browser.
  const handleDownloadActiveFile = async () => {
    if (isDesktop()) {
      const name = fileConfig.label || 'Component.tsx';
      if (activeFile === USER_FILE_ID && userFilePath) {
        const result = await saveTsxFile(userFilePath, code);
        notify(result.ok ? `Saved ${name}` : `Could not save ${name}: ${result.error}`);
        if (result.ok) learningLoop.log('real_file_saved', { fileName: name, linesOfCode: code.split('\n').length });
      } else {
        const saved = await saveTsxFileAs(name, code);
        if (saved) {
          if (activeFile === USER_FILE_ID) setUserFilePath(saved.path);
          notify(`Saved ${saved.name}`);
        }
      }
      return;
    }
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileConfig.label || 'Component.tsx';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    if (activeFile === USER_FILE_ID) {
      learningLoop.log('real_file_downloaded', { fileName: anchor.download, linesOfCode: code.split('\n').length });
    }
    notify(`Downloaded ${anchor.download}`);
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
    safeStorageSet(TOUR_SEEN_KEY, 'true');
    window.location.hash = phaseToHash(phase, false);
    if (activeNodesMap?.['cta-button']) setSelectedNodeId('cta-button');
  };

  const handleTourSkip = () => {
    setTourActive(false);
    setTourStep(0);
    safeStorageSet(TOUR_SEEN_KEY, 'true');
    window.location.hash = phaseToHash(phase, false);
  };

  const handleFeedbackClose = () => {
    setFeedbackOpen(false);
    safeStorageSet('bluepainter-feedback-given', 'true');
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
      setExportConfirmResult(result);
      setExportConfirmOpen(true);
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
    selectedNodeIds,
    onSelectNode: handleSelectNode,
    onUpdateNode: handleUpdateNode,
    onReparentNodes: handleReparentNodes,
    onDeleteNode: handleDeleteNode,
    onMoveNode: handleMoveNode,
    onDuplicateNode: handleDuplicateNode,
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
  const showPricing = phase === 'pricing';

  const requiresAuth = authEnabled && !showLanding && !showPricing && !user && !authLoading;

  if (requiresAuth) {
    return (
      <div className="app-container">
        <AuthModal 
          isOpen={true}
          onClose={handleGoHome}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

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
        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  if (showPricing) {
    return (
      <div className="app-container app-landing">
        <PricingPage
          onBackToHome={() => {
            setPhase('landing');
            window.location.hash = '#/home';
          }}
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
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onDownloadFile={handleDownloadActiveFile}
        onResetWorkspace={() => { handleResetDemo(); notify('Workspace reset to the demo files'); }}
        onOpenInterviewGuide={() => setValidationScriptOpen(true)}
        onOpenExportDeploy={() => setExportDeployOpen(true)}
        onExportComponent={handleExportComponent}
        onBatchExport={handleBatchExportComponents}
        onOpenMarketingKit={handleOpenMarketingKit}
        onOpenFigmaImport={() => setFigmaImportOpen(true)}
        onOpenRealFile={handleOpenRealFile}
        onRestoreBackup={() => setRestoreBackupOpen(true)}
        onDownloadRealFile={handleDownloadActiveFile}
        onOpenAI={() => handleOpenAI('full-marketing')}
        onCopyLink={handleCopyLink}
        onOpenGitContext={() => setGitContextModalOpen(true)}
        realFileLoaded={Boolean(userFileNodes)}
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
      {/* Mounted only while open so it always reads the latest saved tokens. */}
      {exportDeployOpen && (
        <ExportDeployModal
          isOpen
          onClose={() => setExportDeployOpen(false)}
          nodesByFile={nodesByFile}
          onExported={(_, kind) => notify({
            download: 'Project downloaded — see DEPLOY.md in the zip',
            github: 'Pushed to GitHub',
            vercel: 'Deployment started on Vercel',
            both: 'Pushed to GitHub and deploying to Vercel'
          }[kind] || 'Export complete')}
        />
      )}
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
      <ExportConfirmationModal
        isOpen={exportConfirmOpen}
        onClose={() => setExportConfirmOpen(false)}
        exportResult={exportConfirmResult}
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
      
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
      
      {projectPickerOpen && (
        <ProjectPicker
          onProjectSelected={handleProjectSelected}
          onCancel={() => setProjectPickerOpen(false)}
        />
      )}
      
      <AppToast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
