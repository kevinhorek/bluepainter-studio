/**
 * Design System Detection Utility (Node.js/VS Code version)
 * 
 * Lightweight detection of workspace roots and packages that look like design systems.
 * Used by VS Code extension to tailor the "edit known components" experience.
 * 
 * SPEC §12 requirement: detect monorepo / design-system packages to help users
 * work with component libraries more effectively.
 */

const fs = require('fs');
const path = require('path');

function detectWorkspaceType(workspaceRoot) {
  const result = {
    isMonorepo: false,
    isDesignSystem: false,
    confidence: 'none',
    indicators: [],
    workspaceRoot: workspaceRoot || null,
    componentPaths: []
  };

  if (!workspaceRoot || !fs.existsSync(workspaceRoot)) {
    return result;
  }

  const packageJsonPath = path.join(workspaceRoot, 'package.json');
  let packageJson = null;
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    } catch {
      return result;
    }
  }

  if (!packageJson) {
    return result;
  }

  const hasWorkspaces = !!(packageJson.workspaces);
  const hasLerna = fs.existsSync(path.join(workspaceRoot, 'lerna.json'));
  const hasPnpmWorkspace = fs.existsSync(path.join(workspaceRoot, 'pnpm-workspace.yaml'));
  const hasTurborepo = fs.existsSync(path.join(workspaceRoot, 'turbo.json'));
  const hasNxJson = fs.existsSync(path.join(workspaceRoot, 'nx.json'));

  if (hasWorkspaces || hasLerna || hasPnpmWorkspace || hasTurborepo || hasNxJson) {
    result.isMonorepo = true;
    if (hasWorkspaces) result.indicators.push('package.json workspaces');
    if (hasLerna) result.indicators.push('lerna.json');
    if (hasPnpmWorkspace) result.indicators.push('pnpm-workspace.yaml');
    if (hasTurborepo) result.indicators.push('turbo.json');
    if (hasNxJson) result.indicators.push('nx.json');
  }

  const packageName = packageJson.name || '';
  const designSystemPatterns = [
    /design-system/i,
    /@[\w-]+\/(ui|components|design)/i,
    /^ui-/i,
    /^component-library/i,
    /-ui$/i,
    /react-components/i,
    /design-tokens/i
  ];

  const matchesPattern = designSystemPatterns.some(pattern => pattern.test(packageName));

  const componentsPath = path.join(workspaceRoot, 'src', 'components');
  const hasComponentsDir = fs.existsSync(componentsPath);
  
  const alternateComponentsPath = path.join(workspaceRoot, 'components');
  const hasAlternateComponents = fs.existsSync(alternateComponentsPath);

  const tokensPath = path.join(workspaceRoot, 'tokens');
  const hasTokensDir = fs.existsSync(tokensPath);

  const storybookPath = path.join(workspaceRoot, '.storybook');
  const hasStorybookConfig = fs.existsSync(storybookPath);

  if (matchesPattern) {
    result.isDesignSystem = true;
    result.indicators.push(`package name: ${packageName}`);
  }

  if (hasComponentsDir) {
    result.isDesignSystem = true;
    result.indicators.push('src/components directory');
    result.componentPaths.push('src/components');
  } else if (hasAlternateComponents) {
    result.isDesignSystem = true;
    result.indicators.push('components directory');
    result.componentPaths.push('components');
  }

  if (hasTokensDir) {
    result.indicators.push('design tokens directory');
  }

  if (hasStorybookConfig) {
    result.indicators.push('Storybook config');
  }

  if (result.isDesignSystem) {
    if (matchesPattern && (hasComponentsDir || hasAlternateComponents)) {
      result.confidence = 'high';
    } else if (matchesPattern || hasComponentsDir || hasAlternateComponents) {
      result.confidence = 'medium';
    } else {
      result.confidence = 'low';
    }
  }

  return result;
}

function findComponentFiles(workspaceRoot, componentPaths) {
  const componentFiles = [];
  const componentPatterns = [
    /\/Button\.(tsx|jsx)$/,
    /\/Card\.(tsx|jsx)$/,
    /\/Input\.(tsx|jsx)$/,
    /\/Modal\.(tsx|jsx)$/,
    /\/Select\.(tsx|jsx)$/,
    /\/Checkbox\.(tsx|jsx)$/,
    /\/Radio\.(tsx|jsx)$/,
    /\/Badge\.(tsx|jsx)$/,
    /\/Avatar\.(tsx|jsx)$/,
    /\/Tooltip\.(tsx|jsx)$/
  ];

  for (const basePath of componentPaths) {
    const fullPath = path.join(workspaceRoot, basePath);
    if (!fs.existsSync(fullPath)) continue;

    const files = fs.readdirSync(fullPath, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile()) {
        const filePath = path.join(basePath, file.name);
        const isComponent = componentPatterns.some(pattern => pattern.test(filePath));
        if (isComponent) {
          componentFiles.push({
            path: filePath,
            name: file.name.replace(/\.(tsx|jsx)$/, ''),
            fullPath: path.join(workspaceRoot, filePath)
          });
        }
      }
    }
  }

  return componentFiles;
}

function getWorkspaceRecommendations(detection) {
  const recommendations = [];

  if (detection.isDesignSystem && detection.confidence === 'high') {
    recommendations.push({
      type: 'info',
      message: 'Design system detected. BluePainter works best with stable id attributes on components.'
    });
  }

  if (detection.isMonorepo && detection.componentPaths.length > 0) {
    recommendations.push({
      type: 'tip',
      message: `Found ${detection.componentPaths.length} component path(s). Use .bluepainter.json to customize receipt policy per package.`
    });
  }

  if (detection.isDesignSystem && detection.indicators.includes('Storybook config')) {
    recommendations.push({
      type: 'tip',
      message: 'Storybook detected. Consider syncing component stories with BluePainter canvas states.'
    });
  }

  return recommendations;
}

module.exports = {
  detectWorkspaceType,
  findComponentFiles,
  getWorkspaceRecommendations
};
