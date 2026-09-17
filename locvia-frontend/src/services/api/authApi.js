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

/**
 * Step 1: Sends a 6-digit OTP to the given email for password recovery.
 * Always returns a generic message (user enumeration safe).
 * @param {Object} payload
 * @param {string} payload.email
 * @returns {Promise<{ message: string }>}
 */
export const forgotPassword = async ({ email }) => {
  return axiosClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
};

/**
 * Step 2: Verifies the 6-digit OTP entered by the user.
 * On success, returns a short-lived resetToken UUID for Step 3.
 * @param {Object} payload
 * @param {string} payload.email
 * @param {string} payload.otp
 * @returns {Promise<{ resetToken: string, message: string }>}
 */
export const verifyResetOtp = async ({ email, otp }) => {
  return axiosClient.post(ENDPOINTS.AUTH.VERIFY_RESET_OTP, { email, otp });
};

/**
 * Step 3: Resets the password using the UUID reset token from Step 2.
 * @param {Object} payload
 * @param {string} payload.email
 * @param {string} payload.resetToken
 * @param {string} payload.newPassword
 * @returns {Promise<{ message: string }>}
 */
export const resetPassword = async ({ email, resetToken, newPassword }) => {
  return axiosClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, { email, resetToken, newPassword });
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  refreshToken,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};
