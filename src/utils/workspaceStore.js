// Workspace state: undo/redo history + autosave to localStorage.
import { getFreshHeroNodes, getFreshPricingNodes, getFreshDashboardNodes } from './demoScenarios';
import { getFreshMarketingNodes } from '../data/marketingPage';
import { getEmptyFigmaImportNodes } from './figmaImport';
import { WORKSPACE_FILES, registerCustomFile, getCustomFileMeta } from '../data/workspaceFiles';

const STORAGE_KEY = 'bluepainter-workspace-v1';
const HISTORY_LIMIT = 100;
/** Edits closer together than this (drag, resize, typing) share one undo step. */
const COALESCE_MS = 400;

export function getFreshNodesByFile() {
  return {
    pricing: getFreshPricingNodes(),
    hero: getFreshHeroNodes(),
    dashboard: getFreshDashboardNodes(),
    marketing: getFreshMarketingNodes(),
    figma: getEmptyFigmaImportNodes()
  };
}

export function createHistory(present) {
  return { present, past: [], future: [], lastAt: 0 };
}

/**
 * Pure reducer over { present, past, future }.
 * `set` takes a value or updater plus the event time, so bursts collapse into one step.
 */
export function historyReducer(state, action) {
  switch (action.type) {
    case 'set': {
      const next = typeof action.updater === 'function' ? action.updater(state.present) : action.updater;
      if (next === state.present || next == null) return state;
      const coalesce = state.past.length > 0 && action.at - state.lastAt < COALESCE_MS;
      return {
        present: next,
        past: coalesce ? state.past : [...state.past, state.present].slice(-HISTORY_LIMIT),
        future: [],
        lastAt: action.at
      };
    }
    case 'undo': {
      if (!state.past.length) return state;
      return {
        present: state.past[state.past.length - 1],
        past: state.past.slice(0, -1),
        future: [state.present, ...state.future].slice(0, HISTORY_LIMIT),
        lastAt: 0
      };
    }
    case 'redo': {
      if (!state.future.length) return state;
      return {
        present: state.future[0],
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        lastAt: 0
      };
    }
    case 'reset':
      return createHistory(action.value);
    default:
      return state;
  }
}

function isValidNodesMap(nodes, rootId) {
  if (!nodes || typeof nodes !== 'object' || Array.isArray(nodes)) return false;
  const root = nodes[rootId];
  return Boolean(root && typeof root === 'object' && root.id === rootId);
}

/** Read the saved workspace, falling back to fresh demo files for anything missing or corrupt. */
export function loadWorkspace() {
  const fresh = getFreshNodesByFile();
  const empty = { nodesByFile: fresh, codeBaseByFile: {}, fileViewports: {}, activeFile: 'dashboard', restored: false };
  let saved;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    saved = JSON.parse(raw);
  } catch {
    return empty;
  }
  if (!saved || typeof saved !== 'object' || saved.version !== 1) return empty;

  if (saved.customFile && typeof saved.customFile.rootId === 'string') registerCustomFile(saved.customFile);

  const nodesByFile = { ...fresh };
  Object.keys(WORKSPACE_FILES).forEach((fileId) => {
    const candidate = saved.nodesByFile?.[fileId];
    if (isValidNodesMap(candidate, WORKSPACE_FILES[fileId].rootId)) nodesByFile[fileId] = candidate;
  });

  // Re-attach saved editor text to the node maps it was parsed into.
  const codeBaseByFile = {};
  Object.entries(saved.codeByFile || {}).forEach(([fileId, code]) => {
    if (typeof code === 'string' && nodesByFile[fileId] && WORKSPACE_FILES[fileId]) {
      codeBaseByFile[fileId] = { code, nodes: nodesByFile[fileId] };
    }
  });

  const activeFile = WORKSPACE_FILES[saved.activeFile] && nodesByFile[saved.activeFile] ? saved.activeFile : 'dashboard';
  return {
    nodesByFile,
    codeBaseByFile,
    fileViewports: saved.fileViewports && typeof saved.fileViewports === 'object' ? saved.fileViewports : {},
    activeFile,
    restored: true
  };
}

export function saveWorkspace({ nodesByFile, codeByFile, fileViewports, activeFile }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      nodesByFile,
      codeByFile,
      fileViewports,
      activeFile,
      customFile: getCustomFileMeta()
    }));
    return true;
  } catch {
    return false; // quota exceeded or storage blocked — the session still works
  }
}

export function clearWorkspace() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable
  }
}
