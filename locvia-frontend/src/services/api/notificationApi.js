// src/services/api/notificationApi.js
// Notifications Center API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

/**
 * Fetches user notifications with optional pagination.
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.size]
 * @returns {Promise<Array<Object>|{ content: Array<Object>, unreadCount: number }>}
 */
export const getNotifications = async (params = {}) => {
  return axiosClient.get(ENDPOINTS.NOTIFICATIONS.BASE, { params });
};

/**
 * Fetches count of unread notifications for badge counters.
 * @returns {Promise<{ unreadCount: number }>}
 */
export const getUnreadCount = async () => {
  return axiosClient.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
};

/**
 * Marks a single notification as read.
 * @param {string|number} id
 * @returns {Promise<Object>} Updated notification
 */
export const markAsRead = async (id) => {
  return axiosClient.put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
};

/**
 * Marks all notifications as read for current user.
 * @returns {Promise<{ success: boolean }>}
 */
export const markAllAsRead = async () => {
  return axiosClient.put(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
};

/**
 * Deletes all notifications for current user.
 * @returns {Promise<{ success: boolean }>}
 */
export const clearAllNotifications = async () => {
  return axiosClient.delete(ENDPOINTS.NOTIFICATIONS.CLEAR_ALL);
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
};
