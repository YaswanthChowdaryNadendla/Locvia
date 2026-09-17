// src/services/api/adminApi.js
// Admin Platform Management API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

/**
 * Fetches all platform users for administration.
 * GET /api/admin/users
 * @param {Object} [params]
 * @returns {Promise<Array<Object>>}
 */
export const getUsers = async (params = {}) => {
  return axiosClient.get(ENDPOINTS.ADMIN.USERS, { params });
};

/**
 * Updates a user's platform active status.
 * PUT /api/admin/users/{id}
 * @param {string|number} userId
 * @param {string} status
 * @returns {Promise<Object>} Updated user
 */
export const updateUserStatus = async (userId, status) => {
  return axiosClient.put(ENDPOINTS.ADMIN.USER_BY_ID(userId), { status });
};

/**
 * Approves a SHOP_OWNER or DELIVERY_PARTNER account.
 * PUT /api/admin/users/{id}/approve
 * @param {string|number} userId
 * @returns {Promise<Object>} Updated user with accountStatus = APPROVED
 */
export const approveUser = async (userId) => {
  return axiosClient.put(ENDPOINTS.ADMIN.APPROVE_USER(userId));
};

/**
 * Rejects a SHOP_OWNER or DELIVERY_PARTNER account.
 * PUT /api/admin/users/{id}/reject
 * @param {string|number} userId
 * @returns {Promise<Object>} Updated user with accountStatus = REJECTED
 */
export const rejectUser = async (userId) => {
  return axiosClient.put(ENDPOINTS.ADMIN.REJECT_USER(userId));
};

/**
 * Fetches all registered shops for platform administration.
 * GET /api/admin/shops
 * @param {Object} [params]
 * @returns {Promise<Array<Object>>}
 */
export const getShops = async (params = {}) => {
  return axiosClient.get(ENDPOINTS.ADMIN.SHOPS, { params });
};

/**
 * Updates a shop's verification status ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED').
 * PUT /api/admin/shops/{id}
 * @param {string|number} shopId
 * @param {string} status
 * @returns {Promise<Object>} Updated shop
 */
export const updateShopStatus = async (shopId, status) => {
  return axiosClient.put(ENDPOINTS.ADMIN.SHOP_BY_ID(shopId), { status });
};

/**
 * Fetches all categories for admin catalog management.
 * GET /api/admin/categories
 * @returns {Promise<Array<Object>>}
 */
export const getCategories = async () => {
  return axiosClient.get(ENDPOINTS.ADMIN.CATEGORIES);
};

/**
 * Creates a new category.
 * POST /api/admin/categories
 * @param {Object} categoryData
 * @returns {Promise<Object>}
 */
export const createCategory = async (categoryData) => {
  return axiosClient.post(ENDPOINTS.ADMIN.CATEGORIES, categoryData);
};

/**
 * Updates an existing category.
 * PUT /api/admin/categories/{id}
 * @param {string|number} id
 * @param {Object} categoryData
 * @returns {Promise<Object>}
 */
export const updateCategory = async (id, categoryData) => {
  return axiosClient.put(ENDPOINTS.ADMIN.CATEGORY_BY_ID(id), categoryData);
};

/**
 * Deletes a category.
 * DELETE /api/admin/categories/{id}
 * @param {string|number} id
 * @returns {Promise<{ success: boolean }>}
 */
export const deleteCategory = async (id) => {
  return axiosClient.delete(ENDPOINTS.ADMIN.CATEGORY_BY_ID(id));
};

/**
 * Fetches platform-wide products for administration.
 * GET /api/admin/products
 * @param {Object} [params]
 * @returns {Promise<Array<Object>>}
 */
export const getProducts = async (params = {}) => {
  return axiosClient.get(ENDPOINTS.ADMIN.PRODUCTS, { params });
};

/**
 * Fetches platform-wide inventory for administration.
 * GET /api/admin/inventory
 * @param {Object} [params]
 * @returns {Promise<Array<Object>>}
 */
export const getInventory = async (params = {}) => {
  return axiosClient.get(ENDPOINTS.ADMIN.INVENTORY, { params });
};

/**
 * Fetches platform-wide orders for administration.
 * GET /api/admin/orders
 * @param {Object} [params]
 * @returns {Promise<Array<Object>>}
 */
export const getOrders = async (params = {}) => {
  return axiosClient.get(ENDPOINTS.ADMIN.ORDERS, { params });
};

/**
 * Updates an order status from admin console.
 * PATCH /api/admin/orders/{id}/status
 * @param {string|number} orderId
 * @param {string} status
 * @returns {Promise<Object>}
 */
export const updateOrderStatus = async (orderId, status) => {
  return axiosClient.patch(ENDPOINTS.ADMIN.ORDER_STATUS(orderId), { status });
};

/**
 * Fetches platform-wide delivery operations.
 * GET /api/admin/deliveries
 * @param {Object} [params]
 * @returns {Promise<Array<Object>>}
 */
export const getDeliveries = async (params = {}) => {
  return axiosClient.get(ENDPOINTS.ADMIN.DELIVERIES, { params });
};

/**
 * Fetches platform-wide payments for administration.
 * GET /api/admin/payments
 * @param {Object} [params]
 * @returns {Promise<Array<Object>>}
 */
export const getPayments = async (params = {}) => {
  return axiosClient.get(ENDPOINTS.ADMIN.PAYMENTS, { params });
};

/**
 * Fetches real-time system metrics, GMV, counts, and platform performance.
 * GET /api/admin
 * @returns {Promise<Object>}
 */
export const getSystemMetrics = async () => {
  return axiosClient.get(ENDPOINTS.ADMIN.METRICS);
};

export default {
  getUsers,
  updateUserStatus,
  approveUser,
  rejectUser,
  getShops,
  updateShopStatus,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getInventory,
  getOrders,
  updateOrderStatus,
  getDeliveries,
  getPayments,
  getSystemMetrics,
};

