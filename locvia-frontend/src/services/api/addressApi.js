// src/services/api/addressApi.js
// Customer Delivery Addresses API service for Spring Boot backend integration.

import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

/**
 * Fetches all saved delivery addresses for the authenticated user.
 * @returns {Promise<Array<Object>>}
 */
export const getAddresses = async () => {
  return axiosClient.get(ENDPOINTS.ADDRESSES.BASE);
};

/**
 * Fetches single address by ID.
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const getAddressById = async (id) => {
  return axiosClient.get(ENDPOINTS.ADDRESSES.DETAIL(id));
};

/**
 * Saves a new delivery address.
 * @param {Object} addressData
 * @param {string} addressData.fullName
 * @param {string} addressData.phone
 * @param {string} addressData.addressLine1
 * @param {string} [addressData.addressLine2]
 * @param {string} addressData.city
 * @param {string} addressData.state
 * @param {string} addressData.pincode
 * @param {string} [addressData.type] - 'Home', 'Work', 'Other'
 * @param {boolean} [addressData.isDefault]
 * @returns {Promise<Object>} Created address
 */
export const createAddress = async (addressData) => {
  return axiosClient.post(ENDPOINTS.ADDRESSES.BASE, addressData);
};

/**
 * Updates an existing delivery address.
 * @param {number|string} id
 * @param {Object} addressData
 * @returns {Promise<Object>} Updated address
 */
export const updateAddress = async (id, addressData) => {
  return axiosClient.put(ENDPOINTS.ADDRESSES.DETAIL(id), addressData);
};

/**
 * Deletes an address by ID.
 * @param {number|string} id
 * @returns {Promise<{ success: boolean }>}
 */
export const deleteAddress = async (id) => {
  return axiosClient.delete(ENDPOINTS.ADDRESSES.DETAIL(id));
};

/**
 * Sets an address as the user's primary default address.
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const setDefaultAddress = async (id) => {
  return axiosClient.put(ENDPOINTS.ADDRESSES.SET_DEFAULT(id));
};

export default {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
