// src/services/notificationService.js
// Module 38 — Master Notification Service
// Single master store: 'locvia_notifications'
// Handles Shop Owner new orders (with multi-shop isolation) and Delivery Partner assignments.

import { getLocalOrders } from './orderService.js';
import { getStoredShops } from './shopOwnerService.js';

export const NOTIFICATIONS_KEY = 'locvia_notifications';
const MAX_NOTIFICATIONS_PER_USER = 100;

// ── localStorage Helpers ─────────────────────────────────────────

export const readNotifications = () => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading locvia_notifications:', err);
  }
  return [];
};

export const writeNotifications = (notifications) => {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (err) {
    console.error('Error writing locvia_notifications:', err);
  }
};

// ── Timestamp Formatter ──────────────────────────────────────────

export const formatRelativeTime = (isoString) => {
  if (!isoString) return 'Just now';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diffSec < 45) return 'Just now';
    if (diffSec < 90) return '1 min ago';

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mins ago`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Just now';
  }
};

// ── Deterministic ID Generators ──────────────────────────────────

export const getOrderNotificationId = (orderId, shopId, ownerId) =>
  `NEW_ORDER_${String(orderId).trim()}_${String(shopId).trim()}_${String(ownerId).trim()}`;

export const getDeliveryNotificationId = (orderId, partnerId) =>
  `DELIVERY_ASSIGNED_${String(orderId).trim()}_${String(partnerId).trim()}`;

// ── User Isolation & Retrieval ───────────────────────────────────

/**
 * Returns notifications strictly scoped to the specified user ID
 */
export const getUserNotifications = (userId) => {
  if (!userId) return [];
  const cleanId = String(userId).trim();
  const all = readNotifications();

  return all
    .filter((n) => {
      const rId = String(n.recipientUserId).trim();
      if (rId === cleanId) return true;
      // Alias match for demo shop owner: user-02 and shop-01 represent same owner
      if (
        (cleanId === 'user-02' || cleanId === 'shop-01' || cleanId.toLowerCase() === 'shopowner@locvia.com') &&
        (rId === 'user-02' || rId === 'shop-01' || rId.toLowerCase() === 'shopowner@locvia.com')
      ) {
        return true;
      }
      return false;
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

/**
 * Count unread notifications for a specific user
 */
export const getUnreadCount = (userId) => {
  if (!userId) return 0;
  return getUserNotifications(userId).filter((n) => !n.read).length;
};

// ── Read / Unread Actions ────────────────────────────────────────

const isMatchingUser = (userIdA, userIdB) => {
  const cleanA = String(userIdA || '').trim();
  const cleanB = String(userIdB || '').trim();
  if (cleanA === cleanB) return true;
  if (
    (cleanA === 'user-02' || cleanA === 'shop-01' || cleanA.toLowerCase() === 'shopowner@locvia.com') &&
    (cleanB === 'user-02' || cleanB === 'shop-01' || cleanB.toLowerCase() === 'shopowner@locvia.com')
  ) {
    return true;
  }
  return false;
};

/**
 * Mark a single notification as read (strictly checks ownership)
 */
export const markNotificationAsRead = (notificationId, userId) => {
  if (!notificationId || !userId) return false;
  const all = readNotifications();

  let modified = false;
  const updated = all.map((n) => {
    if (n.id === notificationId && isMatchingUser(n.recipientUserId, userId)) {
      if (!n.read) {
        modified = true;
        return { ...n, read: true, readAt: new Date().toISOString() };
      }
    }
    return n;
  });

  if (modified) {
    writeNotifications(updated);
    notifySubscribers();
  }
  return modified;
};

/**
 * Mark all notifications as read for a specific user only
 */
export const markAllNotificationsAsRead = (userId) => {
  if (!userId) return false;
  const all = readNotifications();

  let modified = false;
  const updated = all.map((n) => {
    if (isMatchingUser(n.recipientUserId, userId) && !n.read) {
      modified = true;
      return { ...n, read: true, readAt: new Date().toISOString() };
    }
    return n;
  });

  if (modified) {
    writeNotifications(updated);
    notifySubscribers();
  }
  return modified;
};

// ── Add Notification with Retention & Duplicate Protection ───────

/**
 * Add a new notification.
 * Returns { added: true, notification } if newly added, or { added: false } if duplicate exists.
 */
export const addNotification = (item) => {
  if (!item || !item.id || !item.recipientUserId) return { added: false };

  const all = readNotifications();
  const exists = all.some((n) => n.id === item.id);
  if (exists) {
    return { added: false, notification: all.find((n) => n.id === item.id) };
  }

  const newNotification = {
    id: item.id,
    recipientUserId: String(item.recipientUserId).trim(),
    recipientRole: item.recipientRole,
    type: item.type,
    title: item.title,
    message: item.message,
    orderId: item.orderId,
    shopId: item.shopId || null,
    shopName: item.shopName || '',
    deliveryId: item.deliveryId || item.orderId || null,
    itemsCount: item.itemsCount || 0,
    subtotal: item.subtotal || 0,
    pickupShopName: item.pickupShopName || '',
    deliveryAddress: item.deliveryAddress || '',
    createdAt: item.createdAt || new Date().toISOString(),
    read: Boolean(item.read),
  };

  // Retention limit per user (keep max 100 per user, dropping oldest read first)
  const userItems = [newNotification, ...all.filter((n) => String(n.recipientUserId) === String(item.recipientUserId))];
  const otherItems = all.filter((n) => String(n.recipientUserId) !== String(item.recipientUserId));

  let trimmedUserItems = userItems;
  if (userItems.length > MAX_NOTIFICATIONS_PER_USER) {
    // Preserve unread items, drop oldest read items
    const unread = userItems.filter((n) => !n.read);
    const read = userItems.filter((n) => n.read);
    const allowedReadCount = Math.max(0, MAX_NOTIFICATIONS_PER_USER - unread.length);
    const retainedRead = read.slice(0, allowedReadCount);
    trimmedUserItems = [...unread, ...retainedRead];
  }

  const finalAll = [...trimmedUserItems, ...otherItems];
  writeNotifications(finalAll);

  // Dispatch custom event for active tabs
  notifySubscribers(newNotification);

  return { added: true, notification: newNotification };
};

// ── Subscriber Dispatch Helper ───────────────────────────────────

const notifySubscribers = (newNotification = null) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('locvia_notifications_updated', {
        detail: { newNotification },
      })
    );
  }
};

// ── Shop Ownership Resolver Helper ───────────────────────────────

/**
 * Returns array of shops owned by a given user
 */
export const getShopsOwnedByUser = (user) => {
  if (!user) return [];
  const shops = getStoredShops();
  const userIdStr = String(user.id || '').trim();

  return shops.filter((s) => {
    // Direct match by ownerId
    if (s.ownerId && String(s.ownerId).trim() === userIdStr) return true;
    // Match by user's shopId field
    if (user.shopId && String(s.id) === String(user.shopId)) return true;
    // Default demo shop owner fallback: user-02 / Rajan Mehta owns Shop 101
    if ((userIdStr === 'user-02' || userIdStr === 'shop-01') && String(s.id) === '101') return true;
    return false;
  });
};

// ── Event Generation Functions ───────────────────────────────────

/**
 * Creates notifications for all shops included in a new customer order.
 * Ensures each shop owner only receives items & subtotal for THEIR shop.
 */
export const generateOrderNotifications = (order) => {
  if (!order || !order.items || order.items.length === 0) return [];
  const shops = getStoredShops();
  const created = [];

  // Group items by shopId
  const shopItemsMap = {};
  order.items.forEach((item) => {
    const sId = String(item.shopId || 101);
    if (!shopItemsMap[sId]) shopItemsMap[sId] = [];
    shopItemsMap[sId].push(item);
  });

  Object.entries(shopItemsMap).forEach(([shopId, items]) => {
    const shop = shops.find((s) => String(s.id) === String(shopId)) || {
      id: shopId,
      name: items[0]?.shopName || 'Local Store',
      ownerId: 'user-02',
    };

    const ownerId = shop.ownerId || (String(shopId) === '101' ? 'user-02' : `owner-${shopId}`);
    const itemsCount = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
    const subtotal = items.reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );

    const orderId = order.orderId || order.id;
    const notificationId = getOrderNotificationId(orderId, shopId, ownerId);

    const result = addNotification({
      id: notificationId,
      recipientUserId: ownerId,
      recipientRole: 'SHOP_OWNER',
      type: 'NEW_ORDER',
      title: 'New Order Received',
      message: `Order #${orderId} • ${itemsCount} items • ₹${subtotal}`,
      orderId,
      shopId: shop.id,
      shopName: shop.name,
      itemsCount,
      subtotal,
      createdAt: order.createdAt || new Date().toISOString(),
      read: false,
    });

    if (result.added) {
      created.push(result.notification);
    }
  });

  return created;
};

/**
 * Creates notification for delivery partner when a delivery is assigned to them.
 * Preserves historical delivery address snapshot.
 */
export const generateDeliveryAssignmentNotification = (order, partnerId) => {
  if (!order || !partnerId) return null;

  const orderId = order.orderId || order.id;
  const notificationId = getDeliveryNotificationId(orderId, partnerId);

  // Determine pickup shop name from historical order data
  const pickupShopName =
    order.shops && order.shops.length > 0
      ? order.shops[0].name
      : order.items?.[0]?.shopName || 'Local Store';

  // Determine customer delivery address from historical snapshot
  let deliveryAddress = 'Customer Address';
  if (order.address) {
    const addr = order.address;
    const parts = [
      addr.addressLine1 || addr.line1,
      addr.addressLine2 || addr.line2,
      addr.city,
      addr.pincode,
    ].filter(Boolean);
    if (parts.length > 0) deliveryAddress = parts.join(', ');
  }

  const result = addNotification({
    id: notificationId,
    recipientUserId: String(partnerId).trim(),
    recipientRole: 'DELIVERY_PARTNER',
    type: 'DELIVERY_ASSIGNED',
    title: 'Delivery Assigned',
    message: `Order #${orderId} • Pickup: ${pickupShopName} • Deliver to: ${deliveryAddress}`,
    orderId,
    deliveryId: orderId,
    pickupShopName,
    deliveryAddress,
    createdAt: order.assignedAt || order.updatedAt || new Date().toISOString(),
    read: false,
  });

  return result.added ? result.notification : null;
};

// ── Background / Storage Change Synchronizer ─────────────────────

/**
 * Evaluates current orders in localStorage and generates missing notifications
 * for the currently logged-in user without re-notifying already recorded events.
 */
export const syncNotificationsForUser = (user) => {
  if (!user || !user.role) return [];
  const newlyCreated = [];

  try {
    const orders = getLocalOrders();

    if (user.role === 'SHOP_OWNER') {
      const ownedShops = getShopsOwnedByUser(user);
      if (ownedShops.length === 0) return [];

      const ownedShopIds = ownedShops.map((s) => String(s.id));

      orders.forEach((order) => {
        // Only active/new orders trigger notifications for shop owners
        const status = (order.orderStatus || 'PLACED').toUpperCase();
        if (['CANCELLED', 'DELIVERED'].includes(status)) return;

        const orderId = order.orderId || order.id;

        ownedShops.forEach((shop) => {
          const shopIdStr = String(shop.id);
          const shopItems = (order.items || []).filter(
            (item) => String(item.shopId || 101) === shopIdStr
          );

          if (shopItems.length > 0) {
            const notificationId = getOrderNotificationId(orderId, shop.id, user.id);
            const all = readNotifications();

            if (!all.some((n) => n.id === notificationId)) {
              const itemsCount = shopItems.reduce((s, it) => s + (Number(it.quantity) || 1), 0);
              const subtotal = shopItems.reduce(
                (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1),
                0
              );

              const res = addNotification({
                id: notificationId,
                recipientUserId: user.id,
                recipientRole: 'SHOP_OWNER',
                type: 'NEW_ORDER',
                title: 'New Order Received',
                message: `Order #${orderId} • ${itemsCount} items • ₹${subtotal}`,
                orderId,
                shopId: shop.id,
                shopName: shop.name,
                itemsCount,
                subtotal,
                createdAt: order.createdAt || new Date().toISOString(),
                read: false,
              });

              if (res.added) newlyCreated.push(res.notification);
            }
          }
        });
      });
    } else if (user.role === 'DELIVERY_PARTNER') {
      const partnerIdStr = String(user.id).trim();

      orders.forEach((order) => {
        if (String(order.deliveryPartnerId).trim() !== partnerIdStr) return;

        // Only active delivery assignments (not completed in the past)
        const status = (order.orderStatus || '').toUpperCase();
        if (['DELIVERED', 'CANCELLED'].includes(status)) return;

        const orderId = order.orderId || order.id;
        const notificationId = getDeliveryNotificationId(orderId, user.id);
        const all = readNotifications();

        if (!all.some((n) => n.id === notificationId)) {
          const notif = generateDeliveryAssignmentNotification(order, user.id);
          if (notif) newlyCreated.push(notif);
        }
      });
    }
  } catch (err) {
    console.error('Error syncing notifications for user:', err);
  }

  return newlyCreated;
};

// ── Global Reactive Listeners ────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('locvia_order_created', (e) => {
    if (e.detail?.order) {
      generateOrderNotifications(e.detail.order);
    }
  });

  window.addEventListener('locvia_delivery_assigned', (e) => {
    if (e.detail?.order && e.detail?.partnerId) {
      generateDeliveryAssignmentNotification(e.detail.order, e.detail.partnerId);
    }
  });
}
