// src/services/api/deliveryApi.js
// Delivery Partner Dispatch & Status API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

/**
 * Fetches unassigned or available delivery requests in partner's area.
 * GET /api/delivery/requests
 * @returns {Promise<Array<Object>>}
 */
export const getDeliveryRequests = async () => {
  return axiosClient.get(ENDPOINTS.DELIVERY.REQUESTS);
};

/**
 * Fetches the currently ongoing / active deliveries assigned to the partner.
 * GET /api/delivery/active
 * @returns {Promise<Array<Object>>}
 */
export const getActiveDelivery = async () => {
  return axiosClient.get(ENDPOINTS.DELIVERY.ACTIVE);
};

/**
 * Fetches completed deliveries for the authenticated delivery partner.
 * GET /api/delivery/completed
 * @returns {Promise<Array<Object>>}
 */
export const getCompletedDeliveries = async () => {
  return axiosClient.get(ENDPOINTS.DELIVERY.COMPLETED);
};

/**
 * Fetches details of a specific delivery record by ID.
 * GET /api/delivery/{id}
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const getDeliveryById = async (id) => {
  return axiosClient.get(ENDPOINTS.DELIVERY.DETAIL(id));
};

/**
 * Updates delivery status with state transition validation.
 * PATCH /api/delivery/{id}/status
 * @param {number|string} deliveryId
 * @param {string} status - 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
 * @returns {Promise<Object>} Updated delivery record
 */
export const updateDeliveryStatus = async (deliveryId, status) => {
  return axiosClient.patch(ENDPOINTS.DELIVERY.UPDATE_STATUS(deliveryId), { status });
};

export default {
  getDeliveryRequests,
  getActiveDelivery,
  getCompletedDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
};

