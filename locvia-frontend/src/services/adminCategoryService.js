// src/services/adminCategoryService.js
// Service layer for Admin Category Management (Module 32)
// Handles category CRUD, image mapping, product count calculation, and duplicate validation.

import { categories as initialCategories } from '../data/categories';
import { getStoredProducts } from './shopOwnerService';

const CATEGORIES_KEY = 'locvia_categories';

/**
 * Normalizes category object with safe defaults
 */
const normalizeCategory = (cat) => {
  let image = cat.image || null;
  const initial = initialCategories.find(
    (c) => c.id === cat.id || (c.name && cat.name && c.name.toLowerCase() === cat.name.toLowerCase())
  );
  if (!image && initial?.image) {
    image = initial.image;
  }

  return {
    id: cat.id,
    name: cat.name || 'Unnamed Category',
    slug: cat.slug || (cat.name ? cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'category'),
    image,
    crop: cat.crop || 'none',
    status: cat.status || 'ACTIVE',
    createdAt: cat.createdAt || '2024-01-01T00:00:00Z',
  };
};

/**
 * Retrieves all categories with derived product counts.
 */
export const getAllCategories = () => {
  let rawList = [];
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        rawList = parsed;
      }
    }
  } catch (err) {
    console.error('Error reading locvia_categories:', err);
  }

  if (rawList.length === 0) {
    rawList = initialCategories.map(normalizeCategory);
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(rawList));
    } catch (e) {
      console.error('Error saving initial categories:', e);
    }
  }

  const allProducts = getStoredProducts();

  return rawList.map((cat) => {
    const norm = normalizeCategory(cat);
    const count = allProducts.filter(
      (p) =>
        p.category === norm.name ||
        (p.category && String(p.category).trim().toLowerCase() === norm.name.trim().toLowerCase())
    ).length;

    return {
      ...norm,
      productCount: count,
    };
  });
};

/**
 * Adds a new category
 */
export const addCategory = (categoryData) => {
  const current = getAllCategories();
  const newCat = normalizeCategory({
    id: `cat-${Date.now()}`,
    ...categoryData,
    createdAt: new Date().toISOString(),
  });
  const updated = [newCat, ...current];
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving category:', e);
  }
  return newCat;
};

/**
 * Updates an existing category
 */
export const updateCategory = (id, categoryData) => {
  const current = getAllCategories();
  const updated = current.map((c) => (c.id === id ? { ...c, ...categoryData } : c));
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error updating category:', e);
  }
  return updated.find((c) => c.id === id);
};

/**
 * Updates a category's status (ACTIVE / INACTIVE)
 */
export const updateCategoryStatus = (id, newStatus) => {
  return updateCategory(id, { status: newStatus });
};

/**
 * Deletes a category
 */
export const deleteCategory = (id) => {
  const current = getAllCategories();
  const filtered = current.filter((c) => c.id !== id);
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error deleting category:', e);
  }
  return true;
};

/**
 * Calculates category summary stats
 */
export const calculateCategoryStats = (categories = []) => {
  const total = categories.length;
  const active = categories.filter((c) => c.status === 'ACTIVE').length;
  const inactive = categories.filter((c) => c.status !== 'ACTIVE').length;
  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);

  return {
    total,
    active,
    inactive,
    totalProducts,
  };
};

/**
 * Generates category initials
 */
export const getCategoryInitials = (name = '') => {
  if (!name) return 'C';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
