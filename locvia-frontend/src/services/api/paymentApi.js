// src/services/api/paymentApi.js
// Payment Gateway (Mock/Razorpay) API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

/**
 * Creates a mock payment transaction for an order.
 * POST /api/payments { orderId, paymentMethod }
 * @param {Object} payload
 * @param {number|string} payload.orderId
 * @param {string} [payload.paymentMethod='MOCK']
 * @returns {Promise<Object>} Created PaymentResponse
 */
export const createPayment = async ({ orderId, paymentMethod = 'MOCK' }) => {
  return axiosClient.post(ENDPOINTS.PAYMENTS.BASE, {
    orderId: Number(orderId),
    paymentMethod,
  });
};

/**
 * Initializes a Razorpay order on the backend for a given order ID.
 * POST /api/payments/razorpay/order { orderId }
 * @param {Object} payload
 * @param {number|string} payload.orderId
 * @returns {Promise<Object>} Razorpay order payload
 */
export const createRazorpayOrder = async ({ orderId }) => {
  return axiosClient.post(ENDPOINTS.PAYMENTS.RAZORPAY_ORDER, {
    orderId: Number(orderId),
  });
};

/**
 * Verifies Razorpay signature on the backend.
 * POST /api/payments/razorpay/verify
 * @param {Object} verificationData
 * @param {number|string} verificationData.orderId
 * @param {string} verificationData.razorpayOrderId
 * @param {string} verificationData.razorpayPaymentId
 * @param {string} verificationData.razorpaySignature
 * @returns {Promise<Object>} PaymentResponse
 */
export const verifyRazorpayPayment = async (verificationData) => {
  return axiosClient.post(ENDPOINTS.PAYMENTS.RAZORPAY_VERIFY, {
    ...verificationData,
    orderId: Number(verificationData.orderId),
  });
};

/**
 * Retrieves payment history for the authenticated customer.
 * GET /api/payments
 * @returns {Promise<Array<Object>>}
 */
export const getMyPayments = async () => {
  return axiosClient.get(ENDPOINTS.PAYMENTS.BASE);
};

export default {
  createPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyPayments,
};

