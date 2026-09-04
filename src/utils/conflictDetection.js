/**
 * Detect if code contains git conflict markers
 * @param {string} code - TSX/JSX code to check
 * @returns {boolean} true if conflict markers found
 */
export function hasGitConflictMarkers(code) {
  if (!code) return false;
  return /^(<{7}|={7}|>{7})\s/m.test(code);
}

/**
 * Get conflict marker summary for user display
 * @param {string} code - TSX/JSX code with markers
 * @returns {Object} conflict summary
 */
export function getConflictMarkerInfo(code) {
  if (!hasGitConflictMarkers(code)) return null;
  
  const lines = code.split('\n');
  const conflictSections = [];
  let inConflict = false;
  let currentSection = { start: 0, end: 0 };
  
  lines.forEach((line, idx) => {
    if (/^<{7}\s/.test(line)) {
      inConflict = true;
      currentSection = { start: idx + 1 };
    } else if (/^>{7}\s/.test(line) && inConflict) {
      currentSection.end = idx + 1;
      conflictSections.push(currentSection);
      inConflict = false;
    }
  });
  
  return {
    count: conflictSections.length,
    sections: conflictSections
  };
}
