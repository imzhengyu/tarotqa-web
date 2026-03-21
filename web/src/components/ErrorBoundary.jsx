import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#F5F5F5',
          background: 'linear-gradient(135deg, #1A0F2E 0%, #2D1B4E 100%)',
          minHeight: '100vh'
        }}>
          <h1 style={{ color: '#D4AF37', marginBottom: '20px' }}>出错了</h1>
          <p style={{ color: '#B8A9C9' }}>{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#D4AF37',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;