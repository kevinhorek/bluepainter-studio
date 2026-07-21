const DEFAULT_RECEIPT_POLICY = {
  spacingGrid: 8,
  radiusGrid: 4,
  minContrastRatio: 4.5,
  maxFeatureCount: 5,
  weakCtaWords: ['submit', 'click here', 'send', 'button', 'ok', 'enter'],
  suggestedCta: 'Start free trial',
  contrastFixColor: '#1e40af'
};

function loadReceiptPolicyFromConfig(vscodeConfig) {
  if (!vscodeConfig) return { ...DEFAULT_RECEIPT_POLICY };
  return {
    spacingGrid: vscodeConfig.get('spacingGrid', DEFAULT_RECEIPT_POLICY.spacingGrid),
    radiusGrid: vscodeConfig.get('radiusGrid', DEFAULT_RECEIPT_POLICY.radiusGrid),
    minContrastRatio: vscodeConfig.get('minContrastRatio', DEFAULT_RECEIPT_POLICY.minContrastRatio),
    maxFeatureCount: vscodeConfig.get('maxFeatureCount', DEFAULT_RECEIPT_POLICY.maxFeatureCount),
    weakCtaWords: vscodeConfig.get('weakCtaWords', DEFAULT_RECEIPT_POLICY.weakCtaWords),
    suggestedCta: vscodeConfig.get('suggestedCta', DEFAULT_RECEIPT_POLICY.suggestedCta),
    contrastFixColor: vscodeConfig.get('contrastFixColor', DEFAULT_RECEIPT_POLICY.contrastFixColor)
  };
}

module.exports = { DEFAULT_RECEIPT_POLICY, loadReceiptPolicyFromConfig };
