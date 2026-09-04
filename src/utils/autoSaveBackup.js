/**
 * Auto-save backup system for Studio crash recovery
 * Stores file state snapshots to localStorage
 */

const BACKUP_KEY_PREFIX = 'bluepainter-backup-';
const BACKUP_INDEX_KEY = 'bluepainter-backup-index';
const MAX_BACKUPS = 10;
const AUTO_SAVE_INTERVAL_MS = 30000; // 30 seconds

/**
 * Create a backup snapshot
 */
export function createBackup(fileName, code, nodes, rootId) {
  try {
    const timestamp = Date.now();
    const backupId = `${timestamp}`;
    
    const backup = {
      id: backupId,
      timestamp,
      fileName,
      code,
      nodes,
      rootId,
      codeLength: code.length,
      nodeCount: Object.keys(nodes || {}).length
    };
    
    // Save backup
    localStorage.setItem(`${BACKUP_KEY_PREFIX}${backupId}`, JSON.stringify(backup));
    
    // Update index
    const index = getBackupIndex();
    const updatedIndex = [
      { id: backupId, timestamp, fileName, codeLength: code.length, nodeCount: backup.nodeCount },
      ...index
    ].slice(0, MAX_BACKUPS);
    
    localStorage.setItem(BACKUP_INDEX_KEY, JSON.stringify(updatedIndex));
    
    // Clean up old backups beyond MAX_BACKUPS
    if (index.length >= MAX_BACKUPS) {
      const toDelete = index.slice(MAX_BACKUPS - 1);
      toDelete.forEach(old => {
        localStorage.removeItem(`${BACKUP_KEY_PREFIX}${old.id}`);
      });
    }
    
    return { success: true, backupId };
  } catch (err) {
    console.error('[AutoSave] Failed to create backup:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get list of all backups (metadata only)
 */
export function getBackupIndex() {
  try {
    const raw = localStorage.getItem(BACKUP_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[AutoSave] Failed to read backup index:', err);
    return [];
  }
}

/**
 * Get a specific backup by ID
 */
export function getBackup(backupId) {
  try {
    const raw = localStorage.getItem(`${BACKUP_KEY_PREFIX}${backupId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('[AutoSave] Failed to read backup:', backupId, err);
    return null;
  }
}

/**
 * Delete a specific backup
 */
export function deleteBackup(backupId) {
  try {
    localStorage.removeItem(`${BACKUP_KEY_PREFIX}${backupId}`);
    
    const index = getBackupIndex();
    const updatedIndex = index.filter(b => b.id !== backupId);
    localStorage.setItem(BACKUP_INDEX_KEY, JSON.stringify(updatedIndex));
    
    return { success: true };
  } catch (err) {
    console.error('[AutoSave] Failed to delete backup:', backupId, err);
    return { success: false, error: err.message };
  }
}

/**
 * Clear all backups
 */
export function clearAllBackups() {
  try {
    const index = getBackupIndex();
    index.forEach(backup => {
      localStorage.removeItem(`${BACKUP_KEY_PREFIX}${backup.id}`);
    });
    localStorage.removeItem(BACKUP_INDEX_KEY);
    return { success: true };
  } catch (err) {
    console.error('[AutoSave] Failed to clear backups:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Format backup timestamp for display
 */
export function formatBackupTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export { AUTO_SAVE_INTERVAL_MS };
