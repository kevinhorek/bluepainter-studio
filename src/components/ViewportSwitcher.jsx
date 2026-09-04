const VIEWPORT_PRESETS = [
  { id: 'desktop', label: 'Desktop', icon: '🖥️', width: 1280, shortcut: 'D' },
  { id: 'tablet', label: 'Tablet', icon: '📱', width: 768, shortcut: 'T' },
  { id: 'mobile', label: 'Mobile', icon: '📱', width: 375, shortcut: 'M' }
];

export default function ViewportSwitcher({ activeViewport = 'desktop', onViewportChange }) {
  return (
    <div className="viewport-switcher">
      {VIEWPORT_PRESETS.map(viewport => {
        const isActive = activeViewport === viewport.id;
        return (
          <button
            key={viewport.id}
            type="button"
            className={`viewport-switcher-btn ${isActive ? 'active' : ''}`}
            onClick={() => onViewportChange(viewport.id)}
            title={`${viewport.label} (${viewport.width}px) — ${viewport.shortcut}`}
            aria-pressed={isActive}
          >
            <span className="viewport-switcher-icon">{viewport.icon}</span>
            <span className="viewport-switcher-label">{viewport.label}</span>
            <span className="viewport-switcher-width">{viewport.width}px</span>
          </button>
        );
      })}
    </div>
  );
}

export { VIEWPORT_PRESETS };
