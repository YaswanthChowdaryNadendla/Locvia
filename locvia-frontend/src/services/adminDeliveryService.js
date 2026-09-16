// src/services/adminDeliveryService.js
// Service layer for Admin Delivery Management (Module 34)
// Reads delivery records without any mock/demo data seeding.

import { getLocalOrders } from './orderService';
import { getAllUsers } from './adminUserService';
import { getDeliveryAvailability, formatINR } from './deliveryService';
import { ROLES } from '../data/users';

export { formatINR };

const ACTIVE_DELIVERY_STATUSES = ['ASSIGNED', 'PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'];

/**
 * Retrieves all registered Delivery Partners with performance stats & availability
 */
export const getAllDeliveryPartners = () => {
  const allUsers = getAllUsers();
  const allOrders = getLocalOrders();

  const partners = allUsers.filter((u) => u.role === ROLES.DELIVERY_PARTNER);

  return partners.map((partner) => {
    const isAvailable = getDeliveryAvailability(partner.id);

    const partnerOrders = allOrders.filter(
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
 * Normalizes an order into a clean Admin Delivery Record
 */
const normalizeDeliveryRecord = (order, allUsers = []) => {
  const partner = order.deliveryPartnerId
    ? allUsers.find((u) => String(u.id) === String(order.deliveryPartnerId)) || null
    : null;

  const totalAmount =
    order.pricing?.finalTotal !== undefined
      ? order.pricing.finalTotal
      : typeof order.totalAmount === 'number'
      ? order.totalAmount
      : 0;

  return {
    id: order.id || order.orderId,
    orderId: order.orderId || order.id,
    customerName: order.address?.fullName || 'Customer',
    customerPhone: order.address?.phone || 'N/A',
    deliveryAddress: order.address ? `${order.address.addressLine1 || ''}, ${order.address.city || ''}` : 'N/A',
    deliveryPartnerId: order.deliveryPartnerId || null,
    deliveryPartnerName: partner ? partner.name : (order.deliveryPartnerName || 'Unassigned'),
    deliveryPartnerPhone: partner ? partner.phone : 'N/A',
    deliveryStatus: order.deliveryStatus || order.orderStatus || 'PENDING',
    orderStatus: order.orderStatus || order.status || 'PLACED',
    totalAmount,
    createdAt: order.createdAt || new Date().toISOString(),
    estimatedTime: order.estimatedDelivery || '25-35 mins',
  };
};

/**
 * Retrieves all delivery records across orders
 */
export const getAllDeliveryRecords = () => {
  const allOrders = getLocalOrders();
  const allUsers = getAllUsers();
  return allOrders.map((o) => normalizeDeliveryRecord(o, allUsers));
};

/**
 * Retrieves a single delivery record details by delivery/order ID
 */
export const getDeliveryDetails = (deliveryId) => {
  const records = getAllDeliveryRecords();
  const cleanId = String(deliveryId || '').trim().toLowerCase();
  return (
    records.find(
      (r) =>
        String(r.id).toLowerCase() === cleanId ||
        String(r.orderId).toLowerCase() === cleanId
    ) || null
  );
};

/**
 * Calculates delivery overview statistics
 */
export const calculateDeliveryStats = () => {
  const partners = getAllDeliveryPartners();
  const records = getAllDeliveryRecords();

  const totalPartners = partners.length;
  const availablePartners = partners.filter((p) => p.partnerStatus === 'AVAILABLE').length;
  const onDeliveryPartners = partners.filter((p) => p.partnerStatus === 'ON_DELIVERY').length;

  const activeDeliveries = records.filter((r) =>
    ACTIVE_DELIVERY_STATUSES.includes((r.deliveryStatus || '').toUpperCase())
  ).length;

  const completedDeliveries = records.filter(
    (r) => (r.deliveryStatus || '').toUpperCase() === 'DELIVERED'
  ).length;

  return {
    totalPartners,
    availablePartners,
    onDeliveryPartners,
    activeDeliveries,
    completedDeliveries,
    totalDeliveries: records.length,
  };
};
