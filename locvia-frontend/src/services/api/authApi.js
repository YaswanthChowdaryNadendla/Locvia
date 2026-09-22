// src/services/api/authApi.js
// Authentication API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

// Dedicated timeout for entry auth requests to accommodate Render free-tier cold starts (up to 55s)
const AUTH_REQUEST_TIMEOUT = 60000;

/**
 * Authenticates user credentials with Spring Boot backend.
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ token: string, user: Object, redirectTo?: string }>}
 */
export const login = async ({ email, password }) => {
  return axiosClient.post(ENDPOINTS.AUTH.LOGIN, { email, password }, { timeout: AUTH_REQUEST_TIMEOUT });
};

/**
 * Authenticates user using a verified Google Identity Services ID token.
 * POST /api/auth/google { credential }
 * @param {Object} payload
 * @param {string} payload.credential - Google ID token JWT string
 * @returns {Promise<{ token: string, user: Object }>}
 */
export const loginWithGoogle = async ({ credential }) => {
  return axiosClient.post(ENDPOINTS.AUTH.GOOGLE, { credential }, { timeout: AUTH_REQUEST_TIMEOUT });
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
  return axiosClient.post(ENDPOINTS.AUTH.REGISTER, userData, { timeout: AUTH_REQUEST_TIMEOUT });
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
  return axiosClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }, { timeout: AUTH_REQUEST_TIMEOUT });
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
  return axiosClient.post(ENDPOINTS.AUTH.VERIFY_RESET_OTP, { email, otp }, { timeout: AUTH_REQUEST_TIMEOUT });
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
  return axiosClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, { email, resetToken, newPassword }, { timeout: AUTH_REQUEST_TIMEOUT });
};

/**
 * Verifies email using 6-digit OTP code received after registration.
 * POST /api/auth/verify-signup-email (or /api/auth/verify-email)
 * @param {Object} payload
 * @param {string} payload.email
 * @param {string} payload.otp
 * @returns {Promise<{ message: string }>}
 */
export const verifySignupEmail = async ({ email, otp }) => {
  return axiosClient.post(ENDPOINTS.AUTH.VERIFY_SIGNUP_EMAIL, { email, otp }, { timeout: AUTH_REQUEST_TIMEOUT });
};

/**
 * Resends email verification 6-digit OTP code (backend enforces 60s cooldown).
 * POST /api/auth/resend-signup-otp (or /api/auth/resend-verification)
 * @param {Object} payload
 * @param {string} payload.email
 * @returns {Promise<{ message: string }>}
 */
export const resendSignupOtp = async ({ email }) => {
  return axiosClient.post(ENDPOINTS.AUTH.RESEND_SIGNUP_OTP, { email }, { timeout: AUTH_REQUEST_TIMEOUT });
};

// Aliases for compatibility
export const verifyEmail = verifySignupEmail;
export const resendVerification = resendSignupOtp;

export default {
  login,
  loginWithGoogle,
  register,
  logout,
  getCurrentUser,
  refreshToken,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  verifyEmail,
  verifySignupEmail,
  resendVerification,
  resendSignupOtp,
};
