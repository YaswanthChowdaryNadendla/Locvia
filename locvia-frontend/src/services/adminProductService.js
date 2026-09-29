// src/services/adminProductService.js
// Service layer for Admin Product Management (Module 32)
// Normalizes products, resolves shop & category mappings, and handles status persistence.

import * as adminApi from './api/adminApi';
import { getStoredProducts } from './shopOwnerService';
import { getAllShops } from './adminShopService';
import { getAllCategories } from './adminCategoryService';

const PRODUCTS_KEY = 'locvia_products';

/**
 * Retrieves all normalized platform products with shop references and calculated fields.
 */
export const getAllProducts = async () => {
  let backendProducts = null;
  let allShops = [];
  let allCategories = [];

  try {
    const [prodData, shopsData, catData] = await Promise.all([
      adminApi.getProducts().catch(() => null),
      getAllShops().catch(() => []),
      Promise.resolve(getAllCategories()).catch(() => []),
    ]);
    if (Array.isArray(prodData)) {
      backendProducts = prodData;
    } else if (prodData && Array.isArray(prodData.content)) {
      backendProducts = prodData.content;
    }
    allShops = Array.isArray(shopsData) ? shopsData : [];
    allCategories = Array.isArray(catData) ? catData : [];
  } catch (err) {
    console.warn('Error loading admin product dependencies:', err);
  }

  const rawProducts = backendProducts || getStoredProducts() || [];

  return (Array.isArray(rawProducts) ? rawProducts : []).map((p) => {
    // 1. Resolve Shop
    const shop = allShops.find((s) => String(s.id) === String(p.shopId)) || null;
    const shopName = p.shopName || (shop ? shop.name : 'Unknown Shop');

    // 2. Resolve Category
    const categoryName = p.categoryName || p.category || 'Grocery';
    const categoryObj = allCategories.find(
      (c) => c.name && c.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
    ) || null;

    // 3. Resolve Pricing & MRP
    const price = typeof p.price === 'number' ? p.price : (Number(p.price) || 0);
    const mrp = typeof p.originalPrice === 'number'
      ? p.originalPrice
      : (typeof p.mrp === 'number' ? p.mrp : (typeof p.discountPrice === 'number' ? p.discountPrice : price));
    const discount = p.discount || (mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0);

    // 4. Resolve Stock & Status
    const stock = typeof p.stockQuantity === 'number'
      ? p.stockQuantity
      : (typeof p.stock === 'number' ? p.stock : 0);
    const isAvailable = p.active !== undefined ? Boolean(p.active) : (p.isAvailable !== false);
    const status = p.active !== undefined
      ? (p.active ? 'ACTIVE' : 'INACTIVE')
      : (p.status || (isAvailable && stock > 0 ? 'ACTIVE' : 'INACTIVE'));

    return {
      id: p.id,
      name: p.name || 'Unnamed Product',
      description: p.description || '',
      price,
      mrp,
      discount,
      unit: p.unit || '1 unit',
      shopId: p.shopId,
      shopName,
      category: categoryName,
      categoryId: p.categoryId || categoryObj?.id || null,
      image: p.imageUrl || p.image || null,
      imageUrl: p.imageUrl || p.image || null,
      rating: typeof p.rating === 'number' ? p.rating : null,
      reviewCount: p.reviewCount || 0,
      stock,
      stockQuantity: stock,
      isAvailable,
      status,
      createdAt: p.createdAt || '2024-01-01T00:00:00Z',
    };
  });
};

/**
 * Updates a product's active status (ACTIVE <-> INACTIVE)
 */
export const updateProductStatus = async (productId, newStatus) => {
  const isActivating = newStatus === 'ACTIVE';
  try {
    if (isActivating) {
      await adminApi.updateProduct(productId, { active: true });
    } else {
      await adminApi.updateProduct(productId, { active: false });
    }
  } catch (err) {
    console.warn('adminApi product status update failed, syncing fallback:', err);
  }

  // Also sync localStorage fallback
  const rawProducts = getStoredProducts();
  const updatedRaw = (Array.isArray(rawProducts) ? rawProducts : []).map((p) => {
    if (String(p.id) === String(productId)) {
      return {
        ...p,
        status: newStatus,
        isAvailable: isActivating,
      };
    }
    return p;
  });

  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedRaw));
  } catch (err) {
    console.error('Error updating product status in localStorage:', err);
  }

  return getAllProducts();
};

/**
 * Permanently deletes a product via admin console.
 */
export const deleteProduct = async (productId) => {
  await adminApi.deleteProduct(productId);

  // Also sync localStorage fallback
  const rawProducts = getStoredProducts();
  const updatedRaw = (Array.isArray(rawProducts) ? rawProducts : []).filter(
    (p) => String(p.id) !== String(productId)
  );

  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedRaw));
  } catch (err) {
    console.error('Error removing product from localStorage:', err);
  }

  return getAllProducts();
};

/**
 * Computes platform-wide product statistics.
 */
export const calculateProductStats = (productsList = []) => {
  const stats = {
    totalProducts: productsList.length,
    activeProducts: 0,
    inactiveProducts: 0,
    categoriesCount: 0,
    outOfStockCount: 0,
    shopsWithProductsCount: 0,
  };

  const categorySet = new Set();
  const shopSet = new Set();

  productsList.forEach((p) => {
    if (p.status === 'INACTIVE') {
      stats.inactiveProducts += 1;
    } else {
      stats.activeProducts += 1;
    }

    if (p.stock === 0) {
      stats.outOfStockCount += 1;
    }

    if (p.category) {
      categorySet.add(p.category);
    }

    if (p.shopId) {
      shopSet.add(p.shopId);
    }
  });

  stats.categoriesCount = categorySet.size;
  stats.shopsWithProductsCount = shopSet.size;

  return stats;
};

/**
 * Formats product initials (e.g. "Aashirvaad Atta" -> "AA")
 */
export const getProductInitials = (name = '') => {
  if (!name) return 'P';
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};
