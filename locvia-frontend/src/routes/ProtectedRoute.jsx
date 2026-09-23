// src/routes/ProtectedRoute.jsx
// Guards routes based on authentication and role

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/common/loaders/PageLoader';

/**
 * Props:
 *  allowedRoles  - string[] (e.g. ['CUSTOMER', 'ADMIN'])
 *                  If empty or undefined, only requires authentication.
 *  children      - JSX to render if authorized
 */

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, user, isInitialized = true } = useAuth();
  const location = useLocation();

  // If auth state is still initializing, display compact PageLoader to prevent flash
  if (!isInitialized) {
    return <PageLoader message="Verifying session..." />;
  }

  // Not logged in → redirect to /login, preserve intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user?.role)) {
      // Logged in but wrong role → redirect to their dedicated home
      if (user?.role === 'SHOP_OWNER') {
        return <Navigate to="/shop-owner/dashboard" replace />;
      }
      if (user?.role === 'DELIVERY_PARTNER') {
        return <Navigate to="/delivery/dashboard" replace />;
      }
      if (user?.role === 'ADMIN') {
        return <Navigate to="/admin/users" replace />;
      }
      if (user?.role === 'CUSTOMER') {
        return <Navigate to="/customer" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }


  return children;
};

export default ProtectedRoute;
