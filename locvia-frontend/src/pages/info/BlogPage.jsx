// src/pages/info/BlogPage.jsx
// Module: Information Pages — Locvia Blog (/blog)

import { BookOpen, Sparkles, Bell } from 'lucide-react';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

const BLOG_CATEGORIES = ['All Topics', 'Local Business', 'Shopping', 'Technology', 'Community'];

export default function BlogPage() {
  return (
    <InfoPageWrapper
      badge="Blog"
      title="Locvia Blog"
      subtitle="Stories, ideas and updates from Locvia."
      breadcrumb={[{ label: 'Blog' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Topic Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {BLOG_CATEGORIES.map((cat, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '0.375rem 0.875rem',
                borderRadius: '9999px',
                backgroundColor: idx === 0 ? '#16A34A' : '#F1F5F9',
                color: idx === 0 ? '#FFFFFF' : '#475569',
                cursor: 'default',
              }}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Clean Coming Soon / Empty State (strictly no fake articles) */}
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            backgroundColor: '#F8FAFC',
            borderRadius: '16px',
            border: '1px dashed #CBD5E1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={26} />
          </div>

          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
            Locvia stories are coming soon.
          </h2>

          <p style={{ margin: 0, color: '#64748B', maxWidth: '480px', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            We'll share updates about local businesses, grocery shopping, delivery technology and the Locvia community.
          </p>

          <div
            style={{
              marginTop: '0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              color: '#15803D',
              backgroundColor: '#F0FDF4',
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontWeight: 500,
            }}
          >
            <Sparkles size={14} /> Stay tuned for our inaugural editorial publications.
          </div>
        </div>
      </div>
    </InfoPageWrapper>
  );
}
