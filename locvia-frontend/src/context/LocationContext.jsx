// src/context/LocationContext.jsx
// Manages customer delivery location state, browser Geolocation API,
// OpenStreetMap Nominatim reverse geocoding, and integration with M12 saved addresses.

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAddress } from './AddressContext';

const LocationContext = createContext(null);

const STORAGE_KEY = 'locvia_selected_location';

export const LocationProvider = ({ children }) => {
  const { defaultAddress, addresses } = useAddress();

  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to load saved location:', err);
    }
    return null;
  });

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectingStage, setDetectingStage] = useState(null); // 'gps_fast' | 'gps_precise' | 'geocoding' | null
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      if (selectedLocation) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedLocation));
      }
    } catch (err) {
      console.error('Failed to persist location:', err);
    }
  }, [selectedLocation]);

  // Query browser permissions if supported
  const checkPermissionState = async () => {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state; // 'granted' | 'prompt' | 'denied'
      } catch {
        return 'prompt';
      }
    }
    return 'prompt';
  };

  // Reverse Geocoding Helper via OpenStreetMap Nominatim API
  const reverseGeocode = async (lat, lon) => {
    try {
      const params = new URLSearchParams({
        format: 'json',
        lat: lat.toString(),
        lon: lon.toString(),
        zoom: '12',
        addressdetails: '1',
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();
      const addr = data.address || {};

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        addr.county ||
        addr.state_district ||
        'Current Location';

      const state = addr.state || '';
      const displayName = state ? `${city}, ${state}` : city;

      return {
        city,
        state,
        displayName,
      };
    } catch (err) {
      console.warn('Reverse geocoding failed, using fallback display:', err);
      // Reverse geocoding failure MUST NOT be treated as a GPS failure!
      return {
        city: 'Current Location',
        state: '',
        displayName: 'Current GPS Location',
      };
    }
  };

  // Process successful GPS coordinates
  const handleLocationSuccess = useCallback(async (position) => {
    const { latitude, longitude } = position.coords;
    setDetectingStage('geocoding');

    const geoResult = await reverseGeocode(latitude, longitude);

    const newLoc = {
      type: 'gps',
      label: null,
      cityName: geoResult.city,
      stateName: geoResult.state,
      displayName: geoResult.displayName,
      latitude,
      longitude,
      addressId: null,
      timestamp: Date.now(),
    };

    setSelectedLocation(newLoc);
    setIsDetecting(false);
    setDetectingStage(null);
    setError(null);
    setErrorCode(null);
  }, []);

  // Map final geolocation error codes to user messages
  const handleFinalError = useCallback((err) => {
    const code = err ? err.code : 0;
    switch (code) {
      case 1: // PERMISSION_DENIED
        setError('Location permission denied. Please allow location access in your browser settings.');
        setErrorCode('PERMISSION_DENIED');
        break;
      case 2: // POSITION_UNAVAILABLE
        setError('Your location is currently unavailable. Please try again or choose a saved address.');
        setErrorCode('POSITION_UNAVAILABLE');
        break;
      case 3: // TIMEOUT (after BOTH attempts failed)
        setError('Location detection timed out. Please try again or choose a saved address.');
        setErrorCode('TIMEOUT');
        break;
      default:
        setError('Unable to detect your location. Please try again or choose a saved address.');
        setErrorCode('POSITION_UNAVAILABLE');
        break;
    }
  }, []);

  // Detect location with 2-attempt fallback configuration
  const detectCurrentLocation = useCallback(async () => {
    if (isDetecting) return; // Prevent duplicate concurrent requests

    if (!navigator.geolocation) {
      setError('Location detection is not supported by this browser.');
      setErrorCode('NOT_SUPPORTED');
      return;
    }

    const permState = await checkPermissionState();
    if (permState === 'denied') {
      setError('Location permission is blocked. Please enable location permission for this site in your browser settings.');
      setErrorCode('PERMISSION_DENIED');
      return;
    }

    setIsDetecting(true);
    setDetectingStage('gps_fast');
    setError(null);
    setErrorCode(null);

    // ── Attempt 1: Fast / Low Accuracy ──
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationSuccess(position);
      },
      (err1) => {
        // If Attempt 1 times out (code 3), run Attempt 2
        if (err1.code === 3 || err1.code === 3 /* TIMEOUT */) {
          setDetectingStage('gps_precise');

          // ── Attempt 2: High Accuracy / Longer Timeout ──
          navigator.geolocation.getCurrentPosition(
            (position) => {
              handleLocationSuccess(position);
            },
            (err2) => {
              setIsDetecting(false);
              setDetectingStage(null);
              handleFinalError(err2);
            },
            {
              enableHighAccuracy: true,
              timeout: 30000,
              maximumAge: 0,
            }
          );
        } else {
          // For PERMISSION_DENIED (1) or POSITION_UNAVAILABLE (2), fail immediately without Attempt 2
          setIsDetecting(false);
          setDetectingStage(null);
          handleFinalError(err1);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 300000,
      }
    );
  }, [isDetecting, handleLocationSuccess, handleFinalError]);

  // Select a saved address from M12
  const selectSavedAddress = useCallback((addr) => {
    if (!addr) return;
    const cityName = addr.city || addr.state || '';
    const newLoc = {
      type: 'saved',
      label: addr.type || 'Home',
      cityName: cityName,
      stateName: addr.state || '',
      displayName: addr.addressLine1 ? `${addr.addressLine1}, ${cityName}` : cityName,
      latitude: addr.lat || null,
      longitude: addr.lng || null,
      addressId: addr.id,
      timestamp: Date.now(),
    };
    setSelectedLocation(newLoc);
    setError(null);
    setErrorCode(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  // Active address object if selectedLocation points to a saved M12 address
  const activeSavedAddress = useMemo(() => {
    if (selectedLocation?.type === 'saved' && selectedLocation.addressId) {
      return addresses.find((a) => a.id === selectedLocation.addressId) || null;
    }
    return null;
  }, [selectedLocation, addresses]);

  // Unified delivery location text display for Navbar, Hero, and all pages
  const locationDisplayText = useMemo(() => {
    // 1. Explicitly selected location (saved M12 address or GPS)
    if (selectedLocation) {
      if (selectedLocation.type === 'saved') {
        const addr = activeSavedAddress;
        if (addr) {
          const label = addr.type || selectedLocation.label || 'Home';
          const city = addr.city || addr.state || selectedLocation.cityName || '';
          return city ? `${label}, ${city}` : label;
        }
        // If address was deleted or not found, try stored selected location fields
        if (selectedLocation.cityName || selectedLocation.label) {
          const label = selectedLocation.label || 'Home';
          const city = selectedLocation.cityName || selectedLocation.stateName || '';
          return city ? `${label}, ${city}` : label;
        }
      } else if (selectedLocation.type === 'gps') {
        const city = selectedLocation.cityName || selectedLocation.displayName || '';
        return city || 'Current Location';
      }
    }

    // 2. Default saved address from M12
    if (defaultAddress) {
      const label = defaultAddress.type || 'Home';
      const city = defaultAddress.city || defaultAddress.state || defaultAddress.addressLine1 || '';
      return city ? `${label}, ${city}` : label;
    }

    // 3. Fallback
    return 'Select location';
  }, [selectedLocation, activeSavedAddress, defaultAddress]);

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        locationDisplayText,
        isDetecting,
        detectingStage,
        error,
        errorCode,
        detectCurrentLocation,
        selectSavedAddress,
        clearError,
        activeSavedAddress,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDeliveryLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useDeliveryLocation must be used within LocationProvider');
  return ctx;
};
