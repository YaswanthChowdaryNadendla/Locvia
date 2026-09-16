// src/services/api/authApi.js
// Authentication API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

/**
 * Authenticates user credentials with Spring Boot backend.
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ token: string, user: Object, redirectTo?: string }>}
 */
export const login = async ({ email, password }) => {
  return axiosClient.post(ENDPOINTS.AUTH.LOGIN, { email, password });
};

/**
 * Registers a new user account on the backend.
 * @param {Object} userData
 * @param {string} userData.name
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {string} [userData.phone]
 * @param {string} userData.role
 * @returns {Promise<{ token: string, user: Object, redirectTo?: string }>}
 */
export const register = async (userData) => {
  return axiosClient.post(ENDPOINTS.AUTH.REGISTER, userData);
};

/**
 * Logs out the current session on the backend (invalidating token/refresh cookie).
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const logout = async () => {
  return axiosClient.post(ENDPOINTS.AUTH.LOGOUT);
};

/**
 * Fetches the authenticated user profile from backend based on Bearer token.
 * @returns {Promise<Object>} The authenticated User object
 */
export const getCurrentUser = async () => {
  return axiosClient.get(ENDPOINTS.AUTH.ME);
};

/**
 * Refreshes an expired JWT token using refresh credentials.
 * @param {string} [refreshToken]
 * @returns {Promise<{ token: string }>}
 */
export const refreshToken = async (refreshToken) => {
  return axiosClient.post(ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  refreshToken,
};
