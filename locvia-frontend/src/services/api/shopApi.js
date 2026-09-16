// src/services/api/shopApi.js
// Shop Discovery and Management API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

/**
 * Fetches shops list with filtering, searching, and sorting.
 * @param {Object} [params]
 * @param {string} [params.query] - Search query keyword
 * @param {string} [params.category] - Category filter
 * @param {string} [params.sort] - Sort option
 * @param {boolean} [params.openOnly] - Only open shops
 * @param {number} [params.minRating] - Minimum rating
 * @param {number} [params.maxDistance] - Maximum distance in km
 * @param {number} [params.maxDeliveryTime] - Maximum delivery time in minutes
 * @param {number} [params.page] - Page number (0-indexed)
 * @param {number} [params.size] - Page size
 * @returns {Promise<Array<Object>|{ content: Array<Object>, totalElements: number }>}
 */
export const getShops = async (params = {}) => {
  return axiosClient.get(ENDPOINTS.SHOPS.BASE, { params });
};

/**
 * Fetches details for a single shop by ID.
 * @param {number|string} id
 * @returns {Promise<Object>} Shop details
 */
export const getShopById = async (id) => {
  return axiosClient.get(ENDPOINTS.SHOPS.DETAIL(id));
};

/**
 * Fetches nearby shops based on geographic coordinates.
 * @param {Object} coords
 * @param {number} coords.latitude
 * @param {number} coords.longitude
 * @param {number} [coords.radiusKm=10]
 * @returns {Promise<Array<Object>>}
 */
export const getNearbyShops = async ({ latitude, longitude, radiusKm = 10 }) => {
  return axiosClient.get(ENDPOINTS.SHOPS.NEARBY, {
    params: { lat: latitude, lng: longitude, radius: radiusKm },
  });
};

/**
 * Fetches the shops owned by the currently authenticated shop owner.
 * GET /api/shops/my
 * @returns {Promise<Array<Object>>}
 */
export const getMyShop = async () => {
  return axiosClient.get(ENDPOINTS.SHOPS.MY);
};

/**
 * Updates details of a shop owned by the current shop owner.
 * PUT /api/shops/{id}
 * @param {number|string} id
 * @param {Object} shopData
 * @returns {Promise<Object>} Updated shop object
 */
export const updateMyShop = async (id, shopData) => {
  return axiosClient.put(ENDPOINTS.SHOPS.UPDATE(id), shopData);
};

/**
 * Registers or creates a new shop.
 * @param {Object} shopData
 * @returns {Promise<Object>} Created shop object
 */
export const createShop = async (shopData) => {
  return axiosClient.post(ENDPOINTS.SHOPS.BASE, shopData);
};

export default {
  getShops,
  getShopById,
  getNearbyShops,
  getMyShop,
  updateMyShop,
  createShop,
};
