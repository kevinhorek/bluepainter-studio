import { generateTSX } from './syncEngine';
import { getComponentName } from '../data/workspaceFiles';

/**
 * Export current component as merge-ready TSX file
 * Ready to drop into src/ directory
 * @param {string} rootNodeId - Root node ID of the component
 * @param {Object} nodesMap - Map of all nodes in the component tree
 * @param {string} existingCode - Optional existing code to patch (if editing existing component)
 * @returns {Object} Export result with success/error and filename
 */
export function exportComponentTSX(rootNodeId, nodesMap, existingCode = null) {
  try {
    if (!rootNodeId || !nodesMap) {
      throw new Error('Component data is missing');
    }

    const tsx = generateTSX(rootNodeId, nodesMap, existingCode);
    
    if (!tsx) {
      throw new Error('Failed to generate TSX - AST patch failed. Check console for details.');
    }

    const componentName = getComponentName(rootNodeId);
    const filename = `${componentName}.tsx`;
    
    // Create and download the file
    const blob = new Blob([tsx], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename,
      componentName,
      linesOfCode: tsx.split('\n').length
    };
  } catch (error) {
    console.error('Failed to export component:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get export preview info without downloading
 * @param {string} rootNodeId 
 * @param {Object} nodesMap 
 * @param {string} existingCode 
 * @returns {Object} Preview info with filename and size
 */
export function getComponentExportPreview(rootNodeId, nodesMap, existingCode = null) {
  try {
    if (!rootNodeId || !nodesMap) {
      return null;
    }

    const tsx = generateTSX(rootNodeId, nodesMap, existingCode);
    if (!tsx) return null;

    const componentName = getComponentName(rootNodeId);
    const filename = `${componentName}.tsx`;
    
    return {
      filename,
      componentName,
      linesOfCode: tsx.split('\n').length,
      sizeKb: (new Blob([tsx]).size / 1024).toFixed(1)
    };
  } catch (error) {
    console.error('Failed to get export preview:', error);
    return null;
  }
}
