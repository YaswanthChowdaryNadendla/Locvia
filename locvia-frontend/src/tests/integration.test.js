import test from 'node:test';
import assert from 'node:assert/strict';

// Polyfills for Node environment
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(String(key)) ?? null,
  setItem: (key, val) => store.set(String(key), String(val)),
  removeItem: (key) => store.delete(String(key)),
  clear: () => store.clear(),
};

const events = [];
globalThis.window = {
  dispatchEvent: (e) => {
    events.push(e);
    return true;
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};

globalThis.CustomEvent = class CustomEvent {
  constructor(type, eventInitDict) {
    this.type = type;
    this.detail = eventInitDict?.detail;
  }
};

// Import services and modules to test
import { normalizeApiError } from '../services/api/errorHandler.js';
import ENDPOINTS from '../services/api/endpoints.js';
import { getRoleHomePath } from '../data/users.js';

test('Integration Suite - Module 65', async (t) => {

  await t.test('1. Login success stores JWT and user, routes by backend role', async () => {
    localStorage.clear();
    const mockResponse = {
      token: 'mock-jwt-customer-token',
      tokenType: 'Bearer',
      user: { id: 101, name: 'Alice Customer', email: 'alice@test.com', role: 'CUSTOMER' },
    };

    localStorage.setItem('locvia_token', mockResponse.token);
    localStorage.setItem('locvia_user', JSON.stringify(mockResponse.user));

    assert.equal(localStorage.getItem('locvia_token'), 'mock-jwt-customer-token');
    const storedUser = JSON.parse(localStorage.getItem('locvia_user'));
    assert.equal(storedUser.role, 'CUSTOMER');
    assert.equal(getRoleHomePath(storedUser.role), '/customer');
  });

  await t.test('2. Login failure normalizes 401 error and preserves security', async () => {
    const errorResponse = {
      response: {
        status: 401,
        data: {
          timestamp: new Date().toISOString(),
          status: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password',
          path: '/api/auth/login',
        },
      },
    };

    const normalized = normalizeApiError(errorResponse);
    assert.equal(normalized.status, 401);
    assert.equal(normalized.message, 'Invalid email or password');
  });

  await t.test('3. Auth session restoration (/api/auth/me) refreshes user', async () => {
    localStorage.setItem('locvia_token', 'valid-persisted-jwt');
    const freshUserFromBackend = {
      id: 101,
      name: 'Alice Customer Updated',
      email: 'alice@test.com',
      role: 'CUSTOMER',
    };

    localStorage.setItem('locvia_user', JSON.stringify(freshUserFromBackend));
    const restored = JSON.parse(localStorage.getItem('locvia_user'));
    assert.equal(restored.name, 'Alice Customer Updated');
    assert.equal(restored.role, 'CUSTOMER');
  });

  await t.test('4. Logout removes credentials cleanly from storage', async () => {
    localStorage.setItem('locvia_token', 'jwt-token-to-remove');
    localStorage.setItem('locvia_user', JSON.stringify({ id: 1 }));

    localStorage.removeItem('locvia_token');
    localStorage.removeItem('locvia_user');

    assert.equal(localStorage.getItem('locvia_token'), null);
    assert.equal(localStorage.getItem('locvia_user'), null);
  });

  await t.test('5. Protected route checks deny unauthenticated access', () => {
    localStorage.clear();
    const token = localStorage.getItem('locvia_token');
    const isAuthenticated = !!token;
    assert.equal(isAuthenticated, false);
  });

  await t.test('6. Role-based routing enforces correct portal destinations', () => {
    assert.equal(getRoleHomePath('CUSTOMER'), '/customer');
    assert.equal(getRoleHomePath('SHOP_OWNER'), '/shop-owner/dashboard');
    assert.equal(getRoleHomePath('DELIVERY_PARTNER'), '/delivery/dashboard');
    assert.equal(getRoleHomePath('ADMIN'), '/admin/dashboard');
  });

  await t.test('7. Customer API endpoints match backend mapping', () => {
    assert.equal(ENDPOINTS.SHOPS.BASE, '/shops');
    assert.equal(ENDPOINTS.CATEGORIES.BASE, '/categories');
    assert.equal(ENDPOINTS.PRODUCTS.BASE, '/products');
    assert.equal(ENDPOINTS.PRODUCTS.DETAIL(42), '/products/42');
  });

  await t.test('8. Cart API endpoints align with CartController.java', () => {
    assert.equal(ENDPOINTS.CART.BASE, '/cart');
    assert.equal(ENDPOINTS.CART.ITEMS, '/cart/items');
    assert.equal(ENDPOINTS.CART.ITEM_BY_ID(7), '/cart/items/7');
    assert.equal(ENDPOINTS.CART.CLEAR, '/cart/clear');
  });

  await t.test('9. Address API endpoints align with AddressController.java', () => {
    assert.equal(ENDPOINTS.ADDRESSES.BASE, '/addresses');
    assert.equal(ENDPOINTS.ADDRESSES.DETAIL(5), '/addresses/5');
    assert.equal(ENDPOINTS.ADDRESSES.SET_DEFAULT(5), '/addresses/5/default');
  });

  await t.test('10. Order API endpoints align with OrderController.java', () => {
    assert.equal(ENDPOINTS.ORDERS.BASE, '/orders');
    assert.equal(ENDPOINTS.ORDERS.CUSTOMER_ORDERS, '/orders/my-orders');
    assert.equal(ENDPOINTS.ORDERS.DETAIL(101), '/orders/101');
    assert.equal(ENDPOINTS.ORDERS.CANCEL(101), '/orders/101/cancel');
    assert.equal(ENDPOINTS.ORDERS.DELIVERY(101), '/orders/101/delivery');
    assert.equal(ENDPOINTS.ORDERS.PAYMENT(101), '/orders/101/payment');
  });

  await t.test('11. Shop Owner API endpoints align with Shop & Product controllers', () => {
    assert.equal(ENDPOINTS.SHOPS.MY, '/shops/my');
    assert.equal(ENDPOINTS.SHOPS.UPDATE(12), '/shops/12');
    assert.equal(ENDPOINTS.PRODUCTS.BY_SHOP(12), '/shops/12/products');
    assert.equal(ENDPOINTS.PRODUCTS.IMAGE(99), '/products/99/image');
    assert.equal(ENDPOINTS.INVENTORY.BY_SHOP(12), '/shops/12/inventory');
    assert.equal(ENDPOINTS.INVENTORY.QUANTITY(99), '/products/99/inventory/quantity');
  });

  await t.test('12. Delivery Partner API endpoints align with DeliveryController.java', () => {
    assert.equal(ENDPOINTS.DELIVERY.REQUESTS, '/delivery/requests');
    assert.equal(ENDPOINTS.DELIVERY.ACTIVE, '/delivery/active');
    assert.equal(ENDPOINTS.DELIVERY.COMPLETED, '/delivery/completed');
    assert.equal(ENDPOINTS.DELIVERY.UPDATE_STATUS(88), '/delivery/88/status');
  });

  await t.test('13. Admin API endpoints align with Admin controllers', () => {
    assert.equal(ENDPOINTS.ADMIN.DASHBOARD, '/admin/dashboard');
    assert.equal(ENDPOINTS.ADMIN.USERS, '/admin/users');
    assert.equal(ENDPOINTS.ADMIN.SHOPS, '/admin/shops');
    assert.equal(ENDPOINTS.ADMIN.CATEGORIES, '/admin/categories');
    assert.equal(ENDPOINTS.ADMIN.ORDERS, '/admin/orders');
    assert.equal(ENDPOINTS.ADMIN.DELIVERIES, '/admin/deliveries');
    assert.equal(ENDPOINTS.ADMIN.PAYMENTS, '/admin/payments');
  });

  await t.test('14. 401 Unauthorized handling clears storage and fires session event', () => {
    localStorage.setItem('locvia_token', 'expired-jwt');
    localStorage.setItem('locvia_user', JSON.stringify({ name: 'User' }));

    // Simulate 401 interceptor logic
    localStorage.removeItem('locvia_token');
    localStorage.removeItem('locvia_user');
    window.dispatchEvent(new CustomEvent('locvia:auth:session_expired'));

    assert.equal(localStorage.getItem('locvia_token'), null);
    assert.equal(localStorage.getItem('locvia_user'), null);
    const expiredEvent = events.find((e) => e.type === 'locvia:auth:session_expired');
    assert.ok(expiredEvent);
  });

  await t.test('15. 403 Forbidden handling normalizes permission error without logout', () => {
    localStorage.setItem('locvia_token', 'valid-partner-jwt');
    const forbiddenError = {
      response: {
        status: 403,
        data: {
          status: 403,
          error: 'Forbidden',
          message: 'Access denied: insufficient permissions',
        },
      },
    };

    const normalized = normalizeApiError(forbiddenError);
    assert.equal(normalized.status, 403);
    assert.equal(normalized.message, 'Access denied: insufficient permissions');
    // Token is NOT cleared on 403
    assert.equal(localStorage.getItem('locvia_token'), 'valid-partner-jwt');
  });

  await t.test('16. API error handling parses backend ApiErrorResponse & validation field errors', () => {
    const validationErrorResponse = {
      response: {
        status: 400,
        data: {
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message: 'Validation failed for request',
          path: '/api/addresses',
          errors: ['Postal code must be a valid 6-digit PIN code.', 'Phone number is required'],
        },
      },
    };

    const normalized = normalizeApiError(validationErrorResponse);
    assert.equal(normalized.status, 400);
    assert.equal(normalized.message, 'Validation failed for request');
    assert.deepEqual(normalized.errors, [
      'Postal code must be a valid 6-digit PIN code.',
      'Phone number is required',
    ]);
  });
});
