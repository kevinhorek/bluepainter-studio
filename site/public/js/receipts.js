(function (global) {
  const DEFAULT_POLICY = {
    spacingGrid: 8,
    radiusGrid: 4,
    minContrastRatio: 4.5,
    maxFeatureCount: 5,
    weakCtaWords: ['submit', 'click here', 'send', 'button', 'ok', 'enter'],
    suggestedCta: 'Start free trial',
    contrastFixColor: '#1e40af'
  };

  function getContrastRatio(hexcolor) {
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

  function evaluateContrast(bgHex, minRatio) {
    minRatio = minRatio || 4.5;
    const ratio = getContrastRatio(bgHex);
    return {
      ratio,
      passesAA: ratio >= minRatio,
      minRatio,
      suggestedFix: DEFAULT_POLICY.contrastFixColor
    };
  }

  function gradeSimpleReceipts(input, policy) {
    policy = policy || DEFAULT_POLICY;
    const rules = [];
    const pad = parseInt(input.padding, 10);
    const spacingOk = Number.isNaN(pad) || pad % policy.spacingGrid === 0;
    rules.push({
      id: 'spacing',
      valid: spacingOk,
      title: spacingOk ? 'Padding on grid' : 'Off-grid spacing',
      fix: spacingOk ? null : Math.round((pad || 0) / policy.spacingGrid) * policy.spacingGrid
    });

    const contrast = evaluateContrast(input.background || '#2563eb', policy.minContrastRatio);
    rules.push({
      id: 'contrast',
      valid: contrast.passesAA,
      title: contrast.passesAA ? 'Contrast ' + contrast.ratio + ':1' : 'Low contrast ' + contrast.ratio + ':1',
      fix: contrast.passesAA ? null : contrast.suggestedFix
    });

    const weak = policy.weakCtaWords.indexOf(String(input.ctaText || '').toLowerCase().trim()) >= 0;
    rules.push({
      id: 'copy',
      valid: !weak,
      title: weak ? 'Weak CTA copy' : 'Strong CTA copy',
      fix: weak ? policy.suggestedCta : null
    });

    const radius = parseInt(input.borderRadius, 10);
    const radiusOk = Number.isNaN(radius) || radius % policy.radiusGrid === 0;
    rules.push({
      id: 'radius',
      valid: radiusOk,
      title: radiusOk ? 'Radius on scale' : 'Odd corner rounding',
      fix: radiusOk ? null : Math.round((radius || 0) / policy.radiusGrid) * policy.radiusGrid
    });

    const features = parseInt(input.featureCount, 10) || 0;
    const featuresOk = features <= policy.maxFeatureCount;
    rules.push({
      id: 'features',
      valid: featuresOk,
      title: featuresOk ? features + ' features — ok' : 'High visual clutter',
      fix: featuresOk ? null : policy.maxFeatureCount
    });

    let score = 100;
    rules.forEach(function (r) {
      if (r.valid) return;
      if (r.id === 'contrast') score -= 25;
      else if (r.id === 'spacing') score -= 15;
      else score -= 10;
    });

    return { rules: rules, score: Math.max(0, score), policy: policy };
  }

  // Estimate the value of catching design-system issues (Designer's Receipts)
  // and canvas <-> code round-trips before merge, versus manual review + rework.
  function estimateReviewRoi(input) {
    const devs = Math.max(0, parseFloat(input.devs) || 0);
    const componentsPerMonth = Math.max(0, parseFloat(input.componentsPerMonth) || 0);
    const reviewMinutes = Math.max(0, parseFloat(input.reviewMinutes) || 0);
    const hourlyRate = Math.max(0, parseFloat(input.hourlyRate) || 0);
    // Share of manual design-review + rework time removed when policy checks
    // and round-trip sync happen in-editor before merge.
    const savingsFactor = 0.6;

    const minutesSavedMonthly = componentsPerMonth * reviewMinutes * savingsFactor;
    const hoursSavedMonthly = Math.round((minutesSavedMonthly / 60) * 10) / 10;
    const monthlySavings = Math.round(hoursSavedMonthly * hourlyRate);
    const annualSavings = monthlySavings * 12;

    return {
      estimate: annualSavings,
      unit: 'USD/year',
      monthlySavings: monthlySavings,
      annualSavings: annualSavings,
      hoursSavedMonthly: hoursSavedMonthly,
      explanation:
        'Assumes BluePainter removes ~' + Math.round(savingsFactor * 100) +
        '% of manual design-review and rework time by catching contrast, spacing, CTA, and clutter issues in-editor and keeping canvas and TSX in sync before merge.',
      assumptions: [
        devs + ' frontend dev(s) on the team',
        componentsPerMonth + ' components/PRs reviewed per month',
        reviewMinutes + ' min manual design review + rework per component today',
        '$' + hourlyRate + '/hr blended cost',
        Math.round(savingsFactor * 100) + '% of that review/rework time removed'
      ]
    };
  }

  function analyzeTsxIds(source) {
    const ids = [];
    const re = /\bid\s*=\s*["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(source))) ids.push(m[1]);
    const unique = [];
    ids.forEach(function (id) {
      if (unique.indexOf(id) === -1) unique.push(id);
    });
    return { count: unique.length, ids: unique };
  }

  global.BluePainterTools = {
    evaluateContrast: evaluateContrast,
    gradeSimpleReceipts: gradeSimpleReceipts,
    estimateReviewRoi: estimateReviewRoi,
    analyzeTsxIds: analyzeTsxIds,
    DEFAULT_POLICY: DEFAULT_POLICY
  };
})(typeof window !== 'undefined' ? window : globalThis);
