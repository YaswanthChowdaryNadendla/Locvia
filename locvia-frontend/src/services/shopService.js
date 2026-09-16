// src/services/shopService.js
// Real API service for Shop Discovery — replaces all mock/localStorage logic.
// All data comes from Spring Boot backend via shopApi.

import * as shopApi from './api/shopApi';

/**
 * Fetches shops with optional filtering.
 */
export const getShops = async (params = {}) => {
  const response = await shopApi.getShops(params);
  // Backend returns array directly; handle both [] and { content: [] }
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.content)) return response.content;
  return [];
};

/**
 * Fetches a single shop by ID (async, from API).
 */
export const getShopById = async (id) => {
  return shopApi.getShopById(id);
};

/**
 * Synchronous shop lookup — returns null (no mock data).
 * Pages that previously relied on this for instant UI should
 * await getShopById() instead.
 */
export const getShopByIdSync = (_id) => null;

export default {
  getShops,
  getShopById,
  getShopByIdSync,
};
