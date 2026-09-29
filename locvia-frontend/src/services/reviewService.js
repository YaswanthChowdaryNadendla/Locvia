// src/services/reviewService.js
// Module 36 — Product Reviews & Ratings Service
// Real API integration with Spring Boot backend via reviewApi.
// All mock and localStorage review data have been purged; the database is the single source of truth.

import * as reviewApi from './api/reviewApi.js';

// Purge any stale mock reviews from localStorage
try {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('locvia_reviews')) {
    localStorage.removeItem('locvia_reviews');
  }
} catch {
  // Ignore storage exceptions
}

// ── Delivered/completed status check ──────────────────────────
const REVIEWABLE_STATUSES = ['DELIVERED', 'COMPLETED'];

export const isOrderReviewable = (order) =>
  REVIEWABLE_STATUSES.includes((order?.orderStatus || order?.status || '').toUpperCase());

// ── Purchase & Eligibility verification ────────────────────────
/**
 * Checks whether the current user is eligible to review the given product.
 * Returns true if the user purchased and received the product.
 * @param {string|number} userId
 * @param {string|number} productId
 * @returns {Promise<boolean>}
 */
export const canUserReviewProduct = async (userId, productId) => {
  try {
    const res = await reviewApi.checkEligibility(productId);
    return !!res?.eligible;
  } catch {
    return false;
  }
};

/**
 * Checks if a specific review by the user for a product exists.
 * @param {string|number} userId
 * @param {string|number} productId
 * @returns {Promise<Object|null>}
 */
export const getReviewForProduct = async (userId, productId) => {
  try {
    const res = await reviewApi.checkEligibility(productId);
    return res?.existingReview || null;
  } catch {
    return null;
  }
};

// ── Core review CRUD ───────────────────────────────────────────

/**
 * getProductReviews — retrieves all approved reviews and rating summary for a product.
 * @param {string|number} productId
 * @returns {Promise<Array<Object>>}
 */
export const getProductReviews = async (productId) => {
  try {
    const res = await reviewApi.getProductReviews(productId);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.reviews)) return res.reviews;
    return [];
  } catch (err) {
    console.error('[reviewService] Failed to fetch product reviews:', err);
    return [];
  }
};

/**
 * getShopReviews — retrieves reviews for all products belonging to a shop.
 * @param {string|number} shopId
 * @returns {Promise<Array<Object>>}
 */
export const getShopReviews = async (shopId) => {
  try {
    const res = await reviewApi.getShopReviews(shopId);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.reviews)) return res.reviews;
    return [];
  } catch (err) {
    console.error('[reviewService] Failed to fetch shop reviews:', err);
    return [];
  }
};

/**
 * getAllReviews — retrieves all platform reviews (for admin moderation).
 * @returns {Promise<Array<Object>>}
 */
export const getAllReviews = async () => {
  try {
    const res = await reviewApi.getAllReviews();
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.content)) return res.content;
    return [];
  } catch (err) {
    console.error('[reviewService] Failed to fetch admin reviews:', err);
    return [];
  }
};

/**
 * addReview — submits a new review to the backend.
 * @param {Object} params
 * @param {string|number} params.productId
 * @param {number} params.rating
 * @param {string} params.comment
 * @param {string|number} [params.orderId]
 * @returns {Promise<Object>}
 */
export const addReview = async ({ productId, rating, comment, orderId }) => {
  return await reviewApi.submitReview({
    productId: Number(productId),
    rating: Number(rating),
    comment: comment.trim(),
    orderId: orderId ? Number(orderId) : null,
  });
};

/**
 * updateReview — updates an existing customer review.
 * @param {string|number} reviewId
 * @param {string|number} userId
 * @param {Object} params
 * @param {number} params.rating
 * @param {string} params.comment
 * @returns {Promise<Object>}
 */
export const updateReview = async (reviewId, userId, { rating, comment }) => {
  return await reviewApi.updateReview(reviewId, {
    rating: Number(rating),
    comment: comment.trim(),
  });
};

/**
 * deleteReview — deletes a review by ID.
 * @param {string|number} reviewId
 * @returns {Promise<boolean>}
 */
export const deleteReview = async (reviewId) => {
  await reviewApi.deleteReview(reviewId);
  return true;
};

/**
 * voteHelpful — toggles helpful vote.
 * @param {string|number} reviewId
 * @returns {Promise<number>}
 */
export const voteHelpful = async (reviewId) => {
  try {
    const res = await reviewApi.voteHelpful(reviewId);
    return res?.helpful ?? 0;
  } catch {
    return 0;
  }
};

// ── Summary calculation ────────────────────────────────────────

/**
 * calculateReviewSummary(reviews) → { average, total, distribution }
 */
export const calculateReviewSummary = (reviews = []) => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    const rating = Number(r.rating);
    if (rating >= 1 && rating <= 5) {
      distribution[rating] = (distribution[rating] || 0) + 1;
      sum += rating;
    }
  }
  const total = reviews.length;
  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
  return { average, total, distribution };
};

// ── Date display ───────────────────────────────────────────────

export const formatReviewDate = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

export default {
  isOrderReviewable,
  canUserReviewProduct,
  getReviewForProduct,
  getProductReviews,
  getShopReviews,
  getAllReviews,
  addReview,
  updateReview,
  deleteReview,
  voteHelpful,
  calculateReviewSummary,
  formatReviewDate,
};
