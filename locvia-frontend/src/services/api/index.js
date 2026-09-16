// src/services/api/index.js
// Central export hub for all Locvia API services and Axios client.

export { default as axiosClient, API_BASE_URL, isApiEnabled } from './axiosClient';
export { ENDPOINTS } from './endpoints';
export {
  normalizeApiError,
  getErrorMessage,
  isAuthError,
  isNotFoundError,
} from './errorHandler';

export * as authApi from './authApi';
export * as userApi from './userApi';
export * as shopApi from './shopApi';
export * as categoryApi from './categoryApi';
export * as productApi from './productApi';
export * as cartApi from './cartApi';
export * as addressApi from './addressApi';
export * as orderApi from './orderApi';
export * as deliveryApi from './deliveryApi';
export * as paymentApi from './paymentApi';
export * as reviewApi from './reviewApi';
export * as notificationApi from './notificationApi';
export * as adminApi from './adminApi';
