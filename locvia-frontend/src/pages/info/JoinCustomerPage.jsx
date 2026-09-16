// src/pages/info/JoinCustomerPage.jsx
// Module: Information Pages — Join as Customer (/join/customer)

import { Link } from 'react-router-dom';
import { ShoppingBag, Check, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

const BENEFITS = [
  'Discover nearby shops',
  'Browse grocery products',
  'Manage your cart',
  'Save delivery addresses',
  'Place orders easily',
  'Track your orders',
];

export default function JoinCustomerPage() {
  return (
    <InfoPageWrapper
      badge="Join as Customer"
      title="Shop Locally with Locvia"
      subtitle="Discover local shops and get everyday essentials delivered."
      breadcrumb={[{ label: 'Join As' }, { label: 'Customer' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: '0 0 1rem 0' }}>
            Why create a customer account?
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {BENEFITS.map((benefit, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.9375rem',
                  color: '#334155',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#DCFCE7',
                    color: '#16A34A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Check size={14} strokeWidth={3} />
                </div>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#166534' }}>
            Get started with Locvia in under a minute
          </h3>
          <p style={{ margin: 0, color: '#15803D', fontSize: '0.9375rem' }}>
            Create your account to start browsing local grocery shops in your neighborhood.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <Link
              to="/register"
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
              <UserPlus size={18} /> Create Customer Account <ArrowRight size={16} />
            </Link>

            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#FFFFFF',
                color: '#166534',
                border: '1px solid #86EFAC',
                fontWeight: 600,
                fontSize: '0.9375rem',
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              <LogIn size={16} /> Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </InfoPageWrapper>
  );
}
