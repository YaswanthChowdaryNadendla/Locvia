// src/hooks/usePWAUpdate.js
// Module 40 — Service Worker Update Detection & Safe Reload Hook
// Detects when a new service worker version is waiting, prompts user, and activates safely without reload loops.

import { useState, useEffect, useCallback, useRef } from 'react';

const UPDATE_DISMISSED_KEY = 'locvia_pwa_update_dismissed_session';

export const usePWAUpdate = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const waitingWorkerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Check if user dismissed update during this session
    if (sessionStorage.getItem(UPDATE_DISMISSED_KEY) === 'true') {
      return;
    }

    let isRefreshing = false;

    // Listen for controllerchange event (fires when skipWaiting() activates the new worker)
    const handleControllerChange = () => {
      if (!isRefreshing) {
        isRefreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Check for updates on registered service worker
    navigator.serviceWorker.ready.then((registration) => {
      // If a worker is already waiting to activate
      if (registration.waiting) {
        waitingWorkerRef.current = registration.waiting;
        setHasUpdate(true);
      }

      // Listen for newly installed workers
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version installed and waiting for activation
            waitingWorkerRef.current = newWorker;
            setHasUpdate(true);
          }
        });
      });
    }).catch(() => {
      // Service worker not active in current environment
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // User clicked "Update"
  const updateApp = useCallback(() => {
    setIsUpdating(true);
    setUpdateError('');

    try {
      if (waitingWorkerRef.current) {
        waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.warn('[Locvia PWA] Service worker update failed:', err);
      setIsUpdating(false);
      setUpdateError("Update couldn't be completed. Please try again later.");
    }
  }, []);

  // User dismissed update for this session
  const dismissUpdate = useCallback(() => {
    setHasUpdate(false);
    sessionStorage.setItem(UPDATE_DISMISSED_KEY, 'true');
  }, []);

  return {
    hasUpdate,
    isUpdating,
    updateError,
    updateApp,
    dismissUpdate,
  };
};

export default usePWAUpdate;
