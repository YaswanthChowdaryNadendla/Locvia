// src/components/common/loaders/SectionLoader.jsx
// Compact section/panel loader with accessible status announcement

import { Loader2 } from 'lucide-react';

const SectionLoader = ({ message = 'Loading section...', height = '200px' }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height,
        width: '100%',
        padding: '1.5rem',
        gap: '0.75rem',
      }}
    >
      <Loader2
        size={26}
        style={{
          color: 'var(--color-primary, #0c831f)',
          animation: 'spin 0.8s linear infinite',
        }}
        aria-hidden="true"
      />
      {message && (
        <span
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-gray-500, #64748b)',
            fontWeight: 500,
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
};

export default SectionLoader;
