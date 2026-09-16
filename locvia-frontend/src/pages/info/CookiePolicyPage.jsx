// src/pages/info/CookiePolicyPage.jsx
// Module: Legal Pages — Cookie Policy (/cookie-policy)

import { Link } from 'react-router-dom';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

export default function CookiePolicyPage() {
  return (
    <InfoPageWrapper
      badge="Legal"
      title="Cookie Policy"
      subtitle="How Locvia uses browser storage and essential cookies."
      breadcrumb={[{ label: 'Cookie Policy' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', fontSize: '0.9375rem', lineHeight: 1.7, color: '#334155' }}>
        <p style={{ margin: 0 }}>
          This Cookie Policy explains how Locvia uses cookies and local browser storage technologies to maintain platform security, authenticate users, and remember essential preferences.
        </p>

        <div>
          <h2 style={sectionTitleStyle}>1. What Are Cookies and Local Storage?</h2>
          <p style={{ margin: 0 }}>
            Cookies and browser local storage are small data files placed on your device by websites you visit. They allow web applications to remember your session, keep you logged in between page visits, and persist cart items.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>2. Essential Cookies & Storage Keys</h2>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            Locvia utilizes strictly essential cookies and browser storage keys necessary for the application to function. These include:
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>
              <strong>Authentication Tokens:</strong> Secure JWT credentials that verify your identity when browsing your account, cart, or merchant dashboard.
            </li>
            <li>
              <strong>Cart Storage:</strong> Temporary device storage that retains selected items in your shopping cart while browsing products.
            </li>
            <li>
              <strong>Delivery Location Preferences:</strong> Storing selected delivery area to display nearby stores and accurate delivery estimates.
            </li>
          </ul>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>3. Preference & Session Management</h2>
          <p style={{ margin: 0 }}>
            These storage mechanisms ensure you do not have to re-enter your credentials or reselect your delivery location every time you navigate to a new page or reload the browser.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>4. Managing Cookies and Storage</h2>
          <p style={{ margin: 0 }}>
            You can control or delete browser cookies and local storage through your browser settings. However, disabling essential cookies or storage may prevent you from logging into your account, maintaining a cart, or completing checkout.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>5. Contact Us</h2>
          <p style={{ margin: 0 }}>
            If you have any questions regarding our use of cookies and local storage, please visit our{' '}
            <Link to="/contact" style={{ color: '#16A34A', fontWeight: 600 }}>
              Contact Page
            </Link>{' '}
            or email us at{' '}
            <a href="mailto:support@locvia.com" style={{ color: '#16A34A', fontWeight: 600 }}>
              support@locvia.com
            </a>
            .
          </p>
        </div>
      </div>
    </InfoPageWrapper>
  );
}

const sectionTitleStyle = {
  fontSize: '1.125rem',
  fontWeight: 700,
  color: '#0F172A',
  margin: '0 0 0.5rem 0',
};
