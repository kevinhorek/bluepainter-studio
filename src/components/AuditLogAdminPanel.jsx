import { useState, useEffect } from 'react';
import { queryAuditLog, exportAuditLog, getAuditBufferStats } from '../utils/auditLog';

/**
 * Audit Log Admin Panel
 * 
 * Team admin view for querying, viewing, and exporting audit log events.
 * Requires DATABASE_URL configured in backend to query persisted events.
 */
export default function AuditLogAdminPanel({ onClose }) {
  const [filters, setFilters] = useState({
    teamId: '',
    startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
    endDate: Date.now(),
    userId: '',
    eventType: '',
    filePath: '',
    limit: 50,
    offset: 0
  });
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [bufferStats, setBufferStats] = useState(null);

  useEffect(() => {
    const stats = getAuditBufferStats();
    setBufferStats(stats);
  }, []);

  const handleQuery = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await queryAuditLog(filters);
      
      if (result.error) {
        setError(result.error);
        setEvents([]);
      } else {
        setEvents(result.events);
        setTotal(result.total);
        setHasMore(result.hasMore);
      }
    } catch (err) {
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await exportAuditLog(filters, format);
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatEventType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        maxWidth: '1200px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>Audit Log Admin Panel</h2>
            {bufferStats && (
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
                Buffer: {bufferStats.totalEvents} events
                {bufferStats.bufferAtRisk && <strong style={{ color: '#f59e0b' }}> (High)</strong>}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#999'
          }}>×</button>
        </div>

        {/* Filters */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e0e0e0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Team ID</label>
            <input
              type="text"
              value={filters.teamId}
              onChange={(e) => setFilters({ ...filters, teamId: e.target.value })}
              placeholder="team-uuid"
              style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>User ID</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              placeholder="user@example.com"
              style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Event Type</label>
            <select
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
              style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">All Types</option>
              <option value="receipt_fix_applied">Receipt Fix Applied</option>
              <option value="receipt_dismissed">Receipt Dismissed</option>
              <option value="policy_change">Policy Change</option>
              <option value="canvas_to_code_sync">Canvas → Code Sync</option>
              <option value="code_to_canvas_sync">Code → Canvas Sync</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>File Path</label>
            <input
              type="text"
              value={filters.filePath}
              onChange={(e) => setFilters({ ...filters, filePath: e.target.value })}
              placeholder="src/*.tsx"
              style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Limit</label>
            <input
              type="number"
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value, 10) })}
              min="10"
              max="500"
              style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <button
            onClick={handleQuery}
            disabled={loading || !filters.teamId}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !filters.teamId ? 'not-allowed' : 'pointer',
              opacity: loading || !filters.teamId ? 0.5 : 1
            }}
          >
            {loading ? 'Loading...' : 'Query Events'}
          </button>
          
          <button
            onClick={() => handleExport('json')}
            disabled={loading || events.length === 0}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || events.length === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || events.length === 0 ? 0.5 : 1
            }}
          >
            Export JSON
          </button>
          
          <button
            onClick={() => handleExport('csv')}
            disabled={loading || events.length === 0}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || events.length === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || events.length === 0 ? 0.5 : 1
            }}
          >
            Export CSV
          </button>
          
          {!filters.teamId && (
            <span style={{ fontSize: '13px', color: '#f59e0b', marginLeft: '8px' }}>
              Team ID required to query
            </span>
          )}
        </div>

        {/* Results */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {error && (
            <div style={{
              padding: '12px',
              background: '#fee',
              color: '#c00',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '13px'
            }}>
              <strong>Error:</strong> {error}
              <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                {error.includes('Backend not configured') && (
                  <>Set <code>VITE_AUDIT_API_URL</code> environment variable or use <code>/api/audit-log</code> default.</>
                )}
                {error.includes('not configured') && (
                  <>Backend is in soft-fail mode. Set <code>DATABASE_URL</code> to persist events. See docs/AUDIT_BACKEND.md</>
                )}
              </p>
            </div>
          )}
          
          {events.length > 0 && (
            <div>
              <div style={{
                marginBottom: '16px',
                fontSize: '13px',
                color: '#666'
              }}>
                Found {total} total events. Showing {events.length} events.
                {hasMore && ' (More available)'}
              </div>
              
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Time</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Event Type</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>User</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>File</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, idx) => (
                    <tr key={event.eventId || idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{formatTimestamp(event.timestamp)}</td>
                      <td style={{ padding: '8px' }}>{formatEventType(event.type)}</td>
                      <td style={{ padding: '8px' }}>{event.context?.userId || '-'}</td>
                      <td style={{ padding: '8px', fontSize: '11px' }}>{event.context?.filePath || '-'}</td>
                      <td style={{ padding: '8px', fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {JSON.stringify(event.data)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && !error && events.length === 0 && filters.teamId && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#999'
            }}>
              No events found. Try adjusting your filters.
            </div>
          )}
          
          {!filters.teamId && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#999'
            }}>
              Enter a Team ID and click Query Events to search audit logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
