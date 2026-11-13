const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const DEFAULT_RECEIPT_POLICY = {
  spacingGrid: 8,
  radiusGrid: 4,
  minContrastRatio: 4.5,
  maxFeatureCount: 5,
  weakCtaWords: ['submit', 'click here', 'send', 'button', 'ok', 'enter'],
  suggestedCta: 'Start free trial',
  contrastFixColor: '#1e40af',
  primaryColor: '#2563eb',
  textColor: '#1e293b'
};

function loadWorkspaceConfig() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return null;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const configPath = path.join(workspaceRoot, '.bluepainter.json');

  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);
      return config;
    }
  } catch (err) {
    console.error(`Failed to load .bluepainter.json: ${err.message}`);
  }

  return null;
}

function loadReceiptPolicyFromConfig(vscodeConfig) {
  const workspaceConfig = loadWorkspaceConfig();
  const workspacePolicy = workspaceConfig?.receiptPolicy || null;
  const settingsPolicy = vscodeConfig ? {
    spacingGrid: vscodeConfig.get('spacingGrid', DEFAULT_RECEIPT_POLICY.spacingGrid),
    radiusGrid: vscodeConfig.get('radiusGrid', DEFAULT_RECEIPT_POLICY.radiusGrid),
    minContrastRatio: vscodeConfig.get('minContrastRatio', DEFAULT_RECEIPT_POLICY.minContrastRatio),
    maxFeatureCount: vscodeConfig.get('maxFeatureCount', DEFAULT_RECEIPT_POLICY.maxFeatureCount),
    weakCtaWords: vscodeConfig.get('weakCtaWords', DEFAULT_RECEIPT_POLICY.weakCtaWords),
    suggestedCta: vscodeConfig.get('suggestedCta', DEFAULT_RECEIPT_POLICY.suggestedCta),
    contrastFixColor: vscodeConfig.get('contrastFixColor', DEFAULT_RECEIPT_POLICY.contrastFixColor),
    primaryColor: vscodeConfig.get('primaryColor', DEFAULT_RECEIPT_POLICY.primaryColor),
    textColor: vscodeConfig.get('textColor', DEFAULT_RECEIPT_POLICY.textColor)
  } : { ...DEFAULT_RECEIPT_POLICY };

  if (workspacePolicy) {
    return { ...DEFAULT_RECEIPT_POLICY, ...settingsPolicy, ...workspacePolicy };
  }

  return settingsPolicy;
}

const DEFAULT_LEARNING_LOOP_OPTIONS = {
  minEvents: 3,
  dismissThreshold: 0.7
};

function loadLearningLoopOverrides() {
  const workspaceConfig = loadWorkspaceConfig();
  const overrides = workspaceConfig?.learningLoopOverrides || null;
  
  if (overrides) {
    return { ...DEFAULT_LEARNING_LOOP_OPTIONS, ...overrides };
  }
  
  return DEFAULT_LEARNING_LOOP_OPTIONS;
}

module.exports = { 
  DEFAULT_RECEIPT_POLICY, 
  DEFAULT_LEARNING_LOOP_OPTIONS,
  loadReceiptPolicyFromConfig, 
  loadWorkspaceConfig,
  loadLearningLoopOverrides
};
