// src/services/adminUserService.js
// Service layer for Admin User Management
// Connects to the real Spring Boot backend API via adminApi.
// Previously used localStorage — replaced with live API calls.

import * as adminApi from './api/adminApi';
import { ROLES } from '../data/users';

export { ROLES };

/**
 * Fetches all platform users from the Spring Boot backend.
 * GET /api/admin/users
 * Returns an array of user objects including accountStatus.
 * @param {Object} [params] optional query parameters (role, active, search)
 * @returns {Promise<Array>}
 */
export const getAllUsers = async (params = {}) => {
  return adminApi.getUsers(params);
};

/**
 * Approves a SHOP_OWNER or DELIVERY_PARTNER account.
 * PUT /api/admin/users/{id}/approve
 * @param {string|number} userId
 * @returns {Promise<Object>} Updated user
 */
export const approveUser = async (userId) => {
  return adminApi.approveUser(userId);
};

/**
 * Rejects a SHOP_OWNER or DELIVERY_PARTNER account.
 * PUT /api/admin/users/{id}/reject
 * @param {string|number} userId
 * @returns {Promise<Object>} Updated user
 */
export const rejectUser = async (userId) => {
  return adminApi.rejectUser(userId);
};

/**
 * Toggles a user's active status.
 * PUT /api/admin/users/{id}
 * @param {string|number} userId
 * @param {boolean} active
 * @returns {Promise<Object>} Updated user
 */
export const updateUserActiveStatus = async (userId, active) => {
  return adminApi.updateUserStatus(userId, { active });
};

/**
 * Calculates user statistics from a user list.
 * @param {Array} users
 * @returns {Object} stats
 */
export const calculateUserStats = (users = []) => {
  const total = users.length;
  const customers = users.filter((u) => u.role === ROLES.CUSTOMER).length;
  const shopOwners = users.filter((u) => u.role === ROLES.SHOP_OWNER).length;
  const deliveryPartners = users.filter((u) => u.role === ROLES.DELIVERY_PARTNER).length;
  const activeUsers = users.filter((u) => u.active !== false).length;
  const inactiveUsers = users.filter((u) => u.active === false).length;
  const pendingApproval = users.filter(
    (u) =>
      (u.role === ROLES.SHOP_OWNER || u.role === ROLES.DELIVERY_PARTNER) &&
      u.accountStatus === 'PENDING'
  ).length;

  return {
    totalUsers: total,
    customers,
    shopOwners,
    deliveryPartners,
    activeUsers,
    inactiveUsers,
    pendingApproval,
  };
};

/**
 * Generates user initials from name.
 * @param {string} name
 * @returns {string}
 */
export const getUserInitials = (name = '') => {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Formats a date string to a readable joined date.
 * @param {string} dateStr
 * @returns {string}
 */
export const formatJoinedDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};
