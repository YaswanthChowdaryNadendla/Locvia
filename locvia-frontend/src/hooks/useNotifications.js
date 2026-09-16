// src/hooks/useNotifications.js
// Module 38 — Custom hook for reactive notifications, unread counts, and audio alerts

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  syncNotificationsForUser,
} from '../services/notificationService';
import {
  isSoundEnabled,
  setSoundEnabled,
  playNewOrderSound,
  playDeliveryAssignedSound,
  initAudioOnInteraction,
} from '../services/notificationSoundService';

export const useNotifications = (user) => {
  const userId = user?.id || null;
  const userRole = user?.role || null;

  const [notifications, setNotifications] = useState(() => getUserNotifications(userId));
  const [unreadCount, setUnreadCount] = useState(() => getUnreadCount(userId));
  const [isSoundOn, setIsSoundOn] = useState(() => isSoundEnabled(userId));
  const [activeToast, setActiveToast] = useState(null);

  const toastTimerRef = useRef(null);

  // Dismiss toast helper
  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setActiveToast(null);
  }, []);

  // Show in-app toast for a new notification
  const triggerToast = useCallback(
    (notif) => {
      dismissToast();
      setActiveToast(notif);
      toastTimerRef.current = setTimeout(() => {
        setActiveToast(null);
        toastTimerRef.current = null;
      }, 5000);
    },
    [dismissToast]
  );

  // Play appropriate audio for notification
  const triggerAudio = useCallback(
    (notif) => {
      if (!userId || !isSoundEnabled(userId)) return;
      if (notif.type === 'NEW_ORDER') {
        playNewOrderSound(userId);
      } else if (notif.type === 'DELIVERY_ASSIGNED') {
        playDeliveryAssignedSound(userId);
      }
    },
    [userId]
  );

  // Refresh notification list from storage
  const refresh = useCallback(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    const list = getUserNotifications(userId);
    setNotifications(list);
    setUnreadCount(getUnreadCount(userId));
    setIsSoundOn(isSoundEnabled(userId));
  }, [userId]);

  // Initial sync & event subscription
  useEffect(() => {
    if (!userId || !userRole) return;

    // Synchronize missing notifications on mount
    const newItems = syncNotificationsForUser(user);
    refresh();

    // If new items were created on mount during this active user session
    // Note: only play audio/toast if the item was created in the last 15 seconds (genuine live event)
    if (newItems.length > 0) {
      const recent = newItems[0];
      const ageMs = Date.now() - new Date(recent.createdAt || 0).getTime();
      if (ageMs < 15000) {
        triggerToast(recent);
        triggerAudio(recent);
      }
    }

    // Unlock audio context on first user click/touch
    const handleInteraction = () => {
      initAudioOnInteraction();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });

    // Listener for custom in-app notification events
    const handleNotificationAdded = (e) => {
      const newNotif = e.detail?.newNotification;
      refresh();

      if (newNotif && String(newNotif.recipientUserId).trim() === String(userId).trim()) {
        triggerToast(newNotif);
        triggerAudio(newNotif);
      }
    };

    // Listener for storage events (cross-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === 'locvia_notifications' || e.key === 'locvia_orders') {
        syncNotificationsForUser(user);
        refresh();
      } else if (e.key === `locvia_notification_sound_${userId}`) {
        setIsSoundOn(isSoundEnabled(userId));
      }
    };

    // Listener for local sound preference changes
    const handleSoundPref = (e) => {
      if (e.detail?.userId === userId) {
        setIsSoundOn(Boolean(e.detail.enabled));
      }
    };

    window.addEventListener('locvia_notifications_updated', handleNotificationAdded);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('locvia_sound_pref_changed', handleSoundPref);

    return () => {
      window.removeEventListener('locvia_notifications_updated', handleNotificationAdded);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('locvia_sound_pref_changed', handleSoundPref);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [userId, userRole, refresh, triggerToast, triggerAudio, user]);

  // Toggle sound handler
  const toggleSound = useCallback(() => {
    if (!userId) return;
    const nextState = !isSoundOn;
    setIsSoundOn(nextState);
    setSoundEnabled(userId, nextState);
  }, [userId, isSoundOn]);

  // Mark single as read
  const handleMarkAsRead = useCallback(
    (notificationId) => {
      markNotificationAsRead(notificationId, userId);
      refresh();
    },
    [userId, refresh]
  );

  // Mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllNotificationsAsRead(userId);
    refresh();
  }, [userId, refresh]);

  return {
    notifications,
    unreadCount,
    isSoundOn,
    toggleSound,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    activeToast,
    dismissToast,
    refresh,
  };
};

export default useNotifications;
