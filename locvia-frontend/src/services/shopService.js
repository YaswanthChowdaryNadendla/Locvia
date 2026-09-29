// src/services/shopService.js
// Real API service for Shop Discovery — replaces all mock/localStorage logic.
// All data comes from Spring Boot backend via shopApi.

import * as shopApi from './api/shopApi';

/**
 * Normalizes shop response ensuring isOpen accurately reflects the backend source of truth.
 */
export const normalizeShop = (shop) => {
  if (!shop) return null;
  const isApproved = shop.status === 'APPROVED' || shop.status === 'ACTIVE' || (shop.active !== false && !shop.status);
  const isOpen = shop.isOpen !== undefined ? Boolean(shop.isOpen) : (isApproved && shop.active !== false);
  return {
    ...shop,
    isOpen,
  };
};

/**
 * Fetches shops with optional filtering.
 */
export const getShops = async (params = {}) => {
  const response = await shopApi.getShops(params);
  // Backend returns array directly; handle both [] and { content: [] }
  let list = [];
  if (Array.isArray(response)) {
    list = response;
  } else if (response && Array.isArray(response.content)) {
    list = response.content;
  }

  let normalized = list.map(normalizeShop).filter(Boolean);

  // Client-side filtering fallback for query, category, openOnly, sort
  if (params.openOnly) {
    normalized = normalized.filter((s) => s.isOpen);
  }
  if (params.category && params.category !== 'All') {
    normalized = normalized.filter(
      (s) => (s.category || '').toLowerCase() === params.category.toLowerCase()
    );
  }
  if (params.query && params.query.trim()) {
    const q = params.query.trim().toLowerCase();
    normalized = normalized.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q))
    );
  }
  if (params.sort) {
    if (params.sort === 'rating') {
      normalized.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (params.sort === 'distance') {
      normalized.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
  }

  return normalized;
};

/**
 * Fetches a single shop by ID (async, from API).
 */
export const getShopById = async (id) => {
  const shop = await shopApi.getShopById(id);
  return normalizeShop(shop);
};

/**
 * Synchronous shop lookup — returns null (no mock data).
 * Pages that previously relied on this for instant UI should
 * await getShopById() instead.
 */
export const getShopByIdSync = (_id) => null;

export default {
  normalizeShop,
  getShops,
  getShopById,
  getShopByIdSync,
};
