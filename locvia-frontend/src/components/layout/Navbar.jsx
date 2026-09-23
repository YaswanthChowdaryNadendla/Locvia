// src/components/layout/Navbar.jsx
// Locvia main navigation bar — responsive desktop + mobile layout

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  MapPin,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Store,
  LayoutDashboard,
  Home,
  Grid,
  Package,
  Navigation,
  Briefcase,
  Building,
  Check,
  Plus,
  Loader2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import SearchBar from '../common/SearchBar';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useAddress } from '../../context/AddressContext';
import { useDeliveryLocation } from '../../context/LocationContext';
import { ROLES } from '../../data/users';

// ── Locvia Wordmark ──────────────────────────────────────────
const LocviaLogo = ({ size = 'md', white = false }) => (
  <Link to="/" className={`locvia-wordmark ${size === 'sm' ? 'locvia-wordmark-sm' : ''} ${white ? 'locvia-wordmark-white' : ''}`}>
    <span className="loc">Loc</span>
    <span className="via">via</span>
    <span className="dot" />
  </Link>
);

// ── Location Selector ────────────────────────────────────────
const LocationSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const {
    selectedLocation,
    locationDisplayText,
    isDetecting,
    detectingStage,
    error,
    detectCurrentLocation,
    selectSavedAddress,
    clearError,
  } = useDeliveryLocation();

  const { addresses } = useAddress();

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleDetectClick = (e) => {
    e.stopPropagation();
    clearError();
    detectCurrentLocation();
  };

  const handleSelectAddress = (addr) => {
    selectSavedAddress(addr);
    setIsOpen(false);
  };

  const handleManageAddresses = () => {
    setIsOpen(false);
    navigate('/customer/addresses');
  };

  return (
    <div style={{ position: 'relative', minWidth: '120px', flexShrink: 0 }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          padding: '4px 0',
          width: 'auto',
          minWidth: '120px',
        }}
        title="Select delivery location"
        aria-label="Choose delivery location"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#edf7ed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isDetecting ? (
            <Loader2
              size={18}
              strokeWidth={2.2}
              className="animate-spin"
              style={{ color: 'var(--color-primary)' }}
            />
          ) : (
            <MapPin size={18} strokeWidth={2.2} style={{ color: 'var(--color-primary)' }} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, maxWidth: '190px' }}>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--color-gray-500)',
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            Delivering to
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-gray-900)',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '160px',
              }}
              title={locationDisplayText}
            >
              {locationDisplayText}
            </span>
            <ChevronDown
              size={14}
              style={{
                color: 'var(--color-gray-500)',
                flexShrink: 0,
                transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </div>
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="location-popover-dropdown animate-scale-in" role="dialog" aria-label="Location selector popover">
          <div className="location-popover-header">
            <h4 className="popover-title">Where should we deliver?</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="popover-close-btn"
              aria-label="Close location selector"
            >
              <X size={16} />
            </button>
          </div>

          {/* Detect Location Option */}
          <div className="location-detect-box">
            <button
              onClick={handleDetectClick}
              disabled={isDetecting}
              className="detect-location-btn"
            >
              <div className="detect-icon-bg">
                {isDetecting ? (
                  <Loader2 size={16} className="animate-spin text-primary" />
                ) : (
                  <Navigation size={16} className="text-primary" />
                )}
              </div>
              <div className="detect-text-wrap">
                <span className="detect-main-text">
                  {isDetecting
                    ? detectingStage === 'geocoding'
                      ? 'Finding your location...'
                      : detectingStage === 'gps_precise'
                      ? 'Trying to get your precise location...'
                      : 'Detecting your location...'
                    : 'Detect my current location'}
                </span>
                <span className="detect-sub-text">
                  {isDetecting
                    ? detectingStage === 'gps_precise'
                      ? 'Retrying with high precision GPS...'
                      : 'Requesting browser location'
                    : selectedLocation?.type === 'gps'
                    ? `✓ Active: ${selectedLocation.displayName}`
                    : 'Use device GPS location'}
                </span>
              </div>
            </button>

            {error && (
              <div className="location-error-box">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="popover-divider" />

          {/* Saved Addresses Section */}
          <div className="saved-addresses-section">
            <div className="saved-addresses-header">
              <span>Saved Addresses</span>
              {addresses.length > 0 && (
                <button onClick={handleManageAddresses} className="manage-link-btn">
                  Manage
                </button>
              )}
            </div>

            {addresses.length === 0 ? (
              <div className="no-addresses-prompt">
                <p>No saved addresses yet.</p>
                <button onClick={handleManageAddresses} className="add-addr-quick-btn">
                  <Plus size={14} /> Add New Address
                </button>
              </div>
            ) : (
              <div className="saved-addresses-list">
                {addresses.map((addr) => {
                  const isSelected =
                    selectedLocation?.type === 'saved' &&
                    selectedLocation?.addressId === addr.id;

                  const TypeIcon =
                    addr.type === 'Work'
                      ? Briefcase
                      : addr.type === 'Other'
                      ? Building
                      : Home;

                  return (
                    <button
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`saved-address-item ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="address-item-icon">
                        <TypeIcon size={15} />
                      </div>
                      <div className="address-item-details">
                        <div className="address-item-top">
                          <span className="address-item-label">{addr.type || 'Home'}</span>
                          {isSelected && (
                            <span className="selected-pill">
                              <Check size={11} /> Selected
                            </span>
                          )}
                          {!isSelected && addr.isDefault && (
                            <span className="default-pill">Default</span>
                          )}
                        </div>
                        <p className="address-item-line">
                          {addr.addressLine1}, {addr.city}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manage Addresses Footer Button */}
          <div className="popover-footer">
            <button onClick={handleManageAddresses} className="manage-addresses-footer-btn">
              <span>Manage Saved Addresses</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── User Menu ────────────────────────────────────────────────
const UserMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="nav-action-btn"
        aria-label="User menu"
        aria-expanded={open}
      >
        <div className="nav-action-icon-wrap">
          <User size={20} strokeWidth={2.2} style={{ color: 'var(--color-gray-900)' }} />
        </div>
        <span style={{ maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-gray-900)' }}>
          {user?.name?.split(' ')[0] || 'Profile'}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 'calc(var(--z-dropdown) - 1)',
            }}
            onClick={() => setOpen(false)}
          />
          <div
            className="animate-scale-in"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: '190px',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 'var(--z-dropdown)',
              overflow: 'hidden',
              padding: '0.5rem',
            }}
          >
            {/* Customer Links */}
            {(!user || user?.role === ROLES.CUSTOMER) && (
              <>
                <button
                  onClick={() => { navigate('/customer/profile'); setOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                    color: 'var(--color-gray-700)',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User size={15} style={{ color: 'var(--color-primary)' }} />
                  My Profile
                </button>

                <button
                  onClick={() => { navigate('/customer/orders'); setOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                    color: 'var(--color-gray-700)',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Package size={15} style={{ color: 'var(--color-primary)' }} />
                  My Orders
                </button>

                <button
                  onClick={() => { navigate('/customer/addresses'); setOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                    color: 'var(--color-gray-700)',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <MapPin size={15} style={{ color: 'var(--color-primary)' }} />
                  Saved Addresses
                </button>
              </>
            )}

            {/* Non-customer Dashboard Link */}
            {user?.role && user.role !== ROLES.CUSTOMER && (
              <button
                onClick={() => {
                  const paths = {
                    [ROLES.SHOP_OWNER]: '/shop/dashboard',
                    [ROLES.DELIVERY_PARTNER]: '/delivery/dashboard',
                    [ROLES.ADMIN]: '/admin/users',
                  };
                  navigate(paths[user.role] || '/');
                  setOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  color: 'var(--color-gray-700)',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LayoutDashboard size={15} style={{ color: 'var(--color-primary)' }} />
                Dashboard
              </button>
            )}

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: 'var(--color-border-light)', margin: '4px 0' }} />

            {/* Logout */}
            <button
              onClick={() => { onLogout(); setOpen(false); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                color: 'var(--color-error)',
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-error-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ── Cart Icon Button ─────────────────────────────────────────
const CartButton = ({ count }) => (
  <Link to="/customer/cart" className="nav-cart-btn" aria-label={`Cart — ${count} items`}>
    <div className="nav-action-icon-wrap">
      <ShoppingCart size={20} strokeWidth={2.2} style={{ color: 'var(--color-gray-900)' }} />
      {count > 0 && (
        <span className="nav-action-badge">{count > 99 ? '99+' : count}</span>
      )}
    </div>
    <span style={{ color: 'var(--color-gray-900)' }}>Cart</span>
  </Link>
);

// ── Mobile Menu Drawer ───────────────────────────────────────
const MobileMenuDrawer = ({ isOpen, onClose, isAuthenticated, user, isCustomer, onLogout }) => {
  return (
    <>
      {isOpen && <div className="mobile-drawer-overlay" onClick={onClose} />}
      <div className={`mobile-drawer ${isOpen ? 'open' : ''}`}>
        <button className="mobile-drawer-close" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
        <div style={{ padding: '2rem 1.5rem 1rem', borderBottom: '1px solid var(--color-gray-100)' }}>
          <LocviaLogo size="md" />
        </div>
        <nav className="mobile-drawer-nav">
          <Link to="/" className="mobile-drawer-link" onClick={onClose}>
            <Home size={20} /> Home
          </Link>
          <Link to="/customer/shops" className="mobile-drawer-link" onClick={onClose}>
            <Store size={20} /> Shops
          </Link>
          <Link to="/customer/products" className="mobile-drawer-link" onClick={onClose}>
            <Grid size={20} /> Categories
          </Link>
          
          <div style={{ height: '1px', backgroundColor: 'var(--color-gray-100)', margin: '0.5rem 0' }} />
          
          {isAuthenticated ? (
            <>
              {isCustomer ? (
                <>
                  <Link to="/customer/profile" className="mobile-drawer-link" onClick={onClose}>
                    <User size={20} /> My Profile
                  </Link>
                  <Link to="/customer/orders" className="mobile-drawer-link" onClick={onClose}>
                    <Package size={20} /> My Orders
                  </Link>
                  <Link to="/customer/addresses" className="mobile-drawer-link" onClick={onClose}>
                    <MapPin size={20} /> Saved Addresses
                  </Link>
                </>
              ) : (
                <Link
                  to={
                    user?.role === ROLES.SHOP_OWNER
                      ? '/shop/dashboard'
                      : user?.role === ROLES.DELIVERY_PARTNER
                      ? '/delivery/dashboard'
                      : user?.role === ROLES.ADMIN
                      ? '/admin/users'
                      : '/'
                  }
                  className="mobile-drawer-link"
                  onClick={onClose}
                >
                  <LayoutDashboard size={20} /> Dashboard
                </Link>
              )}
              <button 
                onClick={() => { onLogout(); onClose(); }} 
                className="mobile-drawer-link" 
                style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', color: 'var(--color-error)', textAlign: 'left', font: 'inherit' }}
              >
                <LogOut size={20} style={{ color: 'var(--color-error)' }} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-drawer-link" onClick={onClose}>
                <User size={20} /> Login
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  );
};

// ── Main Navbar ──────────────────────────────────────────────
const Navbar = () => {
  const { user, isAuthenticated, handleLogout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isCustomer = isAuthenticated && user?.role === ROLES.CUSTOMER;

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const handleSearch = (query) => {
    if (query.trim()) {
      navigate(`/customer/products?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <>
      <nav className={`locvia-navbar ${isScrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation">
        {/* ── Desktop Navbar ───────────────────────── */}
        <div
          className="locvia-container hide-mobile"
          style={{
            height: '100%',
            display: 'none', // overridden by .hide-mobile media query
            alignItems: 'center',
            padding: '0 2rem',
            width: '100%'
          }}
        >
          {/* Logo */}
          <div style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <LocviaLogo />
            <span className="locvia-tagline" style={{ marginTop: '2px', color: '#9ca3af' }}>Everything local, delivered fast</span>
          </div>

          {/* Location */}
          <div style={{ flexShrink: 0, marginRight: '1rem', marginLeft: '1rem' }}>
            <LocationSelector />
          </div>

          {/* Search — fills remaining space */}
          <div style={{ flex: 1, position: 'relative', margin: '0 1.5rem' }}>
            <div className="navbar-search" style={{ width: '100%' }}>
              <SearchBar
                placeholder="Search for groceries, products or shops..."
                onSubmit={handleSearch}
              />
            </div>
          </div>

          {/* Right actions */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.25rem' }}>
            {isAuthenticated ? (
              <>
                <UserMenu user={user} onLogout={handleLogoutClick} />
                {isCustomer && <CartButton count={totalItems} />}
              </>
            ) : (
              <Link to="/login" className="nav-action-btn">
                <div className="nav-action-icon-wrap">
                  <User size={20} strokeWidth={2.2} style={{ color: 'var(--color-gray-900)' }} />
                </div>
                <span style={{ color: 'var(--color-gray-900)' }}>Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── Mobile Navbar ────────────────────────── */}
        <div
          className="hide-desktop"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Top row: Hamburger + Logo + Cart/Login */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: 'none',
                border: 'none',
                color: 'var(--color-gray-900)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              aria-label="Menu"
            >
              <Menu size={24} />
            </button>

            <LocviaLogo />

            {isCustomer ? (
              <CartButton count={totalItems} />
            ) : isAuthenticated ? (
              <UserMenu user={user} onLogout={handleLogoutClick} />
            ) : (
              <Link to="/login" className="nav-action-btn" aria-label="Login">
                <div className="nav-action-icon-wrap">
                  <User size={20} strokeWidth={2.2} style={{ color: 'var(--color-gray-900)' }} />
                </div>
                <span style={{ color: 'var(--color-gray-900)' }}>Login</span>
              </Link>
            )}
          </div>

          {/* Second row: Location */}
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <LocationSelector />
          </div>

          {/* Third row: Search */}
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <SearchBar
              placeholder="Search for groceries, products or shops..."
              onSubmit={handleSearch}
            />
          </div>
        </div>
      </nav>

      <MobileMenuDrawer 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        isAuthenticated={isAuthenticated} 
        user={user} 
        isCustomer={isCustomer}
        onLogout={handleLogoutClick} 
      />
    </>
  );
};

export { LocviaLogo };
export default Navbar;
