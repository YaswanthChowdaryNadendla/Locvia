// src/utils/errorHandler.js
// Centralized, safe error classification and sanitization utility for Locvia.
// Guarantees no sensitive data, credentials, stack traces, or technical jargon are exposed.

/**
 * Sanitizes and classifies any error into a safe, human-readable user message.
 *
 * @param {Error|Object|string} error - The caught error
 * @param {string} [fallback] - Optional custom fallback message
 * @returns {string} Clean, friendly user-facing message
 */
export const getFriendlyErrorMessage = (
  error,
  fallback = 'Something went wrong. Please try again.'
) => {
  // 1. Connection / Offline state check
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'You appear to be offline. Please check your internet connection and try again.';
  }

  if (!error) return fallback;

  // Extract raw string message
  const rawMsg = typeof error === 'string'
    ? error
    : error.message || error.statusText || '';

  // 2. Sensitive keywords filter - never expose backend secrets, tokens, or stack traces
  const SENSITIVE_PATTERNS = [
    /token/i,
    /secret/i,
    /password/i,
    /key/i,
    /credential/i,
    /cloudinary/i,
    /bearer/i,
    /jwt/i,
    /authorization/i,
    /database/i,
    /sql/i,
    /stack\s*trace/i,
    /at\s+\w+\s+\(/i, // stack trace lines like "at Component ("
    /node_modules/i,
    /webpack/i,
    /vite/i,
  ];

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(rawMsg)) {
      return fallback;
    }
  }

  // 3. Technical JS errors / unhandled exceptions
  if (
    rawMsg.includes('TypeError') ||
    rawMsg.includes('AxiosError') ||
    rawMsg.includes('ReferenceError') ||
    rawMsg.includes('SyntaxError') ||
    rawMsg.includes('Cannot read properties of undefined') ||
    rawMsg.includes('Cannot read properties of null') ||
    rawMsg.includes('is not a function') ||
    rawMsg.includes('undefined is not an object')
  ) {
    return 'An unexpected issue occurred. Please refresh the page or try again.';
  }

  // 4. HTTP Status Code Checks
  const status = error?.response?.status || error?.status;
  if (status === 401) {
    return 'Your session has expired. Please log in again to continue.';
  }
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (status === 404) {
    return 'The requested resource was not found or is no longer available.';
  }
  if (status >= 500 && status < 600) {
    return 'Our server encountered an issue. Please try again in a moment.';
  }

  // 5. Network / Timeout errors
  if (
    rawMsg.includes('Network Error') ||
    rawMsg.includes('Failed to fetch') ||
    rawMsg.includes('ERR_CONNECTION') ||
    rawMsg.includes('timeout') ||
    rawMsg.includes('ECONNABORTED')
  ) {
    return 'Network connection issue. Please check your connection and try again.';
  }

  // 6. Safe explicit messages (whitelist short, safe domain messages)
  if (
    rawMsg &&
    rawMsg.length <= 150 &&
    !/[{}[\]\\]/.test(rawMsg) &&
    !rawMsg.includes('http://') &&
    !rawMsg.includes('https://')
  ) {
    return rawMsg;
  }

  return fallback;
};

export default getFriendlyErrorMessage;
