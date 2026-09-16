// src/services/productService.js
// Real API service for Product Catalog — replaces all mock/localStorage logic.
// All data comes from Spring Boot backend via productApi.

import * as productApi from './api/productApi';

/**
 * Fetches products with optional filtering and sorting.
 * Params accepted by backend: shopId, categoryId, search, sort, page, size.
 */
export const getProducts = async (params = {}) => {
  // Map frontend filter keys to backend param names
  const backendParams = {};
  if (params.query)     backendParams.search   = params.query;
  if (params.shopId)    backendParams.shopId   = params.shopId;
  if (params.category && params.category !== 'All') {
    backendParams.category = params.category;
  }
  if (params.minPrice)  backendParams.minPrice = params.minPrice;
  if (params.maxPrice)  backendParams.maxPrice = params.maxPrice;
  if (params.isAvailable !== undefined) backendParams.isAvailable = params.isAvailable;
  if (params.page)      backendParams.page     = params.page;
  if (params.size)      backendParams.size     = params.size;

  const response = await productApi.getProducts(backendParams);
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.content)) return response.content;
  return [];
};

/**
 * Fetches a single product by ID (async, from API).
 */
export const fetchProductById = async (id) => {
  return productApi.getProductById(id);
};

/**
 * Fetches related/recommended products.
 * Falls back to empty array if endpoint not available.
 */
export const fetchRelatedProducts = async (categoryOrId, currentProductId, limit = 4) => {
  try {
    const response = await productApi.getRelatedProducts(currentProductId, limit);
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.content)) return response.content;
    return [];
  } catch {
    return [];
  }
};

export default {
  getProducts,
  fetchProductById,
  fetchRelatedProducts,
};
