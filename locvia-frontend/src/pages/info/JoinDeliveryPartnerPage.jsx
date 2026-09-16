// src/pages/info/JoinDeliveryPartnerPage.jsx
// Module: Information Pages — Join as Delivery Partner (/join/delivery-partner)

import { Link } from 'react-router-dom';
import { Truck, Check, Clock, LogIn, AlertCircle } from 'lucide-react';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

const BENEFITS = [
  'View delivery requests',
  'Accept/handle assigned deliveries',
  'Update delivery status',
  'Manage active deliveries',
  'View completed deliveries',
];

export default function JoinDeliveryPartnerPage() {
  return (
    <InfoPageWrapper
      badge="Join as Delivery Partner"
      title="Deliver with Locvia"
      subtitle="Help local customers receive their orders."
      breadcrumb={[{ label: 'Join As' }, { label: 'Delivery Partner' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: '0 0 1rem 0' }}>
            Drive hyperlocal fulfillment in your neighborhood
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
                    backgroundColor: '#FEF3C7',
                    color: '#D97706',
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

        {/* Onboarding Notice & Login */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#1E40AF',
              fontSize: '0.9375rem',
              fontWeight: 500,
            }}
          >
            <Clock size={20} style={{ color: '#2563EB', flexShrink: 0 }} />
            <span>Delivery partner onboarding will be available soon.</span>
          </div>

          <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem', maxWidth: '500px' }}>
            We are currently partnering with local logistics coordinators. Public self-registration for riders and delivery personnel will launch soon.
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
            <LogIn size={18} /> Already a Delivery Partner? Login
          </Link>
        </div>
      </div>
    </InfoPageWrapper>
  );
}
