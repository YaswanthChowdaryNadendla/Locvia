// src/context/AuthContext.jsx
// Provides authentication state throughout the app.
// Connects to Spring Boot JWT backend via authService → authApi → axiosClient.

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  login,
  logout,
  register,
  getCurrentUser,
  fetchCurrentUser,
  updateUserProfile,
} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize from localStorage for immediate render (no flash of unauthenticated state)
  const [user, setUser] = useState(() => getCurrentUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  // ── Session Hydration & Expiry Listener on Mount ──────────────────────────
  useEffect(() => {
    const hydrateSession = async () => {
      const freshUser = await fetchCurrentUser();
      if (freshUser) {
        setUser(freshUser);
      } else {
        // Token was invalid/expired — clear user state
        setUser(null);
      }
      setIsInitialized(true);
    };

    hydrateSession();

    // Listen for 401 session expiry events dispatched by axiosClient interceptor
    const handleSessionExpired = () => {
      setUser(null);
      setError('Your session has expired. Please log in again.');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('locvia:auth:session_expired', handleSessionExpired);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('locvia:auth:session_expired', handleSessionExpired);
      }
    };
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = useCallback(async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await login(credentials);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const handleRegister = useCallback(async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await register(data);
      if (result?.token && result?.user) {
        setUser(result.user);
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Update Profile ────────────────────────────────────────────────────────
  const handleUpdateProfile = useCallback((updatedFields) => {
    const updated = updateUserProfile(updatedFields);
    if (updated) {
      setUser(updated);
    }
    return updated;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        isAuthenticated: !!user,
        isInitialized,
        handleLogin,
        handleRegister,
        handleUpdateProfile,
        handleLogout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
