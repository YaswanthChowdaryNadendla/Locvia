// src/services/adminDeliveryService.js
// Service layer for Admin Delivery Management (Module 34)
// Reads delivery records with live backend integration and safe fallbacks.

import * as adminApi from './api/adminApi';
import { getLocalOrders } from './orderService';
import { getAllUsers } from './adminUserService';
import { getDeliveryAvailability, formatINR } from './deliveryService';
import { ROLES } from '../data/users';

export { formatINR };

const ACTIVE_DELIVERY_STATUSES = ['ASSIGNED', 'PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'];

/**
 * Normalizes an order or backend delivery into a clean Admin Delivery Record
 */
export const normalizeDeliveryRecord = (item, allUsers = []) => {
  if (!item) return null;
  const rawId = item.id || item.deliveryId || item.orderId || '1';
  const deliveryId = String(rawId).startsWith('DEL-') ? String(rawId) : `DEL-${rawId}`;
  const orderId = item.orderId || item.id || 'N/A';
  const partnerId = item.deliveryPartnerId || item.partner?.id || null;
  const partner = partnerId
    ? (allUsers.find((u) => String(u.id) === String(partnerId)) || {
        id: partnerId,
        name: item.deliveryPartnerName || item.partner?.name || 'Assigned Partner',
        phone: item.deliveryPartnerPhone || item.partner?.phone || 'N/A',
        email: item.partner?.email || 'partner@locvia.com',
      })
    : (item.partner || null);

  const addressObj = item.deliveryAddress || item.address || {};
  const customerName = addressObj.fullName || addressObj.name || item.customerName || item.customer?.name || 'Customer';
  const customerPhone = addressObj.phone || item.customerPhone || item.customer?.phone || 'N/A';
  const customerUserId = item.customerId || item.customer?.userId || item.userId || 'N/A';
  const city = addressObj.city || 'Ongole';
  const state = addressObj.state || 'Andhra Pradesh';
  const pincode = addressObj.pincode || addressObj.zipCode || '523001';
  const addressLine1 = addressObj.addressLine1 || addressObj.line1 || 'Main Road';

  const shops = Array.isArray(item.shops) && item.shops.length > 0
    ? item.shops
    : [{ name: item.shopName || 'Locvia Partner Store' }];

  const orderStatus = (item.orderStatus || item.status || item.deliveryStatus || 'PLACED').toUpperCase();

  return {
    id: item.id || orderId,
    deliveryId,
    orderId,
    deliveryPartnerId: partnerId,
    partner,
    partnerPerformance: item.partnerPerformance || {
      completedCount: partner?.completedCount || 0,
      totalAssigned: partner?.totalAssignedCount || 0,
      completionRate: '100%',
    },
    customer: {
      name: customerName,
      phone: customerPhone,
      userId: customerUserId,
    },
    address: {
      fullName: customerName,
      phone: customerPhone,
      city,
      state,
      pincode,
      addressLine1,
      addressLine2: addressObj.addressLine2 || '',
      type: addressObj.type || 'Home',
      ...addressObj,
    },
    shops,
    orderStatus,
    deliveryStatus: item.status || item.deliveryStatus || 'PENDING',
    paymentStatus: item.paymentStatus || item.payment?.status || 'PAID',
    paymentMethod: item.paymentMethod || item.payment?.method || 'ONLINE',
    totalAmount: typeof item.totalAmount === 'number' ? item.totalAmount : (Number(item.totalAmount) || 0),
    assignedAt: item.assignedAt || null,
    pickedUpAt: item.pickedUpAt || null,
    outForDeliveryAt: item.outForDeliveryAt || null,
    deliveredAt: item.deliveredAt || null,
    createdAt: item.createdAt || new Date().toISOString(),
  };
};

/**
 * Retrieves all registered Delivery Partners with performance stats & availability
 */
export const getAllDeliveryPartners = async () => {
  let allUsers = [];
  try {
    const users = await getAllUsers();
    allUsers = Array.isArray(users) ? users : [];
  } catch (err) {
    console.warn('getAllUsers in adminDeliveryService failed:', err);
  }

  const allOrders = getLocalOrders() || [];
  const partners = allUsers.filter((u) => u.role === ROLES.DELIVERY_PARTNER);

  return partners.map((partner) => {
    const isAvailable = getDeliveryAvailability(partner.id);

    const partnerOrders = (allOrders || []).filter(
      (o) => String(o.deliveryPartnerId) === String(partner.id)
    );

    const activeCount = partnerOrders.filter((o) => {
      const status = (o.orderStatus || o.status || '').toUpperCase();
      return ACTIVE_DELIVERY_STATUSES.includes(status);
    }).length;

    const completedCount = partnerOrders.filter((o) => {
      const status = (o.orderStatus || o.status || '').toUpperCase();
      return status === 'DELIVERED';
    }).length;

    let partnerStatus = 'UNAVAILABLE';
    if (activeCount > 0) {
      partnerStatus = 'ON_DELIVERY';
    } else if (isAvailable) {
      partnerStatus = 'AVAILABLE';
    }

    return {
      ...partner,
      isAvailable,
      partnerStatus,
      activeCount,
      completedCount,
      totalAssignedCount: partnerOrders.length,
    };
  });
};

/**
 * Retrieves all delivery records across orders
 */
export const getAllDeliveryRecords = async () => {
  let backendDeliveries = null;
  let allUsers = [];

  try {
    const [delData, users] = await Promise.all([
      adminApi.getDeliveries().catch(() => null),
      getAllUsers().catch(() => []),
    ]);
    if (Array.isArray(delData)) {
      backendDeliveries = delData;
    }
    allUsers = Array.isArray(users) ? users : [];
  } catch (err) {
    console.warn('Error loading admin delivery records:', err);
  }

  const rawRecords = backendDeliveries && backendDeliveries.length > 0 
    ? backendDeliveries 
    : (getLocalOrders() || []);

  return (Array.isArray(rawRecords) ? rawRecords : [])
    .map((o) => normalizeDeliveryRecord(o, allUsers))
    .filter(Boolean);
};

/**
 * Retrieves a single delivery record details by delivery/order ID
 */
export const getDeliveryDetails = async (deliveryId) => {
  const records = await getAllDeliveryRecords();
  const cleanId = String(deliveryId || '').trim().toLowerCase();
  return (
    records.find(
      (r) =>
        String(r.id).toLowerCase() === cleanId ||
        String(r.deliveryId).toLowerCase() === cleanId ||
        String(r.orderId).toLowerCase() === cleanId
    ) || null
  );
};

/**
 * Calculates delivery overview statistics
 */
export const calculateDeliveryStats = (partnersList = [], recordsList = []) => {
  const partners = Array.isArray(partnersList) ? partnersList : [];
  const records = Array.isArray(recordsList) ? recordsList : [];

  const totalPartners = partners.length;
  const availablePartners = partners.filter((p) => p.partnerStatus === 'AVAILABLE').length;
  const onDeliveryPartners = partners.filter((p) => p.partnerStatus === 'ON_DELIVERY').length;

  const activeDeliveries = records.filter((r) =>
    ACTIVE_DELIVERY_STATUSES.includes((r.orderStatus || r.deliveryStatus || '').toUpperCase())
  ).length;

  const completedDeliveries = records.filter(
    (r) => (r.orderStatus || r.deliveryStatus || '').toUpperCase() === 'DELIVERED'
  ).length;

  const pendingAssignments = records.filter(
    (r) =>
      ['READY_FOR_PICKUP', 'PREPARING', 'CONFIRMED', 'PLACED'].includes((r.orderStatus || '').toUpperCase()) &&
      !r.deliveryPartnerId
  ).length;

  return {
    totalPartners,
    availablePartners,
    onDeliveryPartners,
    activeDeliveries,
    completedDeliveries,
    pendingAssignments,
    totalDeliveries: records.length,
  };
};
