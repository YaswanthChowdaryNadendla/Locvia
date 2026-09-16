// src/services/api/productApi.js
// Product Catalog API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

/**
 * Fetches products list with flexible filtering and sorting.
 * @param {Object} [params]
 * @param {string} [params.query]
 * @param {string} [params.category]
 * @param {number|string} [params.shopId]
 * @param {number} [params.minPrice]
 * @param {number} [params.maxPrice]
 * @param {boolean} [params.isAvailable]
 * @param {string} [params.sort]
 * @param {number} [params.page]
 * @param {number} [params.size]
 * @returns {Promise<Array<Object>|{ content: Array<Object>, totalElements: number }>}
 */
export const getProducts = async (params = {}) => {
  return axiosClient.get(ENDPOINTS.PRODUCTS.BASE, { params });
};

/**
 * Fetches single product details by ID.
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const getProductById = async (id) => {
  return axiosClient.get(ENDPOINTS.PRODUCTS.DETAIL(id));
};

/**
 * Fetches all products belonging to a specific shop.
 * @param {number|string} shopId
 * @param {Object} [params]
 * @returns {Promise<Array<Object>>}
 */
export const getProductsByShop = async (shopId, params = {}) => {
  return axiosClient.get(ENDPOINTS.PRODUCTS.BY_SHOP(shopId), { params });
};

/**
 * Fetches products in a given category.
 * @param {string} category
 * @param {Object} [params]
 * @returns {Promise<Array<Object>>}
 */
export const getProductsByCategory = async (category, params = {}) => {
  return axiosClient.get(ENDPOINTS.PRODUCTS.BY_CATEGORY(category), { params });
};

/**
 * Searches products by text query across name, description, tags.
 * @param {string} query
 * @param {Object} [params]
 * @returns {Promise<Array<Object>>}
 */
export const searchProducts = async (query, params = {}) => {
  return axiosClient.get(ENDPOINTS.PRODUCTS.SEARCH, {
    params: { q: query, ...params },
  });
};

/**
 * Fetches related/recommended products for a given product ID.
 * @param {number|string} id
 * @param {number} [limit=4]
 * @returns {Promise<Array<Object>>}
 */
export const getRelatedProducts = async (id, limit = 4) => {
  return axiosClient.get(ENDPOINTS.PRODUCTS.RELATED(id), {
    params: { limit },
  });
};

/**
 * Creates a new product for a specific shop (Shop Owner / Admin).
 * POST /api/shops/{shopId}/products
 * @param {number|string} shopId
 * @param {Object} productData
 * @returns {Promise<Object>} Created product
 */
export const createProduct = async (shopId, productData) => {
  // If shopId was passed inside productData or as first arg
  const targetShopId = shopId && typeof shopId !== 'object' ? shopId : productData?.shopId;
  const payload = typeof shopId === 'object' ? shopId : productData;
  return axiosClient.post(ENDPOINTS.PRODUCTS.CREATE_FOR_SHOP(targetShopId), payload);
};

/**
 * Updates an existing product.
 * PUT /api/products/{id}
 * @param {number|string} id
 * @param {Object} productData
 * @returns {Promise<Object>} Updated product
 */
export const updateProduct = async (id, productData) => {
  return axiosClient.put(ENDPOINTS.PRODUCTS.UPDATE(id), productData);
};

/**
 * Deletes a product.
 * DELETE /api/products/{id}
 * @param {number|string} id
 * @returns {Promise<{ success: boolean }>}
 */
export const deleteProduct = async (id) => {
  return axiosClient.delete(ENDPOINTS.PRODUCTS.DELETE(id));
};

/**
 * Uploads a product image via Cloudinary backend integration.
 * POST /api/products/{id}/image (multipart/form-data)
 * @param {number|string} productId
 * @param {File|Blob} file
 * @returns {Promise<Object>} Updated product with imageUrl
 */
export const uploadProductImage = async (productId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axiosClient.post(ENDPOINTS.PRODUCTS.IMAGE(productId), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default {
  getProducts,
  getProductById,
  getProductsByShop,
  getProductsByCategory,
  searchProducts,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
};
