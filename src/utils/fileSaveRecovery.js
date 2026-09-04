// File save/recovery utilities for real-file workflow

const SAVE_KEY_PREFIX = 'bluepainter-realfile-backup-';
const MAX_BACKUPS = 5;
const BACKUP_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function saveBackup(fileName, code, nodesMap) {
  try {
    const backup = {
      fileName,
      code,
      nodesMap,
      timestamp: Date.now(),
      version: 1
    };
    
    const key = `${SAVE_KEY_PREFIX}${fileName}`;
    localStorage.setItem(key, JSON.stringify(backup));
    
    cleanupOldBackups();
    return true;
  } catch (err) {
    console.error('[fileSaveRecovery] Failed to save backup:', err);
    return false;
  }
}

export function loadBackup(fileName) {
  try {
    const key = `${SAVE_KEY_PREFIX}${fileName}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return null;
    
    const backup = JSON.parse(stored);
    
    // Check if backup is expired
    const age = Date.now() - backup.timestamp;
    if (age > BACKUP_EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }
    
    return backup;
  } catch (err) {
    console.error('[fileSaveRecovery] Failed to load backup:', err);
    return null;
  }
}

export function hasBackup(fileName) {
  const key = `${SAVE_KEY_PREFIX}${fileName}`;
  return localStorage.getItem(key) !== null;
}

export function clearBackup(fileName) {
  const key = `${SAVE_KEY_PREFIX}${fileName}`;
  localStorage.removeItem(key);
}

export function listBackups() {
  const backups = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SAVE_KEY_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const backup = JSON.parse(stored);
          backups.push({
            fileName: backup.fileName,
            timestamp: backup.timestamp,
            age: Date.now() - backup.timestamp
          });
        }
      }
    }
  } catch (err) {
    console.error('[fileSaveRecovery] Failed to list backups:', err);
  }
  
  return backups.sort((a, b) => b.timestamp - a.timestamp);
}

function cleanupOldBackups() {
  try {
    const backups = listBackups();
    
    // Remove expired backups
    const now = Date.now();
    backups.forEach(backup => {
      if (now - backup.timestamp > BACKUP_EXPIRY_MS) {
        clearBackup(backup.fileName);
      }
    });
    
    // Keep only MAX_BACKUPS most recent
    const remaining = listBackups();
    if (remaining.length > MAX_BACKUPS) {
      remaining.slice(MAX_BACKUPS).forEach(backup => {
        clearBackup(backup.fileName);
      });
    }
  } catch (err) {
    console.error('[fileSaveRecovery] Cleanup failed:', err);
  }
}

export function formatAge(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}
