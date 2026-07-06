import { getAllowedNodeKeys } from './aiPrompts';
import { extractMarketingContext } from './marketingKit';

export function buildAIContext(nodesByFile, activeFile) {
  const ctx = extractMarketingContext(nodesByFile);
  return {
    brandName: ctx.brandName,
    heroTitle: ctx.heroTitle,
    heroSubtitle: ctx.heroSubtitle,
    price: `${ctx.price}${ctx.period}`,
    planName: ctx.planName,
    features: ctx.features,
    activeFile,
    siteUrl: ctx.siteUrl
  };
}

export function applyAIUpdates(nodesByFile, updates, type = 'custom') {
  const allowed = getAllowedNodeKeys(type);
  const next = {};

  Object.keys(nodesByFile).forEach((fileId) => {
    next[fileId] = { ...nodesByFile[fileId] };
  });

  let applied = 0;

  (updates || []).forEach((update) => {
    const { fileId, nodeId, text, style } = update;
    const key = `${fileId}:${nodeId}`;
    if (!allowed.has(key)) return;

    const node = next[fileId]?.[nodeId];
    if (!node) return;

    next[fileId] = {
      ...next[fileId],
      [nodeId]: {
        ...node,
        ...(text !== undefined ? { text: String(text) } : {}),
        ...(style && typeof style === 'object'
          ? { style: { ...(node.style || {}), ...style } }
          : {})
      }
    };
    applied += 1;
  });

  return { nodesByFile: next, applied };
}

/** Pick first updated node for canvas selection focus. */
export function getFirstUpdateTarget(updates, type) {
  const allowed = getAllowedNodeKeys(type);
  const hit = (updates || []).find((u) => allowed.has(`${u.fileId}:${u.nodeId}`));
  return hit ? { fileId: hit.fileId, nodeId: hit.nodeId } : null;
}
