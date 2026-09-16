// src/modules/shop-owner/auth/ShopOwnerAuthContext.jsx
// Decoupled state provider for Locvia Shop Owner UI state (open/closed toggle)

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

  // Sync shop open status when shopOwner changes
  useEffect(() => {
    if (shopOwner) {
      setIsShopOpen(shopOwner.isOpen ?? true);
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

  // Toggle Shop Open/Closed status
  const toggleShopStatus = useCallback(() => {
    setIsShopOpen((prev) => {
      const nextState = !prev;
      setShopOwner((current) => {
        if (!current) return current;
        const updated = { ...current, isOpen: nextState };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      return nextState;
    });
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
