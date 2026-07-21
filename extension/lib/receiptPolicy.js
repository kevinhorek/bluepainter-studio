function getContrastRatio(hexcolor) {
  if (!hexcolor || hexcolor.length < 6) return 8.7;
  const color = hexcolor.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  return Math.round((1.05 / (luminance + 0.05)) * 100) / 100;
}

function evaluateReceipts(nodesMap, component, policy, dismissedRules = new Set()) {
  if (!component || !nodesMap) {
    return { rules: [], scores: { design: 100, accessibility: 100, buildability: 100, total: 100 } };
  }

  const activeRoot = nodesMap['pricing-card-frame'] || nodesMap['hero-frame'] || component;
  const buttonNode = component.type === 'button' ? component : (nodesMap['cta-button'] || nodesMap['hero-button']);
  const featuresListNode = nodesMap['features-list'];
  const pricingFrameNode = nodesMap['pricing-card-frame'] || (component.type === 'frame' && component.id?.includes('pricing') ? component : null);
  const targetSpacingNode = component.type === 'frame' ? component : activeRoot;

  const paddingVal = targetSpacingNode.style?.padding !== undefined ? parseInt(targetSpacingNode.style.padding, 10) : 0;
  const grid = policy.spacingGrid || 8;
  const isSpacingValid = isNaN(paddingVal) || paddingVal % grid === 0;
  const nearestPadding = isNaN(paddingVal) ? grid : Math.round(paddingVal / grid) * grid;

  let btnColor = buttonNode?.style?.background || '#2563eb';
  if (btnColor === 'blue' || btnColor === 'primary') btnColor = '#2563eb';
  const contrastRatio = getContrastRatio(btnColor);
  const isContrastValid = contrastRatio >= (policy.minContrastRatio || 4.5);

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
    fixMeta: { padding: nearestPadding || grid, nodeId: targetSpacingNode.id }
  });

  addRule('contrast', isContrastValid, {
    title: isContrastValid ? `Button contrast ratio ${contrastRatio}:1` : `Low contrast ratio (${contrastRatio}:1)`,
    desc: isContrastValid
      ? `Passes WCAG 2.1 AA (minimum ${policy.minContrastRatio}:1).`
      : 'Fails WCAG AA. Text might be hard to read on this button color.',
    tag: 'Accessibility',
    severity: 'error',
    fixLabel: 'Enhance Contrast',
    fixKey: 'contrast',
    fixMeta: { nodeId: buttonNode?.id, color: policy.contrastFixColor }
  });

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

function applyReceiptFix(fixKey, fixMeta, nodesMap, onUpdateNode) {
  if (!onUpdateNode || !fixMeta) return;

  if (fixKey === 'spacing') {
    const node = nodesMap[fixMeta.nodeId];
    onUpdateNode(fixMeta.nodeId, { style: { ...node.style, padding: fixMeta.padding } });
  } else if (fixKey === 'contrast') {
    const node = nodesMap[fixMeta.nodeId];
    onUpdateNode(fixMeta.nodeId, { style: { ...node.style, background: fixMeta.color } });
  } else if (fixKey === 'copy') {
    onUpdateNode(fixMeta.nodeId, { text: fixMeta.text });
  } else if (fixKey === 'radius') {
    const node = nodesMap[fixMeta.nodeId];
    onUpdateNode(fixMeta.nodeId, { style: { ...node.style, borderRadius: fixMeta.borderRadius } });
  } else if (fixKey === 'features') {
    const node = nodesMap[fixMeta.nodeId];
    onUpdateNode(fixMeta.nodeId, { children: node.children.slice(0, fixMeta.max) });
  }
}

module.exports = { evaluateReceipts, applyReceiptFix };
