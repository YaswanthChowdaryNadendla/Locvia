// src/services/api/categoryApi.js
// Category API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

/**
 * Fetches all active product categories.
 * @returns {Promise<Array<Object>>}
 */
export const getCategories = async () => {
  return axiosClient.get(ENDPOINTS.CATEGORIES.BASE);
};

/**
 * Fetches single category details by ID.
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const getCategoryById = async (id) => {
  return axiosClient.get(ENDPOINTS.CATEGORIES.DETAIL(id));
};

export default {
  getCategories,
  getCategoryById,
};
