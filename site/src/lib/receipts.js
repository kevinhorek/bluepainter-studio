/** Shared receipt / contrast helpers for free tools + MCP. */

export const DEFAULT_POLICY = {
  spacingGrid: 8,
  radiusGrid: 4,
  minContrastRatio: 4.5,
  maxFeatureCount: 5,
  weakCtaWords: ['submit', 'click here', 'send', 'button', 'ok', 'enter'],
  suggestedCta: 'Start free trial',
  contrastFixColor: '#1e40af'
};

export function getContrastRatio(hexcolor) {
  if (!hexcolor || String(hexcolor).length < 6) return 8.7;
  const color = String(hexcolor).replace('#', '');
  if (color.length < 6) return 8.7;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return 8.7;
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  return Math.round((1.05 / (luminance + 0.05)) * 100) / 100;
}

export function evaluateContrast(bgHex, minRatio = 4.5) {
  const ratio = getContrastRatio(bgHex);
  return {
    ratio,
    passesAA: ratio >= minRatio,
    minRatio,
    suggestedFix: DEFAULT_POLICY.contrastFixColor
  };
}

export function gradeSimpleReceipts({ padding, background, ctaText, borderRadius, featureCount }, policy = DEFAULT_POLICY) {
  const rules = [];
  const pad = parseInt(padding, 10);
  const grid = policy.spacingGrid;
  const spacingOk = Number.isNaN(pad) || pad % grid === 0;
  rules.push({
    id: 'spacing',
    valid: spacingOk,
    title: spacingOk ? `Padding on ${grid}px grid` : 'Off-grid spacing',
    fix: spacingOk ? null : Math.round((pad || 0) / grid) * grid
  });

  const contrast = evaluateContrast(background || '#2563eb', policy.minContrastRatio);
  rules.push({
    id: 'contrast',
    valid: contrast.passesAA,
    title: contrast.passesAA ? `Contrast ${contrast.ratio}:1` : `Low contrast ${contrast.ratio}:1`,
    fix: contrast.passesAA ? null : contrast.suggestedFix
  });

  const weak = policy.weakCtaWords.includes(String(ctaText || '').toLowerCase().trim());
  rules.push({
    id: 'copy',
    valid: !weak,
    title: weak ? 'Weak CTA copy' : 'Strong CTA copy',
    fix: weak ? policy.suggestedCta : null
  });

  const radius = parseInt(borderRadius, 10);
  const radiusOk = Number.isNaN(radius) || radius % policy.radiusGrid === 0;
  rules.push({
    id: 'radius',
    valid: radiusOk,
    title: radiusOk ? 'Radius on scale' : 'Odd corner rounding',
    fix: radiusOk ? null : Math.round((radius || 0) / policy.radiusGrid) * policy.radiusGrid
  });

  const features = parseInt(featureCount, 10) || 0;
  const featuresOk = features <= policy.maxFeatureCount;
  rules.push({
    id: 'features',
    valid: featuresOk,
    title: featuresOk ? `${features} features — ok` : 'High visual clutter',
    fix: featuresOk ? null : policy.maxFeatureCount
  });

  let score = 100;
  rules.forEach((r) => {
    if (r.valid) return;
    if (r.id === 'contrast') score -= 25;
    else if (r.id === 'spacing') score -= 15;
    else score -= 10;
  });

  return { rules, score: Math.max(0, score), policy };
}

export function analyzeTsxIds(source) {
  const ids = [];
  const re = /\bid\s*=\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(source))) ids.push(m[1]);
  return { count: ids.length, ids: [...new Set(ids)] };
}
