import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          background: '#0b0f19',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ maxWidth: 520 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 12 }}>BluePainter failed to load</h1>
            <p style={{ color: '#94a3b8', marginBottom: 16, lineHeight: 1.5 }}>
              Something crashed while starting the demo. Try a hard refresh. If you opened a built file directly, run the dev server instead.
            </p>
            <pre style={{
              background: '#1e293b',
              padding: 16,
              borderRadius: 8,
              overflow: 'auto',
              fontSize: '0.8rem',
              color: '#fca5a5'
            }}>
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: 16,
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
