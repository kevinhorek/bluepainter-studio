import { generateTSX } from './syncEngine';
import { getComponentName } from '../data/workspaceFiles';
import { evaluateReceipts, applyReceiptFix } from '../../packages/shared/lib/receiptPolicy';

/**
 * Export component with all receipt fixes auto-applied
 * @param {string} rootNodeId - Root node ID
 * @param {Object} nodesMap - Current nodes map  
 * @param {Object} policy - Receipt policy
 * @param {Set} dismissedRules - Dismissed rule IDs
 * @param {string} existingCode - Optional existing code
 * @returns {Object} Export result with applied fixes list
 */
export function exportComponentWithFixes(rootNodeId, nodesMap, policy, dismissedRules = new Set(), existingCode = null) {
  try {
    if (!rootNodeId || !nodesMap) {
      throw new Error('Component data is missing');
    }

    // Clone nodes to avoid mutating original
    let workingNodes = JSON.parse(JSON.stringify(nodesMap));
    const appliedFixes = [];
    const component = workingNodes[rootNodeId];

    // Evaluate receipts on current state
    const receipts = evaluateReceipts(workingNodes, component, policy, dismissedRules);
    
    // Apply all fixable non-dismissed rules
    receipts.rules.forEach(rule => {
      if (!rule.valid && rule.fixKey && !dismissedRules.has(rule.id)) {
        try {
          // Apply fix using the receipt policy fix handler
          applyReceiptFix(rule.fixKey, rule.fixMeta, workingNodes, (nodeId, patch) => {
            const node = workingNodes[nodeId];
            if (node) {
              workingNodes[nodeId] = {
                ...node,
                ...patch,
                style: { ...(node.style || {}), ...(patch.style || {}) }
              };
            }
          });
          
          appliedFixes.push({
            ruleId: rule.id,
            fixKey: rule.fixKey,
            title: rule.title,
            nodeId: rule.fixMeta?.nodeId
          });
        } catch (error) {
          console.warn(`Failed to apply fix for rule ${rule.id}:`, error);
        }
      }
    });

    // Generate TSX from fixed nodes
    const tsx = generateTSX(rootNodeId, workingNodes, existingCode);
    
    if (!tsx) {
      throw new Error('Failed to generate TSX after applying fixes');
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
      linesOfCode: tsx.split('\n').length,
      appliedFixes,
      fixCount: appliedFixes.length
    };
  } catch (error) {
    console.error('Failed to export component with fixes:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get preview of what fixes would be applied
 * @param {string} rootNodeId 
 * @param {Object} nodesMap 
 * @param {Object} policy 
 * @param {Set} dismissedRules 
 * @returns {Object} Preview with fixable rules
 */
export function getExportWithFixesPreview(rootNodeId, nodesMap, policy, dismissedRules = new Set()) {
  try {
    if (!rootNodeId || !nodesMap) {
      return null;
    }

    const component = nodesMap[rootNodeId];
    const receipts = evaluateReceipts(nodesMap, component, policy, dismissedRules);
    
    const fixableRules = receipts.rules.filter(r => 
      !r.valid && r.fixKey && !dismissedRules.has(r.id)
    );

    const componentName = getComponentName(rootNodeId);
    
    return {
      componentName,
      filename: `${componentName}.tsx`,
      fixCount: fixableRules.length,
      fixes: fixableRules.map(r => ({
        ruleId: r.id,
        title: r.title,
        fixLabel: r.fixLabel,
        severity: r.severity
      }))
    };
  } catch (error) {
    console.error('Failed to get export with fixes preview:', error);
    return null;
  }
}
