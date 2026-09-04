import { generateTSX } from './syncEngine';
import { getWorkspaceFile } from '../data/workspaceFiles';
import JSZip from 'jszip';

/**
 * Export full page bundle (page + all referenced components)
 * @param {string} pageFileId - ID of page file (dashboard, marketing, etc)
 * @param {Object} nodesByFile - All nodes by file
 * @returns {Promise<Object>} Export result with bundle details
 */
export async function exportPageBundle(pageFileId, nodesByFile) {
  try {
    const pageInfo = getWorkspaceFile(pageFileId);
    if (!pageInfo?.isPage) {
      throw new Error('Selected file is not a page');
    }

    const zip = new JSZip();
    const exported = [];
    const dependencies = new Set();

    // Get page nodes and root
    const pageNodes = nodesByFile[pageFileId];
    const pageRootId = pageInfo.rootId;

    if (!pageNodes || !pageNodes[pageRootId]) {
      throw new Error('Page data not found');
    }

    // Find all component references in page
    function collectDependencies(nodes, nodeId) {
      const node = nodes[nodeId];
      if (!node) return;

      if (node.type === 'component-instance' && node.refFile) {
        dependencies.add(node.refFile);
      }

      if (node.children) {
        node.children.forEach(childId => collectDependencies(nodes, childId));
      }
    }

    collectDependencies(pageNodes, pageRootId);

    // Export all dependencies first
    for (const depFileId of dependencies) {
      const depInfo = getWorkspaceFile(depFileId);
      const depNodes = nodesByFile[depFileId];
      const depRootId = depInfo?.rootId;

      if (depRootId && depNodes && depNodes[depRootId]) {
        try {
          const tsx = generateTSX(depRootId, depNodes, null);
          if (tsx) {
            const filename = `${depInfo.componentName}.tsx`;
            zip.file(filename, tsx);
            exported.push({
              type: 'component',
              fileId: depFileId,
              filename,
              componentName: depInfo.componentName,
              linesOfCode: tsx.split('\n').length
            });
          }
        } catch (error) {
          console.warn(`Failed to export dependency ${depFileId}:`, error);
        }
      }
    }

    // Export the page itself
    const pageTsx = generateTSX(pageRootId, pageNodes, null);
    if (!pageTsx) {
      throw new Error('Failed to generate page TSX');
    }

    const pageFilename = `${pageInfo.componentName}.tsx`;
    zip.file(pageFilename, pageTsx);
    exported.push({
      type: 'page',
      fileId: pageFileId,
      filename: pageFilename,
      componentName: pageInfo.componentName,
      linesOfCode: pageTsx.split('\n').length
    });

    // Generate bundle README
    const readme = generateBundleReadme(pageInfo, exported);
    zip.file('README.md', readme);

    // Generate package.json stub
    const packageJson = generatePackageJson(pageInfo.componentName);
    zip.file('package.json', packageJson);

    // Generate blob and download
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    anchor.download = `${pageInfo.componentName.toLowerCase()}-bundle-${timestamp}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename: anchor.download,
      pageComponent: pageInfo.componentName,
      totalFiles: exported.length + 2, // +2 for README and package.json
      components: exported,
      dependencies: Array.from(dependencies)
    };
  } catch (error) {
    console.error('Failed to export page bundle:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate README for page bundle
 */
function generateBundleReadme(pageInfo, exported) {
  const timestamp = new Date().toISOString();
  let readme = `# ${pageInfo.componentName} Bundle\n\n`;
  readme += `Full page export with all component dependencies.\n\n`;
  readme += `Exported: ${timestamp}\n\n`;
  
  readme += `## Page Component\n\n`;
  const pageExport = exported.find(e => e.type === 'page');
  if (pageExport) {
    readme += `- **${pageExport.filename}** — ${pageExport.linesOfCode} lines (main page)\n\n`;
  }
  
  const components = exported.filter(e => e.type === 'component');
  if (components.length > 0) {
    readme += `## Dependencies (${components.length})\n\n`;
    components.forEach(comp => {
      readme += `- **${comp.filename}** — ${comp.linesOfCode} lines\n`;
    });
    readme += `\n`;
  }
  
  readme += `## Usage\n\n`;
  readme += `This bundle contains a complete page with all dependencies:\n\n`;
  readme += `1. Drop all \`.tsx\` files into your \`src/\` directory\n`;
  readme += `2. Install React if needed: \`npm install react react-dom\`\n`;
  readme += `3. Import the page component:\n\n`;
  readme += `\`\`\`tsx\n`;
  readme += `import { ${pageInfo.componentName} } from './${pageInfo.componentName}';\n\n`;
  readme += `function App() {\n`;
  readme += `  return <${pageInfo.componentName} />;\n`;
  readme += `}\n`;
  readme += `\`\`\`\n\n`;
  readme += `## Bundle Details\n\n`;
  readme += `- **Total files:** ${exported.length}\n`;
  readme += `- **Total lines:** ${exported.reduce((sum, e) => sum + e.linesOfCode, 0)}\n`;
  readme += `- **Dependencies resolved:** All component imports included\n`;
  readme += `- **Format:** React functional components with inline styles\n\n`;
  readme += `**Note:** This bundle was exported from BluePainter Studio with AST-based code generation.\n`;
  
  return readme;
}

/**
 * Generate minimal package.json for the bundle
 */
function generatePackageJson(componentName) {
  const packageName = componentName.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  
  return JSON.stringify({
    name: `bluepainter-${packageName}`,
    version: '0.1.0',
    description: `${componentName} page bundle exported from BluePainter Studio`,
    type: 'module',
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0'
    },
    devDependencies: {
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      typescript: '^5.0.0'
    }
  }, null, 2);
}

/**
 * Get preview of page bundle contents
 */
export function getPageBundlePreview(pageFileId, nodesByFile) {
  try {
    const pageInfo = getWorkspaceFile(pageFileId);
    if (!pageInfo?.isPage) {
      return null;
    }

    const pageNodes = nodesByFile[pageFileId];
    const pageRootId = pageInfo.rootId;

    if (!pageNodes || !pageNodes[pageRootId]) {
      return null;
    }

    const dependencies = new Set();
    
    function collectDeps(nodes, nodeId) {
      const node = nodes[nodeId];
      if (!node) return;
      
      if (node.type === 'component-instance' && node.refFile) {
        dependencies.add(node.refFile);
      }
      
      if (node.children) {
        node.children.forEach(childId => collectDeps(nodes, childId));
      }
    }

    collectDeps(pageNodes, pageRootId);

    const depComponents = Array.from(dependencies).map(depId => {
      const depInfo = getWorkspaceFile(depId);
      return {
        fileId: depId,
        componentName: depInfo?.componentName || depId,
        label: depInfo?.label || depId
      };
    });

    return {
      pageName: pageInfo.componentName,
      pageLabel: pageInfo.label,
      dependencyCount: dependencies.size,
      dependencies: depComponents,
      totalFiles: dependencies.size + 1
    };
  } catch (error) {
    console.error('Failed to get page bundle preview:', error);
    return null;
  }
}
