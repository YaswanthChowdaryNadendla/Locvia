// src/App.jsx
// Root application component — wraps contexts, error boundary, and routes

import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AddressProvider } from './context/AddressContext';
import { LocationProvider } from './context/LocationContext';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppRoutes from './routes';
import axiosClient, { API_BASE_URL } from './services/api/axiosClient';

const App = () => {
  // Pre-warm Render backend on initial application mount (fire-and-forget to eliminate cold starts)
  useEffect(() => {
    if (API_BASE_URL && API_BASE_URL.includes('onrender.com')) {
      axiosClient.get('/health', { timeout: 60000 }).catch(() => {
        // Non-blocking background wake-up probe; safe to ignore errors
      });
    }
  }, []);
  return (
    <BrowserRouter>
      <AuthProvider>
        <AddressProvider>
          <LocationProvider>
            <CartProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </CartProvider>
          </LocationProvider>
        </AddressProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
