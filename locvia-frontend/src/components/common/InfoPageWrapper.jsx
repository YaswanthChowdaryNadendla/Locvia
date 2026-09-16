// src/components/common/InfoPageWrapper.jsx
// Reusable wrapper for informational, help, legal, and join pages.
// Provides unified breadcrumb, header hero, responsive container, and consistent styling.

import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import Container from './Container';

export default function InfoPageWrapper({
  badge,
  title,
  subtitle,
  breadcrumb = [],
  children,
  maxWidth = '900px',
}) {
  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '80vh', paddingBottom: '4rem' }}>
      {/* ── Breadcrumb Bar ────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '0.75rem 0',
        }}
      >
        <Container>
          <nav
            aria-label="Breadcrumb"
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: '#64748B',
            }}
          >
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#64748B',
                textDecoration: 'none',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#16A34A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
            >
              <Home size={15} />
              Home
            </Link>

            {breadcrumb.map((item, idx) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                {item.to ? (
                  <Link
                    to={item.to}
                    style={{
                      color: '#64748B',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#16A34A')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        </Container>
      </div>

      {/* ── Hero Banner Header ────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '2.5rem 0',
          textAlign: 'center',
        }}
      >
        <Container style={{ maxWidth }}>
          {badge && (
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                marginBottom: '0.75rem',
              }}
            >
              {badge}
            </span>
          )}

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 0.5rem 0',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              style={{
                fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
                color: '#64748B',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          )}
        </Container>
      </div>

      {/* ── Main Content Body ─────────────────────────────────────── */}
      <Container style={{ maxWidth, marginTop: '2rem' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: 'clamp(1.5rem, 4vw, 2.75rem)',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </div>
      </Container>
    </div>
  );
}
