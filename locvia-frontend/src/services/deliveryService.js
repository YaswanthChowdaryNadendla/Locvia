// src/services/deliveryService.js
// Dedicated service layer for Delivery Partner operations in Locvia (Modules 24, 25, 26, 27, 28)

import { getLocalOrders } from './orderService';
import * as deliveryApi from './api/deliveryApi';

const AVAILABILITY_PREFIX = 'locvia_delivery_availability_';
const DISMISSED_PREFIX = 'locvia_delivery_dismissed_';

// Active status states
const ACTIVE_STATUSES = ['ASSIGNED', 'PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'];

// ── Currency Formatter Helper ────────────────────────────────────
export const formatINR = (amount) => {
  const cleanVal = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(cleanVal);
};

// ── Availability Persistence (Scoped per Delivery Partner) ────────
export const getDeliveryAvailability = (partnerId = 'user-partner') => {
  try {
    const raw = localStorage.getItem(`${AVAILABILITY_PREFIX}${partnerId}`);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading delivery availability:', err);
  }
  return true; // Default to Available (Online)
};

export const setDeliveryAvailability = (partnerId = 'user-partner', isAvailable) => {
  try {
    localStorage.setItem(`${AVAILABILITY_PREFIX}${partnerId}`, JSON.stringify(isAvailable));
  } catch (err) {
    console.error('Error saving delivery availability:', err);
  }
  return isAvailable;
};

// ── Dismissed Requests Persistence (Scoped per Delivery Partner) ─
export const getDismissedRequests = (partnerId = 'user-partner') => {
  try {
    const raw = localStorage.getItem(`${DISMISSED_PREFIX}${partnerId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading dismissed requests:', err);
  }
  return [];
};

export const dismissDeliveryRequest = (orderId, partnerId = 'user-partner') => {
  try {
    const dismissed = getDismissedRequests(partnerId);
    const cleanId = String(orderId).trim();
    if (!dismissed.includes(cleanId)) {
      const updated = [...dismissed, cleanId];
      localStorage.setItem(`${DISMISSED_PREFIX}${partnerId}`, JSON.stringify(updated));
    }
    return true;
  } catch (err) {
    console.error('Error dismissing delivery request:', err);
    return false;
  }
};

// ── Delivery Requests & Orders Derivation ─────────────────────────

// Get available delivery requests (ready for pickup or unassigned delivery)
export const getAvailableDeliveryRequests = (partnerId = 'user-partner') => {
  const allOrders = getLocalOrders();
  const dismissed = getDismissedRequests(partnerId);

  return allOrders.filter((o) => {
    const status = (o.orderStatus || o.status || '').toUpperCase();
    const idStr = String(o.id || o.orderId).trim();

    // Must be an eligible status (READY_FOR_PICKUP, PREPARING, CONFIRMED, PLACED)
    const isEligibleStatus = ['READY_FOR_PICKUP', 'PREPARING', 'CONFIRMED', 'PLACED'].includes(status);

    // Must NOT be assigned to another partner
    const isUnassigned = !o.deliveryPartnerId;

    // Must NOT be dismissed by current delivery partner
    const isNotDismissed = !dismissed.includes(idStr);

    return isEligibleStatus && isUnassigned && isNotDismissed;
  });
};

// Accept a delivery request
export const acceptDeliveryRequest = (orderId, partnerId = 'user-partner') => {
  try {
    const allOrders = getLocalOrders();
    const cleanId = String(orderId).trim().toLowerCase();

    const targetOrder = allOrders.find(
      (o) => String(o.id).toLowerCase() === cleanId || String(o.orderId).toLowerCase() === cleanId
    );

    if (!targetOrder) {
      throw new Error('Order not found.');
    }

    // Check if order is already assigned to someone else
    if (targetOrder.deliveryPartnerId && String(targetOrder.deliveryPartnerId) !== String(partnerId)) {
      return { success: false, reason: 'ALREADY_TAKEN', message: 'This delivery request has already been accepted by another partner.' };
    }

    const now = new Date().toISOString();

    // Update order with partner assignment and ASSIGNED status
    const updatedOrders = allOrders.map((o) => {
      if (String(o.id).toLowerCase() === cleanId || String(o.orderId).toLowerCase() === cleanId) {
        return {
          ...o,
          deliveryPartnerId: partnerId,
          orderStatus: 'ASSIGNED',
          assignedAt: o.assignedAt || now,
          acceptedAt: o.acceptedAt || now,
          updatedAt: now,
        };
      }
      return o;
    });

    localStorage.setItem('locvia_orders', JSON.stringify(updatedOrders));

    const updatedOrder = updatedOrders.find(
      (o) => String(o.id).toLowerCase() === cleanId || String(o.orderId).toLowerCase() === cleanId
    );

    // Dispatch delivery assigned event for reactive notification handling
    if (typeof window !== 'undefined' && updatedOrder) {
      window.dispatchEvent(
        new CustomEvent('locvia_delivery_assigned', { detail: { order: updatedOrder, partnerId } })
      );
    }

    return { success: true, order: updatedOrder };
  } catch (err) {
    console.error('Error accepting delivery request:', err);
    return { success: false, reason: 'ERROR', message: err.message || 'Failed to accept delivery request.' };
  }
};

// Update delivery execution status (ASSIGNED -> PICKED_UP -> OUT_FOR_DELIVERY -> DELIVERED)
export const updateDeliveryExecutionStatus = (orderId, partnerId, newStatus) => {
  try {
    const allOrders = getLocalOrders();
    const cleanId = String(orderId).trim().toLowerCase();
    const target = allOrders.find(
      (o) => String(o.id).toLowerCase() === cleanId || String(o.orderId).toLowerCase() === cleanId
    );

    if (!target) {
      return { success: false, message: 'Delivery order not found.' };
    }

    if (target.deliveryPartnerId && String(target.deliveryPartnerId) !== String(partnerId)) {
      return { success: false, message: 'Access denied. Order assigned to another partner.' };
    }

    const now = new Date().toISOString();
    const cleanStatus = newStatus.toUpperCase();

    const updatedOrders = allOrders.map((o) => {
      if (String(o.id).toLowerCase() === cleanId || String(o.orderId).toLowerCase() === cleanId) {
        const updatedObj = {
          ...o,
          orderStatus: cleanStatus,
          updatedAt: now,
        };

        if (cleanStatus === 'PICKED_UP') {
          updatedObj.pickedUpAt = now;
        } else if (cleanStatus === 'OUT_FOR_DELIVERY') {
          updatedObj.outForDeliveryAt = now;
        } else if (cleanStatus === 'DELIVERED') {
          updatedObj.deliveredAt = now;
          if (!updatedObj.partnerEarning) {
            updatedObj.partnerEarning = 60; // Standard delivery partner payout per completed delivery
          }
        }

        return updatedObj;
      }
      return o;
    });

    localStorage.setItem('locvia_orders', JSON.stringify(updatedOrders));

    const updated = updatedOrders.find(
      (o) => String(o.id).toLowerCase() === cleanId || String(o.orderId).toLowerCase() === cleanId
    );

    return { success: true, order: updated };
  } catch (err) {
    console.error('Error updating delivery status:', err);
    return { success: false, message: err.message || 'Failed to update delivery status.' };
  }
};

// Get current active delivery for partner
export const getActiveDelivery = (partnerId = 'user-partner') => {
  const allOrders = getLocalOrders();
  return (
    allOrders.find((o) => {
      const status = (o.orderStatus || o.status || '').toUpperCase();
      const assignedPartner = o.deliveryPartnerId;
      return ACTIVE_STATUSES.includes(status) && String(assignedPartner) === String(partnerId);
    }) || null
  );
};

// Get completed deliveries for partner
export const getCompletedDeliveries = (partnerId = 'user-partner') => {
  const allOrders = getLocalOrders();
  return allOrders.filter((o) => {
    const status = (o.orderStatus || o.status || '').toUpperCase();
    const assignedPartner = o.deliveryPartnerId || 'user-partner';
    return status === 'DELIVERED' && String(assignedPartner) === String(partnerId);
  });
};

// Get order by ID for partner verification
export const getDeliveryOrderById = (orderId, partnerId = 'user-partner') => {
  const allOrders = getLocalOrders();
  const cleanId = String(orderId).trim().toLowerCase();
  return (
    allOrders.find(
      (o) =>
        (String(o.id).toLowerCase() === cleanId || String(o.orderId).toLowerCase() === cleanId) &&
        String(o.deliveryPartnerId) === String(partnerId)
    ) || null
  );
};

// Calculate detailed earnings metrics for a specific delivery partner (Module 28)
export const getDeliveryEarnings = (partnerId = 'user-partner') => {
  const completed = getCompletedDeliveries(partnerId);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Start of current week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Start of current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalEarnings = 0;
  let todayEarnings = 0;
  let weeklyEarnings = 0;
  let monthlyEarnings = 0;

  const history = completed.map((o) => {
    // Earning per delivery (partnerEarning or fallback deliveryFee or standard ₹60)
    const amount = Number(o.partnerEarning || o.pricing?.deliveryFee || 60);
    const dateTs = o.deliveredAt || o.updatedAt || o.createdAt;
    const d = dateTs ? new Date(dateTs) : new Date();

    totalEarnings += amount;

    if (dateTs && dateTs.slice(0, 10) === todayStr) {
      todayEarnings += amount;
    }
    if (d >= startOfWeek) {
      weeklyEarnings += amount;
    }
    if (d >= startOfMonth) {
      monthlyEarnings += amount;
    }

    return {
      id: o.id || o.orderId,
      orderId: o.orderId || o.id,
      amount,
      status: 'DELIVERED',
      deliveredAt: dateTs,
      shops: o.shops || [],
      address: o.address || {},
      itemsCount: o.items ? o.items.length : 1,
    };
  });

  // Sort history newest first
  history.sort((a, b) => new Date(b.deliveredAt || 0) - new Date(a.deliveredAt || 0));

  return {
    totalEarnings,
    todayEarnings,
    weeklyEarnings,
    monthlyEarnings,
    completedCount: completed.length,
    history,
  };
};

// Calculate Delivery Dashboard Summary Metrics
export const getDeliverySummary = (partnerId = 'user-partner') => {
  const allOrders = getLocalOrders();
  const availableRequests = getAvailableDeliveryRequests(partnerId);
  const activeDelivery = getActiveDelivery(partnerId);
  const completedDeliveries = getCompletedDeliveries(partnerId);

  // Filter today's deliveries
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDeliveries = allOrders.filter((o) => {
    if (!o.createdAt) return false;
    return o.createdAt.slice(0, 10) === todayStr;
  });

  return {
    todayCount: todayDeliveries.length || completedDeliveries.length,
    activeCount: activeDelivery ? 1 : 0,
    completedCount: completedDeliveries.length,
    availableCount: availableRequests.length,
  };
};

// ── Real Backend API Integration Methods ─────────────────────────────

/**
 * Fetches available delivery requests from Spring Boot backend.
 * GET /api/delivery/requests
 */
export const fetchAvailableDeliveryRequests = async () => {
  try {
    const res = await deliveryApi.getDeliveryRequests();
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.error('Error fetching delivery requests from API:', err);
    return [];
  }
};

/**
 * Fetches active deliveries assigned to partner from Spring Boot backend.
 * GET /api/delivery/active
 */
export const fetchActiveDeliveries = async () => {
  try {
    const res = await deliveryApi.getActiveDelivery();
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.error('Error fetching active deliveries from API:', err);
    return [];
  }
};

/**
 * Fetches completed deliveries for partner from Spring Boot backend.
 * GET /api/delivery/completed
 */
export const fetchCompletedDeliveries = async () => {
  try {
    const res = await deliveryApi.getCompletedDeliveries();
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.error('Error fetching completed deliveries from API:', err);
    return [];
  }
};

/**
 * Updates delivery status on the Spring Boot backend.
 * PATCH /api/delivery/{id}/status
 */
export const updateApiDeliveryStatus = async (deliveryId, status) => {
  return deliveryApi.updateDeliveryStatus(deliveryId, status);
};

