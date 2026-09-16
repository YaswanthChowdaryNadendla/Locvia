// src/components/common/PWAUpdatePrompt.jsx
// Module 40 — Service Worker Update Notification Banner
// Prompts the user when a new app version is ready and activates it safely.
//
// Refined UX:
//   - Title: "New version available"
//   - Body: "Update Locvia to get the latest improvements."
//   - Buttons: [ Update ] and [ Later ]
//   - Loading state: "Updating..." with spinning indicator
//   - Error handling: inline fallback message if update fails
//   - Floats above bottom navigation and safe-area inset

import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import usePWAUpdate from '../../hooks/usePWAUpdate';

const PWAUpdatePrompt = () => {
  const { hasUpdate, isUpdating, updateError, updateApp, dismissUpdate } = usePWAUpdate();

  if (!hasUpdate) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="pwa-update-banner animate-slide-up"
      style={{
        position: 'fixed',
        bottom: 'calc(5.25rem + env(safe-area-inset-bottom, 0px))',
        right: '1rem',
        zIndex: 99998,
        backgroundColor: '#1F2937',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '14px 16px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '390px',
        width: 'calc(100% - 2rem)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-primary, #0C831F)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isUpdating ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <RefreshCw size={20} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF' }}>
            New version available
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#9CA3AF', lineHeight: 1.3 }}>
            Update Locvia to get the latest improvements.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={updateApp}
            disabled={isUpdating}
            style={{
              backgroundColor: 'var(--color-primary, #0C831F)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isUpdating ? 'wait' : 'pointer',
              opacity: isUpdating ? 0.75 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 6px rgba(12,131,31,0.3)',
            }}
          >
            {isUpdating && <Loader2 size={12} className="animate-spin" />}
            <span>{isUpdating ? 'Updating...' : 'Update'}</span>
          </button>

          <button
            onClick={dismissUpdate}
            disabled={isUpdating}
            aria-label="Later"
            title="Later"
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#D1D5DB',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Later
          </button>
        </div>
      </div>

      {updateError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#FCA5A5',
            marginTop: '2px',
          }}
        >
          <AlertCircle size={13} />
          <span>{updateError}</span>
        </div>
      )}
    </div>
  );
};

export default PWAUpdatePrompt;
