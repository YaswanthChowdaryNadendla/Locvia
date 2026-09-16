// src/services/adminOrderService.js
// Service layer for Admin Order Management (Module 33)
// Reads master orders without any mock/demo data seeding.

import { getLocalOrders } from './orderService';
import { getAllUsers } from './adminUserService';
import * as adminApi from './api/adminApi';

/**
 * Formats currency amount to INR (e.g. ₹649, ₹1,250)
 */
export const formatINR = (amount = 0) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Formats ISO timestamp to human readable date string
 */
export const formatOrderDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'N/A';
  }
};

/**
 * Normalizes and retrieves all master orders (starts empty if no orders placed).
 */
export const getAllOrders = () => {
  const rawOrders = getLocalOrders();
  const allUsers = getAllUsers();

  return rawOrders.map((o) => {
    const customerUser = allUsers.find((u) => u.id === o.userId) || null;
    const customerName = o.address?.fullName || customerUser?.name || 'Customer';
    const customerEmail = customerUser?.email || 'N/A';
    const customerPhone = o.address?.phone || customerUser?.phone || 'N/A';

    const items = (o.items || []).map((item) => ({
      id: item.id || item.productId || Math.random(),
      productId: item.productId || item.id,
      name: item.name || 'Product Item',
      price: typeof item.price === 'number' ? item.price : 0,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
      image: item.image || null,
      shopId: item.shopId || null,
      shopName: item.shopName || null,
    }));

    const finalTotal =
      o.pricing?.finalTotal !== undefined
        ? o.pricing.finalTotal
        : typeof o.totalAmount === 'number'
        ? o.totalAmount
        : items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return {
      ...o,
      customerName,
      customerEmail,
      customerPhone,
      items,
      finalTotal,
      orderStatus: o.orderStatus || o.status || 'PLACED',
      createdAt: o.createdAt || new Date().toISOString(),
    };
  });
};

/**
 * Retrieves details for a specific order by ID
 */
export const getOrderDetails = (orderId) => {
  const all = getAllOrders();
  const cleanId = String(orderId || '').trim().toLowerCase();
  return (
    all.find(
      (o) =>
        String(o.id).toLowerCase() === cleanId ||
        String(o.orderId).toLowerCase() === cleanId
    ) || null
  );
};

/**
 * Calculates admin overview metrics for orders
 */
export const calculateOrderStats = (orders = []) => {
  const total = orders.length;
  const placed = orders.filter((o) => (o.orderStatus || '').toUpperCase() === 'PLACED').length;
  const preparing = orders.filter((o) => (o.orderStatus || '').toUpperCase() === 'PREPARING').length;
  const delivered = orders.filter((o) => (o.orderStatus || '').toUpperCase() === 'DELIVERED').length;
  const cancelled = orders.filter((o) => (o.orderStatus || '').toUpperCase() === 'CANCELLED').length;

  const totalGMV = orders
    .filter((o) => (o.orderStatus || '').toUpperCase() !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.finalTotal || 0), 0);

  return {
    total,
    placed,
    preparing,
    delivered,
    cancelled,
    totalGMV,
  };
};

/**
 * Fetches all orders from Spring Boot admin endpoint.
 * GET /api/admin/orders
 */
export const fetchAllOrders = async (params = {}) => {
  try {
    const orders = await adminApi.getOrders(params);
    return Array.isArray(orders) ? orders : [];
  } catch (err) {
    console.error('Error fetching admin orders from API:', err);
    return getAllOrders();
  }
};

/**
 * Updates order status via Spring Boot admin endpoint.
 * PATCH /api/admin/orders/{id}/status
 */
export const updateOrderStatusApi = async (orderId, status) => {
  return adminApi.updateOrderStatus(orderId, status);
};

