// src/modules/shop-owner/auth/ShopOwnerAuthContext.jsx
// Decoupled state provider for Locvia Shop Owner UI state (open/closed toggle)

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getOwnerShop, updateShopDetails } from '../../../services/shopOwnerService';

const ShopOwnerAuthContext = createContext(null);
const STORAGE_KEY = 'shopOwnerAuth';

export const ShopOwnerAuthProvider = ({ children }) => {
  const [shopOwner, setShopOwner] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.error('Error reading shopOwnerAuth from storage:', err);
    }
    return null;
  });

  const [isShopOpen, setIsShopOpen] = useState(() => {
    return shopOwner?.isOpen ?? true;
  });

  // Fetch true backend shop state on mount to sync open/closed status
  useEffect(() => {
    let isMounted = true;
    getOwnerShop()
      .then((shop) => {
        if (!isMounted || !shop) return;
        const open = shop.isOpen !== undefined ? Boolean(shop.isOpen) : true;
        setShopOwner((current) => {
          const updated = {
            ...(current || {}),
            id: shop.id,
            name: shop.name,
            isOpen: open,
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        setIsShopOpen(open);
      })
      .catch((err) => {
        console.warn('Could not sync owner shop in ShopOwnerAuthContext:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync shop open status when shopOwner changes
  useEffect(() => {
    if (shopOwner && shopOwner.isOpen !== undefined) {
      setIsShopOpen(Boolean(shopOwner.isOpen));
    }
  }, [shopOwner]);

  // Login handler
  const login = useCallback(({ email, password }) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    // Check if user was registered locally
    try {
      const registeredRaw = localStorage.getItem('locvia_registered_shop');
      if (registeredRaw) {
        const registered = JSON.parse(registeredRaw);
        if (
          (registered.email.toLowerCase() === cleanEmail || registered.shopName.toLowerCase() === cleanEmail) &&
          registered.password === cleanPass
        ) {
          const userObj = {
            id: registered.id || `shop-${Date.now()}`,
            name: registered.shopName,
            ownerName: registered.ownerName,
            email: registered.email,
            phone: registered.phone,
            category: registered.category || 'Grocery',
            address: registered.address || 'Bengaluru, Karnataka',
            isOpen: true,
            rating: 5.0,
            totalRatings: 1,
            acceptanceRate: 100,
            onTimePrepRate: 100,
            lastLogin: new Date().toISOString(),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
          setShopOwner(userObj);
          setIsShopOpen(true);
          return userObj;
        }
      }
    } catch (err) {
      console.error('Error checking registered shop credentials:', err);
    }

    throw new Error('Invalid email/shop ID or password. Use demo credentials: shopowner@locvia.com / shopowner123');
  }, []);

  // Register handler
  const register = useCallback((data) => {
    const registeredObj = {
      id: `shop-${Date.now()}`,
      shopName: data.shopName.trim(),
      ownerName: data.ownerName.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      password: data.password,
      category: data.category || 'Grocery',
      address: data.address.trim(),
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('locvia_registered_shop', JSON.stringify(registeredObj));
    return registeredObj;
  }, []);

  // Toggle Shop Open/Closed status and persist to backend
  const toggleShopStatus = useCallback(async () => {
    let nextState;
    setIsShopOpen((prev) => {
      nextState = !prev;
      setShopOwner((current) => {
        if (!current) return current;
        const updated = { ...current, isOpen: nextState };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      return nextState;
    });

    try {
      const shop = await getOwnerShop();
      if (shop?.id && nextState !== undefined) {
        await updateShopDetails(shop.id, { isOpen: nextState });
      }
    } catch (err) {
      console.error('Failed to sync shop status update to backend:', err);
    }
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShopOwner(null);
  }, []);

  return (
    <ShopOwnerAuthContext.Provider
      value={{
        shopOwner,
        isAuthenticated: !!shopOwner,
        isShopOpen,
        login,
        register,
        toggleShopStatus,
        logout,
      }}
    >
      {children}
    </ShopOwnerAuthContext.Provider>
  );
};

export const useShopOwnerAuth = () => {
  const ctx = useContext(ShopOwnerAuthContext);
  if (!ctx) throw new Error('useShopOwnerAuth must be used within ShopOwnerAuthProvider');
  return ctx;
};
