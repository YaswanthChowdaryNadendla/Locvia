import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as cartApi from '../services/api/cartApi';

// No hardcoded coupons — coupon validation comes from the backend API.
const AVAILABLE_COUPONS = [];

const CartContext = createContext(null);

const mapCartResponseToItems = (cartData) => {
  if (!cartData || !Array.isArray(cartData.items)) return [];
  return cartData.items.map((item) => ({
    id: item.id, // Cart item ID in backend database
    product: {
      id: item.productId,
      name: item.productName,
      price: typeof item.productPrice === 'number' ? item.productPrice : parseFloat(item.productPrice) || 0,
      image: item.imageUrl,
      imageUrl: item.imageUrl,
    },
    quantity: item.quantity,
  }));
};

export const CartProvider = ({ children }) => {
  // items: [{ id, product, quantity }]
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('locvia_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('locvia_cart_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // ── Sync with Backend API on Mount or Token Change ──────────────────────
  const refreshCartFromApi = useCallback(async () => {
    const token = localStorage.getItem('locvia_token');
    const userRaw = localStorage.getItem('locvia_user');
    const userRole = userRaw ? JSON.parse(userRaw)?.role : null;

    // Only customers have backend cart endpoints
    if (token && userRole === 'CUSTOMER') {
      try {
        const cartData = await cartApi.getCart();
        if (cartData && Array.isArray(cartData.items)) {
          const loaded = mapCartResponseToItems(cartData);
          setItems(loaded);
          localStorage.setItem('locvia_cart_items', JSON.stringify(loaded));
        }
      } catch (err) {
        console.warn('[CartContext] Could not fetch backend cart:', err.message);
      }
    }
  }, []);

  useEffect(() => {
    refreshCartFromApi();

    const handleAuthChange = () => {
      refreshCartFromApi();
    };

    window.addEventListener('locvia:auth:session_expired', () => setItems([]));
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [refreshCartFromApi]);

  // Sync items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('locvia_cart_items', JSON.stringify(items));
    } catch (err) {
      console.error('Failed to persist cart:', err);
    }
  }, [items]);

  // Sync coupon to localStorage
  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('locvia_cart_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('locvia_cart_coupon');
      }
    } catch (err) {
      console.error('Failed to persist coupon:', err);
    }
  }, [appliedCoupon]);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items]
  );

  const totalMRP = useMemo(
    () => items.reduce((sum, i) => sum + (i.product.originalPrice || i.product.price) * i.quantity, 0),
    [items]
  );

  const totalSavings = useMemo(
    () => Math.max(0, totalMRP - totalAmount),
    [totalMRP, totalAmount]
  );

  // Auto-remove coupon if subtotal falls below required minimum
  useEffect(() => {
    if (appliedCoupon && totalAmount > 0) {
      if (totalAmount < appliedCoupon.minOrderAmount) {
        setAppliedCoupon(null);
      }
    } else if (totalAmount === 0 && appliedCoupon) {
      setAppliedCoupon(null);
    }
  }, [totalAmount, appliedCoupon]);

  const applyCouponCode = useCallback((code) => {
    if (!code || !code.trim()) {
      return { success: false, message: 'Please enter a coupon code.' };
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = AVAILABLE_COUPONS.find((c) => c.code === normalizedCode);

    if (!coupon) {
      return { success: false, message: 'Invalid coupon code.' };
    }

    if (totalAmount < coupon.minOrderAmount) {
      return { success: false, message: `Add ₹${coupon.minOrderAmount - totalAmount} more to use this coupon.` };
    }

    setAppliedCoupon(coupon);
    return { success: true };
  }, [totalAmount]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const addItem = useCallback(async (product, quantity = 1) => {
    const token = localStorage.getItem('locvia_token');
    const userRaw = localStorage.getItem('locvia_user');
    const userRole = userRaw ? JSON.parse(userRaw)?.role : null;

    if (token && userRole === 'CUSTOMER') {
      try {
        const response = await cartApi.addToCart({ productId: product.id, quantity });
        if (response && Array.isArray(response.items)) {
          setItems(mapCartResponseToItems(response));
          return;
        }
      } catch (err) {
        console.warn('[CartContext] Backend addToCart failed, updating locally:', err.message);
      }
    }

    // Local state fallback for unauthenticated guests
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      const stock = product.stock !== undefined ? product.stock : (product.isAvailable ? 50 : 0);

      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, stock > 0 ? stock : 99);
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: newQty } : i
        );
      }
      const initialQty = Math.min(quantity, stock > 0 ? stock : 99);
      return [...prev, { product, quantity: initialQty }];
    });
  }, []);

  const removeItem = useCallback(async (productId) => {
    const token = localStorage.getItem('locvia_token');
    const userRaw = localStorage.getItem('locvia_user');
    const userRole = userRaw ? JSON.parse(userRaw)?.role : null;

    const targetItem = items.find((i) => i.product.id === productId);

    if (token && userRole === 'CUSTOMER' && targetItem?.id) {
      try {
        const response = await cartApi.removeFromCart(targetItem.id);
        if (response && Array.isArray(response.items)) {
          setItems(mapCartResponseToItems(response));
          return;
        }
      } catch (err) {
        console.warn('[CartContext] Backend removeFromCart failed, removing locally:', err.message);
      }
    }

    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, [items]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    const token = localStorage.getItem('locvia_token');
    const userRaw = localStorage.getItem('locvia_user');
    const userRole = userRaw ? JSON.parse(userRaw)?.role : null;

    const targetItem = items.find((i) => i.product.id === productId);

    if (token && userRole === 'CUSTOMER' && targetItem?.id) {
      try {
        const response = await cartApi.updateCartItem(targetItem.id, quantity);
        if (response && Array.isArray(response.items)) {
          setItems(mapCartResponseToItems(response));
          return;
        }
      } catch (err) {
        console.warn('[CartContext] Backend updateCartItem failed, updating locally:', err.message);
      }
    }

    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id === productId) {
          const stock = i.product.stock !== undefined ? i.product.stock : (i.product.isAvailable ? 50 : 0);
          const maxAllowed = stock > 0 ? stock : 99;
          return { ...i, quantity: Math.min(quantity, maxAllowed) };
        }
        return i;
      })
    );
  }, [items, removeItem]);

  const clearCart = useCallback(async () => {
    const token = localStorage.getItem('locvia_token');
    const userRaw = localStorage.getItem('locvia_user');
    const userRole = userRaw ? JSON.parse(userRaw)?.role : null;

    if (token && userRole === 'CUSTOMER') {
      try {
        await cartApi.clearCart();
      } catch (err) {
        console.warn('[CartContext] Backend clearCart error:', err.message);
      }
    }

    setItems([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem('locvia_cart_items');
      localStorage.removeItem('locvia_cart_coupon');
    } catch (e) {
      console.error(e);
    }
  }, []);

  const getItemQuantity = useCallback(
    (productId) => {
      const item = items.find((i) => i.product.id === productId);
      return item ? item.quantity : 0;
    },
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCartFromApi,
        getItemQuantity,
        totalItems,
        totalAmount,
        totalMRP,
        totalSavings,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};


