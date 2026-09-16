// src/pages/delivery/DeliveryProfilePage.jsx
// Dedicated Delivery Profile Page for Delivery Partners (Module 25)

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getDeliveryAvailability,
  setDeliveryAvailability,
  getCompletedDeliveries,
  getActiveDelivery,
} from '../../services/deliveryService';
import {
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Power,
  Edit2,
  LogOut,
  X,
  CheckCircle,
  AlertCircle,
  Truck,
  PackageCheck,
  DollarSign,
  Compass,
  ChevronRight,
  IdCard,
} from 'lucide-react';
import { ButtonLoader } from '../../components/common/loaders';

export default function DeliveryProfilePage() {
  const navigate = useNavigate();
  const { user, handleUpdateProfile, handleLogout } = useAuth();
  const partnerId = user?.id || 'user-partner';

  // Availability State
  const [isOnline, setIsOnline] = useState(() => getDeliveryAvailability(partnerId));
  
  // Modals & Toast State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Sync availability state
  useEffect(() => {
    setIsOnline(getDeliveryAvailability(partnerId));
  }, [partnerId]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Toggle Availability
  const handleToggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    setDeliveryAvailability(partnerId, nextState);
    if (nextState) {
      showToast("You're now online and available for delivery requests.");
    } else {
      showToast("You're now offline. New delivery requests are paused.", 'error');
    }
  };

  // Dynamic Initials Avatar (e.g. Suresh Kumar -> SK)
  const initials = useMemo(() => {
    if (!user?.name) return 'DP';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }, [user?.name]);

  // Member Since date
  const memberSince = useMemo(() => {
    if (!user?.createdAt) return 'Member since Jan 2024';
    try {
      const d = new Date(user.createdAt);
      return `Member since ${d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
    } catch {
      return 'Member since Jan 2024';
    }
  }, [user?.createdAt]);

  // Dynamic Stats & Deliveries
  const completedDeliveries = useMemo(() => getCompletedDeliveries(partnerId), [partnerId]);
  const activeDelivery = useMemo(() => getActiveDelivery(partnerId), [partnerId]);

  // Calculate total earnings estimate (e.g., ₹50 per completed delivery + ₹450 base)
  const totalEarnings = useMemo(() => {
    const perDeliveryRate = 50;
    const basePay = 450;
    return basePay + completedDeliveries.length * perDeliveryRate;
  }, [completedDeliveries]);

  // Open Edit Form
  const handleOpenEdit = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Validate Edit Form
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

  // Save Profile
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
      showToast('Profile updated successfully!');
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
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
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Page Title Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
          Delivery Profile
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '2px' }}>
          Manage your partner profile, view availability, and check delivery statistics.
        </p>
      </div>

      {/* Header Profile Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
        }}
      >
        {/* Left: Avatar & Personal Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', minWidth: 0 }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', margin: 0, wordBreak: 'break-word' }}>
                {user?.name || 'Delivery Partner'}
              </h2>
              <span
                style={{
                  backgroundColor: '#ECFDF5',
                  color: '#047857',
                  border: '1px solid #A7F3D0',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                Delivery Partner
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.85rem', color: '#6B7280' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={14} style={{ color: '#9CA3AF' }} />
                <span style={{ overflowWrap: 'anywhere' }}>{user?.email || 'partner@locvia.com'}</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={14} style={{ color: '#9CA3AF' }} />
                <span>{user?.phone ? `+91 ${user.phone}` : 'No phone linked'}</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} style={{ color: '#9CA3AF' }} />
                <span>{memberSince}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Availability Toggle & Edit CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Availability Switch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: isOnline ? '#F0FDF4' : '#F9FAFB',
              border: `1px solid ${isOnline ? '#BBF7D0' : '#E5E7EB'}`,
              padding: '6px 12px',
              borderRadius: '24px',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isOnline ? '#15803D' : '#6B7280' }}>
              {isOnline ? '● Online' : '○ Offline'}
            </span>
            <button
              onClick={handleToggleOnline}
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: isOnline ? '#10B981' : '#6B7280',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <Power size={13} />
              {isOnline ? 'Available' : 'Go Online'}
            </button>
          </div>

          <button
            onClick={handleOpenEdit}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              color: 'var(--color-text)',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Edit2 size={16} style={{ color: 'var(--color-primary)' }} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Metric 1: Total Deliveries */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Total Deliveries</div>
              <div style={statValueStyle}>{completedDeliveries.length + (activeDelivery ? 1 : 0)}</div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#E0F2FE', color: '#0284C7' }}>
              <Truck size={22} />
            </div>
          </div>
        </div>

        {/* Metric 2: Completed Deliveries */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Completed Deliveries</div>
              <div style={{ ...statValueStyle, color: '#059669' }}>{completedDeliveries.length}</div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#D1FAE5', color: '#059669' }}>
              <CheckCircle size={22} />
            </div>
          </div>
        </div>

        {/* Metric 3: Active Delivery */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Active Delivery</div>
              <div style={{ ...statValueStyle, color: activeDelivery ? '#7C3AED' : 'var(--color-text)' }}>
                {activeDelivery ? 1 : 0}
              </div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
              <PackageCheck size={22} />
            </div>
          </div>
        </div>

        {/* Metric 4: Earnings Overview */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Total Earnings</div>
              <div style={{ ...statValueStyle, color: '#D97706' }}>₹{totalEarnings}</div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <DollarSign size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Account Information & Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Account Details Card */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
              <User size={18} style={{ color: 'var(--color-primary)' }} /> Account Details
            </div>
            <button onClick={handleOpenEdit} style={viewAllLinkStyle}>
              Edit Details
            </button>
          </div>

          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={detailRowStyle}>
              <User size={18} style={detailIconStyle} />
              <div style={{ minWidth: 0 }}>
                <div style={detailLabelStyle}>Full Name</div>
                <div style={detailValueStyle}>{user?.name || 'N/A'}</div>
              </div>
            </div>

            <div style={detailRowStyle}>
              <Mail size={18} style={detailIconStyle} />
              <div style={{ minWidth: 0 }}>
                <div style={detailLabelStyle}>Email Address</div>
                <div style={{ ...detailValueStyle, overflowWrap: 'anywhere' }}>{user?.email || 'N/A'}</div>
              </div>
            </div>

            <div style={detailRowStyle}>
              <Phone size={18} style={detailIconStyle} />
              <div style={{ minWidth: 0 }}>
                <div style={detailLabelStyle}>Phone Number</div>
                <div style={detailValueStyle}>{user?.phone ? `+91 ${user.phone}` : 'Not provided'}</div>
              </div>
            </div>

            <div style={detailRowStyle}>
              <ShieldCheck size={18} style={detailIconStyle} />
              <div style={{ minWidth: 0 }}>
                <div style={detailLabelStyle}>Role & System Access</div>
                <div style={detailValueStyle}>Delivery Partner (ROLES.DELIVERY_PARTNER)</div>
              </div>
            </div>

            <div style={detailRowStyle}>
              <IdCard size={18} style={detailIconStyle} />
              <div style={{ minWidth: 0 }}>
                <div style={detailLabelStyle}>Partner ID</div>
                <div style={detailValueStyle}>{user?.id || 'user-partner'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation Card */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
              Partner Quick Actions
            </div>
          </div>

          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button onClick={() => navigate('/delivery/dashboard')} style={quickActionRowStyle}>
              <div style={{ ...actionIconWrapStyle, backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                <Truck size={20} />
              </div>
              <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>Delivery Dashboard</div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>Overview, active deliveries, and availability</div>
              </div>
              <ChevronRight size={18} style={{ color: '#9CA3AF' }} />
            </button>

            <button onClick={() => navigate('/delivery/requests')} style={quickActionRowStyle}>
              <div style={{ ...actionIconWrapStyle, backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                <Compass size={20} />
              </div>
              <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>Delivery Requests</div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>Browse and accept new delivery orders</div>
              </div>
              <ChevronRight size={18} style={{ color: '#9CA3AF' }} />
            </button>

            <button onClick={() => navigate('/delivery/active')} style={quickActionRowStyle}>
              <div style={{ ...actionIconWrapStyle, backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
                <PackageCheck size={20} />
              </div>
              <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>Active Delivery</div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>Track current pickup & customer drop-off</div>
              </div>
              <ChevronRight size={18} style={{ color: '#9CA3AF' }} />
            </button>

            <button onClick={() => navigate('/delivery/earnings')} style={quickActionRowStyle}>
              <div style={{ ...actionIconWrapStyle, backgroundColor: '#FEF3C7', color: '#D97706' }}>
                <DollarSign size={20} />
              </div>
              <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>Earnings & Payouts</div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>View earnings history and payout status</div>
              </div>
              <ChevronRight size={18} style={{ color: '#9CA3AF' }} />
            </button>

            <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '0.5rem', paddingTop: '0.75rem' }}>
              <button
                onClick={() => setIsSignOutModalOpen(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #FCA5A5',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <LogOut size={16} /> Sign Out Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ────────────────────────────────────── */}
      {isEditModalOpen && (
        <div
          style={modalBackdropStyle}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            style={modalContentStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                Edit Profile
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ padding: '1.25rem' }}>
              {/* Full Name Field */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                  }}
                  style={{
                    ...inputStyle,
                    borderColor: formErrors.name ? '#EF4444' : '#D1D5DB',
                  }}
                  placeholder="Enter full name"
                  autoFocus
                />
                {formErrors.name && <p style={errorTextModalStyle}>{formErrors.name}</p>}
              </div>

              {/* Phone Field */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Phone Number (10 digits)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, phone: e.target.value }));
                    if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: null }));
                  }}
                  style={{
                    ...inputStyle,
                    borderColor: formErrors.phone ? '#EF4444' : '#D1D5DB',
                  }}
                  placeholder="e.g. 9876543210"
                />
                {formErrors.phone && <p style={errorTextModalStyle}>{formErrors.phone}</p>}
              </div>

              {/* Email Field (Read-only) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={labelStyle}>Email Address</label>
                  <span style={{ fontSize: '0.725rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <ShieldCheck size={12} style={{ color: '#059669' }} /> Read-only
                  </span>
                </div>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{
                    ...inputStyle,
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280',
                    cursor: 'not-allowed',
                  }}
                />
              </div>

              {/* Role Field (Read-only) */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={labelStyle}>Role</label>
                  <span style={{ fontSize: '0.725rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <ShieldCheck size={12} style={{ color: '#059669' }} /> Read-only
                  </span>
                </div>
                <input
                  type="text"
                  value="Delivery Partner"
                  disabled
                  style={{
                    ...inputStyle,
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280',
                    cursor: 'not-allowed',
                  }}
                />
              </div>

              {formErrors.submit && (
                <div style={{ padding: '8px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', color: '#DC2626', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={16} />
                  <span>{formErrors.submit}</span>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isSaving ? '#6B7280' : 'var(--color-primary)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSaving ? <ButtonLoader size={16} color="#FFFFFF" text="Saving..." /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sign Out Confirmation Modal ──────────────────────────── */}
      {isSignOutModalOpen && (
        <div
          style={modalBackdropStyle}
          onClick={() => setIsSignOutModalOpen(false)}
        >
          <div
            style={{ ...modalContentStyle, maxWidth: '400px', padding: '1.5rem', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <LogOut size={24} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 0.5rem' }}>
              Sign Out of Locvia?
            </h3>

            <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to sign out? You will need to log in again to access delivery requests and active deliveries.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setIsSignOutModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSignOut}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
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

// ── Reusable Styles ─────────────────────────────────────────────
const statCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '1.25rem',
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const statLabelStyle = {
  fontSize: '0.78rem',
  fontWeight: 600,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
};

const statValueStyle = {
  fontSize: '1.6rem',
  fontWeight: 800,
  color: 'var(--color-text)',
  marginTop: '4px',
};

const iconBoxStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const cardHeaderStyle = {
  backgroundColor: '#F9FAFB',
  borderBottom: '1px solid #E5E7EB',
  padding: '0.875rem 1.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const viewAllLinkStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  fontWeight: 600,
  fontSize: '0.825rem',
  cursor: 'pointer',
  padding: 0,
};

const detailRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '8px 0',
  borderBottom: '1px solid #F3F4F6',
};

const detailIconStyle = {
  color: 'var(--color-primary)',
  marginTop: '3px',
  flexShrink: 0,
};

const detailLabelStyle = {
  fontSize: '0.75rem',
  color: '#9CA3AF',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
};

const detailValueStyle = {
  fontSize: '0.9rem',
  fontWeight: 700,
  color: 'var(--color-text)',
  marginTop: '2px',
};

const quickActionRowStyle = {
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #E5E7EB',
  backgroundColor: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  width: '100%',
};

const actionIconWrapStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const modalBackdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
  padding: '1rem',
};

const modalContentStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '460px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  overflow: 'hidden',
};

const modalHeaderStyle = {
  padding: '1rem 1.25rem',
  borderBottom: '1px solid #E5E7EB',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#F9FAFB',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 700,
  color: 'var(--color-text)',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  fontSize: '0.9rem',
  color: 'var(--color-text)',
  outline: 'none',
  boxSizing: 'border-box',
};

const errorTextModalStyle = {
  fontSize: '0.78rem',
  color: '#EF4444',
  marginTop: '4px',
  fontWeight: 600,
};
