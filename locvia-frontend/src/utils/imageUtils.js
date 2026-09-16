// src/utils/imageUtils.js
// Global image fallback and healing utilities for Locvia

// Embedded SVG data URI fallbacks (zero network latency, offline-ready)
export const DEFAULT_PRODUCT_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><rect width="400" height="400" fill="%23f8fafc"/><g fill="none" stroke="%2394a3b8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" transform="translate(100, 90)"><rect x="20" y="50" width="160" height="130" rx="16" fill="%23ffffff"/><path d="M60 50V30a40 40 0 0 1 80 0v20"/><circle cx="100" cy="115" r="24" fill="%23f1f5f9"/><path d="M100 103v24M88 115h24"/></g><text x="200" y="310" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="%2364748b" text-anchor="middle">Locvia Product</text></svg>';

export const DEFAULT_SHOP_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400"><rect width="600" height="400" fill="%23f8fafc"/><g fill="none" stroke="%2394a3b8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" transform="translate(200, 80)"><path d="M20 70 L100 20 L180 70 L180 180 L20 180 Z" fill="%23ffffff"/><path d="M75 180 L75 110 L125 110 L125 180"/><path d="M20 70 L180 70"/></g><text x="300" y="310" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="%2364748b" text-anchor="middle">Locvia Store</text></svg>';

// Map of known deprecated or deactivated Unsplash photo IDs to verified, active high-quality images
export const IMAGE_FIX_MAP = {
  // Salt (Tata Salt & Rock Salt)
  'photo-1518110165387-74f74296892f':
    'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&q=80&w=400&h=400',
  // Pulses, Dals, Nuts & Lentils
  'photo-1596489379051-5a9e33464eb7':
    'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&q=80&w=400&h=400',
  // Shakes & Mango Lassi
  'photo-1571006682862-365287f39454':
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=400&h=400',
  // Fresh Watermelon
  'photo-1587049352847-4a222e784d38':
    'https://images.unsplash.com/photo-1563114773-84221bd62daa?auto=format&fit=crop&q=80&w=400&h=400',
  // Tomatoes & Potatoes
  'photo-1518977676601-b14184f98115':
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400&h=400',
  // Shop 101: Sri Lakshmi General Store
  'photo-1534723452862-4c87650828f3':
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600&h=400',
  // Shop 111: Krishna Grocery Store
  'photo-1604719312566-8912e9c8a213':
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600&h=400',
};

/**
 * Normalizes an image URL by replacing deprecated IDs and falling back to default placeholders.
 */
export const normalizeImageUrl = (url, type = 'product') => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return type === 'shop' ? DEFAULT_SHOP_IMAGE : DEFAULT_PRODUCT_IMAGE;
  }
  for (const [deadId, fixedUrl] of Object.entries(IMAGE_FIX_MAP)) {
    if (url.includes(deadId)) {
      return fixedUrl;
    }
  }
  return url;
};

/**
 * Global onError handler for HTML <img> tags to safely fallback without infinite loops.
 */
export const handleImageError = (event, type = 'product') => {
  const target = event.currentTarget || event.target;
  if (!target || target.dataset.hasFailed) return;
  target.dataset.hasFailed = 'true';
  target.src = type === 'shop' ? DEFAULT_SHOP_IMAGE : DEFAULT_PRODUCT_IMAGE;
};
