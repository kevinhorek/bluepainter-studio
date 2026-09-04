// File validation utilities for real-file loading

export const ValidationError = {
  NO_ID_ATTRIBUTES: 'no_id_attributes',
  SYNTAX_ERROR: 'syntax_error',
  NO_COMPONENT: 'no_component',
  EMPTY_FILE: 'empty_file',
  TAILWIND_ONLY: 'tailwind_only',
  CSS_MODULES: 'css_modules',
  UNSUPPORTED_EXTENSION: 'unsupported_extension'
};

export function validateFileExtension(fileName) {
  if (!fileName.endsWith('.tsx') && !fileName.endsWith('.jsx')) {
    return {
      valid: false,
      error: ValidationError.UNSUPPORTED_EXTENSION,
      message: 'Only .tsx and .jsx files are supported. Please select a React component file.',
      suggestion: 'Use inline style={{}} for canvas-editable properties.'
    };
  }
  return { valid: true };
}

export function validateFileContent(code) {
  if (!code || !code.trim()) {
    return {
      valid: false,
      error: ValidationError.EMPTY_FILE,
      message: 'File is empty or contains only whitespace.',
      suggestion: 'Select a file with a React component.'
    };
  }
  return { valid: true };
}

export function validateParsedNodes(nodes) {
  const nodeCount = Object.keys(nodes || {}).length;
  
  if (nodeCount === 0) {
    return {
      valid: false,
      error: ValidationError.NO_ID_ATTRIBUTES,
      message: 'No syncable elements found. Components must have stable id="..." attributes on elements.',
      suggestion: 'Add id attributes to elements you want to edit on canvas:\n<div id="container" style={{ padding: 16 }}>...</div>',
      docs: 'See AST_SCOPE.md § Required Element Structure'
    };
  }

  if (nodeCount === 1) {
    return {
      valid: true,
      warning: true,
      message: 'Only 1 syncable element found. Add more id attributes for better canvas editing.',
      suggestion: 'Add id="..." to child elements for full canvas control.'
    };
  }

  return { valid: true, nodeCount };
}

export function detectUnsupportedPatterns(code) {
  const warnings = [];

  // Check for Tailwind-heavy usage (className with no inline styles)
  const hasTailwindClasses = /className=["'][\w\s-]+["']/.test(code) || 
                              /className={["'][\w\s-]+["']}/.test(code);
  const hasInlineStyles = /style=\{\{/.test(code);
  
  if (hasTailwindClasses && !hasInlineStyles) {
    warnings.push({
      type: ValidationError.TAILWIND_ONLY,
      severity: 'warning',
      message: 'Tailwind-only component detected. Classes are preserved but NOT editable on canvas.',
      suggestion: 'Add inline style={{}} for canvas-editable properties alongside Tailwind classes.',
      example: '<div className="flex gap-4" style={{ padding: 16 }}>...</div>'
    });
  }

  // Check for CSS Modules
  const hasCssModules = /import\s+styles\s+from\s+['"].*\.module\.(css|scss)['"]/.test(code) ||
                        /className={styles\./.test(code);
  
  if (hasCssModules) {
    warnings.push({
      type: ValidationError.CSS_MODULES,
      severity: 'warning',
      message: 'CSS Modules detected. Module classes are NOT supported for canvas editing.',
      suggestion: 'Use inline style={{}} for canvas-editable properties.',
      example: '<div className={styles.card} style={{ padding: 16 }}>...</div>'
    });
  }

  return warnings;
}

export function formatValidationError(error) {
  let message = error.message;
  
  if (error.suggestion) {
    message += `\n\n💡 Suggestion: ${error.suggestion}`;
  }
  
  if (error.example) {
    message += `\n\nExample:\n${error.example}`;
  }
  
  if (error.docs) {
    message += `\n\n📖 ${error.docs}`;
  }
  
  return message;
}
