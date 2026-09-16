// src/layouts/MainLayout.jsx
// Standard page layout: Navbar + main content + Footer

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import OfflineBanner from '../components/common/OfflineBanner';
import InstallPrompt from '../components/common/InstallPrompt';
import PWAUpdatePrompt from '../components/common/PWAUpdatePrompt';

const MainLayout = ({ children, hideFooter = false }) => {
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

export default MainLayout;

