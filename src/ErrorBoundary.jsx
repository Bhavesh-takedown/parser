import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('React error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0f1a',
          color: '#e2e8f0',
          fontFamily: 'monospace',
          padding: '24px',
          gap: '16px',
        }}>
          <div style={{ fontSize: 48 }}>⚠</div>
          <h2 style={{ color: '#fca5a5' }}>Runtime Error</h2>
          <pre style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            padding: '16px',
            maxWidth: 700,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontSize: 12,
            color: '#fca5a5',
          }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
