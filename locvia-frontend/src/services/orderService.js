// src/services/orderService.js
// Dedicated service layer for Orders connecting to Spring Boot backend.
// Replaces local storage mock data with real API integration.

import * as orderApi from './api/orderApi';

const LAST_ORDER_KEY = 'locvia_last_order';

// Generate Unique Order ID helper (used for temporary correlation if needed)
export const generateOrderId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LOC-${dateStr}-${rand}`;
};

// Retrieve local orders synchronously (returns [] when empty — zero mock data)
export const getLocalOrders = () => {
  try {
    const raw = localStorage.getItem('locvia_orders');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading locvia_orders:', err);
  }
  return [];
};

// Retrieve the last created order snapshot
export const getLastOrder = () => {
  try {
    const data = localStorage.getItem(LAST_ORDER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Error reading last order:', err);
    return null;
  }
};

// Set last order snapshot in storage
export const setLastOrder = (order) => {
  try {
    if (order) {
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
    }
  } catch (err) {
    console.error('Error saving last order:', err);
  }
};

// Retrieve a single order by ID from the Spring Boot API
export const getOrderById = async (id) => {
  try {
    if (!id) return null;
    return await orderApi.getOrderById(id);
  } catch (err) {
    console.error('Error fetching order by id from API:', err);
    return null;
  }
};

// Retrieve orders for the authenticated customer from Spring Boot API
export const getOrdersByCustomer = async (_userId) => {
  const data = await orderApi.getMyOrders();
  // Handle direct array response (e.g. List<OrderSummaryResponse> from Spring Boot)
  if (Array.isArray(data)) {
    return data;
  }
  // Handle Spring Data Page or wrapper response structures
  if (data && Array.isArray(data.content)) {
    return data.content;
  }
  if (data && Array.isArray(data.orders)) {
    return data.orders;
  }
  // Handle 204 No Content or legitimate null/undefined empty result
  if (data === null || data === undefined) {
    return [];
  }
  throw new Error('Unexpected order response structure received from server');
};

// Service layer async helpers
export const fetchMyOrders = async (_userId) => {
  return getOrdersByCustomer();
};

export const fetchOrderById = async (id) => {
  const order = await getOrderById(id);
  if (!order) throw new Error(`Order not found: ${id}`);
  return order;
};

export const placeOrder = async (orderData) => {
  // If orderData is an object with addressId
  const payload = {
    addressId: orderData.addressId || orderData.address?.id || 1,
  };
  const created = await orderApi.createOrder(payload);
  setLastOrder(created);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('locvia_order_created', { detail: { order: created } }));
  }

  return created;
};

export const cancelCustomerOrder = async (orderId) => {
  return orderApi.cancelOrder(orderId);
};

// Legacy stub kept for backward compatibility
export const createLocalOrder = placeOrder;
export const updateLocalOrderStatus = async (_orderId, _newStatus) => null;

