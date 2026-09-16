// src/services/api/axiosClient.js
// Centralized Axios client instance configured for Locvia frontend.

import axios from 'axios';
import { normalizeApiError } from './errorHandler';

// Base URL configured via environment variable with graceful fallback to localhost:8080
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Checks whether real backend API calls are enabled.
 * Returns true if VITE_ENABLE_API is explicitly set to 'true'.
 * @returns {boolean}
 */
export const isApiEnabled = () => {
  return import.meta.env.VITE_ENABLE_API === 'true';
};

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request Interceptor ────────────────────────────────────────────────
// Attaches stored JWT token from localStorage to every outgoing request.
axiosClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('locvia_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (storageErr) {
      console.warn('[axiosClient] Unable to access token from localStorage:', storageErr);
    }
    return config;
  },
  (error) => {
    return Promise.reject(normalizeApiError(error));
  }
);

// ── Response Interceptor ───────────────────────────────────────────────
// Unwraps response.data and standardizes error responses.
axiosClient.interceptors.response.use(
  (response) => {
    // Unwraps response payload directly for convenience
    return response.data;
  },
  (error) => {
    // Handle 401 Unauthorized (expired or invalid token)
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('locvia_token');
        localStorage.removeItem('locvia_user');
        // Dispatch custom event for reactive UI state synchronization
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('locvia:auth:session_expired'));
        }
      } catch (e) {
        console.error('[axiosClient] Error clearing auth state on 401:', e);
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

export default axiosClient;
