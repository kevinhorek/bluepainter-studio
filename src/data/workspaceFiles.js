export const WORKSPACE_FILES = {
  dashboard: {
    id: 'dashboard',
    label: 'DashboardPage.tsx',
    rootId: 'dashboard-page',
    componentName: 'DashboardPage',
    isPage: true,
    viewport: { width: 1280, height: 800 },
    defaultSelection: 'dashboard-page'
  },
  marketing: {
    id: 'marketing',
    label: 'MarketingPage.tsx',
    rootId: 'marketing-page',
    componentName: 'MarketingPage',
    isPage: true,
    viewport: { width: 1280, height: 1680 },
    defaultSelection: 'marketing-page',
    isMarketing: true
  },
  pricing: {
    id: 'pricing',
    label: 'PricingCard.tsx',
    rootId: 'pricing-card-frame',
    componentName: 'PricingCard',
    isPage: false,
    defaultSelection: 'pricing-card-frame'
  },
  hero: {
    id: 'hero',
    label: 'HeroSection.tsx',
    rootId: 'hero-frame',
    componentName: 'HeroSection',
    isPage: false,
    defaultSelection: 'hero-frame'
  },
  figma: {
    id: 'figma',
    label: 'FigmaImport.tsx',
    rootId: 'figma-import-page',
    componentName: 'FigmaImport',
    isPage: true,
    viewport: { width: 1280, height: 800 },
    defaultSelection: 'figma-import-page',
    isFigmaImport: true
  },
  // A TSX file the user opened from disk. Its label / root id / component name
  // come from the file (see registerCustomFile); hidden until something is opened.
  custom: {
    id: 'custom',
    label: 'Imported.tsx',
    rootId: 'imported-root',
    componentName: 'Imported',
    isPage: false,
    defaultSelection: 'imported-root',
    isUserFile: true,
    hidden: true
  }
};

/** Point the `custom` slot at an opened file. */
export function registerCustomFile({ label, rootId, componentName }) {
  const file = WORKSPACE_FILES.custom;
  file.label = label || 'Imported.tsx';
  file.rootId = rootId;
  file.defaultSelection = rootId;
  file.componentName = componentName || 'Imported';
  file.hidden = false;
}

export function getCustomFileMeta() {
  const { label, rootId, componentName, hidden } = WORKSPACE_FILES.custom;
  return hidden ? null : { label, rootId, componentName };
}

export const FILE_ORDER = ['dashboard', 'marketing', 'figma', 'pricing', 'hero', 'custom'];

/** Files included in app export (excludes marketing meta-page). */
export const APP_EXPORT_FILE_IDS = ['dashboard', 'pricing', 'hero'];

export const LIBRARY_FILE_IDS = FILE_ORDER.filter((id) => !WORKSPACE_FILES[id].isPage && !WORKSPACE_FILES[id].isUserFile);

export function getWorkspaceFile(fileId) {
  return WORKSPACE_FILES[fileId] || WORKSPACE_FILES.pricing;
}

export function getFileLabel(fileId) {
  return getWorkspaceFile(fileId).label;
}

export function getComponentName(rootId) {
  const entry = Object.values(WORKSPACE_FILES).find((f) => f.rootId === rootId);
  return entry?.componentName || 'Component';
}

export function getImportPath(fileId) {
  return `./${getWorkspaceFile(fileId).label.replace(/\.tsx$/, '')}`;
}

export function collectComponentRefs(rootNodeId, nodesMap) {
  const refs = new Set();
  function walk(nodeId) {
    const node = nodesMap[nodeId];
    if (!node) return;
    if (node.type === 'component-instance' && node.refFile) {
      refs.add(node.refFile);
    }
    (node.children || []).forEach(walk);
  }
  walk(rootNodeId);
  return refs;
}
