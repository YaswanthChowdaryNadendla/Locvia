// src/pages/customer/CustomerProfilePage.jsx
// MODULE 18 — Customer Profile Page

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  Edit2,
  MapPin,
  ShoppingBag,
  ArrowRight,
  LogOut,
  X,
  CheckCircle2,
  Calendar,
  ShieldCheck,
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
import PageLoader from '../../components/common/loaders/PageLoader';
import ButtonLoader from '../../components/common/loaders/ButtonLoader';

export default function CustomerProfilePage() {
  const { user, handleUpdateProfile, handleLogout } = useAuth();
  const { addresses } = useAddress();
  const navigate = useNavigate();

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [successToast, setSuccessToast] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  // Format member since date
  const memberSince = useMemo(() => {
    if (!user?.createdAt) return 'Member since 2024';
    try {
      const d = new Date(user.createdAt);
      return `Member since ${d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
    } catch {
      return 'Member since 2024';
    }
  }, [user?.createdAt]);

  // Handle Edit Open
  const handleOpenEdit = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Please enter your full name.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }

    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/\s+/g, '');
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSaving) return;

    setIsSaving(true);
    try {
      await handleUpdateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      });
      setIsEditModalOpen(false);
      setSuccessToast('Profile updated successfully!');
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
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

                <div className="profile-detail-item">
                  <Calendar size={18} className="profile-detail-icon" />
                  <div className="profile-detail-content">
                    <span className="profile-detail-label">Account Status</span>
                    <span className="profile-detail-value">{memberSince}</span>
                  </div>
                </div>
              </div>

              <button onClick={handleOpenEdit} className="profile-edit-btn">
                <Edit2 size={16} /> Edit Profile
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

      {/* ── Edit Profile Modal ────────────────────────────────────── */}
      {isEditModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', padding: 0 }}>
            
            <div className="modal-header">
              <h3 className="modal-title">Edit Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="modal-close-btn" aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ padding: '1.25rem 1.5rem' }}>
              
              {/* Full Name Input */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                  }}
                  className={`form-input ${formErrors.name ? 'error' : ''}`}
                  placeholder="Enter your full name"
                  autoFocus
                />
                {formErrors.name && <p className="form-error-msg">{formErrors.name}</p>}
              </div>

              {/* Phone Input */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Phone Number (10 digits)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, phone: e.target.value }));
                    if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: null }));
                  }}
                  className={`form-input ${formErrors.phone ? 'error' : ''}`}
                  placeholder="e.g. 9876543210"
                />
                {formErrors.phone && <p className="form-error-msg">{formErrors.phone}</p>}
              </div>

              {/* Email Input (Disabled/Read-only) */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Email Address</label>
                  <span className="readonly-pill"><ShieldCheck size={12} /> Read-only</span>
                </div>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="form-input disabled"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '0.35rem' }}>
                  Email cannot be changed directly for security verification purposes.
                </p>
              </div>

              {formErrors.submit && (
                <div className="form-submit-error">
                  <AlertCircle size={15} />
                  <span>{formErrors.submit}</span>
                </div>
              )}

              {/* Form Buttons */}
              <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={isSaving} className="btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSaving && <ButtonLoader size="sm" color="white" />}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
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
