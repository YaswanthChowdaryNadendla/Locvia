import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Compass, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../data/users';

const BottomNavigation = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();

  // Hide bottom navigation for internal operational roles (DELIVERY_PARTNER, SHOP_OWNER, ADMIN)
  if (user?.role === ROLES.DELIVERY_PARTNER || user?.role === ROLES.SHOP_OWNER || user?.role === ROLES.ADMIN) {
    return null;
  }

  const isCustomer = user?.role === ROLES.CUSTOMER;

  // Active state matchers
  const isHomeActive = () => {
    return (
      location.pathname === '/' ||
      location.pathname === '/home' ||
      location.pathname === '/customer' ||
      location.pathname === '/customer/'
    );
  };

  const isShopsActive = () => {
    return (
      location.pathname.startsWith('/shops') ||
      location.pathname.startsWith('/shop/') ||
      location.pathname.startsWith('/customer/shops') ||
      location.pathname.startsWith('/customer/shop/')
    );
  };

  const isExploreActive = () => {
    return (
      location.pathname.startsWith('/products') ||
      location.pathname.startsWith('/product/') ||
      location.pathname.startsWith('/customer/products') ||
      location.pathname.startsWith('/customer/product/')
    );
  };

  const isCartActive = () => {
    return (
      location.pathname === '/cart' ||
      location.pathname === '/customer/cart'
    );
  };

  const isProfileActive = () => {
    return (
      location.pathname === '/login' ||
      location.pathname.startsWith('/customer/profile') ||
      location.pathname.startsWith('/customer/orders') ||
      location.pathname.startsWith('/customer/address')
    );
  };

  const homePath = isCustomer ? '/customer' : '/';
  const shopsPath = isCustomer ? '/customer/shops' : '/shops';
  const explorePath = isCustomer ? '/customer/products' : '/products';
  const cartPath = isCustomer ? '/customer/cart' : '/cart';
  const profilePath = user ? '/customer/profile' : '/login';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="locvia-bottom-nav hide-desktop"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '100vw',
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(229, 231, 235, 0.8)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 0 calc(8px + env(safe-area-inset-bottom, 0px)) 0',
        margin: 0,
        zIndex: 1000,
        boxSizing: 'border-box',
      }}
    >
      <NavItem
        to={homePath}
        icon={Home}
        label="Home"
        active={isHomeActive()}
      />
      <NavItem
        to={shopsPath}
        icon={Store}
        label="Shops"
        active={isShopsActive()}
      />
      <NavItem
        to={explorePath}
        icon={Compass}
        label="Explore"
        active={isExploreActive()}
      />
      <NavItem
        to={cartPath}
        icon={ShoppingCart}
        label="Cart"
        active={isCartActive()}
        badge={totalItems}
      />
      <NavItem
        to={profilePath}
        icon={User}
        label="Profile"
        active={isProfileActive()}
      />
    </nav>
  );
};

const NavItem = ({ to, icon: Icon, label, active, badge = 0 }) => {
  const activeColor = '#16A34A';
  const inactiveColor = '#6B7280';

  return (
    <Link
      to={to}
      className={`locvia-bottom-nav-item ${active ? 'active' : 'inactive'}`}
      style={{
        flex: '1 1 0%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        minHeight: '44px',
        padding: '2px 0',
        gap: '3px',
        color: active ? activeColor : inactiveColor,
        WebkitTapHighlightColor: 'transparent',
        boxSizing: 'border-box',
        transition: 'color 0.15s ease, transform 0.15s ease',
      }}
    >
      <div
        className="locvia-bottom-nav-icon-wrap"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
        }}
      >
        <Icon
          size={21}
          strokeWidth={active ? 2.4 : 1.9}
          style={{
            color: active ? activeColor : inactiveColor,
            transition: 'stroke-width 0.15s ease, color 0.15s ease',
          }}
          aria-hidden="true"
        />
        {badge > 0 && (
          <span
            className="locvia-bottom-nav-badge"
            aria-label={`${badge} items in cart`}
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-9px',
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '9999px',
              padding: '1px 4px',
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              border: '1.5px solid #FFFFFF',
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span
        className="locvia-bottom-nav-label"
        style={{
          fontSize: '11px',
          fontWeight: active ? 600 : 500,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          padding: '0 2px',
          boxSizing: 'border-box',
          color: active ? activeColor : inactiveColor,
          transition: 'color 0.15s ease',
        }}
      >
        {label}
      </span>
    </Link>
  );
};

export default BottomNavigation;
