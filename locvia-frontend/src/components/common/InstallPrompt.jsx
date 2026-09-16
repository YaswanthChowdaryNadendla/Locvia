// src/components/common/InstallPrompt.jsx
// Module 40 — PWA Install Prompt Banner & Success Feedback
//
// Refined UX:
//   - Exact copy matching spec:
//       Title: "Install Locvia"
//       Subtitle: "Shop groceries faster with an app-like experience."
//       Buttons: "Install Locvia" & "Maybe later"
//   - Success state feedback: "Locvia installed successfully"
//   - Floats above mobile BottomNavigation (bottom offset + safe area inset)
//   - Shows subtle iOS Safari guide if visited on iOS device
//   - Respects user session & permanent dismissals

import { useState } from 'react';
import { Download, CheckCircle2, Share, X } from 'lucide-react';
import usePWAInstall from '../../hooks/usePWAInstall';

const InstallPrompt = () => {
  const {
    showInstallPrompt,
    canInstall,
    installSuccessMessage,
    isIOS,
    isInstalled,
    triggerInstall,
    dismissForSession,
  } = usePWAInstall();

  const [showIOSHint, setShowIOSHint] = useState(false);

  // 1. Show Install Success notification if user just installed
  if (installSuccessMessage) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="pwa-install-banner animate-slide-up"
        style={{
          position: 'fixed',
          bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 2rem)',
          maxWidth: '420px',
          backgroundColor: '#0C831F',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-xl, 16px)',
          padding: '12px 18px',
          boxShadow: '0 8px 30px rgba(12,131,31,0.3)',
          zIndex: 99997,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CheckCircle2 size={20} color="#FFFFFF" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
            {installSuccessMessage}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>
            You can now launch Locvia directly from your home screen.
          </p>
        </div>
      </div>
    );
  }

  // 2. Browser supports native prompt
  if (showInstallPrompt && canInstall) {
    return (
      <div
        className="pwa-install-banner animate-slide-up"
        role="dialog"
        aria-label="Install Locvia app"
        aria-modal="false"
        style={{
          position: 'fixed',
          bottom: 'calc(5.25rem + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 2rem)',
          maxWidth: '430px',
          backgroundColor: 'var(--color-charcoal, #1C1C2E)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-2xl, 20px)',
          padding: '1rem 1.25rem',
          boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
          zIndex: 99997,
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          boxSizing: 'border-box',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {/* App icon */}
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-primary, #0C831F)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <img
            src="/icons/icon-192.png"
            alt="Locvia"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.innerHTML = `
                  <span style="font-size:1.25rem;font-weight:800;color:white;letter-spacing:-0.04em">Lv</span>
                `;
              }
            }}
          />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.2,
              marginBottom: '3px',
            }}
          >
            Install Locvia
          </p>
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.35,
              margin: 0,
            }}
          >
            Shop groceries faster with an app-like experience.
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          {/* Install button */}
          <button
            id="pwa-install-btn"
            onClick={triggerInstall}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 0.875rem',
              backgroundColor: 'var(--color-primary, #0C831F)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(12,131,31,0.4)',
              minHeight: '36px',
            }}
            aria-label="Install Locvia app"
          >
            <Download size={14} />
            Install Locvia
          </button>

          {/* Maybe later button */}
          <button
            onClick={dismissForSession}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '2px 4px',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    );
  }

  // 3. iOS Safari Fallback Tip
  if (isIOS && !isInstalled && showIOSHint) {
    return (
      <div
        role="dialog"
        aria-label="Install on iOS"
        className="pwa-install-banner animate-slide-up"
        style={{
          position: 'fixed',
          bottom: 'calc(5.25rem + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 2rem)',
          maxWidth: '430px',
          backgroundColor: '#1C1C2E',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '12px 16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          zIndex: 99997,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Share size={20} className="text-primary flex-shrink-0" />
        <div style={{ flex: 1, minWidth: 0, fontSize: '12px', lineHeight: 1.4 }}>
          Tap the <strong>Share</strong> button in Safari and select <strong>Add to Home Screen</strong> to install Locvia.
        </div>
        <button
          onClick={() => setShowIOSHint(false)}
          aria-label="Close"
          style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return null;
};

export default InstallPrompt;
