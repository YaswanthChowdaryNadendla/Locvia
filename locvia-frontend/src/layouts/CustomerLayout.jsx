// src/layouts/CustomerLayout.jsx
// Layout for authenticated customer pages.
// Currently mirrors PublicLayout, but semantically separated to allow
// future customer-specific features (e.g., a sticky mobile bottom nav).

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import OfflineBanner from '../components/common/OfflineBanner';
import InstallPrompt from '../components/common/InstallPrompt';
import PWAUpdatePrompt from '../components/common/PWAUpdatePrompt';
import BottomNavigation from '../components/layout/BottomNavigation';

const CustomerLayout = ({ children, hideFooter = false }) => {
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

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default CustomerLayout;
