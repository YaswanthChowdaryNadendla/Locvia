import { Link } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';
import Container from '../components/common/Container';

const PlaceholderPage = ({ title = 'Coming Soon', description }) => {
  return (
    <Container>
      <div className="placeholder-page" style={{ padding: '4rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div className="icon-wrap">
          <Construction size={36} />
        </div>
        <h1
          style={{
            fontSize: 'var(--font-size-xl, 1.5rem)',
            fontWeight: 700,
            color: 'var(--color-gray-700, #334155)',
            margin: 0,
          }}
        >
          {title}
        </h1>
        <p
          className="text-body-sm"
          style={{ color: 'var(--color-gray-400, #94A3B8)', maxWidth: '360px', margin: 0 }}
        >
          {description || 'This page is under construction and will be implemented in an upcoming module.'}
        </p>
        <Link
          to="/"
          style={{
            marginTop: '0.75rem',
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
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    </Container>
  );
};

export default PlaceholderPage;
