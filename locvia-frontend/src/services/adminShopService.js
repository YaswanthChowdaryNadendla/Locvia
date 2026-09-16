// src/services/adminShopService.js
// Service layer for Admin Shop Management
// Reads shops without any mock/demo data seeding.

const SHOPS_KEY = 'locvia_shops';

/**
 * Normalizes shop object with safe defaults
 */
const normalizeShop = (shop) => {
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
    status: shop.status || (shop.isOpen ? 'ACTIVE' : 'INACTIVE'),
    isOpen: shop.isOpen !== false,
    rating: typeof shop.rating === 'number' ? shop.rating : 0,
    reviewCount: shop.reviewCount || 0,
    deliveryTime: shop.deliveryTime || '20–30 mins',
    deliveryFee: shop.deliveryFee !== undefined ? shop.deliveryFee : 0,
    image: shop.image || null,
    createdAt: shop.createdAt || new Date().toISOString(),
  };
};

/**
 * Retrieves all platform shops from localStorage (returns [] when empty — no mock seed).
 */
export const getAllShops = () => {
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
 * Updates a shop's status ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', etc.)
 */
export const updateShopStatus = (shopId, newStatus) => {
  const shopsList = getAllShops();
  const updatedList = shopsList.map((s) => {
    if (String(s.id) === String(shopId)) {
      return { ...s, status: newStatus };
    }
    return s;
  });

  try {
    localStorage.setItem(SHOPS_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Error updating shop status in localStorage:', err);
  }

  return updatedList;
};

/**
 * Calculates shop overview stats
 */
export const calculateShopStats = (shops = []) => {
  const total = shops.length;
  const active = shops.filter((s) => s.status === 'ACTIVE' || s.isOpen).length;
  const pending = shops.filter((s) => s.status === 'PENDING_VERIFICATION').length;
  const suspended = shops.filter((s) => s.status === 'SUSPENDED' || s.status === 'INACTIVE').length;

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
