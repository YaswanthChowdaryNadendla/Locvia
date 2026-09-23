// src/data/users.js
// Application role constants and utilities.
// No mock user data — all users come from the real backend (Spring Boot + MySQL).

export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  SHOP_OWNER: 'SHOP_OWNER',
  DELIVERY_PARTNER: 'DELIVERY_PARTNER',
  ADMIN: 'ADMIN',
};

// Kept for import compatibility — not a real user list.
export const users = [];

// Get redirect path for a given role
export const getRoleHomePath = (role) => {
  const paths = {
    [ROLES.CUSTOMER]:          '/customer',
    [ROLES.SHOP_OWNER]:        '/shop-owner/dashboard',
    [ROLES.DELIVERY_PARTNER]:  '/delivery/dashboard',
    [ROLES.ADMIN]:             '/admin/users',
  };
  return paths[role] || '/';
};

// Stub for import compatibility — no mock user lookup.
export const findUserByEmail = (_email) => null;
