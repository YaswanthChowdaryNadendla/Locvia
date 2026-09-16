// src/pages/info/TrackOrderPage.jsx
// Module: Information Pages — Track Order (/track-order)

import { Link } from 'react-router-dom';
import { PackageSearch, LogIn, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

export default function TrackOrderPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <InfoPageWrapper
      badge="Order Tracking"
      title="Track your Locvia order"
      subtitle={
        isAuthenticated
          ? 'View your active and past orders to track live delivery status.'
          : 'Sign in to view your current orders and delivery status.'
      }
      breadcrumb={[{ label: 'Track Order' }]}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '2rem 1rem',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#DCFCE7',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PackageSearch size={32} />
        </div>

        {isAuthenticated ? (
          <div style={{ maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '1rem', color: '#334155', lineHeight: 1.6 }}>
              Hello, <strong>{user?.name || 'Customer'}</strong>! You can view the live progress of your orders directly from your personal orders section.
            </p>
            <Link
              to="/customer/orders"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.9375rem',
                padding: '0.625rem 1.5rem',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803D')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16A34A')}
            >
              <ShoppingBag size={18} /> View My Orders <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{ maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '1rem', color: '#64748B', lineHeight: 1.6 }}>
              Please log in to track your order. Once signed in, you will be able to check order status, preparation progress, and delivery partner updates.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.9375rem',
                padding: '0.625rem 1.5rem',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803D')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16A34A')}
            >
              <LogIn size={18} /> Login
            </Link>
          </div>
        )}
      </div>
    </InfoPageWrapper>
  );
}
