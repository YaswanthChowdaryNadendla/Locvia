// src/pages/info/AboutPage.jsx
// Module: Information Pages — About Locvia (/about)

import { Link } from 'react-router-dom';
import { ArrowRight, Store, Users, Target, CheckCircle2 } from 'lucide-react';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

export default function AboutPage() {
  return (
    <InfoPageWrapper
      badge="About Locvia"
      title="About Locvia"
      subtitle="Everything Local. Delivered Fast."
      breadcrumb={[{ label: 'About Locvia' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Intro */}
        <div style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: '#334155' }}>
          <p style={{ margin: '0 0 1rem 0' }}>
            Locvia is a local grocery delivery platform designed to connect customers with trusted neighborhood shops.
          </p>
          <p style={{ margin: 0, color: '#64748B' }}>
            Instead of replacing local stores, Locvia helps bring them closer to customers through a simple digital shopping experience.
          </p>
        </div>

        {/* Section 1: Why Locvia? */}
        <div style={sectionBoxStyle}>
          <div style={iconHeaderStyle}>
            <div style={{ ...iconCircleStyle, backgroundColor: '#DCFCE7', color: '#16A34A' }}>
              <CheckCircle2 size={22} />
            </div>
            <h2 style={sectionHeadingStyle}>Why Locvia?</h2>
          </div>
          <p style={sectionTextStyle}>
            Local shops know their communities best. Locvia helps customers discover nearby stores, explore products, and order everyday essentials conveniently.
          </p>
        </div>

        {/* Section 2: Built for Local Businesses */}
        <div style={sectionBoxStyle}>
          <div style={iconHeaderStyle}>
            <div style={{ ...iconCircleStyle, backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Store size={22} />
            </div>
            <h2 style={sectionHeadingStyle}>Built for Local Businesses</h2>
          </div>
          <p style={sectionTextStyle}>
            Shop owners can create their own digital storefront, manage products, update inventory, and receive orders from nearby customers.
          </p>
        </div>

        {/* Section 3: Built for Customers */}
        <div style={sectionBoxStyle}>
          <div style={iconHeaderStyle}>
            <div style={{ ...iconCircleStyle, backgroundColor: '#FDF2F8', color: '#DB2777' }}>
              <Users size={22} />
            </div>
            <h2 style={sectionHeadingStyle}>Built for Customers</h2>
          </div>
          <p style={sectionTextStyle}>
            Customers can discover local shops, browse groceries and daily essentials, manage their cart, choose a delivery address, and track their orders.
          </p>
        </div>

        {/* Section 4: Our Mission */}
        <div style={sectionBoxStyle}>
          <div style={iconHeaderStyle}>
            <div style={{ ...iconCircleStyle, backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <Target size={22} />
            </div>
            <h2 style={sectionHeadingStyle}>Our Mission</h2>
          </div>
          <p style={sectionTextStyle}>
            To make local shopping more convenient while helping neighborhood businesses grow through technology.
          </p>
        </div>

        {/* CTA Card */}
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '1.75rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#166534' }}>
            Ready to explore local neighborhood stores?
          </h3>
          <p style={{ margin: 0, color: '#15803D', fontSize: '0.9375rem' }}>
            Browse local groceries, fresh fruits, vegetables, and household essentials.
          </p>
          <Link
            to="/shops"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.9375rem',
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803D')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16A34A')}
          >
            Start Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </InfoPageWrapper>
  );
}

const sectionBoxStyle = {
  backgroundColor: '#F8FAFC',
  borderRadius: '12px',
  padding: '1.25rem 1.5rem',
  border: '1px solid #E2E8F0',
};

const iconHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '0.5rem',
};

const iconCircleStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const sectionHeadingStyle = {
  margin: 0,
  fontSize: '1.125rem',
  fontWeight: 700,
  color: '#0F172A',
};

const sectionTextStyle = {
  margin: 0,
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: '#475569',
};
