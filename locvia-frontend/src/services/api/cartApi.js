// src/services/api/cartApi.js
// Shopping Cart API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

/**
 * Fetches the user's current shopping cart.
 * @returns {Promise<{ items: Array<Object>, subtotal: number, deliveryFee: number, total: number, coupon?: Object }>}
 */
export const getCart = async () => {
  return axiosClient.get(ENDPOINTS.CART.BASE);
};

/**
 * Adds an item to the shopping cart.
 * @param {Object} payload
 * @param {number|string} payload.productId
 * @param {number} [payload.quantity=1]
 * @returns {Promise<Object>} Updated cart
 */
export const addToCart = async ({ productId, quantity = 1 }) => {
  return axiosClient.post(ENDPOINTS.CART.ITEMS, { productId, quantity });
};

/**
 * Updates an item's quantity in the cart.
 * @param {number|string} itemId
 * @param {number} quantity
 * @returns {Promise<Object>} Updated cart
 */
export const updateCartItem = async (itemId, quantity) => {
  return axiosClient.put(ENDPOINTS.CART.ITEM_BY_ID(itemId), { quantity });
};

/**
 * Removes a specific item from the cart.
 * @param {number|string} itemId
 * @returns {Promise<Object>} Updated cart
 */
export const removeFromCart = async (itemId) => {
  return axiosClient.delete(ENDPOINTS.CART.ITEM_BY_ID(itemId));
};

/**
 * Clears all items from the shopping cart.
 * @returns {Promise<{ success: boolean }>}
 */
export const clearCart = async () => {
  return axiosClient.delete(ENDPOINTS.CART.CLEAR);
};

/**
 * Applies a promotional coupon code to the cart.
 * @param {string} code
 * @returns {Promise<{ coupon: Object, discountAmount: number, newTotal: number }>}
 */
export const applyCoupon = async (code) => {
  return axiosClient.post(ENDPOINTS.CART.APPLY_COUPON, { code });
};

/**
 * Removes the currently applied coupon code.
 * @returns {Promise<Object>} Updated cart
 */
export const removeCoupon = async () => {
  return axiosClient.post(ENDPOINTS.CART.REMOVE_COUPON);
};

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
};
