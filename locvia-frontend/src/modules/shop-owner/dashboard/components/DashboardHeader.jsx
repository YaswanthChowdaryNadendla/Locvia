import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronDown, User, Settings, HelpCircle, LogOut, Store } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { getOwnerShop } from '../../../../services/shopOwnerService';
import NotificationBell from '../../../../components/notifications/NotificationBell';
import { useNotifications } from '../../../../hooks/useNotifications';

export default function DashboardHeader() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const effectiveUser =
    user && (user.role === 'SHOP_OWNER' || user.id === 'user-02')
      ? user
      : { id: 'user-02', role: 'SHOP_OWNER', name: 'Rajan Mehta', email: 'shopowner@locvia.com' };

  const notif = useNotifications(effectiveUser);
  const ownerShop = getOwnerShop(effectiveUser);

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    handleLogout();
    navigate('/login');
  };

  return (
    <header className="shop-dash-header">
      <div className="shop-dash-header-title">
        <h1 className="dash-title-text">Shop Dashboard</h1>
        <p className="dash-title-sub">Manage your shop, products, inventory and orders.</p>
      </div>

      <div className="shop-dash-header-actions">
        
        {/* Notifications Bell */}
        <NotificationBell
          notifications={notif.notifications}
          unreadCount={notif.unreadCount}
          isSoundOn={notif.isSoundOn}
          onToggleSound={notif.toggleSound}
          onMarkAsRead={notif.markAsRead}
          onMarkAllAsRead={notif.markAllAsRead}
          role="SHOP_OWNER"
        />

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="dash-user-trigger"
            aria-expanded={isDropdownOpen}
          >
            <div className="dash-avatar-circle">
              {ownerShop?.name ? ownerShop.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="dash-user-text hide-mobile">
              <span className="dash-shop-name">{ownerShop?.name || 'My Shop'}</span>
              <span className="dash-owner-name">{user?.name || 'Shop Owner'}</span>
            </div>
            <ChevronDown size={16} className={`dash-chevron ${isDropdownOpen ? 'rotated' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
              <div className="dash-user-dropdown animate-scale-in">
                <div className="dropdown-shop-info">
                  <span className="dropdown-shop-title">{ownerShop?.name || 'My Shop'}</span>
                  <span className="dropdown-shop-email">{user?.email || 'shopowner@locvia.com'}</span>
                </div>

                <div className="dropdown-divider" />

                <Link to="/shop-owner/profile" onClick={() => setIsDropdownOpen(false)} className="dropdown-item">
                  <User size={16} /> My Profile
                </Link>
                <Link to="/shop-owner/dashboard" onClick={() => setIsDropdownOpen(false)} className="dropdown-item">
                  <Store size={16} /> Shop Dashboard
                </Link>
                <Link to="/shop-owner/shop-profile" onClick={() => setIsDropdownOpen(false)} className="dropdown-item">
                  <Settings size={16} /> Shop Profile
                </Link>
                <a href="#help" onClick={(e) => { e.preventDefault(); alert('Help Center: support@locvia.com'); setIsDropdownOpen(false); }} className="dropdown-item">
                  <HelpCircle size={16} /> Help & Support
                </a>

                <div className="dropdown-divider" />

                <button
                  onClick={() => { setIsDropdownOpen(false); setIsLogoutModalOpen(true); }}
                  className="dropdown-item danger"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '1.5rem', textAlign: 'center' }}>
            
            <div className="logout-modal-icon">
              <LogOut size={24} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-gray-900)', margin: '0 0 0.5rem' }}>
              Are you sure you want to logout?
            </h3>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              You'll need to sign in again to access your Shop Dashboard and accept customer orders.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.65rem 1rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="btn-danger"
                style={{ flex: 1, padding: '0.65rem 1rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign Out
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
