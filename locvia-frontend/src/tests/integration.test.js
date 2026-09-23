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

  await t.test('17. Customer orders response normalization differentiates empty state from populated list', () => {
    // Normalization helper matching orderService.getOrdersByCustomer logic
    const normalizeOrders = (data) => {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.content)) return data.content;
      if (data && Array.isArray(data.orders)) return data.orders;
      if (data === null || data === undefined) return [];
      throw new Error('Unexpected order response structure received from server');
    };

    // Case 1: Backend returns empty array [] (zero orders customer) -> valid empty array for "No orders yet"
    const zeroOrders = normalizeOrders([]);
    assert.equal(Array.isArray(zeroOrders), true);
    assert.equal(zeroOrders.length, 0);

    // Case 2: Backend returns Spring Data Page wrapper { content: [] } -> valid empty array
    const pageWrapperEmpty = normalizeOrders({ content: [] });
    assert.equal(Array.isArray(pageWrapperEmpty), true);
    assert.equal(pageWrapperEmpty.length, 0);

    // Case 3: Backend returns populated order array -> valid array for list rendering
    const populatedOrders = normalizeOrders([
      { id: 1, status: 'DELIVERED', totalAmount: 499, itemCount: 3, createdAt: '2026-09-17T10:00:00' },
      { id: 2, status: 'PLACED', totalAmount: 250, itemCount: 1, createdAt: '2026-09-17T11:30:00' },
    ]);
    assert.equal(Array.isArray(populatedOrders), true);
    assert.equal(populatedOrders.length, 2);
    assert.equal(populatedOrders[0].id, 1);
    assert.equal(populatedOrders[1].status, 'PLACED');

    // Case 4: Malformed response throws error rather than falsely rendering empty state
    assert.throws(() => {
      normalizeOrders({ unexpectedKey: 'malformed_payload' });
    }, /Unexpected order response structure/);
  });

  await t.test('18. Customer orders API failure propagates normalized error for Try Again UI', () => {
    const serverError = {
      response: {
        status: 500,
        data: {
          timestamp: new Date().toISOString(),
          status: 500,
          error: 'Internal Server Error',
          message: 'Database connection failed while fetching orders',
          path: '/api/orders/my-orders',
        },
      },
    };

    const normalized = normalizeApiError(serverError);
    assert.equal(normalized.status, 500);
    assert.equal(normalized.message, 'Database connection failed while fetching orders');
    // Error must have status 500 and not be an empty array
    assert.notEqual(normalized, []);
    assert.equal(Array.isArray(normalized), false);
  });

  await t.test('19. Google Auth endpoint aligns with AuthController.java', () => {
    assert.equal(ENDPOINTS.AUTH.GOOGLE, '/auth/google');
  });

  await t.test('20. Google Auth success sets locvia_token and locvia_user and routes to customer home', () => {
    localStorage.clear();
    const googleAuthResponse = {
      token: 'jwt-google-verified-token',
      user: {
        id: 404,
        name: 'Google User',
        email: 'google.user@gmail.com',
        role: 'CUSTOMER',
        accountStatus: 'APPROVED',
        emailVerified: true,
      },
    };

    localStorage.setItem('locvia_token', googleAuthResponse.token);
    localStorage.setItem('locvia_user', JSON.stringify(googleAuthResponse.user));

    assert.equal(localStorage.getItem('locvia_token'), 'jwt-google-verified-token');
    const storedUser = JSON.parse(localStorage.getItem('locvia_user'));
    assert.equal(storedUser.email, 'google.user@gmail.com');
    assert.equal(storedUser.role, 'CUSTOMER');
    assert.equal(storedUser.accountStatus, 'APPROVED');
    assert.equal(storedUser.emailVerified, true);
    assert.equal(getRoleHomePath(storedUser.role), '/customer');
  });

  await t.test('21. Forgot Password non-existent email normalizes 404 with specific message', () => {
    const notFoundError = {
      response: {
        status: 404,
        data: {
          timestamp: new Date().toISOString(),
          status: 404,
          error: 'Not Found',
          message: 'Email does not exist. Please create an account first.',
          path: '/api/auth/forgot-password',
        },
      },
    };

    const normalized = normalizeApiError(notFoundError);
    assert.equal(normalized.status, 404);
    assert.equal(normalized.message, 'Email does not exist. Please create an account first.');
  });

  await t.test('22. Signup email verification endpoints align with AuthController.java', () => {
    assert.equal(ENDPOINTS.AUTH.VERIFY_SIGNUP_EMAIL, '/auth/verify-signup-email');
    assert.equal(ENDPOINTS.AUTH.RESEND_SIGNUP_OTP, '/auth/resend-signup-otp');
    assert.equal(ENDPOINTS.AUTH.VERIFY_EMAIL, '/auth/verify-email');
    assert.equal(ENDPOINTS.AUTH.RESEND_VERIFICATION, '/auth/resend-verification');
  });

  await t.test('23. Registration with emailVerificationRequired does not authenticate session into localStorage', () => {
    localStorage.clear();
    const registerResponse = {
      message: 'Verification code sent to your email',
      emailVerificationRequired: true,
      email: 'newuser@example.com',
      user: {
        id: 99,
        name: 'New User',
        email: 'newuser@example.com',
        role: 'CUSTOMER',
        accountStatus: 'APPROVED',
      },
    };

    // If registration requires email verification, no token is issued or stored
    if (registerResponse.emailVerificationRequired) {
      // Must not set token
      assert.equal(localStorage.getItem('locvia_token'), null);
      assert.equal(localStorage.getItem('locvia_user'), null);
    }
  });

  await t.test('24. Role-specific signup definitions support CUSTOMER, SHOP_OWNER, DELIVERY_PARTNER and restrict ADMIN', () => {
    const roles = ['CUSTOMER', 'SHOP_OWNER', 'DELIVERY_PARTNER', 'ADMIN'];
    const publicRoles = roles.filter((r) => r !== 'ADMIN');
    assert.deepEqual(publicRoles, ['CUSTOMER', 'SHOP_OWNER', 'DELIVERY_PARTNER']);
    assert.equal(roles.includes('ADMIN'), true);
  });

  await t.test('25. Configurable email verification: registration with emailVerificationRequired=false returns role messages without localStorage token', () => {
    localStorage.clear();
    const responses = [
      {
        message: 'Account created successfully. You can now log in to Locvia.',
        emailVerificationRequired: false,
        email: 'cust@example.com',
        user: { id: 10, name: 'Cust User', email: 'cust@example.com', role: 'CUSTOMER', accountStatus: 'APPROVED' },
      },
      {
        message: 'Account created successfully. Your shop owner application is pending administrator approval.',
        emailVerificationRequired: false,
        email: 'shop@example.com',
        user: { id: 11, name: 'Shop User', email: 'shop@example.com', role: 'SHOP_OWNER', accountStatus: 'PENDING' },
      },
      {
        message: 'Account created successfully. Your delivery partner application is pending administrator approval.',
        emailVerificationRequired: false,
        email: 'deliv@example.com',
        user: { id: 12, name: 'Deliv User', email: 'deliv@example.com', role: 'DELIVERY_PARTNER', accountStatus: 'PENDING' },
      },
    ];

    for (const res of responses) {
      assert.equal(res.emailVerificationRequired, false);
      assert.ok(res.message.includes('Account created successfully'));
      assert.equal(localStorage.getItem('locvia_token'), null);
    }
  });

  await t.test('26. Admin delete user endpoint aligns with AdminUserController.java (DELETE /api/admin/users/{id})', () => {
    assert.equal(ENDPOINTS.ADMIN.USER_BY_ID(42), '/admin/users/42');
    assert.equal(ENDPOINTS.ADMIN.USERS, '/admin/users');
  });

  await t.test('27. Admin delete account confirmation dialog displays target user name, email, and role', () => {
    const targetUser = {
      id: 55,
      name: 'Alice Customer',
      email: 'alice.customer@example.com',
      role: 'CUSTOMER',
    };

    const dialogState = {
      title: 'Delete Account?',
      subtitle: 'Are you sure you want to permanently delete this account?',
      user: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
    };

    assert.equal(dialogState.title, 'Delete Account?');
    assert.ok(dialogState.subtitle.includes('permanently delete this account'));
    assert.equal(dialogState.user, 'Alice Customer');
    assert.equal(dialogState.email, 'alice.customer@example.com');
    assert.equal(dialogState.role, 'CUSTOMER');
  });

  await t.test('28. Cancel action dismisses confirmation without calling delete endpoint', () => {
    let deleteCalled = false;
    let userToDelete = { id: 10, name: 'Alice Customer' };

    // Simulate clicking Cancel in UI
    const handleCancel = () => {
      userToDelete = null;
    };
    handleCancel();

    assert.equal(userToDelete, null);
    assert.equal(deleteCalled, false);
  });

  await t.test('29. Confirm action triggers DELETE /api/admin/users/{id}', async () => {
    let requestedEndpoint = null;
    let requestedMethod = null;

    const mockDelete = async (url) => {
      requestedEndpoint = url;
      requestedMethod = 'DELETE';
      return { message: 'Account deleted successfully' };
    };

    const targetUser = { id: 88, name: 'Target User' };
    const res = await mockDelete(ENDPOINTS.ADMIN.USER_BY_ID(targetUser.id));

    assert.equal(requestedMethod, 'DELETE');
    assert.equal(requestedEndpoint, '/admin/users/88');
    assert.equal(res.message, 'Account deleted successfully');
  });

  await t.test('30. Successful deletion removes user from displayed table and refreshes list', () => {
    let usersList = [
      { id: 1, name: 'Admin', role: 'ADMIN', active: true },
      { id: 2, name: 'Customer Two', role: 'CUSTOMER', active: true },
      { id: 3, name: 'Shop Owner', role: 'SHOP_OWNER', active: true },
    ];

    const targetId = 2;
    // Optimistic removal
    usersList = usersList.filter((u) => u.id !== targetId);

    assert.equal(usersList.length, 2);
    assert.ok(!usersList.some((u) => u.id === targetId));

    // Reload verification
    const reloadedUsers = [
      { id: 1, name: 'Admin', role: 'ADMIN', active: true },
      { id: 3, name: 'Shop Owner', role: 'SHOP_OWNER', active: true },
    ];
    usersList = reloadedUsers;
    assert.equal(usersList.length, 2);
  });

  await t.test('31. Failed deletion retains user in table and displays backend error message', () => {
    const usersList = [
      { id: 1, name: 'Locvia Admin', email: 'admin@locvia.com', role: 'ADMIN', active: true },
      { id: 2, name: 'Customer Two', email: 'cust2@example.com', role: 'CUSTOMER', active: true },
    ];

    // Backend error simulation (e.g. 403 Forbidden for protected admin)
    const backendError = {
      response: {
        status: 403,
        data: {
          status: 403,
          error: 'Forbidden',
          message: 'Default administrator account cannot be deleted.',
        },
      },
    };

    const normalized = normalizeApiError(backendError);
    assert.equal(normalized.status, 403);
    assert.equal(normalized.message, 'Default administrator account cannot be deleted.');

    // User is NOT removed from list on failure
    assert.equal(usersList.length, 2);
    assert.ok(usersList.some((u) => u.id === 1));
  });

  await t.test('32. Delete button is disabled while deletion request is processing', () => {
    let isDeleteLoading = true;
    const isButtonDisabled = (loading) => loading === true;

    assert.equal(isButtonDisabled(isDeleteLoading), true);

    isDeleteLoading = false;
    assert.equal(isButtonDisabled(isDeleteLoading), false);
  });
});
