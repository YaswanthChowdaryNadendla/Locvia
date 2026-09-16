// src/modules/shop-owner/auth/ShopOwnerProtectedRoute.jsx
// Guards /shop-owner/* and /shop/* routes strictly for authenticated Shop Owners.
// Uses the global AuthContext — the single source of auth truth for all roles.

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const ShopOwnerProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, user, isInitialized } = useAuth();

  // Wait for session hydration before making a redirect decision
  if (!isInitialized) {
    return null;
  }

  // Not authenticated at all → send to unified /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but wrong role → send to their actual dashboard
  if (user?.role !== 'SHOP_OWNER') {
    if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'DELIVERY_PARTNER') return <Navigate to="/delivery/dashboard" replace />;
    return <Navigate to="/customer" replace />;
  }

  return children;
};

export default ShopOwnerProtectedRoute;
