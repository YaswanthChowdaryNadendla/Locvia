// src/services/api/userApi.js
// User Profile API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

/**
 * Retrieves the current authenticated user's profile details.
 * @returns {Promise<Object>}
 */
export const getProfile = async () => {
  return axiosClient.get(ENDPOINTS.USERS.PROFILE);
};

/**
 * Updates the user's profile information (name, phone, avatar, preferences).
 * @param {Object} profileData
 * @param {string} [profileData.name]
 * @param {string} [profileData.phone]
 * @param {string} [profileData.avatar]
 * @returns {Promise<Object>} Updated user profile
 */
export const updateProfile = async (profileData) => {
  return axiosClient.put(ENDPOINTS.USERS.UPDATE_PROFILE, profileData);
};

/**
 * Changes authenticated user password.
 * @param {Object} payload
 * @param {string} payload.currentPassword
 * @param {string} payload.newPassword
 * @param {string} payload.confirmNewPassword
 * @returns {Promise<{ message: string }>}
 */
export const changePassword = async ({ currentPassword, newPassword, confirmNewPassword }) => {
  return axiosClient.put(ENDPOINTS.USERS.CHANGE_PASSWORD, {
    currentPassword,
    newPassword,
    confirmNewPassword,
  });
};

export default {
  getProfile,
  updateProfile,
  changePassword,
};
