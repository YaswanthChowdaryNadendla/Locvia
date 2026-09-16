// src/hooks/useOnlineStatus.js
// Module 39 — Centralized Online / Offline State Hook
// Exposes isOnline, wasOffline, and isRecovered connection states.

import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [isRecovered, setIsRecovered] = useState(false);

  useEffect(() => {
    let recoveryTimer = null;

    const handleOnline = () => {
      setIsOnline(true);
      // Trigger "Back online" temporary notification if previously offline
      setIsRecovered(true);
      if (recoveryTimer) clearTimeout(recoveryTimer);
      recoveryTimer = setTimeout(() => {
        setIsRecovered(false);
      }, 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setIsRecovered(false);
      if (recoveryTimer) clearTimeout(recoveryTimer);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (recoveryTimer) clearTimeout(recoveryTimer);
    };
  }, []);

  return {
    isOnline,
    wasOffline,
    isRecovered,
  };
};

export default useOnlineStatus;
