// src/hooks/usePWAInstall.js
// Module 40 — PWA Install Hook with Smart Timing, Install Success Feedback & iOS Detection
//
// HOW IT WORKS:
//   1. Browser fires 'beforeinstallprompt' when the app is installable.
//   2. We intercept and defer the event (e.preventDefault()).
//   3. Smart Timing: Prompt is displayed after a brief 3-second delay so it never interrupts initial render.
//   4. Tracks installed outcome and shows "Locvia installed successfully" feedback.
//   5. Provides iOS Safari helper detection for graceful "Add to Home Screen" instructions.

import { useState, useEffect, useCallback, useRef } from 'react';

const DISMISSED_KEY = 'locvia_pwa_install_dismissed';
const SESSION_DISMISSED_KEY = 'locvia_pwa_session_dismissed';

export const usePWAInstall = () => {
  // The deferred BeforeInstallPromptEvent
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  // Whether the prompt should be shown in the UI
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  // Whether the app is already installed (running standalone)
  const [isInstalled, setIsInstalled] = useState(false);
  // Result of user's choice (accepted / dismissed)
  const [installOutcome, setInstallOutcome] = useState(null);
  // Install success feedback badge ("Locvia installed successfully")
  const [installSuccessMessage, setInstallSuccessMessage] = useState('');
  // Detect iOS Safari (cannot fire beforeinstallprompt, requires share sheet)
  const [isIOS, setIsIOS] = useState(false);

  const delayTimerRef = useRef(null);
  const successTimerRef = useRef(null);

  useEffect(() => {
    // Check if already running as a standalone PWA
    const standaloneMQ = window.matchMedia('(display-mode: standalone)');
    const isStandalone =
      standaloneMQ.matches ||
      window.navigator.standalone === true; // iOS Safari standalone

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check iOS Safari device
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const isIosDevice =
      (/iPad|iPhone|iPod/.test(userAgent) ||
        (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
      !window.MSStream;

    setIsIOS(isIosDevice);

    // If user previously dismissed permanently or for this session, don't show
    if (localStorage.getItem(DISMISSED_KEY) === 'permanent') return;
    if (sessionStorage.getItem(SESSION_DISMISSED_KEY) === 'true') return;

    // Listen for the browser's install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Prevent browser's default mini-infobar
      setDeferredPrompt(e);

      // Smart Timing: Delay display by 3 seconds so user is not bombarded on page load
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      delayTimerRef.current = setTimeout(() => {
        // Double check session dismissal before opening
        if (sessionStorage.getItem(SESSION_DISMISSED_KEY) !== 'true') {
          setShowInstallPrompt(true);
        }
      }, 3000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setInstallSuccessMessage('Locvia installed successfully');

      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setInstallSuccessMessage('');
      }, 4000);
    };

    // Listen for display mode change (app installed mid-session)
    const handleStandaloneChange = (e) => {
      if (e.matches) {
        setIsInstalled(true);
        setShowInstallPrompt(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneMQ.addEventListener('change', handleStandaloneChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneMQ.removeEventListener('change', handleStandaloneChange);
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Trigger the native install dialog
  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setInstallOutcome(outcome);

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallPrompt(false);
        setInstallSuccessMessage('Locvia installed successfully');

        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => {
          setInstallSuccessMessage('');
        }, 4000);
      }
    } catch (err) {
      console.warn('[Locvia PWA] Install prompt error:', err);
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  // Dismiss the banner for this session only ("Maybe later")
  const dismissForSession = useCallback(() => {
    sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
    setShowInstallPrompt(false);
  }, []);

  // Dismiss permanently (stored in localStorage)
  const dismissPermanently = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, 'permanent');
    setShowInstallPrompt(false);
  }, []);

  return {
    showInstallPrompt,
    isInstalled,
    installOutcome,
    installSuccessMessage,
    isIOS,
    canInstall: !!deferredPrompt,
    triggerInstall,
    dismissForSession,
    dismissPermanently,
  };
};

export default usePWAInstall;
