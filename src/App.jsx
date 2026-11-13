import { useState, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import { generateTSX, parseTSX, importTSXFile } from './utils/syncEngine';
import { createHistory, historyReducer, loadWorkspace, saveWorkspace, clearWorkspace, getFreshNodesByFile } from './utils/workspaceStore';
import { registerCustomFile } from './data/workspaceFiles';
import { applyBrokenDesignScenario, applyFixedDesignScenario } from './utils/demoScenarios';
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
import FigmaImportModal from './components/FigmaImportModal';
import AIGeneratePanel from './components/AIGeneratePanel';
import { createNodeFromTool, canDropIntoNode } from './utils/nodeFactory';
import { getToolByShortcut, isPlacableTool } from './data/canvasTools';
import { applyAIUpdates, getFirstUpdateTarget } from './utils/aiApply';

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
  // Restored once from localStorage (or fresh demo files on first visit).
  const [initialWorkspace] = useState(loadWorkspace);
  const [fileViewports, setFileViewports] = useState(initialWorkspace.fileViewports);
  const [welcomeOpen, setWelcomeOpen] = useState(() => !hasSeenWelcome());
  const [toast, setToast] = useState(null);
  const [activeFile, setActiveFile] = useState(initialWorkspace.activeFile);
  const [selectedNodeId, setSelectedNodeId] = useState(() => getWorkspaceFile(initialWorkspace.activeFile).defaultSelection);
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
  const toastTimerRef = useRef(null);
  const lastLearningRef = useRef({ key: '', at: 0 });
  const deleteNodeRef = useRef(null);

  const refreshLearningSummary = () => setLearningSummary(getLearningSummary());

  const fileConfig = {
    ...getWorkspaceFile(activeFile),
    ...(fileViewports[activeFile] ? { viewport: fileViewports[activeFile] } : {})
  };
  const activeNodesMap = nodesByFile[activeFile];
  const activeRootId = fileConfig.rootId;

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
  const customUsesClasses = useMemo(
    () => Object.values(nodesByFile.custom || {}).some((n) => typeof n?.className === 'string' && n.className.trim()),
    [nodesByFile.custom]
  );
  useEffect(() => {
    if (activeFile === 'custom' && customUsesClasses) enableTailwindPreview();
  }, [activeFile, customUsesClasses]);

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
  const logLearningOnce = useCallback((type, key, payload) => {
    const now = Date.now();
    const last = lastLearningRef.current;
    const burstKey = `${type}:${key}`;
    if (last.key === burstKey && now - last.at < 1500) {
      last.at = now;
      return;
    }
    lastLearningRef.current = { key: burstKey, at: now };
    logLearningEvent(type, payload);
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
    logLearningEvent('figma_import', { targetFile, nodeCount, frameName });
    notify(`Imported "${frameName || 'frame'}" — ${nodeCount} layers`);
  }, [notify, setNodesByFile]);

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
  }, [nodesByFile, notify, setNodesByFile]);

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
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };
    // Space/Enter must keep activating focused buttons and links.
    const isActivatable = (el) => Boolean(el?.closest?.('button, a, summary, [role="button"]'));
    const isModalOpen = () => Boolean(document.querySelector('.feedback-modal-overlay, .export-modal-overlay, .demo-script-overlay, .welcome-overlay'));

    const onKeyDown = (e) => {
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
    setCodeBaseByFile((prev) => ({ ...prev, [activeFile]: { code: newCode, nodes: parsedNodes } }));
    setActiveNodesMap(parsedNodes);
    logLearningOnce('round_trip_code', 'editor', { source: 'editor' });
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
    logLearningOnce('round_trip_canvas', nodeId, { nodeId, source: 'canvas' });
  };

  const handleDeleteNode = (nodeId) => {
    if (nodeId === activeRootId) return;
    setActiveNodesMap(prev => {
      if (!prev[nodeId]) return prev;
      // Remove the node and everything under it, without mutating previous state.
      const doomed = new Set();
      const collect = (id) => {
        if (doomed.has(id) || !prev[id]) return;
        doomed.add(id);
        (prev[id].children || []).forEach(collect);
      };
      collect(nodeId);

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
    logLearningEvent('component_instance_added', { refFile, page: activeFile });
    refreshLearningSummary();
  }, [activeFile, activeNodesMap, activeRootId, fileConfig.isPage, setActiveNodesMap, notify, makeNodeId]);

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

  // Open a .tsx/.jsx file from disk on the canvas.
  const handleOpenTsxFile = useCallback(async (file) => {
    if (!file) return;
    try {
      const source = await file.text();
      const imported = importTSXFile(source, file.name);
      registerCustomFile({ label: file.name, rootId: imported.rootId, componentName: imported.componentName });
      setNodesByFile((prev) => ({ ...prev, custom: imported.nodes }));
      setCodeBaseByFile((prev) => ({ ...prev, custom: { code: imported.code, nodes: imported.nodes } }));
      setActiveFile('custom');
      setSelectedNodeId(imported.rootId);
      setFocusedPanel('canvas');
      if (/\bclassName=/.test(imported.code)) enableTailwindPreview();
      logLearningEvent('tsx_file_opened', { layers: Object.keys(imported.nodes).length });
      notify(imported.addedIds
        ? `Opened ${file.name} — added ${imported.addedIds} id attribute${imported.addedIds === 1 ? '' : 's'} so layers are editable`
        : `Opened ${file.name}`);
    } catch (err) {
      notify(err.message || 'Could not open that file');
    }
  }, [notify, setNodesByFile]);

  // Save the active file's current code back to disk as a download.
  const handleDownloadActiveFile = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileConfig.label || 'Component.tsx';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    notify(`Downloaded ${anchor.download}`);
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
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenTsxFile={handleOpenTsxFile}
        onDownloadFile={handleDownloadActiveFile}
        onResetWorkspace={() => { handleResetDemo(); notify('Workspace reset to the demo files'); }}
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
