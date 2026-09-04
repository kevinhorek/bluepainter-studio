export function LowContrastCard() {
  return (
    <div
      id="low-contrast-frame"
      style={{
        position: 'absolute',
        left: 100,
        top: 60,
        padding: 32,
        borderRadius: 12,
        background: '#ffffff',
        color: '#1e293b',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderStyle: 'solid',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: 320
      }}
    >
      <h3 id="header-text" style={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 700, color: '#64748b' }}>
        PREMIUM
      </h3>
      <button
        id="cta-button"
        style={{
          width: '100%',
          background: '#e5e7eb',
          color: '#ffffff',
          borderWidth: 0,
          padding: 12,
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer'
        }}
      >
        Get Started
      </button>
    </div>
  );
}
