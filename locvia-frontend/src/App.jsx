// src/App.jsx
// Root application component — wraps contexts, error boundary, and routes

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AddressProvider } from './context/AddressContext';
import { LocationProvider } from './context/LocationContext';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppRoutes from './routes';

const App = () => {
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
