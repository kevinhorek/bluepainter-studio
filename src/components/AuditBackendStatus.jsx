import { useState, useEffect } from 'react';
import { getAuditBackendStatus } from '../utils/auditLog';

/**
 * Audit Backend Status Indicator
 * 
 * Shows a small, unobtrusive indicator for the audit backend status.
 * Helps pilots understand when DATABASE_URL is not configured.
 */
export default function AuditBackendStatus({ compact = false }) {
  const [status, setStatus] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const currentStatus = getAuditBackendStatus();
      setStatus(currentStatus);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (!status || status.available === null) {
    return null; // Unknown status, don't show anything
  }

  // Only show if there's something noteworthy (soft-fail or unavailable)
  const showWarning = status.softFailMode || (!status.available && status.bufferSize > 0);
  
  if (!showWarning && compact) {
    return null;
  }

  const getStatusInfo = () => {
    if (status.softFailMode) {
      return {
        icon: '⚠️',
        label: 'Audit Log: Local Only',
        detail: 'Learning loop events are buffered locally. Set DATABASE_URL to persist to team backend.',
        color: '#f59e0b',
        docs: 'docs/AUDIT_BACKEND.md'
      };
    }
    
    if (!status.available) {
      return {
        icon: '⚠️',
        label: 'Audit Backend Unavailable',
        detail: status.lastError || 'Unable to reach audit backend. Events are buffered locally.',
        color: '#ef4444',
        docs: 'docs/AUDIT_BACKEND.md'
      };
    }

    return {
      icon: '✓',
      label: 'Audit Log Active',
      detail: `Events syncing to team backend. Buffer: ${status.bufferSize}`,
      color: '#10b981',
      docs: null
    };
  };

  const info = getStatusInfo();

  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          color: info.color,
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '4px',
          background: `${info.color}15`
        }}
        onClick={() => setExpanded(!expanded)}
        title={info.detail}
      >
        <span>{info.icon}</span>
        <span>{info.label}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        maxWidth: expanded ? '400px' : '200px',
        padding: '12px',
        background: 'white',
        border: `1px solid ${info.color}`,
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        fontSize: '13px',
        zIndex: 1000,
        transition: 'max-width 0.2s ease'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontSize: '16px' }}>{info.icon}</span>
        <strong style={{ color: info.color }}>{info.label}</strong>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#999' }}>
          {expanded ? '▼' : '▶'}
        </span>
      </div>
      
      {expanded && (
        <div style={{ marginTop: '8px', color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
          <p style={{ margin: '0 0 8px 0' }}>{info.detail}</p>
          {status.bufferSize > 0 && (
            <p style={{ margin: '0 0 8px 0' }}>
              Buffer: {status.bufferSize} events
              {status.bufferAtRisk && <strong style={{ color: info.color }}> (High)</strong>}
            </p>
          )}
          {info.docs && (
            <a
              href={`/${info.docs}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: info.color, textDecoration: 'underline' }}
            >
              Setup Guide →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
