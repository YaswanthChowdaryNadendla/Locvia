// src/services/api/reviewApi.js
// Customer Reviews & Ratings API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

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
 * Toggles a helpful vote on a review.
 * @param {string} id
 * @returns {Promise<{ helpful: number, voted: boolean }>}
 */
export const voteHelpful = async (id) => {
  return axiosClient.post(ENDPOINTS.REVIEWS.VOTE_HELPFUL(id));
};

export default {
  getProductReviews,
  getShopReviews,
  submitReview,
  updateReview,
  deleteReview,
  voteHelpful,
};
