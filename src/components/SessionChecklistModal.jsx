import { useState, useEffect, useMemo } from 'react';
import { buildCurrentSessionMetrics } from '../utils/feedbackStorage';

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
                  <p className="session-metrics-complete">
                    ✓ All activation metrics met! Proceed to feedback collection.
                  </p>
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

              <div className="demo-script-actions">
                <button type="button" className="landing-cta-primary" onClick={handleEndSession}>
                  End session
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
