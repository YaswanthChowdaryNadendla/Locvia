// src/pages/info/CareersPage.jsx
// Module: Information Pages — Careers (/careers)

import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Check, Mail, Sparkles } from 'lucide-react';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

const WHY_US = [
  'Work on real-world products',
  'Build scalable web applications',
  'Learn modern frontend and backend technologies',
  'Work on products that support local businesses',
  'Grow with a fast-moving team',
];

export default function CareersPage() {
  return (
    <InfoPageWrapper
      badge="Careers"
      title="Careers at Locvia"
      subtitle="Build technology that helps local businesses grow."
      breadcrumb={[{ label: 'Careers' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Intro */}
        <p style={{ margin: 0, fontSize: '1.0625rem', lineHeight: 1.7, color: '#334155' }}>
          Locvia is building a technology platform that connects customers, local shops, and delivery partners.
        </p>

        {/* Why work with us */}
        <div style={cardBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ ...iconCircleStyle, backgroundColor: '#DCFCE7', color: '#16A34A' }}>
              <Sparkles size={20} />
            </div>
            <h2 style={cardHeadingStyle}>Why work with us?</h2>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {WHY_US.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9375rem', color: '#334155' }}>
                <span
                  style={{
                    backgroundColor: '#DCFCE7',
                    color: '#16A34A',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Opportunities (Honest empty state as requested) */}
        <div style={cardBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ ...iconCircleStyle, backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Briefcase size={20} />
            </div>
            <h2 style={cardHeadingStyle}>Opportunities</h2>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px dashed #CBD5E1',
              borderRadius: '8px',
              padding: '1.5rem',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 0.5rem 0', color: '#475569', fontWeight: 500, fontSize: '0.9375rem' }}>
              Open positions will be listed here as the Locvia team grows.
            </p>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem' }}>
              We are always excited to connect with talented engineers, designers, and operators passionate about local commerce.
            </p>
          </div>
        </div>

        {/* CTA Card */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
              Interested in joining our mission?
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
              Drop us a message with your background and area of interest.
            </p>
          </div>

          <Link
            to="/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803D')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16A34A')}
          >
            <Mail size={16} /> Contact Locvia <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </InfoPageWrapper>
  );
}

const cardBoxStyle = {
  backgroundColor: '#F8FAFC',
  borderRadius: '12px',
  padding: '1.25rem 1.5rem',
  border: '1px solid #E2E8F0',
};

const iconCircleStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const cardHeadingStyle = {
  margin: 0,
  fontSize: '1.125rem',
  fontWeight: 700,
  color: '#0F172A',
};
