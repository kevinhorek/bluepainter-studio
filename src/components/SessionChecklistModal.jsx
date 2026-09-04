import { useState, useEffect, useMemo } from 'react';
import { buildCurrentSessionMetrics } from '../utils/feedbackStorage';
import { downloadValidationExport } from '../utils/validationExport';

const CHECKLIST_ITEMS = [
  {
    id: 'canvas-to-code',
    label: 'Canvas → code round-trip',
    target: 1,
    getter: (metrics) => metrics.activation?.canvasCount || 0
  },
  {
    id: 'code-to-canvas',
    label: 'Code → canvas round-trip',
    target: 1,
    getter: (metrics) => metrics.activation?.codeCount || 0
  },
  {
    id: 'receipt-actions',
    label: 'Receipt actions (fixes + dismisses)',
    target: 5,
    getter: (metrics) => metrics.receiptActions?.total || 0
  }
];

const SESSION_PHASES = [
  {
    id: 'setup',
    title: 'Setup (2 min)',
    items: [
      'Share bluepainter-studio.vercel.app',
      'Participant opens DashboardPage from file menu',
      'No guided tour unless they get stuck'
    ]
  },
  {
    id: 'explore',
    title: 'Explore (5 min) — watch silently',
    items: [
      'Canvas edit → code updates?',
      'Code edit → canvas updates?',
      'Expand design/code panels to ~90%?',
      'Sidebar opens on select?',
      'Drag component from library?',
      'Notice receipt pills at bottom?'
    ]
  },
  {
    id: 'receipts',
    title: 'Receipts demo (3 min)',
    items: [
      'Facilitator: Break design → select CTA button',
      'Participant clicks receipt message',
      'Ask: "Would your team run this before merge?"'
    ]
  },
  {
    id: 'feedback',
    title: 'Collect feedback (5 min)',
    items: [
      '··· → Share feedback (interest + pilot willingness)',
      'Ask: "Would you use this instead of Figma + IDE?"',
      'Ask: "What one thing would make you switch?"',
      'Record notes for follow-up'
    ]
  }
];

export default function SessionChecklistModal({ isOpen, onClose }) {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('setup');
  const [phaseChecks, setPhaseChecks] = useState({});
  const [exportStatus, setExportStatus] = useState('');

  const metrics = useMemo(() => {
    if (!isOpen) return null;
    return buildCurrentSessionMetrics();
  }, [isOpen]);

  useEffect(() => {
    if (!sessionStarted || !sessionStartTime) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 60000);
      setElapsedMinutes(elapsed);
    }, 5000);
    return () => clearInterval(interval);
  }, [sessionStarted, sessionStartTime]);

  const handleStartSession = () => {
    setSessionStarted(true);
    setSessionStartTime(Date.now());
    setElapsedMinutes(0);
    setCurrentPhase('setup');
    setPhaseChecks({});
  };

  const handleEndSession = () => {
    setSessionStarted(false);
    setSessionStartTime(null);
    setElapsedMinutes(0);
    setCurrentPhase('setup');
    setPhaseChecks({});
    setExportStatus('');
  };

  const handleTogglePhaseCheck = (phaseId, itemIndex) => {
    setPhaseChecks(prev => {
      const phaseKey = `${phaseId}-${itemIndex}`;
      return { ...prev, [phaseKey]: !prev[phaseKey] };
    });
  };

  if (!isOpen) return null;

  const metricsStatus = CHECKLIST_ITEMS.map(item => ({
    ...item,
    current: item.getter(metrics || {}),
    complete: item.getter(metrics || {}) >= item.target
  }));

  const allMetricsComplete = metricsStatus.every(m => m.complete);

  return (
    <div className="demo-script-overlay" onClick={onClose}>
      <div className="demo-script-modal session-checklist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="demo-script-header">
          <h2>Session checklist</h2>
          {sessionStarted && (
            <span className="session-timer">
              {elapsedMinutes} min
            </span>
          )}
          <button type="button" className="demo-script-close" onClick={onClose}>×</button>
        </div>

        <div className="demo-script-body">
          {!sessionStarted ? (
            <>
              <p className="validation-script-intro">
                Track SPEC §8 activation metrics during each validation session.
                Start the timer when the participant opens the demo.
              </p>

              <div style={{
                background: '#f0f9ff',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                lineHeight: 1.5
              }}>
                <strong style={{ color: '#1e40af' }}>💡 Tip:</strong>
                <span style={{ color: '#1e3a8a', marginLeft: '6px' }}>
                  This checklist runs live during your session. Metrics update automatically as participants interact with the demo. 
                  After collecting feedback via <strong>··· → Share feedback</strong>, export session data below.
                </span>
              </div>

              <h3 className="validation-scorecard-heading">Target activation metrics</h3>
              <ul className="validation-scorecard-checks">
                {CHECKLIST_ITEMS.map((item) => (
                  <li key={item.id}>
                    <span className="validation-scorecard-check-icon">○</span>
                    <span className="validation-scorecard-check-label">{item.label}</span>
                    <span className="validation-scorecard-check-detail">Target: {item.target}+</span>
                  </li>
                ))}
              </ul>

              <div className="demo-script-actions">
                <button type="button" className="landing-cta-primary" onClick={handleStartSession}>
                  Start session
                </button>
                <button type="button" className="feedback-cancel-btn" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="session-metrics-summary">
                <h3 className="validation-scorecard-heading">Live activation metrics</h3>
                <ul className="validation-scorecard-checks">
                  {metricsStatus.map((m) => (
                    <li key={m.id} className={m.complete ? 'done' : ''}>
                      <span className="validation-scorecard-check-icon">{m.complete ? '✓' : '○'}</span>
                      <span className="validation-scorecard-check-label">{m.label}</span>
                      <span className="validation-scorecard-check-detail">
                        {m.current}/{m.target}
                      </span>
                    </li>
                  ))}
                </ul>
                {allMetricsComplete && (
                  <div className="session-metrics-complete-box">
                    <div className="session-metrics-complete-header">
                      <span className="session-metrics-complete-icon">✓</span>
                      <span className="session-metrics-complete-title">All activation metrics met!</span>
                    </div>
                    <p className="session-metrics-complete-text">
                      Proceed to feedback collection (··· → Share feedback). After the participant submits, 
                      export session data using the button below.
                    </p>
                  </div>
                )}
              </div>

              <h3 className="validation-scorecard-heading">Session script</h3>
              {SESSION_PHASES.map((phase) => (
                <div key={phase.id} className="session-phase">
                  <div className="session-phase-header">
                    <button
                      type="button"
                      className={`session-phase-btn ${currentPhase === phase.id ? 'active' : ''}`}
                      onClick={() => setCurrentPhase(phase.id)}
                    >
                      {phase.title}
                    </button>
                  </div>
                  {currentPhase === phase.id && (
                    <ul className="session-phase-items">
                      {phase.items.map((item, idx) => {
                        const phaseKey = `${phase.id}-${idx}`;
                        const checked = phaseChecks[phaseKey];
                        return (
                          <li key={idx}>
                            <label className="session-phase-item-check">
                              <input
                                type="checkbox"
                                checked={checked || false}
                                onChange={() => handleTogglePhaseCheck(phase.id, idx)}
                              />
                              <span>{item}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}

              {exportStatus && (
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  color: '#065f46'
                }}>
                  {exportStatus}
                </div>
              )}

              <div className="demo-script-actions">
                <button type="button" className="landing-cta-primary" onClick={handleEndSession}>
                  End session
                </button>
                <button 
                  type="button" 
                  className="feedback-cancel-btn"
                  onClick={() => {
                    const result = downloadValidationExport();
                    if (result.success) {
                      setExportStatus(`✓ Exported ${result.sessionCount} session(s) with ${result.eventCount} learning events`);
                      setTimeout(() => setExportStatus(''), 5000);
                    } else {
                      setExportStatus(`⚠ Export failed: ${result.error || 'Unknown error'}`);
                      setTimeout(() => setExportStatus(''), 5000);
                    }
                  }}
                  title="Export session data as JSON"
                >
                  📥 Export session
                </button>
                <button type="button" className="feedback-cancel-btn" onClick={onClose}>
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
