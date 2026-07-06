const TABS = [
  { id: 'inspect', label: 'Inspect' },
  { id: 'receipts', label: 'Receipts' },
  { id: 'layers', label: 'Layers' },
  { id: 'library', label: 'Library' }
];

export default function DetailDrawer({ open, tab, onTabChange, onClose, inspect, receipts, layers, library }) {
  if (!open) return null;

  return (
    <>
      <button type="button" className="drawer-backdrop" onClick={onClose} aria-label="Close panel" />
      <aside className="detail-drawer" data-tour="detail-drawer">
        <div className="detail-drawer-header">
          <div className="detail-drawer-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`detail-drawer-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => onTabChange(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button type="button" className="detail-drawer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="detail-drawer-body">
          {tab === 'inspect' && inspect}
          {tab === 'receipts' && receipts}
          {tab === 'layers' && layers}
          {tab === 'library' && library}
        </div>
      </aside>
    </>
  );
}
