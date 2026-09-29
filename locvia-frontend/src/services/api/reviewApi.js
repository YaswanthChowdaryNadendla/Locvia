// src/services/api/reviewApi.js
// Customer Reviews & Ratings API service for Spring Boot backend integration.

import axiosClient from './axiosClient.js';
import { ENDPOINTS } from './endpoints.js';

/**
 * Fetches all reviews and rating aggregates for a product.
 * @param {string|number} productId
 * @param {Object} [params]
 * @returns {Promise<{ reviews: Array<Object>, summary: Object }>}
 */
export const getProductReviews = async (productId, params = {}) => {
  return axiosClient.get(ENDPOINTS.REVIEWS.BY_PRODUCT(productId), { params });
};

/**
 * Fetches reviews for a specific shop.
 * @param {string|number} shopId
 * @param {Object} [params]
 * @returns {Promise<Array<Object>>}
 */
export const getShopReviews = async (shopId, params = {}) => {
  return axiosClient.get(ENDPOINTS.REVIEWS.BY_SHOP(shopId), { params });
};

/**
 * Submits a new product review and rating.
 * @param {Object} reviewData
 * @param {string|number} reviewData.productId
 * @param {string|number} [reviewData.orderId]
 * @param {number} reviewData.rating - 1 to 5
 * @param {string} reviewData.comment
 * @param {Array<string>} [reviewData.images]
 * @returns {Promise<Object>} Created review
 */
export const submitReview = async (reviewData) => {
  return axiosClient.post(ENDPOINTS.REVIEWS.BASE, reviewData);
};

/**
 * Updates an existing review.
 * @param {string} id
 * @param {Object} reviewData
 * @returns {Promise<Object>} Updated review
 */
export const updateReview = async (id, reviewData) => {
  return axiosClient.put(ENDPOINTS.REVIEWS.DETAIL(id), reviewData);
};

/**
 * Deletes a review.
 * @param {string} id
 * @returns {Promise<{ success: boolean }>}
 */
export const deleteReview = async (id) => {
  return axiosClient.delete(ENDPOINTS.REVIEWS.DETAIL(id));
};

/**
 * Checks eligibility of the current logged-in customer to review a product.
 * @param {string|number} productId
 * @returns {Promise<{ eligible: boolean, alreadyReviewed: boolean, existingReview: Object|null, deliveredOrderId: number|null, message: string }>}
 */
export const checkEligibility = async (productId) => {
  return axiosClient.get(ENDPOINTS.REVIEWS.ELIGIBILITY(productId));
};

/**
 * Fetches all reviews across the platform (admin moderation).
 * @param {Object} [params]
 * @returns {Promise<Array<Object>>}
 */
export const getAllReviews = async (params = {}) => {
  return axiosClient.get(ENDPOINTS.ADMIN.REVIEWS, { params });
};

/**
 * Resets / deletes all reviews across the platform (admin only).
 * @returns {Promise<Object>}
 */
export const resetReviews = async () => {
  return axiosClient.post(`${ENDPOINTS.ADMIN.REVIEWS}/reset`);
};

/**
 * Toggles a helpful vote on a review.
 * @param {string} id
 * @returns {Promise<{ helpful: number, voted: boolean }>}
 */
export const voteHelpful = async (id) => {
  try {
    return await axiosClient.post(`/reviews/${id}/helpful`);
  } catch {
    return { helpful: 0, voted: false };
  }
};

export default {
  getProductReviews,
  getShopReviews,
  checkEligibility,
  submitReview,
  updateReview,
  deleteReview,
  getAllReviews,
  resetReviews,
  voteHelpful,
};
