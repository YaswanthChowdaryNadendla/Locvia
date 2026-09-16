// src/services/shopOwnerService.js
// Real API service for Shop Owner operations.
// All data comes from Spring Boot backend via shopApi and productApi.
// No mock data. No localStorage seeding.

import * as shopApi from './api/shopApi';
import * as productApi from './api/productApi';
import * as orderApi from './api/orderApi';

// ── Shop ──────────────────────────────────────────────────────

/**
 * Fetches the authenticated shop owner's shop(s).
 * Returns first shop or null if none.
 */
export const getOwnerShop = async () => {
  try {
    const response = await shopApi.getMyShop();
    // getMyShop returns the single owner shop
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      return response;
    }
    if (Array.isArray(response)) return response[0] || null;
    return null;
  } catch {
    return null;
  }
};

/**
 * Fetches all shops owned by the authenticated shop owner.
 */
export const getOwnerShops = async () => {
  try {
    const response = await shopApi.getMyShop();
    if (Array.isArray(response)) return response;
    if (response) return [response];
    return [];
  } catch {
    return [];
  }
};

/**
 * Creates a new shop for the authenticated owner.
 */
export const createShop = async (shopData) => {
  return shopApi.createShop(shopData);
};

/**
 * Updates shop profile details.
 */
export const updateShopDetails = async (shopId, updatedFields) => {
  return shopApi.updateMyShop(shopId, updatedFields);
};

// ── Products ──────────────────────────────────────────────────

/**
 * Fetches all products for a shop from the API.
 */
export const getOwnerProducts = async (shopId) => {
  try {
    const response = await productApi.getProductsByShop(shopId);
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.content)) return response.content;
    return [];
  } catch {
    return [];
  }
};

/**
 * Adds a new product to the shop via the API.
 */
export const addOwnerProduct = async (shopId, productData) => {
  return productApi.createProduct(shopId, productData);
};

/**
 * Uploads a product image via Cloudinary backend integration.
 */
export const uploadProductImage = async (productId, file) => {
  return productApi.uploadProductImage(productId, file);
};

/**
 * Updates an existing product via the API.
 */
export const updateOwnerProduct = async (_shopId, productId, updatedData) => {
  return productApi.updateProduct(productId, updatedData);
};

/**
 * Deletes a product via the API.
 */
export const deleteOwnerProduct = async (_shopId, productId) => {
  return productApi.deleteProduct(productId);
};

// ── Orders ────────────────────────────────────────────────────

/**
 * Fetches orders for the owner's shop via the API.
 */
export const getOwnerOrders = async (shopId) => {
  try {
    const response = await orderApi.getShopOrders(shopId);
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.content)) return response.content;
    return [];
  } catch {
    return [];
  }
};

/**
 * Fetches a single order for the shop owner.
 */
export const getOwnerOrderById = async (_shopId, orderId) => {
  try {
    return await orderApi.getOrderById(orderId);
  } catch {
    return null;
  }
};

/**
 * Updates order status.
 */
export const updateOwnerOrderStatus = async (_shopId, orderId, newStatus) => {
  return orderApi.updateOrderStatus(orderId, newStatus);
};

// ── Legacy synchronous stubs ──────────────────────────────────
// Kept for import compatibility only — return empty values.

/** @deprecated Use getOwnerProducts (async) instead. */
export const getStoredProducts = () => [];
/** @deprecated Use getOwnerShops (async) instead. */
export const getStoredShops = () => [];
