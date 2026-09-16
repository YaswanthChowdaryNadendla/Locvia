// src/components/layout/Footer.jsx
// Locvia professional footer

import { Link } from 'react-router-dom';
import { LocviaLogo } from './Navbar';
import {
  Mail,
  Phone,
} from 'lucide-react';
import usePWAInstall from '../../hooks/usePWAInstall';
import appleStoreBadge from '../../assets/Apple Logo.webp';
import googlePlayBadge from '../../assets/Android Logo.webp';

const footerLinks = {
  Company: [
    { label: 'About Locvia', to: '/about' },
    { label: 'Careers', to: '/careers' },
    { label: 'Blog', to: '/blog' },
    { label: 'Contact Us', to: '/contact' },
  ],
  Help: [
    { label: 'Help Centre', to: '/help' },
    { label: 'Track Order', to: '/track-order' },
    { label: 'Refund Policy', to: '/refund-policy' },
    { label: 'Delivery Info', to: '/delivery-info' },
  ],
  'Join As': [
    { label: 'Customer', to: '/join/customer' },
    { label: 'Shop Owner', to: '/join/shop-owner' },
    { label: 'Delivery Partner', to: '/join/delivery-partner' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Cookie Policy', to: '/cookie-policy' },
  ],
};

const Footer = () => {
  const { isInstalled, canInstall, isIOS, triggerInstall } = usePWAInstall();

  const handleAppStoreClick = () => {
    if (isInstalled) {
      alert('Locvia is already installed on your device!');
    } else if (isIOS) {
      alert(
        "To install Locvia on iOS:\n1. Tap the Share button in Safari (square with up arrow)\n2. Select 'Add to Home Screen'"
      );
    } else if (canInstall) {
      triggerInstall();
    } else {
      alert(
        "To install Locvia on iOS (App Store):\n1. Open Locvia in Safari on your iPhone/iPad\n2. Tap the Share button\n3. Select 'Add to Home Screen'"
      );
    }
  };

  const handleGooglePlayClick = () => {
    if (isInstalled) {
      alert('Locvia is already installed on your device!');
    } else if (canInstall) {
      triggerInstall();
    } else if (isIOS) {
      alert(
        "To install Locvia on iOS:\n1. Tap the Share button in Safari (square with up arrow)\n2. Select 'Add to Home Screen'"
      );
    } else {
      alert(
        "To install Locvia (Google Play / PWA):\nOpen Locvia in Google Chrome or Edge and tap the install icon in your address bar, or tap 'Install app' in Chrome's menu."
      );
    }
  };

  return (
    <footer className="locvia-footer">
      {/* Main footer content */}
      <div className="locvia-container locvia-footer-container">
        <div className="locvia-footer-grid">
          {/* Brand column */}
          <div className="footer-brand-col">
            <LocviaLogo white size="sm" />

            <p className="footer-tagline">
              "Connecting You to Local."
            </p>
            <p className="footer-desc">
              Locvia bridges the gap between customers and local shops, supporting
              neighbourhood businesses and fast hyperlocal delivery.
            </p>

            {/* Contact */}
            <div className="footer-contact-list">
              <a
                href="mailto:hello@locvia.com"
                className="footer-contact-item"
              >
                <Mail size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                hello@locvia.com
              </a>
              <a
                href="tel:+919876543210"
                className="footer-contact-item"
              >
                <Phone size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                +91 98765 43210
              </a>
            </div>
          </div>

          {/* Links columns wrapper */}
          <div className="footer-links-wrapper">
            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section} className="footer-col">
                <h3 className="footer-col-title">
                  {section}
                </h3>
                <ul className="footer-nav-list">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="footer-link"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Download App section (right side) */}
          <div className="footer-download-col">
            <h3 className="footer-col-title">Download App</h3>
            <div className="footer-app-badges">
              <button
                type="button"
                onClick={handleAppStoreClick}
                className="footer-app-badge-btn"
                aria-label="Download on the App Store"
                title="Download on the App Store"
              >
                <img
                  src={appleStoreBadge}
                  alt="Download on the App Store"
                  className="footer-app-badge-img"
                  loading="lazy"
                />
              </button>

              <button
                type="button"
                onClick={handleGooglePlayClick}
                className="footer-app-badge-btn"
                aria-label="Get it on Google Play"
                title="Get it on Google Play"
              >
                <img
                  src={googlePlayBadge}
                  alt="Get it on Google Play"
                  className="footer-app-badge-img"
                  loading="lazy"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="locvia-footer-bottom">
        <div className="locvia-container footer-bottom-inner">
          <p className="footer-copy">
            © {new Date().getFullYear()} Locvia Technologies Pvt. Ltd. All rights reserved.
          </p>
          <p className="footer-tag">
            Made with 💚 for local communities.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
