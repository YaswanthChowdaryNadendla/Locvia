// src/components/common/OfflineBanner.jsx
// Module 39 — Advanced PWA Offline & Recovery Banner
// Displays when connection is lost and shows a temporary "Back online" badge when recovered.

import { WifiOff, Wifi } from 'lucide-react';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const OfflineBanner = () => {
  const { isOnline, isRecovered } = useOnlineStatus();

  // If online and not in recovery phase, render nothing
  if (isOnline && !isRecovered) return null;

  return (
    <aside
      className="offline-banner animate-slide-down"
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        backgroundColor: isOnline ? 'var(--color-primary, #0C831F)' : '#1F2937',
        color: '#FFFFFF',
        padding: 'calc(8px + env(safe-area-inset-top, 0px)) 16px 8px 16px',
        fontSize: '13px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        textAlign: 'center',
        transition: 'background-color 0.25s ease',
      }}
    >
      {isOnline ? (
        <>
          <Wifi size={15} aria-hidden="true" />
          <span>You&apos;re back online!</span>
        </>
      ) : (
        <>
          <WifiOff size={15} aria-hidden="true" />
          <span>You&apos;re offline. Some features may be unavailable until reconnected.</span>
        </>
      )}
    </aside>
  );
};

export default OfflineBanner;
