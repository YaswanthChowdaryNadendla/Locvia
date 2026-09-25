// src/services/adminShopService.js
// Service layer for Admin Shop Management
// Connects to Spring Boot backend via adminApi with safe fallbacks.

import * as adminApi from './api/adminApi';

const SHOPS_KEY = 'locvia_shops';

/**
 * Normalizes shop object with safe defaults
 */
const normalizeShop = (shop) => {
  const status = shop.status || (shop.active ? 'ACTIVE' : 'INACTIVE');
  return {
    id: shop.id,
    name: shop.name || 'Unnamed Shop',
    description: shop.description || '',
    category: shop.category || shop.type || 'Grocery',
    phone: shop.phone || 'N/A',
    address: shop.address || 'N/A',
    city: shop.city || 'Ongole',
    state: shop.state || 'Andhra Pradesh',
    pincode: shop.pincode || '',
    status: status,
    active: shop.active !== undefined ? shop.active : (status === 'ACTIVE' || status === 'APPROVED'),
    isOpen: shop.isOpen !== false,
    ownerName: shop.owner?.name || shop.ownerName || 'Shop Owner',
    ownerEmail: shop.owner?.email || shop.ownerEmail || 'N/A',
    ownerId: shop.ownerId || shop.owner?.id,
    rating: typeof shop.rating === 'number' ? shop.rating : 0,
    reviewCount: shop.reviewCount || 0,
    productCount: shop.productCount || 0,
    deliveryTime: shop.deliveryTime || '20–30 mins',
    deliveryFee: shop.deliveryFee !== undefined ? shop.deliveryFee : 0,
    image: shop.image || shop.imageUrl || null,
    createdAt: shop.createdAt || new Date().toISOString(),
  };
};

/**
 * Retrieves all platform shops from Spring Boot backend (with localStorage fallback).
 */
export const getAllShops = async () => {
  try {
    const data = await adminApi.getShops();
    if (Array.isArray(data)) {
      return data.map(normalizeShop);
    }
    if (data && Array.isArray(data.content)) {
      return data.content.map(normalizeShop);
    }
  } catch (err) {
    console.warn('adminApi.getShops failed or offline, checking fallback:', err);
  }

  try {
    const raw = localStorage.getItem(SHOPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeShop);
      }
    }
  } catch (err) {
    console.error('Error reading locvia_shops from localStorage:', err);
  }
  return [];
};

/**
 * Approves a registered shop via the backend API.
 */
export const approveShop = async (shopId) => {
  try {
    const res = await adminApi.approveShop(shopId);
    return res;
  } catch (err) {
    // Also sync localStorage if present
    try {
      const shopsList = getAllShops();
      const updatedList = (await shopsList).map((s) =>
        String(s.id) === String(shopId) ? { ...s, status: 'APPROVED', active: true } : s
      );
      localStorage.setItem(SHOPS_KEY, JSON.stringify(updatedList));
    } catch (e) {}
    throw err;
  }
};

/**
 * Removes a shop via the backend API.
 */
export const removeShop = async (shopId) => {
  try {
    const res = await adminApi.deleteShop(shopId);
    return res;
  } catch (err) {
    // Also sync localStorage if present
    try {
      const raw = localStorage.getItem(SHOPS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((s) => String(s.id) !== String(shopId));
          localStorage.setItem(SHOPS_KEY, JSON.stringify(filtered));
        }
      }
    } catch (e) {}
    throw err;
  }
};

/**
 * Updates a shop's status ('ACTIVE', 'INACTIVE', etc.)
 */
export const updateShopStatus = async (shopId, newStatus) => {
  try {
    await adminApi.updateShopStatus(shopId, newStatus);
  } catch (err) {
    console.warn('adminApi.updateShopStatus failed, updating local storage:', err);
  }

  try {
    const raw = localStorage.getItem(SHOPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const updatedList = parsed.map((s) => {
          if (String(s.id) === String(shopId)) {
            return { ...s, status: newStatus };
          }
          return s;
        });
        localStorage.setItem(SHOPS_KEY, JSON.stringify(updatedList));
        return updatedList.map(normalizeShop);
      }
    }
  } catch (err) {
    console.error('Error updating shop status in localStorage:', err);
  }

  return [];
};

/**
 * Calculates shop overview stats
 */
export const calculateShopStats = (shops = []) => {
  const total = shops.length;
  const active = shops.filter((s) => s.status === 'ACTIVE' || s.status === 'APPROVED' || s.active).length;
  const pending = shops.filter((s) => s.status === 'PENDING' || s.status === 'PENDING_VERIFICATION').length;
  const suspended = shops.filter((s) => s.status === 'INACTIVE' || s.status === 'REJECTED').length;

  return {
    total,
    active,
    pending,
    suspended,
  };
};

/**
 * Generates shop initials
 */
export const getShopInitials = (name = '') => {
  if (!name) return 'S';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Extracts unique cities for filtering
 */
export const getUniqueCities = (shops = []) => {
  const cities = new Set();
  shops.forEach((s) => {
    if (s.city) cities.add(s.city.trim());
  });
  return Array.from(cities).sort();
};
