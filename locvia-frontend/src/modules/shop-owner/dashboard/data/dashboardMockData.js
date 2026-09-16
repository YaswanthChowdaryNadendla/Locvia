// src/modules/shop-owner/dashboard/data/dashboardMockData.js
// Empty exports maintained for compatibility. Real data comes from backend APIs.

export const INITIAL_SHOP_DATA = null;

export const DASHBOARD_STATS = {
  todayOrders: { count: 0, trend: '', isPositive: true },
  todayRevenue: { amount: 0, formatted: '₹0', trend: '', isPositive: true },
  activeProducts: { count: 0, label: 'In Stock & Active' },
  pendingOrders: { count: 0, label: 'Needs Attention', isUrgent: false },
};

export const RECENT_ORDERS = [];
export const ORDER_STATUS_SUMMARY = [];
export const REVENUE_SERIES = { '7d': [], '30d': [], '3m': [] };
export const LOW_STOCK_ITEMS = [];
export const TOP_SELLING_PRODUCTS = [];
export const RECENT_ACTIVITY_LOGS = [];
