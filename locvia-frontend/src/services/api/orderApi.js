// src/services/api/orderApi.js
// Order Placement & Lifecycle API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

/**
 * Places a new order from customer's shopping cart.
 * @param {Object} payload
 * @param {number|string} payload.addressId
 * @returns {Promise<Object>} Created order
 */
export const createOrder = async (payload) => {
  return axiosClient.post(ENDPOINTS.ORDERS.BASE, payload);
};

/**
 * Retrieves all orders belonging to the authenticated customer.
 * @returns {Promise<Array<Object>>}
 */
export const getMyOrders = async () => {
  return axiosClient.get(ENDPOINTS.ORDERS.CUSTOMER_ORDERS);
};

/**
 * Retrieves details of a specific order by ID.
 * @param {string|number} id
 * @returns {Promise<Object>}
 */
export const getOrderById = async (id) => {
  return axiosClient.get(ENDPOINTS.ORDERS.DETAIL(id));
};

/**
 * Requests cancellation of an order (restores inventory).
 * @param {string|number} id
 * @returns {Promise<Object>} Updated order
 */
export const cancelOrder = async (id) => {
  return axiosClient.patch(ENDPOINTS.ORDERS.CANCEL(id));
};

/**
 * Retrieves delivery tracking details for a customer order.
 * @param {string|number} orderId
 * @returns {Promise<Object>}
 */
export const getOrderDelivery = async (orderId) => {
  return axiosClient.get(ENDPOINTS.ORDERS.DELIVERY(orderId));
};

/**
 * Retrieves payment details for a customer order.
 * @param {string|number} orderId
 * @returns {Promise<Object>}
 */
export const getOrderPayment = async (orderId) => {
  return axiosClient.get(ENDPOINTS.ORDERS.PAYMENT(orderId));
};

/**
 * Retrieves orders for a specific shop.
 * @param {string|number} shopId
 * @returns {Promise<Array<Object>>}
 */
export const getShopOrders = async (shopId) => {
  return axiosClient.get(ENDPOINTS.ADMIN.ORDERS, { params: { shopId } });
};

/**
 * Updates order status.
 * @param {string|number} orderId
 * @param {string} newStatus
 * @returns {Promise<Object>}
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  return axiosClient.patch(ENDPOINTS.ADMIN.ORDER_STATUS(orderId), { status: newStatus });
};

export default {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getOrderDelivery,
  getOrderPayment,
  getShopOrders,
  updateOrderStatus,
};


