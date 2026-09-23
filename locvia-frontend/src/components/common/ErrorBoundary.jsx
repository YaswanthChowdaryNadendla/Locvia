// src/components/common/ErrorBoundary.jsx
// Global React Error Boundary for Locvia
// Catches render and lifecycle errors safely, preserving all auth, cart, address, and order state.

import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { getFriendlyErrorMessage } from '../../utils/errorHandler';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Safe console notification for developer inspection (never sent to user UI)
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Locvia ErrorBoundary] Caught render error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Determine appropriate home route from user role in storage without clearing state
    let target = '/';
    try {
      const rawUser = localStorage.getItem('locvia_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user?.role === 'SHOP_OWNER') target = '/shop-owner/dashboard';
        else if (user?.role === 'DELIVERY_PARTNER') target = '/delivery/dashboard';
        else if (user?.role === 'ADMIN') target = '/admin/users';
        else if (user?.role === 'CUSTOMER') target = '/customer';
      }
    } catch {
      target = '/';
    }
    window.location.href = target;
  };

  render() {
    if (this.state.hasError) {
      const friendlyMessage = getFriendlyErrorMessage(
        this.state.error,
        'Something went wrong while rendering this section.'
      );

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1.5rem calc(4rem + env(safe-area-inset-bottom))',
            backgroundColor: 'var(--color-bg, #f8fafc)',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                border: '1px solid #fee2e2',
              }}
            >
              <AlertTriangle size={32} strokeWidth={2.2} />
            </div>

            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 0.75rem 0',
                letterSpacing: '-0.02em',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                fontSize: '0.9375rem',
                color: '#64748b',
                lineHeight: 1.6,
                margin: '0 0 2rem 0',
              }}
            >
              {friendlyMessage}
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#0c831f',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0a6b19')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0c831f')}
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                <Home size={16} />
                <span>Go to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
