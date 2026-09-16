// src/services/adminUserService.js
// Service layer for Admin User Management
// Reads users without any mock/demo data seeding.

import { ROLES } from '../data/users';

export { ROLES };

const USERS_STORAGE_KEY = 'locvia_all_users';

/**
 * Normalizes user object with safe default fallbacks
 */
const normalizeUser = (user) => {
  return {
    id: user.id || `user-${Math.random().toString(36).substr(2, 9)}`,
    name: user.name || 'Unnamed User',
    email: user.email || 'no-email@locvia.com',
    phone: user.phone || 'N/A',
    role: user.role || ROLES.CUSTOMER,
    status: user.status || 'ACTIVE',
    avatar: user.avatar || null,
    shopId: user.shopId || null,
    createdAt: user.createdAt || new Date().toISOString(),
  };
};

/**
 * Retrieves all platform users from localStorage (returns [] when empty — no mock seed).
 */
export const getAllUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeUser);
      }
    }
  } catch (err) {
    console.error('Error reading locvia_all_users from localStorage:', err);
  }
  return [];
};

/**
 * Updates a user's status (e.g. ACTIVE <-> INACTIVE)
 */
export const updateUserStatus = (userId, newStatus) => {
  const usersList = getAllUsers();
  const updatedList = usersList.map((u) => {
    if (u.id === userId) {
      return { ...u, status: newStatus };
    }
    return u;
  });

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedList));

    const currentAuthRaw = localStorage.getItem('locvia_user');
    if (currentAuthRaw) {
      const currentAuthUser = JSON.parse(currentAuthRaw);
      if (currentAuthUser && currentAuthUser.id === userId) {
        const updatedAuthUser = { ...currentAuthUser, status: newStatus };
        localStorage.setItem('locvia_user', JSON.stringify(updatedAuthUser));
      }
    }
  } catch (err) {
    console.error('Error updating user status in localStorage:', err);
  }

  return updatedList;
};

/**
 * Calculates user statistics metrics
 */
export const calculateUserStats = (users = []) => {
  const total = users.length;
  const customers = users.filter((u) => u.role === ROLES.CUSTOMER).length;
  const shopOwners = users.filter((u) => u.role === ROLES.SHOP_OWNER).length;
  const deliveryPartners = users.filter((u) => u.role === ROLES.DELIVERY_PARTNER).length;
  const active = users.filter((u) => u.status === 'ACTIVE').length;
  const inactive = users.filter((u) => u.status !== 'ACTIVE').length;

  return {
    total,
    customers,
    shopOwners,
    deliveryPartners,
    active,
    inactive,
  };
};

/**
 * Generates user initials
 */
export const getUserInitials = (name = '') => {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Formats user joined date
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
