// src/pages/customer/CustomerProfilePage.jsx
// MODULE 18 — Customer Profile Page

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  ShoppingBag,
  ArrowRight,
  LogOut,
  X,
  CheckCircle2,
  Building,
  Briefcase,
  Home as HomeIcon,
  ChevronRight,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAddress } from '../../context/AddressContext';
import { getOrdersByCustomer } from '../../services/orderService';
import { changePassword } from '../../services/api/userApi';
import PageLoader from '../../components/common/loaders/PageLoader';
import ButtonLoader from '../../components/common/loaders/ButtonLoader';

export default function CustomerProfilePage() {
  const { user, handleLogout } = useAuth();
  const { addresses } = useAddress();
  const navigate = useNavigate();

  // Modal states
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Change Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [successToast, setSuccessToast] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Orders for current customer
  const userOrders = useMemo(() => {
    return getOrdersByCustomer(user?.id || 'cust-01');
  }, [user?.id]);

  const recentOrder = userOrders.length > 0 ? userOrders[0] : null;

  // Dynamic Initials Generator
  const initials = useMemo(() => {
    if (!user?.name) return 'C';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, [user?.name]);

  // Handle Change Password Modal Open
  const handleOpenChangePassword = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setPasswordErrors({});
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsChangePasswordModalOpen(true);
  };

  // Handle Change Password Modal Close
  const handleCloseChangePassword = () => {
    if (isChangingPassword) return;
    setIsChangePasswordModalOpen(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setPasswordErrors({});
  };

  // Password Form Validation
  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = 'Current password cannot be empty.';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password cannot be empty.';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters.';
    }
    if (!passwordData.confirmNewPassword) {
      errors.confirmNewPassword = 'Confirm password cannot be empty.';
    } else if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      errors.confirmNewPassword = 'New passwords do not match.';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Password Change to Backend
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm() || isChangingPassword) return;

    setIsChangingPassword(true);
    setPasswordErrors({});

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmNewPassword,
      });
      setIsChangePasswordModalOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setSuccessToast('Password changed successfully.');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      const errMsg = err?.message || 'Unable to change password. Please try again.';
      if (errMsg.toLowerCase().includes('current password')) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect.', submit: 'Current password is incorrect.' });
      } else if (errMsg.toLowerCase().includes('not match')) {
        setPasswordErrors({ confirmNewPassword: 'New passwords do not match.', submit: 'New passwords do not match.' });
      } else {
        setPasswordErrors({ submit: errMsg });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Confirm Sign Out
  const handleConfirmSignOut = () => {
    setIsSignOutModalOpen(false);
    handleLogout();
    navigate('/login');
  };

  if (!user) {
    return <PageLoader message="Loading profile..." />;
  }

  return (
    <div className="profile-page-wrapper" style={{ paddingBottom: '4rem' }}>
      {/* Toast Notification */}
      {successToast && (
        <div className="profile-toast-success animate-fade-in" role="alert">
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      <div className="locvia-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        
        {/* Header Breadcrumb */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--color-gray-500)', marginBottom: '0.25rem' }}>
            <Link to="/customer" style={{ color: 'var(--color-gray-500)', textDecoration: 'none' }}>Home</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--color-gray-800)', fontWeight: 500 }}>My Profile</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-gray-900)', margin: 0 }}>
            My Account & Settings
          </h1>
        </div>

        {/* Main Grid: Desktop (2 Columns: Left Profile & Actions, Right Metrics & Previews) */}
        <div className="profile-main-grid">
          
          {/* Left Column: User Profile Card & Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* User Info Card */}
            <div className="profile-card">
              <div className="profile-card-top">
                <div className="profile-avatar-wrapper">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="profile-avatar-img" />
                  ) : (
                    <div className="profile-avatar-initials">{initials}</div>
                  )}
                </div>
                <div className="profile-user-headline">
                  <h2 className="profile-user-name">{user.name}</h2>
                  <span className="profile-role-badge">Customer</span>
                </div>
              </div>

              <div className="profile-card-divider" />

              <div className="profile-details-list">
                <div className="profile-detail-item">
                  <Mail size={18} className="profile-detail-icon" />
                  <div className="profile-detail-content">
                    <span className="profile-detail-label">Email Address</span>
                    <span className="profile-detail-value">{user.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="profile-detail-item">
                  <Phone size={18} className="profile-detail-icon" />
                  <div className="profile-detail-content">
                    <span className="profile-detail-label">Phone Number</span>
                    <span className="profile-detail-value">{user.phone ? `+91 ${user.phone}` : 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <button onClick={handleOpenChangePassword} className="profile-edit-btn">
                <Lock size={16} /> Change Password
              </button>
            </div>

            {/* Quick Actions Card */}
            <div className="profile-card">
              <h3 className="profile-card-title">Quick Actions</h3>
              <div className="quick-actions-list">
                <Link to="/customer/orders" className="quick-action-item">
                  <div className="quick-action-icon-bg" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                    <ShoppingBag size={18} />
                  </div>
                  <div className="quick-action-text">
                    <span className="quick-action-title">My Orders</span>
                    <span className="quick-action-sub">Track, view details, or reorder</span>
                  </div>
                  <ChevronRight size={18} className="quick-action-arrow" />
                </Link>

                <Link to="/customer/addresses" className="quick-action-item">
                  <div className="quick-action-icon-bg" style={{ backgroundColor: '#edf7ed', color: '#2e7d32' }}>
                    <MapPin size={18} />
                  </div>
                  <div className="quick-action-text">
                    <span className="quick-action-title">Saved Addresses</span>
                    <span className="quick-action-sub">Manage home & work addresses</span>
                  </div>
                  <ChevronRight size={18} className="quick-action-arrow" />
                </Link>

                <Link to="/customer" className="quick-action-item">
                  <div className="quick-action-icon-bg" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
                    <PackageCheck size={18} />
                  </div>
                  <div className="quick-action-text">
                    <span className="quick-action-title">Continue Shopping</span>
                    <span className="quick-action-sub">Browse fresh groceries nearby</span>
                  </div>
                  <ChevronRight size={18} className="quick-action-arrow" />
                </Link>
              </div>

              <div className="profile-card-divider" style={{ margin: '1rem 0' }} />

              <button onClick={() => setIsSignOutModalOpen(true)} className="profile-signout-btn">
                <LogOut size={16} /> Sign Out Account
              </button>
            </div>

          </div>

          {/* Right Column: Account Overview Metrics & Activity Previews */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Account Overview Cards */}
            <div className="overview-metrics-grid">
              
              <div onClick={() => navigate('/customer/orders')} className="metric-card clickable">
                <div className="metric-icon-bg" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                  <ShoppingBag size={22} />
                </div>
                <div className="metric-info">
                  <span className="metric-count">{userOrders.length}</span>
                  <span className="metric-label">Total Orders</span>
                </div>
                <ArrowRight size={16} className="metric-arrow" />
              </div>

              <div onClick={() => navigate('/customer/addresses')} className="metric-card clickable">
                <div className="metric-icon-bg" style={{ backgroundColor: '#edf7ed', color: '#2e7d32' }}>
                  <MapPin size={22} />
                </div>
                <div className="metric-info">
                  <span className="metric-count">{addresses.length}</span>
                  <span className="metric-label">Saved Addresses</span>
                </div>
                <ArrowRight size={16} className="metric-arrow" />
              </div>

            </div>

            {/* Saved Address Preview */}
            <div className="profile-card">
              <div className="profile-section-header">
                <div>
                  <h3 className="profile-card-title" style={{ margin: 0 }}>Saved Addresses</h3>
                  <p className="profile-section-sub">Delivery locations for fast checkout</p>
                </div>
                <Link to="/customer/addresses" className="profile-section-link">
                  Manage <ChevronRight size={16} />
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="empty-preview-box">
                  <p>No saved addresses yet.</p>
                  <Link to="/customer/addresses" className="empty-preview-btn">
                    + Add New Address
                  </Link>
                </div>
              ) : (
                <div className="saved-addresses-preview-list">
                  {addresses.slice(0, 2).map((addr) => {
                    const TypeIcon = addr.type === 'Work' ? Briefcase : addr.type === 'Other' ? Building : HomeIcon;
                    return (
                      <div key={addr.id} className="address-preview-card">
                        <div className="address-preview-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TypeIcon size={16} className="text-primary" />
                            <span className="address-preview-type">{addr.type || 'Home'}</span>
                          </div>
                          {addr.isDefault && <span className="default-pill">Default</span>}
                        </div>
                        <p className="address-preview-name">{addr.fullName}</p>
                        <p className="address-preview-line">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                        {addr.phone && <p className="address-preview-phone">Ph: +91 {addr.phone}</p>}
                      </div>
                    );
                  })}
                  {addresses.length > 2 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', margin: '0.5rem 0 0', textAlign: 'center' }}>
                      + {addresses.length - 2} more saved address{addresses.length - 2 > 1 ? 'es' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Recent Order Preview */}
            <div className="profile-card">
              <div className="profile-section-header">
                <div>
                  <h3 className="profile-card-title" style={{ margin: 0 }}>Recent Order</h3>
                  <p className="profile-section-sub">Your latest grocery delivery</p>
                </div>
                <Link to="/customer/orders" className="profile-section-link">
                  View All Orders <ChevronRight size={16} />
                </Link>
              </div>

              {!recentOrder ? (
                <div className="empty-preview-box">
                  <p>You haven't placed any orders yet.</p>
                  <Link to="/customer" className="empty-preview-btn">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="recent-order-preview-card">
                  <div className="recent-order-header">
                    <div>
                      <span className="recent-order-id">#{recentOrder.orderId || recentOrder.id}</span>
                      <span className="recent-order-date">
                        {new Date(recentOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span className={`recent-order-status-badge status-${(recentOrder.orderStatus || 'PLACED').toLowerCase()}`}>
                      {recentOrder.orderStatus || 'PLACED'}
                    </span>
                  </div>

                  <div className="recent-order-body">
                    <p className="recent-order-shop">
                      Shop: {recentOrder.shops?.[0]?.name || 'Local Grocery Partner'}
                    </p>
                    <p className="recent-order-summary">
                      {recentOrder.items?.length || 0} item{(recentOrder.items?.length || 0) === 1 ? '' : 's'} • Total Paid: <strong>₹{recentOrder.pricing?.total || 0}</strong>
                    </p>
                  </div>

                  <div className="recent-order-actions">
                    <Link to={`/customer/orders/${recentOrder.orderId || recentOrder.id}`} className="recent-order-btn secondary">
                      View Details
                    </Link>
                    <Link to={`/customer/orders/${recentOrder.orderId || recentOrder.id}/tracking`} className="recent-order-btn primary">
                      Track Order
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ── Change Password Modal ────────────────────────────────────── */}
      {isChangePasswordModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseChangePassword}>
          <div
            className="modal-content animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} style={{ color: '#0c831f' }} />
                <h3 className="modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                  Change Password
                </h3>
              </div>
              <button
                onClick={handleCloseChangePassword}
                className="modal-close-btn"
                aria-label="Close modal"
                disabled={isChangingPassword}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} style={{ padding: '1.25rem 1.5rem' }} noValidate>
              {passwordErrors.submit && (
                <div className="form-submit-error" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{passwordErrors.submit}</span>
                </div>
              )}

              {/* Current Password Input */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="currentPassword">
                  Current Password
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }));
                      if (passwordErrors.currentPassword) setPasswordErrors((prev) => ({ ...prev, currentPassword: null, submit: null }));
                    }}
                    className={`form-input ${passwordErrors.currentPassword ? 'has-error' : ''}`}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    disabled={isChangingPassword}
                    style={{ paddingRight: '42px' }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    disabled={isChangingPassword}
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="form-error-msg" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>

              {/* New Password Input */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="newPassword">
                  New Password
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }));
                      if (passwordErrors.newPassword) setPasswordErrors((prev) => ({ ...prev, newPassword: null, submit: null }));
                    }}
                    className={`form-input ${passwordErrors.newPassword ? 'has-error' : ''}`}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    disabled={isChangingPassword}
                    style={{ paddingRight: '42px' }}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    disabled={isChangingPassword}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="form-error-msg" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm New Password Input */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="confirmNewPassword">
                  Confirm New Password
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="confirmNewPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmNewPassword}
                    onChange={(e) => {
                      setPasswordData((prev) => ({ ...prev, confirmNewPassword: e.target.value }));
                      if (passwordErrors.confirmNewPassword) setPasswordErrors((prev) => ({ ...prev, confirmNewPassword: null, submit: null }));
                    }}
                    className={`form-input ${passwordErrors.confirmNewPassword ? 'has-error' : ''}`}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    disabled={isChangingPassword}
                    style={{ paddingRight: '42px' }}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    disabled={isChangingPassword}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.confirmNewPassword && (
                  <p className="form-error-msg" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {passwordErrors.confirmNewPassword}
                  </p>
                )}
              </div>

              {/* Form Buttons */}
              <div
                className="modal-actions"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                }}
              >
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                  }}
                >
                  {isChangingPassword && <ButtonLoader size="sm" color="white" />}
                  <span>{isChangingPassword ? 'Changing Password...' : 'Change Password'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseChangePassword}
                  disabled={isChangingPassword}
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    padding: '0.65rem 1.25rem',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sign Out Confirmation Modal ──────────────────────────── */}
      {isSignOutModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsSignOutModalOpen(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: '1.5rem', textAlign: 'center' }}>
            
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <LogOut size={24} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-gray-900)', margin: '0 0 0.5rem' }}>
              Sign Out of Locvia?
            </h3>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to sign out? You will need to log in again to manage your orders and cart.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setIsSignOutModalOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.65rem 1rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSignOut}
                className="btn-danger"
                style={{ flex: 1, padding: '0.65rem 1rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign Out
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
