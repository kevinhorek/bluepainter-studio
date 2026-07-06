import { useState, useRef, useEffect } from 'react';
import { isFacilitatorMode } from '../utils/facilitatorMode';
import { FILE_ORDER, WORKSPACE_FILES } from '../data/workspaceFiles';

export default function WorkspaceHeader({
  activeFile,
  onFileChange,
  onFeedback,
  onShowAbout,
  onOpenInterviewGuide,
  facilitatorActions
}) {
  const facilitator = isFacilitatorMode();
  const [fileOpen, setFileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileRef = useRef(null);
  const menuRef = useRef(null);

  const active = WORKSPACE_FILES[activeFile];

  useEffect(() => {
    if (!fileOpen && !menuOpen) return;
    const close = (e) => {
      if (fileOpen && fileRef.current && !fileRef.current.contains(e.target)) setFileOpen(false);
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [fileOpen, menuOpen]);

  return (
    <header className="workspace-header workspace-header-minimal">
      <div className="workspace-header-left">
        <div className="workspace-brand">
          <div className="logo-icon"><div className="logo-dot" /></div>
          <span className="workspace-brand-name">BluePainter</span>
        </div>

        <div className="workspace-file-picker" ref={fileRef}>
          <button
            type="button"
            className="workspace-file-picker-btn"
            onClick={() => { setFileOpen(!fileOpen); setMenuOpen(false); }}
            aria-expanded={fileOpen}
          >
            <span className="workspace-file-picker-label">{active?.label}</span>
            <span className="workspace-file-picker-caret">▾</span>
          </button>
          {fileOpen && (
            <div className="workspace-dropdown">
              {FILE_ORDER.map((fileId) => {
                const file = WORKSPACE_FILES[fileId];
                return (
                  <button
                    key={fileId}
                    type="button"
                    className={`workspace-dropdown-item ${activeFile === fileId ? 'active' : ''}`}
                    onClick={() => { onFileChange(fileId); setFileOpen(false); }}
                  >
                    <span>{file.label}</span>
                    {file.isPage && <span className="workspace-dropdown-tag">page</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="workspace-header-right">
        <span className="sync-indicator sync-indicator-minimal" title="Canvas and code in sync">
          <span className="sync-dot" />
        </span>

        <div className="workspace-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="workspace-menu-btn"
            onClick={() => { setMenuOpen(!menuOpen); setFileOpen(false); }}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            ···
          </button>
          {menuOpen && (
            <div className="workspace-dropdown workspace-menu-dropdown">
              <button type="button" className="workspace-dropdown-item" onClick={() => { onFeedback(); setMenuOpen(false); }}>
                Share feedback
              </button>
              <button type="button" className="workspace-dropdown-item" onClick={() => { onOpenInterviewGuide?.(); setMenuOpen(false); }}>
                Interview guide
              </button>
              <button type="button" className="workspace-dropdown-item" onClick={() => { onShowAbout?.(); setMenuOpen(false); }}>
                About
              </button>
              {facilitator && facilitatorActions && (
                <>
                  <div className="workspace-dropdown-divider" />
                  <span className="workspace-dropdown-heading">Facilitator</span>
                  <button type="button" className="workspace-dropdown-item" onClick={() => { facilitatorActions.onRunPresenter(); setMenuOpen(false); }} disabled={facilitatorActions.presenterRunning}>
                    {facilitatorActions.presenterRunning ? 'Presenting…' : 'Auto-present'}
                  </button>
                  <button type="button" className="workspace-dropdown-item" onClick={() => { facilitatorActions.onBreakDesign(); setMenuOpen(false); }}>Break design</button>
                  <button type="button" className="workspace-dropdown-item" onClick={() => { facilitatorActions.onFixAll(); setMenuOpen(false); }}>Fix all</button>
                  <button type="button" className="workspace-dropdown-item" onClick={() => { facilitatorActions.onReset(); setMenuOpen(false); }}>Reset</button>
                  <button type="button" className="workspace-dropdown-item" onClick={() => { facilitatorActions.onStartTour(); setMenuOpen(false); }}>Tour</button>
                  <button type="button" className="workspace-dropdown-item" onClick={() => { facilitatorActions.onOpenScript(); setMenuOpen(false); }}>Script</button>
                  <button type="button" className="workspace-dropdown-item" onClick={() => { facilitatorActions.onOpenSpec(); setMenuOpen(false); }}>Spec</button>
                  <button type="button" className="workspace-dropdown-item" onClick={() => { facilitatorActions.onExportFeedback(); setMenuOpen(false); }}>
                    Export{facilitatorActions.feedbackCount > 0 ? ` (${facilitatorActions.feedbackCount})` : ''}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
