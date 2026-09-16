// src/layouts/PublicLayout.jsx
// Standard page layout for unauthenticated or public pages (Home, Login, Register)

import { Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import OfflineBanner from '../components/common/OfflineBanner';
import InstallPrompt from '../components/common/InstallPrompt';
import PWAUpdatePrompt from '../components/common/PWAUpdatePrompt';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../data/users';

const PublicLayout = ({ children, hideFooter = false, allowInternalRoles = false }) => {
  const { user } = useAuth();

  if (!allowInternalRoles) {
    if (user?.role === ROLES.DELIVERY_PARTNER) {
      return <Navigate to="/delivery/dashboard" replace />;
    }
    if (user?.role === ROLES.SHOP_OWNER) {
      return <Navigate to="/shop-owner/dashboard" replace />;
    }
  }

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-main" id="main-content">
        {children}
      </main>
      {!hideFooter && <Footer />}

      {/* PWA: offline/online status banner */}
      <OfflineBanner />

      {/* PWA: browser install prompt */}
      <InstallPrompt />

      {/* PWA: update prompt */}
      <PWAUpdatePrompt />
    </div>
  );
};

export default PublicLayout;
