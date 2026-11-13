import { generateTSX } from './syncEngine';
import { getWorkspaceFile, APP_EXPORT_FILE_IDS } from '../data/workspaceFiles';
import JSZip from 'jszip';

/**
 * Export multiple components as a zip file
 * @param {Object} nodesByFile - Map of file IDs to node maps
 * @param {Array<string>} fileIds - Array of file IDs to export (defaults to all app files)
 * @returns {Promise<Object>} Export result with success/error and filename
 */
export async function batchExportComponents(nodesByFile, fileIds = null) {
  try {
    const filesToExport = fileIds || APP_EXPORT_FILE_IDS;
    const zip = new JSZip();
    const exported = [];
    const failed = [];

    for (const fileId of filesToExport) {
      const nodesMap = nodesByFile[fileId];
      const fileInfo = getWorkspaceFile(fileId);
      const rootId = fileInfo?.rootId;

      if (!rootId || !nodesMap || !nodesMap[rootId]) {
        failed.push({ fileId, reason: 'No component data' });
        continue;
      }

      try {
        const tsx = generateTSX(rootId, nodesMap, null);
        if (!tsx) {
          failed.push({ fileId, reason: 'TSX generation failed' });
          continue;
        }

        const filename = `${fileInfo.componentName}.tsx`;
        zip.file(filename, tsx);
        exported.push({
          fileId,
          filename,
          componentName: fileInfo.componentName,
          linesOfCode: tsx.split('\n').length
        });
      } catch (error) {
        failed.push({ fileId, reason: error.message });
      }
    }

    if (exported.length === 0) {
      throw new Error('No components could be exported');
    }

    const readme = generateExportReadme(exported, failed);
    zip.file('README.md', readme);

    const blob = await zip.generateAsync({ type: 'blob' });
    
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bluepainter-components-${new Date().toISOString().slice(0, 10)}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename: anchor.download,
      exported: exported.length,
      failed: failed.length,
      components: exported,
      errors: failed
    };
  } catch (error) {
    console.error('Failed to batch export components:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function generateExportReadme(exported, failed) {
  const timestamp = new Date().toISOString();
  let readme = `# BluePainter Component Export\n\n`;
  readme += `Exported: ${timestamp}\n\n`;
  
  readme += `## Exported Components (${exported.length})\n\n`;
  exported.forEach(comp => {
    readme += `- **${comp.filename}** — ${comp.linesOfCode} lines\n`;
  });
  
  if (failed.length > 0) {
    readme += `\n## Failed Exports (${failed.length})\n\n`;
    failed.forEach(f => {
      readme += `- **${f.fileId}** — ${f.reason}\n`;
    });
  }
  
  readme += `\n## Usage\n\n`;
  readme += `These components are ready to drop into your \`src/\` directory.\n`;
  readme += `Each component is a standalone React function component with inline styles.\n\n`;
  readme += `**Import example:**\n\`\`\`tsx\n`;
  if (exported.length > 0) {
    readme += `import { ${exported[0].componentName} } from './${exported[0].componentName}';\n`;
  }
  readme += `\`\`\`\n\n`;
  readme += `**Note:** These components were exported from BluePainter Studio with AST-based code generation.\n`;
  readme += `Formatting and structure have been preserved from your canvas edits.\n`;
  
  return readme;
}

export function getBatchExportPreview(nodesByFile, fileIds = null) {
  try {
    const filesToExport = fileIds || APP_EXPORT_FILE_IDS;
    const preview = [];

    for (const fileId of filesToExport) {
      const nodesMap = nodesByFile[fileId];
      const fileInfo = getWorkspaceFile(fileId);
      const rootId = fileInfo?.rootId;

      if (rootId && nodesMap && nodesMap[rootId]) {
        const tsx = generateTSX(rootId, nodesMap, null);
        if (tsx) {
          preview.push({
            fileId,
            filename: `${fileInfo.componentName}.tsx`,
            componentName: fileInfo.componentName,
            linesOfCode: tsx.split('\n').length,
            sizeKb: (new Blob([tsx]).size / 1024).toFixed(1)
          });
        }
      }
    }

    return {
      components: preview,
      totalFiles: preview.length,
      totalLines: preview.reduce((sum, p) => sum + p.linesOfCode, 0),
      totalSizeKb: preview.reduce((sum, p) => sum + parseFloat(p.sizeKb), 0).toFixed(1)
    };
  } catch (error) {
    console.error('Failed to get batch export preview:', error);
    return null;
  }
}
