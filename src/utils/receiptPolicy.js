const NAMED_COLORS = {
  white: '#ffffff',
  black: '#000000',
  blue: '#2563eb',
  primary: '#2563eb',
  red: '#ff0000',
  green: '#008000',
  gray: '#808080',
  grey: '#808080'
};

/** Parse #rgb, #rrggbb(aa), rgb()/rgba() and a few named colors → [r, g, b] or null. */
export function parseColor(input) {
  if (typeof input !== 'string') return null;
  let value = input.trim().toLowerCase();
  if (NAMED_COLORS[value]) value = NAMED_COLORS[value];
  let m = value.match(/^#([0-9a-f]{3})$/);
  if (m) return m[1].split('').map((c) => parseInt(c + c, 16));
  m = value.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].substring(i, i + 2), 16));
  m = value.match(/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/);
  if (m) return [m[1], m[2], m[3]].map((n) => Math.min(255, parseInt(n, 10)));
  return null;
}

function relativeLuminance([r, g, b]) {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * WCAG contrast ratio between a background and its text colour.
 * Returns null when either colour can't be parsed (gradient, CSS variable…),
 * so callers can skip the check instead of reporting a made-up number.
 */
export function getContrastRatio(background, foreground = '#ffffff') {
  const bg = parseColor(background);
  const fg = parseColor(foreground);
  if (!bg || !fg) return null;
  const l1 = relativeLuminance(bg);
  const l2 = relativeLuminance(fg);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return Math.round(ratio * 100) / 100;
}

export function evaluateReceipts(nodesMap, component, policy, dismissedRules = new Set()) {
  if (!component || !nodesMap) return { rules: [], scores: { design: 100, accessibility: 100, buildability: 100, total: 100 } };

  const activeRoot = nodesMap['pricing-card-frame'] || nodesMap['hero-frame'] || component;
  const buttonNode = component.type === 'button' ? component : (nodesMap['cta-button'] || nodesMap['hero-button']);
  const featuresListNode = nodesMap['features-list'];
  const pricingFrameNode = nodesMap['pricing-card-frame'] || (component.type === 'frame' && component.id?.includes('pricing') ? component : null);
  const targetSpacingNode = component.type === 'frame' ? component : activeRoot;

  const paddingVal = targetSpacingNode.style?.padding !== undefined ? parseInt(targetSpacingNode.style.padding, 10) : 0;
  const grid = policy.spacingGrid || 8;
  const isSpacingValid = isNaN(paddingVal) || paddingVal % grid === 0;
  // Never suggest snapping to 0 — the label and the applied value must agree.
  const nearestPadding = isNaN(paddingVal) ? grid : (Math.round(paddingVal / grid) * grid || grid);

  const btnColor = buttonNode?.style?.background || buttonNode?.style?.backgroundColor || '#2563eb';
  const btnTextColor = buttonNode?.style?.color || '#ffffff';
  const minContrast = policy.minContrastRatio || 4.5;
  const contrastRatio = buttonNode ? getContrastRatio(btnColor, btnTextColor) : null;
  const isContrastValid = contrastRatio === null || contrastRatio >= minContrast;
  // Only offer the one-click fix if it would actually pass against this text colour.
  const fixRatio = getContrastRatio(policy.contrastFixColor, btnTextColor);
  const contrastFixWorks = fixRatio !== null && fixRatio >= minContrast;

  const buttonText = buttonNode?.text || '';
  const weakWords = policy.weakCtaWords || [];
  const isCopyWeak = buttonNode ? weakWords.includes(buttonText.toLowerCase().trim()) : false;

  const radiusGrid = policy.radiusGrid || 4;
  const borderRadiusVal = pricingFrameNode?.style?.borderRadius !== undefined ? parseInt(pricingFrameNode.style.borderRadius, 10) : 0;
  const isRadiusValid = !pricingFrameNode || (borderRadiusVal % radiusGrid === 0);
  const nearestRadius = pricingFrameNode ? Math.round(borderRadiusVal / radiusGrid) * radiusGrid : 0;

  const featureCount = featuresListNode?.children?.length || 0;
  const maxFeatures = policy.maxFeatureCount || 5;
  const isFeatureCountValid = !featuresListNode || featureCount <= maxFeatures;

  const rules = [];

  const addRule = (id, valid, meta) => {
    if (dismissedRules.has(id) && !valid) return;
    rules.push({ id, valid, ...meta });
  };

  addRule('spacing', isSpacingValid, {
    title: isSpacingValid ? `Padding aligns to ${grid}px grid` : 'Off-grid spacing warning',
    desc: isSpacingValid
      ? `Layout padding is ${paddingVal}px which fits team policy.`
      : `Padding of ${paddingVal}px is off-grid. Recommend ${nearestPadding}px.`,
    tag: 'Design',
    severity: 'warning',
    fixLabel: `Snap to ${nearestPadding}px`,
    fixKey: 'spacing',
    fixMeta: { padding: nearestPadding, nodeId: targetSpacingNode.id }
  });

  // Contrast is a property of a button; skip it when there's no button or its
  // colours can't be measured (gradients, CSS variables).
  if (buttonNode && contrastRatio !== null) {
    addRule('contrast', isContrastValid, {
      title: isContrastValid ? `Button contrast ratio ${contrastRatio}:1` : `Low contrast ratio (${contrastRatio}:1)`,
      desc: isContrastValid
        ? `Passes WCAG 2.1 AA (minimum ${minContrast}:1).`
        : `Fails the ${minContrast}:1 minimum. Text might be hard to read on this button color.`,
      tag: 'Accessibility',
      severity: 'error',
      fixLabel: contrastFixWorks ? 'Enhance Contrast' : null,
      fixKey: 'contrast',
      fixMeta: { nodeId: buttonNode.id, color: policy.contrastFixColor }
    });
  }

  if (buttonNode) {
    addRule('copy', !isCopyWeak, {
      title: isCopyWeak ? 'Weak CTA copy detected' : 'Strong CTA Copy',
      desc: isCopyWeak
        ? `"${buttonText}" feels generic. Suggest an action-oriented copy.`
        : `"${buttonText}" is active and conversion-oriented.`,
      tag: 'Conversion',
      severity: 'warning',
      fixLabel: `Change to "${policy.suggestedCta}"`,
      fixKey: 'copy',
      fixMeta: { nodeId: buttonNode.id, text: policy.suggestedCta }
    });
  }

  if (pricingFrameNode) {
    addRule('radius', isRadiusValid, {
      title: isRadiusValid ? `Border-radius fits ${radiusGrid}px scale` : 'Odd corner rounding',
      desc: isRadiusValid
        ? `Corners are rounded at ${borderRadiusVal}px.`
        : `Border radius of ${borderRadiusVal}px doesn't match ${radiusGrid}px scale.`,
      tag: 'Design',
      severity: 'warning',
      fixLabel: `Snap to ${nearestRadius}px`,
      fixKey: 'radius',
      fixMeta: { nodeId: pricingFrameNode.id, borderRadius: nearestRadius }
    });
  }

  if (featuresListNode) {
    addRule('features', isFeatureCountValid, {
      title: isFeatureCountValid ? `${featureCount} features — sweet spot` : 'High visual clutter',
      desc: isFeatureCountValid
        ? 'Features list height is optimal.'
        : `Pricing lists with ${featureCount} items exceed team policy (max ${maxFeatures}).`,
      tag: 'Buildability',
      severity: 'warning',
      fixLabel: `Truncate to ${maxFeatures} items`,
      fixKey: 'features',
      fixMeta: { nodeId: featuresListNode.id, max: maxFeatures }
    });
  }

  let designScore = 100;
  let accessibilityScore = 100;
  let buildabilityScore = 100;

  rules.forEach((r) => {
    if (r.valid) return;
    if (r.id === 'spacing' || r.id === 'radius') designScore -= r.id === 'spacing' ? 20 : 10;
    if (r.id === 'copy') designScore -= 15;
    if (r.id === 'contrast') accessibilityScore -= 45;
    if (r.id === 'features') buildabilityScore -= 25;
  });

  const total = Math.round((designScore + accessibilityScore + buildabilityScore) / 3);

  return {
    rules,
    scores: { design: designScore, accessibility: accessibilityScore, buildability: buildabilityScore, total }
  };
}

export function applyReceiptFix(fixKey, fixMeta, nodesMap, onUpdateNode) {
  if (!onUpdateNode || !fixMeta) return;
  const node = nodesMap?.[fixMeta.nodeId];
  if (!node) return;
  const style = node.style || {};

  if (fixKey === 'spacing') {
    onUpdateNode(fixMeta.nodeId, { style: { ...style, padding: fixMeta.padding } });
  } else if (fixKey === 'contrast') {
    onUpdateNode(fixMeta.nodeId, { style: { ...style, background: fixMeta.color } });
  } else if (fixKey === 'copy') {
    onUpdateNode(fixMeta.nodeId, { text: fixMeta.text });
  } else if (fixKey === 'radius') {
    onUpdateNode(fixMeta.nodeId, { style: { ...style, borderRadius: fixMeta.borderRadius } });
  } else if (fixKey === 'features') {
    onUpdateNode(fixMeta.nodeId, { children: (node.children || []).slice(0, fixMeta.max) });
  }
}
