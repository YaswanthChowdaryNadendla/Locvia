// src/services/api/endpoints.js
// Centralized Spring Boot REST API Endpoint definitions for Locvia

export const ENDPOINTS = {
  // Authentication & Session (AuthController.java)
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    GOOGLE: '/auth/google',
    ME: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    VERIFY_SIGNUP_EMAIL: '/auth/verify-signup-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    RESEND_SIGNUP_OTP: '/auth/resend-signup-otp',
    // Password reset flow (3-step, public)
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_OTP: '/auth/verify-reset-otp',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // User Profile (UserController.java)
  USERS: {
    ME: '/users/me',
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/me',
    CHANGE_PASSWORD: '/users/change-password',
    BY_ID: (id) => `/users/${id}`,
  },

  // Shops & Discovery (ShopController.java)
  SHOPS: {
    BASE: '/shops',
    DETAIL: (id) => `/shops/${id}`,
    MY: '/shops/my',
    MY_BY_ID: (id) => `/shops/my/${id}`,
    UPDATE: (id) => `/shops/${id}`,
    MY_SHOP: '/shops/my',
    UPDATE_MY_SHOP: (id) => `/shops/${id}`,
  },

  // Product Categories (CategoryController.java)
  CATEGORIES: {
    BASE: '/categories',
    DETAIL: (id) => `/categories/${id}`,
  },

  // Product Catalog (ProductController.java & ShopProductController.java)
  PRODUCTS: {
    BASE: '/products',
    DETAIL: (id) => `/products/${id}`,
    MANAGE: (id) => `/products/${id}/manage`,
    BY_SHOP: (shopId) => `/shops/${shopId}/products`,
    CREATE_FOR_SHOP: (shopId) => `/shops/${shopId}/products`,
    IMAGE: (id) => `/products/${id}/image`,
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },

  // Inventory Management (InventoryController.java & ShopInventoryController.java)
  INVENTORY: {
    BY_PRODUCT: (productId) => `/products/${productId}/inventory`,
    MANAGE: (productId) => `/products/${productId}/inventory/manage`,
    QUANTITY: (productId) => `/products/${productId}/inventory/quantity`,
    BY_SHOP: (shopId) => `/shops/${shopId}/inventory`,
    SHOP_LOW_STOCK: (shopId) => `/shops/${shopId}/inventory/low-stock`,
    SHOP_OUT_OF_STOCK: (shopId) => `/shops/${shopId}/inventory/out-of-stock`,
  },

  // Shopping Cart (CartController.java)
  CART: {
    BASE: '/cart',
    ITEMS: '/cart/items',
    ITEM_BY_ID: (itemId) => `/cart/items/${itemId}`,
    CLEAR: '/cart/clear',
  },

  // Customer Delivery Addresses (AddressController.java)
  ADDRESSES: {
    BASE: '/addresses',
    DETAIL: (id) => `/addresses/${id}`,
    SET_DEFAULT: (id) => `/addresses/${id}/default`,
  },

  // Orders & Lifecycle (OrderController.java)
  ORDERS: {
    BASE: '/orders',
    DETAIL: (id) => `/orders/${id}`,
    CUSTOMER_ORDERS: '/orders/my-orders',
    CANCEL: (id) => `/orders/${id}/cancel`,
    DELIVERY: (orderId) => `/orders/${orderId}/delivery`,
    PAYMENT: (orderId) => `/orders/${orderId}/payment`,
  },

  // Delivery Partner Operations (DeliveryController.java)
  DELIVERY: {
    REQUESTS: '/delivery/requests',
    ACTIVE: '/delivery/active',
    COMPLETED: '/delivery/completed',
    DETAIL: (id) => `/delivery/${id}`,
    UPDATE_STATUS: (id) => `/delivery/${id}/status`,
  },

  // Payment Gateway & Transactions (PaymentController.java)
  PAYMENTS: {
    BASE: '/payments',
    DETAIL: (id) => `/payments/${id}`,
    RAZORPAY_ORDER: '/payments/razorpay/order',
    RAZORPAY_VERIFY: '/payments/razorpay/verify',
    RAZORPAY_WEBHOOK: '/payments/razorpay/webhook',
  },

  // Platform Administration (Admin Controllers)
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    METRICS: '/admin/metrics',
    USERS: '/admin/users',
    USER_BY_ID: (id) => `/admin/users/${id}`,
    APPROVE_USER: (id) => `/admin/users/${id}/approve`,
    REJECT_USER: (id) => `/admin/users/${id}/reject`,
    SHOPS: '/admin/shops',
    SHOP_BY_ID: (id) => `/admin/shops/${id}`,
    CATEGORIES: '/admin/categories',
    CATEGORY_BY_ID: (id) => `/admin/categories/${id}`,
    PRODUCTS: '/admin/products',
    PRODUCT_BY_ID: (id) => `/admin/products/${id}`,
    INVENTORY: '/admin/inventory',
    INVENTORY_LOW_STOCK: '/admin/inventory/low-stock',
    INVENTORY_OUT_OF_STOCK: '/admin/inventory/out-of-stock',
    ORDERS: '/admin/orders',
    ORDER_BY_ID: (id) => `/admin/orders/${id}`,
    ORDER_STATUS: (id) => `/admin/orders/${id}/status`,
    DELIVERIES: '/admin/deliveries',
    DELIVERY_BY_ID: (id) => `/admin/deliveries/${id}`,
    PAYMENTS: '/admin/payments',
    PAYMENT_BY_ID: (id) => `/admin/payments/${id}`,
    REVIEWS: '/admin/reviews',
    REVIEW_BY_ID: (id) => `/admin/reviews/${id}`,
  },
};

export default ENDPOINTS;
