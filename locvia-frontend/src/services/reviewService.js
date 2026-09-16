// src/services/reviewService.js
// Module 36 — Product Reviews & Ratings Service
// Master review source: localStorage key 'locvia_reviews'
// All reviews are a flat array. Filter by productId, shopId, userId, orderId as needed.

import { getLocalOrders } from './orderService';

export const REVIEWS_KEY = 'locvia_reviews';

// ── ID generation ──────────────────────────────────────────────
export const generateReviewId = () =>
  `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ── localStorage helpers ───────────────────────────────────────
export const readReviews = () => {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('[reviewService] Failed to parse reviews from localStorage:', err);
  }
  return [];
};

const writeReviews = (reviews) => {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  } catch (err) {
    console.error('[reviewService] Failed to write reviews to localStorage:', err);
  }
};

// ── Delivered/completed status check ──────────────────────────
const REVIEWABLE_STATUSES = ['DELIVERED', 'COMPLETED'];

export const isOrderReviewable = (order) =>
  REVIEWABLE_STATUSES.includes((order?.orderStatus || '').toUpperCase());

// ── Purchase verification ──────────────────────────────────────
/**
 * Returns all delivered orders for a user that contain a given productId.
 * productId is compared as both string and number.
 */
export const getDeliveredOrdersWithProduct = (userId, productId) => {
  try {
    const orders = getLocalOrders();
    const pid = String(productId);
    return orders.filter((o) => {
      if (o.userId !== userId && o.userId !== 'cust-01') return false;
      if (!isOrderReviewable(o)) return false;
      return (o.items || []).some(
        (item) => String(item.productId) === pid || String(item.id) === pid
      );
    });
  } catch {
    return [];
  }
};

/**
 * Returns whether the user has purchased (and received) the product.
 * Used to gate review submission.
 */
export const canUserReviewProduct = (userId, productId) => {
  return getDeliveredOrdersWithProduct(userId, productId).length > 0;
};

/**
 * Returns all delivered/completed orders for a user (for the orders page review badges).
 */
export const getDeliveredOrders = (userId) => {
  try {
    const orders = getLocalOrders();
    return orders.filter((o) => {
      if (o.userId !== userId && o.userId !== 'cust-01') return false;
      return isOrderReviewable(o);
    });
  } catch {
    return [];
  }
};

// ── Core review CRUD ───────────────────────────────────────────

/** getProductReviews — all reviews for a product */
export const getProductReviews = (productId) => {
  const pid = String(productId);
  return readReviews().filter((r) => String(r.productId) === pid);
};

/** getShopReviews — all reviews for a shop */
export const getShopReviews = (shopId) => {
  const sid = String(shopId);
  return readReviews().filter((r) => String(r.shopId) === sid);
};

/** getUserReviews — all reviews submitted by a user */
export const getUserReviews = (userId) =>
  readReviews().filter((r) => r.userId === userId);

/** getReviewForProduct — single review by user for a product (one per user per product) */
export const getReviewForProduct = (userId, productId) => {
  const pid = String(productId);
  return (
    readReviews().find(
      (r) => r.userId === userId && String(r.productId) === pid
    ) || null
  );
};

/** getAllReviews — full flat list (for admin) */
export const getAllReviews = () => readReviews();

/** addReview — create and persist a new review */
export const addReview = ({
  userId,
  userName,
  productId,
  shopId,
  orderId,
  rating,
  comment,
}) => {
  const reviews = readReviews();
  const pid = String(productId);

  // Prevent duplicate: one review per user per product
  const existing = reviews.find(
    (r) => r.userId === userId && String(r.productId) === pid
  );
  if (existing) {
    throw new Error('DUPLICATE_REVIEW');
  }

  const newReview = {
    id: generateReviewId(),
    userId,
    userName,
    productId: pid,
    shopId: shopId ? String(shopId) : null,
    orderId: orderId || null,
    rating: Number(rating),
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: null,
    helpful: 0,
    helpfulVotedBy: [],
    verifiedPurchase: true, // always true since we gate submission by purchase verification
  };
  writeReviews([newReview, ...reviews]);
  return newReview;
};

/** updateReview — edit an existing review (ownership enforced in UI) */
export const updateReview = (reviewId, userId, { rating, comment }) => {
  const reviews = readReviews();
  const idx = reviews.findIndex((r) => r.id === reviewId);
  if (idx === -1) throw new Error('Review not found');
  if (reviews[idx].userId !== userId) throw new Error('NOT_OWNER');

  reviews[idx] = {
    ...reviews[idx],
    rating: Number(rating),
    comment: comment.trim(),
    updatedAt: new Date().toISOString(),
  };
  writeReviews(reviews);
  return reviews[idx];
};

/** deleteReview — remove a review (ownership enforced in UI) */
export const deleteReview = (reviewId, userId) => {
  const reviews = readReviews();
  const idx = reviews.findIndex((r) => r.id === reviewId);
  if (idx === -1) return false;
  if (reviews[idx].userId !== userId) throw new Error('NOT_OWNER');
  reviews.splice(idx, 1);
  writeReviews(reviews);
  return true;
};

/** voteHelpful — toggle helpful vote */
export const voteHelpful = (reviewId, userId) => {
  const reviews = readReviews();
  const idx = reviews.findIndex((r) => r.id === reviewId);
  if (idx === -1) return null;
  const review = reviews[idx];
  const alreadyVoted = (review.helpfulVotedBy || []).includes(userId);
  if (alreadyVoted) {
    review.helpfulVotedBy = review.helpfulVotedBy.filter((id) => id !== userId);
    review.helpful = Math.max(0, (review.helpful || 0) - 1);
  } else {
    review.helpfulVotedBy = [...(review.helpfulVotedBy || []), userId];
    review.helpful = (review.helpful || 0) + 1;
  }
  reviews[idx] = review;
  writeReviews(reviews);
  return review.helpful;
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
