// src/components/common/loaders/PageLoader.jsx
// Full-page / view loader with accessible status announcement and reduced-motion support

import { Loader2 } from 'lucide-react';

const PageLoader = ({ message = 'Loading...', minHeight = '60vh' }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        padding: '2rem 1rem calc(4.5rem + env(safe-area-inset-bottom)) 1rem', // clearance for mobile BottomNavigation
        gap: '1rem',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader2
          size={36}
          style={{
            color: 'var(--color-primary, #0c831f)',
            animation: 'spin 0.8s linear infinite',
          }}
          aria-hidden="true"
        />
      </div>
      <p
        style={{
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: 'var(--color-gray-600, #475569)',
          margin: 0,
        }}
      >
        {message}
      </p>
      <span className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        Loading content, please wait
      </span>
    </div>
  );
};

export default PageLoader;
