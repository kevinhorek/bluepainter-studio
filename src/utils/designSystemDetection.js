/**
 * Design System Detection Utility
 * 
 * Lightweight detection of workspace roots and packages that look like design systems.
 * Used by extension and Studio to tailor the "edit known components" experience.
 * 
 * SPEC §12 requirement: detect monorepo / design-system packages to help users
 * work with component libraries more effectively.
 */

export function detectWorkspaceType(packageJson, folderStructure = []) {
  const result = {
    isMonorepo: false,
    isDesignSystem: false,
    confidence: 'none',
    indicators: [],
    workspaceRoot: null,
    componentPaths: []
  };

  if (!packageJson) {
    return result;
  }

  const hasWorkspaces = !!(packageJson.workspaces);
  const hasLerna = folderStructure.includes('lerna.json');
  const hasPnpmWorkspace = folderStructure.includes('pnpm-workspace.yaml');
  const hasTurborepo = folderStructure.includes('turbo.json');
  const hasNxJson = folderStructure.includes('nx.json');

  if (hasWorkspaces || hasLerna || hasPnpmWorkspace || hasTurborepo || hasNxJson) {
    result.isMonorepo = true;
    result.workspaceRoot = true;
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

  const hasComponentsDir = folderStructure.some(f => 
    f === 'src/components' || 
    f === 'components' || 
    f === 'packages/components'
  );
  
  const hasTokensDir = folderStructure.some(f => 
    f === 'tokens' || 
    f === 'design-tokens' || 
    f === 'src/tokens'
  );

  const hasStorybookConfig = folderStructure.includes('.storybook');

  if (matchesPattern) {
    result.isDesignSystem = true;
    result.indicators.push(`package name: ${packageName}`);
  }

  if (hasComponentsDir) {
    result.isDesignSystem = true;
    result.indicators.push('components directory');
    const componentsPath = folderStructure.find(f => 
      f === 'src/components' || 
      f === 'components' || 
      f === 'packages/components'
    );
    if (componentsPath) result.componentPaths.push(componentsPath);
  }

  if (hasTokensDir) {
    result.indicators.push('design tokens directory');
  }

  if (hasStorybookConfig) {
    result.indicators.push('Storybook config');
  }

  if (result.isDesignSystem) {
    if (matchesPattern && hasComponentsDir) {
      result.confidence = 'high';
    } else if (matchesPattern || hasComponentsDir) {
      result.confidence = 'medium';
    } else {
      result.confidence = 'low';
    }
  }

  return result;
}

export function findComponentFiles(componentPaths, fileList = []) {
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

  for (const filePath of fileList) {
    for (const basePath of componentPaths) {
      if (filePath.startsWith(basePath)) {
        const isComponent = componentPatterns.some(pattern => pattern.test(filePath));
        if (isComponent) {
          componentFiles.push({
            path: filePath,
            name: filePath.split('/').pop().replace(/\.(tsx|jsx)$/, ''),
            fullPath: filePath
          });
        }
      }
    }
  }

  return componentFiles;
}

export function getWorkspaceRecommendations(detection) {
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
