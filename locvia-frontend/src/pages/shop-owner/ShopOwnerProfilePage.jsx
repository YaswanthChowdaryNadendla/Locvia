// src/pages/shop-owner/ShopOwnerProfilePage.jsx
// Dedicated Personal Profile & Account Settings for Shop Owners (Module 19)

import { useState, useEffect } from 'react';
import { useShopOwnerAuth } from '../../modules/shop-owner/auth/ShopOwnerAuthContext';
import { useAuth } from '../../context/AuthContext';
import { getOwnerShop } from '../../services/shopOwnerService';
import {
  User,
  Mail,
  Phone,
  Shield,
  Store,
  LogOut,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function ShopOwnerProfilePage() {
  // user and logout come from the unified auth context
  const { user, handleLogout: authLogout } = useAuth();
  // isShopOpen/toggleShopStatus remain in ShopOwnerAuthContext (shop-specific UI state)
  useShopOwnerAuth(); // keep provider in tree without destructuring auth data
  const [ownerShop, setOwnerShop] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    getOwnerShop().then(shop => setOwnerShop(shop)).catch(() => setOwnerShop(null));
  }, []);

  const handleLogout = () => {
    authLogout();
  };


  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: notification.type === 'error' ? '#EF4444' : '#10B981',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          {notification.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Owner Personal Profile
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '4px' }}>
          Manage your account security, personal credentials, and session state.
        </p>
      </div>

      {/* Profile Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          marginBottom: '1.5rem',
        }}
      >
        {/* Top Header Banner */}
        <div
          style={{
            backgroundColor: 'var(--color-primary-light, #E6F4EA)',
            padding: '2rem 1.5rem 1.5rem 1.5rem',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 700,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
          >
            {(user?.name || 'O').charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              {user?.name || 'Shop Owner'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span
                style={{
                  backgroundColor: '#D1FAE5',
                  color: '#059669',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                ROLE: {user?.role || 'SHOP_OWNER'}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                Store ID: #{ownerShop?.id}
              </span>
            </div>
          </div>
        </div>

        {/* Account Details List */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={infoRowStyle}>
            <div style={iconBoxStyle}>
              <User size={18} />
            </div>
            <div>
              <div style={infoLabelStyle}>Full Name</div>
              <div style={infoValueStyle}>{user?.name || 'Rajan Mehta'}</div>
            </div>
          </div>

          <div style={infoRowStyle}>
            <div style={iconBoxStyle}>
              <Mail size={18} />
            </div>
            <div>
              <div style={infoLabelStyle}>Email Address</div>
              <div style={infoValueStyle}>{user?.email || 'shopowner@locvia.com'}</div>
            </div>
          </div>

          <div style={infoRowStyle}>
            <div style={iconBoxStyle}>
              <Phone size={18} />
            </div>
            <div>
              <div style={infoLabelStyle}>Phone Number</div>
              <div style={infoValueStyle}>{user?.phone || '+91 98765 43210'}</div>
            </div>
          </div>

          <div style={infoRowStyle}>
            <div style={iconBoxStyle}>
              <Store size={18} />
            </div>
            <div>
              <div style={infoLabelStyle}>Managed Business</div>
              <div style={infoValueStyle}>{ownerShop?.name || 'Sri Lakshmi General Store'}</div>
            </div>
          </div>

          <div style={infoRowStyle}>
            <div style={iconBoxStyle}>
              <Shield size={18} />
            </div>
            <div>
              <div style={infoLabelStyle}>Security Verification</div>
              <div style={{ ...infoValueStyle, color: '#059669', fontWeight: 600 }}>
                Verified Shop Owner Account
              </div>
            </div>
          </div>

        </div>

        {/* Actions Footer */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: '#F9FAFB',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
            Session authenticated locally
          </span>

          <button
            onClick={handleLogout}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid #FCA5A5',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.15s ease',
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

      </div>

    </div>
  );
}

// ── Reusable Styles ─────────────────────────────────────────────
const infoRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
};

const iconBoxStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '8px',
  backgroundColor: '#F3F4F6',
  color: 'var(--color-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const infoLabelStyle = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const infoValueStyle = {
  fontSize: '0.95rem',
  fontWeight: 600,
  color: 'var(--color-text)',
  marginTop: '2px',
};
