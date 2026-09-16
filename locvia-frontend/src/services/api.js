// src/services/api.js
// Backward-compatibility bridge.
// Points to the centralized Axios client in src/services/api/axiosClient.js.

import axiosClient from './api/axiosClient';

export * from './api/axiosClient';
export default axiosClient;
