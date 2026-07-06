export const DEFAULT_RECEIPT_POLICY = {
  spacingGrid: 8,
  radiusGrid: 4,
  minContrastRatio: 4.5,
  maxFeatureCount: 5,
  weakCtaWords: ['submit', 'click here', 'send', 'button', 'ok', 'enter'],
  suggestedCta: 'Start free trial',
  contrastFixColor: '#1e40af'
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
