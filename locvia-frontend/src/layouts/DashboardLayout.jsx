// src/layouts/DashboardLayout.jsx
// Base layout for internal roles: Shop Owner, Delivery Partner, Admin
// Features a responsive sidebar (desktop), hamburger menu (mobile), and Module 38 Notifications

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { LocviaLogo } from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import OfflineBanner from '../components/common/OfflineBanner';
import InstallPrompt from '../components/common/InstallPrompt';
import PWAUpdatePrompt from '../components/common/PWAUpdatePrompt';
import NotificationBell from '../components/notifications/NotificationBell';
import NotificationToast from '../components/notifications/NotificationToast';
import { useNotifications } from '../hooks/useNotifications';

// Resolve effective user identity across diverse auth entry points
const getEffectiveUser = (authUser, roleName) => {
  if (roleName === 'Shop Owner') {
    if (authUser && (authUser.role === 'SHOP_OWNER' || authUser.id === 'user-02')) {
      return authUser;
    }
    try {
      const raw = localStorage.getItem('shopOwnerAuth');
      if (raw) {
        const so = JSON.parse(raw);
        return {
          id: so.id || 'user-02',
          name: so.ownerName || so.name || 'Shop Owner',
          email: so.email || 'shopowner@locvia.com',
          role: 'SHOP_OWNER',
          shopId: so.id,
        };
      }
    } catch {
      // safe fallback
    }
    return authUser || { id: 'user-02', role: 'SHOP_OWNER', name: 'Rajan Mehta' };
  }

  if (roleName === 'Delivery Partner') {
    if (authUser && (authUser.role === 'DELIVERY_PARTNER' || authUser.id === 'user-partner')) {
      return authUser;
    }
    return authUser || { id: 'user-partner', role: 'DELIVERY_PARTNER', name: 'Suresh Kumar' };
  }

  return authUser;
};

const DashboardLayout = ({ children, links, roleName }) => {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Role Isolation for Notifications (Shop Owner & Delivery Partner only; never Admin)
  const isNotificationRole = roleName === 'Shop Owner' || roleName === 'Delivery Partner';
  const notifRole = roleName === 'Delivery Partner' ? 'DELIVERY_PARTNER' : 'SHOP_OWNER';

  const effectiveUser = getEffectiveUser(user, roleName);
  const notif = useNotifications(isNotificationRole ? effectiveUser : null);

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      <div className="dashboard-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <LocviaLogo />
          {isNotificationRole && (
            <NotificationBell
              notifications={notif.notifications}
              unreadCount={notif.unreadCount}
              isSoundOn={notif.isSoundOn}
              onToggleSound={notif.toggleSound}
              onMarkAsRead={notif.markAsRead}
              onMarkAllAsRead={notif.markAllAsRead}
              role={notifRole}
            />
          )}
        </div>
        <span className="dashboard-role-badge">{roleName}</span>
      </div>

      <nav className="dashboard-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `dashboard-nav-link ${isActive ? 'active' : ''}`
            }
            onClick={() => setMobileMenuOpen(false)}
          >
            <link.icon className="dashboard-nav-icon" size={20} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="dashboard-sidebar-footer">
        <div className="dashboard-user-info">
          <div className="dashboard-avatar">
            {effectiveUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="dashboard-user-details">
            <span className="dashboard-user-name">{effectiveUser?.name || 'User'}</span>
            <span className="dashboard-user-email">{effectiveUser?.email}</span>
          </div>
        </div>
        <button className="dashboard-logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="dashboard-layout">
      {/* ── Desktop Sidebar ── */}
      <aside className="dashboard-sidebar hide-mobile">
        <SidebarContent />
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="dashboard-mobile-header hide-desktop">
        <LocviaLogo size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="dashboard-role-badge">{roleName}</span>
          {isNotificationRole && (
            <NotificationBell
              notifications={notif.notifications}
              unreadCount={notif.unreadCount}
              isSoundOn={notif.isSoundOn}
              onToggleSound={notif.toggleSound}
              onMarkAsRead={notif.markAsRead}
              onMarkAllAsRead={notif.markAllAsRead}
              role={notifRole}
            />
          )}
          <button
            className="dashboard-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* ── Mobile Off-Canvas Menu ── */}
      {mobileMenuOpen && (
        <div className="dashboard-mobile-menu hide-desktop">
          <SidebarContent />
        </div>
      )}

      {/* ── Main Content Area ── */}
      <main className="dashboard-main">
        <div className="dashboard-content-wrapper">
          {children}
        </div>
      </main>

      {/* Floating In-App Notification Toast */}
      {isNotificationRole && notif.activeToast && (
        <NotificationToast
          toast={notif.activeToast}
          onDismiss={notif.dismissToast}
          onMarkAsRead={notif.markAsRead}
        />
      )}

      {/* PWA Components */}
      <OfflineBanner />
      <InstallPrompt />
      <PWAUpdatePrompt />
    </div>
  );
};

export default DashboardLayout;
