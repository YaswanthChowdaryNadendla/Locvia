import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Package, User, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../data/users';

const BottomNavigation = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();

  // Hide bottom navigation for internal roles (DELIVERY_PARTNER, SHOP_OWNER, ADMIN)
  if (user?.role === ROLES.DELIVERY_PARTNER || user?.role === ROLES.SHOP_OWNER || user?.role === ROLES.ADMIN) {
    return null;
  }

  const isCustomer = user?.role === ROLES.CUSTOMER;

  // Highlight active tab
  const isActive = (path) => location.pathname === path;

  return (
    <div
      className="hide-desktop"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0.75rem 0.5rem calc(0.75rem + env(safe-area-inset-bottom)) 0.5rem',
        zIndex: 'var(--z-navbar)',
      }}
    >
      <NavItem to="/customer" icon={Home} label="Home" active={isActive('/customer') || isActive('/')} />
      <NavItem to="/customer/shops" icon={Store} label="Shops" active={isActive('/customer/shops')} />
      <NavItem to="/customer/products" icon={Package} label="Explore" active={isActive('/customer/products')} />
      {isCustomer && (
        <NavItem to="/customer/cart" icon={ShoppingCart} label="Cart" active={isActive('/customer/cart')} badge={totalItems} />
      )}
      <NavItem to={user ? '/customer/profile' : '/login'} icon={User} label={user ? 'Profile' : 'Login'} active={isActive('/customer/profile') || isActive('/login')} />
    </div>
  );
};

const NavItem = ({ to, icon: Icon, label, active, badge }) => (
  <Link
    to={to}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      color: active ? 'var(--color-primary-dark)' : 'var(--color-gray-500)',
      textDecoration: 'none',
      position: 'relative',
      minWidth: '64px',
    }}
  >
    <div style={{ position: 'relative' }}>
      <Icon size={24} strokeWidth={active ? 2.5 : 2} style={{ transition: 'all 0.2s' }} />
      {badge > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-8px',
            background: 'var(--color-primary)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            borderRadius: '9999px',
            padding: '2px 6px',
            lineHeight: 1,
            border: '2px solid white',
          }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
    <span style={{ fontSize: '11px', fontWeight: active ? 600 : 500, transition: 'all 0.2s' }}>
      {label}
    </span>
  </Link>
);

export default BottomNavigation;
