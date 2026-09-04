export const DEFAULT_RECEIPT_POLICY = {
  spacingGrid: 8,
  radiusGrid: 4,
  minContrastRatio: 4.5,
  maxFeatureCount: 5,
  weakCtaWords: ['submit', 'click here', 'send', 'button', 'ok', 'enter'],
  suggestedCta: 'Start free trial',
  contrastFixColor: '#1e40af',
  // Design tokens
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  textColor: '#1e293b'
};

export const DEFAULT_LEARNING_CONFIG = {
  hiddenRules: [],
  preferredFixes: {}
};

export function loadReceiptPolicy() {
  try {
    const raw = localStorage.getItem('bluepainter-receipt-policy');
    return raw ? { ...DEFAULT_RECEIPT_POLICY, ...JSON.parse(raw) } : { ...DEFAULT_RECEIPT_POLICY };
  } catch {
    return { ...DEFAULT_RECEIPT_POLICY };
  }
}

export function saveReceiptPolicy(policy) {
  localStorage.setItem('bluepainter-receipt-policy', JSON.stringify(policy));
}

export function loadLearningConfig() {
  try {
    const raw = localStorage.getItem('bluepainter-learning-config');
    return raw ? { ...DEFAULT_LEARNING_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_LEARNING_CONFIG };
  } catch {
    return { ...DEFAULT_LEARNING_CONFIG };
  }
}

export function saveLearningConfig(config) {
  localStorage.setItem('bluepainter-learning-config', JSON.stringify(config));
}

export function exportFullConfig(receiptPolicy, learningConfig) {
  return {
    $schema: 'https://bluepainter-studio.vercel.app/schemas/config.json',
    receiptPolicy,
    learningLoopOverrides: learningConfig
  };
}

export function importFullConfig(config) {
  const result = {
    receiptPolicy: null,
    learningConfig: null
  };

  if (config.receiptPolicy) {
    result.receiptPolicy = { ...DEFAULT_RECEIPT_POLICY, ...config.receiptPolicy };
    saveReceiptPolicy(result.receiptPolicy);
  }

  if (config.learningLoopOverrides) {
    result.learningConfig = { ...DEFAULT_LEARNING_CONFIG, ...config.learningLoopOverrides };
    saveLearningConfig(result.learningConfig);
  }

  return result;
}
