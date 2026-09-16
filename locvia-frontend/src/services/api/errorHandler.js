// src/services/api/errorHandler.js
// Standardized API error handler for Locvia frontend.
// Normalizes Spring Boot exceptions, validation errors, and network failures.

/**
 * Standardized API Error Object structure
 * @typedef {Object} ApiError
 * @property {string} message - User-facing error message
 * @property {number|null} status - HTTP status code (400, 401, 404, 500, etc.)
 * @property {Array<string>|Object|null} errors - Field-level validation errors if present
 * @property {boolean} isNetworkError - True if request failed due to connectivity or backend offline
 * @property {any} raw - Original error object for debugging
 */

/**
 * Normalizes an Axios error or generic error into a consistent ApiError object.
 * Compatible with Spring Boot standard ProblemDetail / DefaultErrorAttributes formats:
 * { timestamp, status, error, message, path, errors: [ ... ] }
 *
 * @param {any} error
 * @returns {ApiError}
 */
export const normalizeApiError = (error) => {
  // If already normalized
  if (error && error.__isApiError) {
    return error;
  }

  // Case 1: Server responded with an HTTP status code outside 2xx
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;

    let message = 'An unexpected server error occurred. Please try again.';
    let validationErrors = null;

    if (typeof data === 'string' && data.trim()) {
      message = data;
    } else if (data && typeof data === 'object') {
      // Spring Boot standard error structures
      if (data.message) {
        message = data.message;
      } else if (data.error) {
        message = data.error;
      } else if (data.detail) {
        // RFC 7807 Problem Details for HTTP APIs
        message = data.detail;
      }

      // Extract field-level validation errors (Spring validation)
      if (Array.isArray(data.errors)) {
        validationErrors = data.errors.map((e) =>
          typeof e === 'string' ? e : e.defaultMessage || e.message || JSON.stringify(e)
        );
      } else if (data.errors && typeof data.errors === 'object') {
        validationErrors = data.errors;
      }
    }

    // Default status-specific messages if none provided
    if (!data?.message && !data?.detail) {
      switch (status) {
        case 400:
          message = message || 'Invalid request. Please verify your input.';
          break;
        case 401:
          message = 'Authentication required or session expired. Please sign in again.';
          break;
        case 403:
          message = 'You do not have permission to perform this action.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 409:
          message = message || 'A conflict occurred with the existing data.';
          break;
        case 422:
          message = 'Validation failed. Please check the submitted fields.';
          break;
        case 500:
          message = 'Internal server error. Our team has been notified.';
          break;
        case 502:
        case 503:
        case 504:
          message = 'Service is temporarily unavailable. Please try again shortly.';
          break;
        default:
          break;
      }
    }

    return {
      __isApiError: true,
      message,
      status,
      errors: validationErrors,
      isNetworkError: false,
      raw: error,
    };
  }

  // Case 2: Request was made but no response was received (Network error, CORS, or backend offline)
  if (error?.request) {
    let message = 'Unable to connect to the server. Please check your connection.';
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = 'The server took too long to respond. Please try again.';
    }

    return {
      __isApiError: true,
      message,
      status: null,
      errors: null,
      isNetworkError: true,
      raw: error,
    };
  }

  // Case 3: Error setting up the request or non-Axios error
  return {
    __isApiError: true,
    message: error?.message || 'An unknown error occurred.',
    status: null,
    errors: null,
    isNetworkError: false,
    raw: error,
  };
};

/**
 * Convenient helper to retrieve only the string message from any error.
 * @param {any} error
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  return normalizeApiError(error).message;
};

/**
 * Check if an error represents a 401 Unauthorized response.
 * @param {any} error
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  return error?.response?.status === 401;
};

/**
 * Check if an error represents a 404 Not Found response.
 * @param {any} error
 * @returns {boolean}
 */
export const isNotFoundError = (error) => {
  return error?.response?.status === 404;
};

export default {
  normalizeApiError,
  getErrorMessage,
  isAuthError,
  isNotFoundError,
};
