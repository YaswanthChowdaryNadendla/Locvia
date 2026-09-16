// src/context/AddressContext.jsx
// Manages customer delivery addresses connecting to Spring Boot backend via addressApi.
// Zero mock data. Addresses start empty if none are saved in database.

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as addressApi from '../services/api/addressApi';
import { useAuth } from './AuthContext';

const AddressContext = createContext(null);

const normalizeAddress = (addr) => {
  if (!addr) return null;
  return {
    id: addr.id,
    fullName: addr.recipientName || addr.fullName || '',
    recipientName: addr.recipientName || addr.fullName || '',
    phone: addr.phoneNumber || addr.phone || '',
    phoneNumber: addr.phoneNumber || addr.phone || '',
    addressLine1: addr.addressLine1 || '',
    addressLine2: addr.addressLine2 || '',
    landmark: addr.landmark || '',
    city: addr.city || '',
    state: addr.state || '',
    pincode: addr.postalCode || addr.pincode || '',
    postalCode: addr.postalCode || addr.pincode || '',
    type: addr.label || addr.type || 'Home',
    label: addr.label || addr.type || 'Home',
    isDefault: !!(addr.defaultAddress || addr.isDefault),
    defaultAddress: !!(addr.defaultAddress || addr.isDefault),
  };
};

export const AddressProvider = ({ children }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Re-sync with backend API on mount or auth change
  const refreshAddresses = useCallback(async () => {
    const token = localStorage.getItem('locvia_token');
    const userRaw = localStorage.getItem('locvia_user');
    const userRole = userRaw ? JSON.parse(userRaw)?.role : null;

    if (token && userRole === 'CUSTOMER') {
      setLoading(true);
      try {
        const response = await addressApi.getAddresses();
        if (Array.isArray(response)) {
          setAddresses(response.map(normalizeAddress));
        } else {
          setAddresses([]);
        }
      } catch (err) {
        console.warn('[AddressContext] Could not fetch addresses from API:', err.message);
        setAddresses([]);
      } finally {
        setLoading(false);
      }
    } else {
      setAddresses([]);
    }
  }, []);

  useEffect(() => {
    refreshAddresses();
  }, [refreshAddresses, user?.id]);

  // Add Address
  const addAddress = useCallback(async (addressData) => {
    const token = localStorage.getItem('locvia_token');
    const userRaw = localStorage.getItem('locvia_user');
    const userRole = userRaw ? JSON.parse(userRaw)?.role : null;

    if (token && userRole === 'CUSTOMER') {
      const payload = {
        label: addressData.type || addressData.label || 'Home',
        recipientName: (addressData.fullName || addressData.recipientName || '').trim(),
        phoneNumber: (addressData.phone || addressData.phoneNumber || '').trim(),
        addressLine1: (addressData.addressLine1 || '').trim(),
        addressLine2: (addressData.addressLine2 || '').trim(),
        landmark: (addressData.landmark || '').trim(),
        city: (addressData.city || '').trim(),
        state: (addressData.state || '').trim(),
        postalCode: (addressData.pincode || addressData.postalCode || '').trim(),
        defaultAddress: !!addressData.isDefault,
      };

      try {
        const created = await addressApi.createAddress(payload);
        const normalized = normalizeAddress(created);
        setAddresses((prev) => {
          if (normalized.isDefault) {
            return [...prev.map(a => ({ ...a, isDefault: false })), normalized];
          }
          return [...prev, normalized];
        });
        return normalized.id;
      } catch (err) {
        console.error('[AddressContext] Failed to create address via API:', err);
        throw err;
      }
    }

    // Local fallback
    const newId = `addr_${Date.now()}`;
    const newAddr = normalizeAddress({ id: newId, ...addressData });
    setAddresses((prev) => [...prev, newAddr]);
    return newId;
  }, []);

  // Update Address
  const updateAddress = useCallback(async (id, updatedData) => {
    const token = localStorage.getItem('locvia_token');
    const userRaw = localStorage.getItem('locvia_user');
    const userRole = userRaw ? JSON.parse(userRaw)?.role : null;

    if (token && userRole === 'CUSTOMER' && typeof id === 'number') {
      const payload = {
        label: updatedData.type || updatedData.label || 'Home',
        recipientName: (updatedData.fullName || updatedData.recipientName || '').trim(),
        phoneNumber: (updatedData.phone || updatedData.phoneNumber || '').trim(),
        addressLine1: (updatedData.addressLine1 || '').trim(),
        addressLine2: (updatedData.addressLine2 || '').trim(),
        landmark: (updatedData.landmark || '').trim(),
        city: (updatedData.city || '').trim(),
        state: (updatedData.state || '').trim(),
        postalCode: (updatedData.pincode || updatedData.postalCode || '').trim(),
        defaultAddress: !!updatedData.isDefault,
      };

      try {
        const updated = await addressApi.updateAddress(id, payload);
        const normalized = normalizeAddress(updated);
        setAddresses((prev) =>
          prev.map((a) => (a.id === id ? normalized : (normalized.isDefault ? { ...a, isDefault: false } : a)))
        );
        return normalized;
      } catch (err) {
        console.error('[AddressContext] Failed to update address via API:', err);
        throw err;
      }
    }

    setAddresses((prev) => {
      const target = prev.find((a) => a.id === id);
      if (!target) return prev;
      const makeDefault = !!updatedData.isDefault;

      return prev.map((addr) => {
        if (addr.id === id) {
          return {
            ...addr,
            fullName: (updatedData.fullName || '').trim(),
            phone: (updatedData.phone || '').trim(),
            addressLine1: (updatedData.addressLine1 || '').trim(),
            addressLine2: (updatedData.addressLine2 || '').trim(),
            landmark: (updatedData.landmark || '').trim(),
            city: (updatedData.city || '').trim(),
            state: (updatedData.state || '').trim(),
            pincode: (updatedData.pincode || '').trim(),
            type: updatedData.type || 'Home',
            isDefault: makeDefault,
          };
        }
        if (makeDefault) {
          return { ...addr, isDefault: false };
        }
        return addr;
      });
    });
  }, []);

  // Delete Address
  const deleteAddress = useCallback(async (id) => {
    const token = localStorage.getItem('locvia_token');
    const userRaw = localStorage.getItem('locvia_user');
    const userRole = userRaw ? JSON.parse(userRaw)?.role : null;

    if (token && userRole === 'CUSTOMER' && typeof id === 'number') {
      try {
        await addressApi.deleteAddress(id);
      } catch (err) {
        console.error('[AddressContext] Failed to delete address via API:', err);
      }
    }

    setAddresses((prev) => {
      const target = prev.find((a) => a.id === id);
      const remaining = prev.filter((a) => a.id !== id);

      if (target?.isDefault && remaining.length > 0) {
        return remaining.map((addr, idx) => ({
          ...addr,
          isDefault: idx === 0,
        }));
      }
      return remaining;
    });
  }, []);

  // Set Default Address
  const setDefaultAddress = useCallback(async (id) => {
    const token = localStorage.getItem('locvia_token');
    const userRaw = localStorage.getItem('locvia_user');
    const userRole = userRaw ? JSON.parse(userRaw)?.role : null;

    if (token && userRole === 'CUSTOMER' && typeof id === 'number') {
      try {
        await addressApi.setDefaultAddress(id);
      } catch (err) {
        console.error('[AddressContext] Failed to set default address via API:', err);
      }
    }

    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  }, []);

  // Get current default address
  const getDefaultAddress = useCallback(() => {
    return addresses.find(a => a.isDefault) || addresses[0] || null;
  }, [addresses]);

  const defaultAddress = useMemo(() => getDefaultAddress(), [getDefaultAddress]);

  return (
    <AddressContext.Provider
      value={{
        addresses,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        getDefaultAddress,
        defaultAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAddress = () => {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddress must be used within AddressProvider');
  return ctx;
};
