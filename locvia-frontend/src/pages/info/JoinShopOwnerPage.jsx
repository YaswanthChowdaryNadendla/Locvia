// src/pages/info/JoinShopOwnerPage.jsx
// Module: Information Pages — Join as Shop Owner (/join/shop-owner)

import { Link } from 'react-router-dom';
import { Store, Check, ArrowRight, LogIn } from 'lucide-react';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

const BENEFITS = [
  'Create your digital shop',
  'Add products',
  'Upload product images',
  'Manage inventory',
  'Receive customer orders',
  'Manage your shop from one dashboard',
];

export default function JoinShopOwnerPage() {
  return (
    <InfoPageWrapper
      badge="Join as Shop Owner"
      title="Grow Your Local Business with Locvia"
      subtitle="Bring your shop online and reach more local customers."
      breadcrumb={[{ label: 'Join As' }, { label: 'Shop Owner' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: '0 0 1rem 0' }}>
            Empower your store with digital commerce
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
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
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
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

        {/* Action Box */}
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
            Ready to expand your local reach?
          </h3>
          <p style={{ margin: 0, color: '#15803D', fontSize: '0.9375rem' }}>
            Register your store on Locvia to start managing products and accepting nearby customer orders.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <Link
              to="/shop/register"
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
              <Store size={18} /> Join as Shop Owner <ArrowRight size={16} />
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
              <LogIn size={16} /> Already a Shop Owner? Login
            </Link>
          </div>
        </div>
      </div>
    </InfoPageWrapper>
  );
}
