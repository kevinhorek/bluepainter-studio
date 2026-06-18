export default function DemoControls({
  onBreakDesign,
  onFixAll,
  onReset,
  onStartTour,
  onShowFeedback,
  onRunPresenter,
  onOpenScript,
  onExportFeedback,
  feedbackCount = 0,
  presenterRunning = false
}) {
  return (
    <div className="demo-controls" data-tour="demo-controls">
      <span className="demo-controls-label">Demo</span>
      <button
        type="button"
        className="demo-control-btn demo-control-present"
        onClick={onRunPresenter}
        disabled={presenterRunning}
        title="Auto-run Break → Fix demo sequence"
      >
        {presenterRunning ? '▶ Running…' : '▶ Present'}
      </button>
      <button type="button" className="demo-control-btn demo-control-warn" onClick={onBreakDesign} title="Trigger design receipt warnings">
        Break Design
      </button>
      <button type="button" className="demo-control-btn demo-control-fix" onClick={onFixAll} title="Fix all receipt issues">
        Fix All
      </button>
      <button type="button" className="demo-control-btn" onClick={onReset} title="Reset to initial state">
        Reset
      </button>
      <span className="demo-controls-divider">|</span>
      <button type="button" className="demo-control-btn demo-control-ghost" onClick={onOpenScript} title="Open validation interview script">
        📋 Script
      </button>
      <button type="button" className="demo-control-btn demo-control-ghost" onClick={onStartTour}>
        ? Tour
      </button>
      <button type="button" className="demo-control-btn demo-control-feedback" onClick={onShowFeedback}>
        Share Feedback
      </button>
      <button
        type="button"
        className="demo-control-btn demo-control-export"
        onClick={onExportFeedback}
        title="Download all feedback responses as JSON"
      >
        ⬇ Export{feedbackCount > 0 ? ` (${feedbackCount})` : ''}
      </button>
    </div>
  );
}
