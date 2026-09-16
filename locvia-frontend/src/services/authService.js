// src/services/authService.js
// Real authentication service — connects to Spring Boot JWT backend.
// Uses the existing authApi.js Axios layer (services/api/authApi.js).
// Storage keys are unchanged from the mock phase: locvia_token / locvia_user.

import * as authApi from './api/authApi';
import { getRoleHomePath } from '../data/users';

// Role display labels for user-facing mismatch messages
const ROLE_LABELS = {
  CUSTOMER: 'Customer',
  SHOP_OWNER: 'Shop Owner',
  DELIVERY_PARTNER: 'Delivery Partner',
  ADMIN: 'Admin',
};

// ── Login ──────────────────────────────────────────────────────────────────
/**
 * Authenticates the user against the Spring Boot backend.
 * POST /api/auth/login { email, password }
 *
 * If selectedRole is provided, compares it against the backend-verified role.
 * A mismatch does NOT grant access — the backend JWT role is authoritative.
 *
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @param {string} [credentials.selectedRole]  - Frontend role selector value (CUSTOMER | SHOP_OWNER | DELIVERY_PARTNER | ADMIN)
 * @returns {Promise<{ token: string, user: Object, redirectTo: string }>}
 */
export const login = async ({ email, password, selectedRole }) => {
  // Backend call — throws normalized ApiError on failure
  const response = await authApi.login({ email, password });

  // response shape: { token, tokenType, user: { id, name, email, phone, role } }
  const { token, user } = response;

  // Role mismatch check — purely frontend UX guard.
  // The JWT already encodes the real role; this just gives a clear message.
  if (selectedRole && user?.role && user.role !== selectedRole) {
    const selectedLabel = ROLE_LABELS[selectedRole] || selectedRole;
    throw new Error(`This account does not have ${selectedLabel} access.`);
  }

  // Persist to localStorage — same keys the Axios interceptor reads
  localStorage.setItem('locvia_token', token);
  localStorage.setItem('locvia_user', JSON.stringify(user));

  return {
    token,
    user,
    redirectTo: getRoleHomePath(user.role),
  };
};

// ── Register ───────────────────────────────────────────────────────────────
/**
 * Registers a new user account via the Spring Boot backend.
 * POST /api/auth/register { name, email, password, phone, role }
 *
 * @param {Object} userData
 * @returns {Promise<{ token: string, user: Object, redirectTo: string }>}
 */
export const register = async (userData) => {
  const response = await authApi.register(userData);
  const { token, user } = response;

  localStorage.setItem('locvia_token', token);
  localStorage.setItem('locvia_user', JSON.stringify(user));

  return {
    token,
    user,
    redirectTo: getRoleHomePath(user.role),
  };
};

// ── Logout ─────────────────────────────────────────────────────────────────
export const logout = () => {
  localStorage.removeItem('locvia_token');
  localStorage.removeItem('locvia_user');
};

// ── Get current user from localStorage ────────────────────────────────────
/**
 * Reads the persisted user from localStorage.
 * Returns null if not found or if data is malformed.
 */
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('locvia_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ── Is authenticated ───────────────────────────────────────────────────────
export const isAuthenticated = () => {
  return !!localStorage.getItem('locvia_token');
};

// ── Fetch current user from backend ───────────────────────────────────────
/**
 * Calls GET /api/auth/me to verify the stored token is still valid
 * and refresh the user object from the backend.
 * Returns the fresh user or null if the token is expired/invalid.
 */
export const fetchCurrentUser = async () => {
  try {
    const token = localStorage.getItem('locvia_token');
    if (!token) return null;

    const user = await authApi.getCurrentUser();

    // Update stored user with fresh data from backend
    if (user) {
      localStorage.setItem('locvia_user', JSON.stringify(user));
    }
    return user;
  } catch {
    // Token invalid/expired — clear auth state
    localStorage.removeItem('locvia_token');
    localStorage.removeItem('locvia_user');
    return null;
  }
};

// ── Update user profile in localStorage ───────────────────────────────────
/**
 * Merges updatedFields into the stored user object.
 * Used for local profile edits before they are persisted to the backend.
 */
export const updateUserProfile = (updatedFields) => {
  try {
    const raw = localStorage.getItem('locvia_user');
    const currentUser = raw ? JSON.parse(raw) : {};
    const updatedUser = { ...currentUser, ...updatedFields };
    localStorage.setItem('locvia_user', JSON.stringify(updatedUser));
    return updatedUser;
  } catch (err) {
    console.error('Failed to update user profile in storage:', err);
    throw err;
  }
};
