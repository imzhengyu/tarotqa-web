import React from 'react';
import { Link } from 'react-router-dom';

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

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text)',
          background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-soft) 100%)',
          minHeight: '100vh'
        }}>
          <h1 style={{ color: 'var(--error-ink)', marginBottom: '20px' }}>出错了</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {this.state.error?.message || '发生了未知错误'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                background: 'var(--primary)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--on-primary)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              重试
            </button>
            <Link to="/" style={{
              padding: '12px 24px',
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              color: 'var(--primary-ink)',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-block'
            }}>
              返回首页
            </Link>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                borderRadius: '8px',
                color: 'var(--primary-ink)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
