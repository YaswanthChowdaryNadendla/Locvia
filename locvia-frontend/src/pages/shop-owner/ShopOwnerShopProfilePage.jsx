// src/pages/shop-owner/ShopOwnerShopProfilePage.jsx
// Module 20 — Dedicated Shop Profile Management Page for Shop Owners

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useShopOwnerAuth } from '../../modules/shop-owner/auth/ShopOwnerAuthContext';
import { useAuth } from '../../context/AuthContext';
import { getOwnerShop, updateShopDetails } from '../../services/shopOwnerService';
import {
  Store,
  MapPin,
  Clock,
  Save,
  CheckCircle,
  AlertTriangle,
  Power,
  Shield,
  RotateCcw,
} from 'lucide-react';
import ButtonLoader from '../../components/common/loaders/ButtonLoader';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DEFAULT_HOURS = DAYS_OF_WEEK.reduce((acc, day) => {
  acc[day] = {
    isOpen: day !== 'Sunday',
    openTime: '08:00 AM',
    closeTime: '09:00 PM',
  };
  return acc;
}, {});

export default function ShopOwnerShopProfilePage() {
  const { user } = useAuth();
  const { isShopOpen: globalIsShopOpen, toggleShopStatus } = useShopOwnerAuth();
  const [ownerShop, setOwnerShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial shop state loaded from source
  const [initialData, setInitialData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    category: 'Grocery & Staples',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    isOpen: true,
    businessHours: DEFAULT_HOURS,
    image: '',
  });

  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load owner's shop data on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getOwnerShop()
      .then((shop) => {
        if (!isMounted) return;
        setOwnerShop(shop);
        if (shop) {
          const parsedHours = shop.businessHours || DEFAULT_HOURS;
          const loaded = {
            name: shop.name || '',
            description: shop.description || 'Fresh groceries and daily essentials delivered fast.',
            phone: shop.phone || '9876543210',
            category: shop.category || shop.type || 'Grocery & Staples',
            address: shop.address || shop.location || '12-4-56, Main Market Road',
            city: shop.city || 'Bengaluru',
            state: shop.state || 'Karnataka',
            pincode: shop.pincode || '560034',
            isOpen: shop.isOpen !== undefined ? shop.isOpen : globalIsShopOpen,
            businessHours: parsedHours,
            image: shop.image || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600&h=400',
          };
          setFormData(loaded);
          setInitialData(loaded);
        }
      })
      .catch((err) => {
        console.error('Error fetching shop profile:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [globalIsShopOpen]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Check if form has unsaved modifications
  const isFormDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  // Toggle Live Store Status (Synchronized with M19 Dashboard & AuthContext)
  const handleToggleShopStatus = () => {
    const newStatus = !formData.isOpen;
    setFormData((prev) => ({ ...prev, isOpen: newStatus }));

    // Toggle global context if state differs
    if (newStatus !== globalIsShopOpen) {
      toggleShopStatus();
    }

    try {
      updateShopDetails(ownerShop.id, { isOpen: newStatus });
      showToast(`Store is now ${newStatus ? 'OPEN for customer orders' : 'CLOSED'}.`);
    } catch {
      showToast('Failed to update shop status.', 'error');
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // 1. Shop Name
    const cleanName = formData.name.trim();
    if (!cleanName) {
      newErrors.name = 'Shop name is required.';
    } else if (cleanName.length < 2) {
      newErrors.name = 'Shop name must contain at least 2 characters.';
    }

    // 2. Phone Number (10 digit Indian number)
    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required.';
    } else if (cleanPhone.length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit Indian phone number.';
    }

    // 3. Address
    if (!formData.address.trim()) {
      newErrors.address = 'Shop address is required.';
    }

    // 4. Pincode
    const cleanPincode = formData.pincode.trim().replace(/\D/g, '');
    if (cleanPincode && cleanPincode.length !== 6) {
      newErrors.pincode = 'Pincode must be 6 digits.';
    }

    // 5. Business Hours Check
    Object.keys(formData.businessHours).forEach((day) => {
      const dayConfig = formData.businessHours[day];
      if (dayConfig.isOpen) {
        if (!dayConfig.openTime || !dayConfig.closeTime) {
          newErrors[`hours_${day}`] = 'Please enter opening and closing times.';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Submit / Save Changes
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    if (!validateForm()) {
      showToast('Please fix the errors before saving.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateShopDetails(ownerShop.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        phone: formData.phone.trim(),
        category: formData.category,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        isOpen: formData.isOpen,
        businessHours: formData.businessHours,
        image: formData.image,
      });

      // Update shopOwnerAuth key for cross-component sync
      try {
        const rawAuth = localStorage.getItem('shopOwnerAuth');
        if (rawAuth) {
          const authObj = JSON.parse(rawAuth);
          localStorage.setItem(
            'shopOwnerAuth',
            JSON.stringify({
              ...authObj,
              name: updated.name,
              phone: updated.phone,
              address: updated.address,
              isOpen: updated.isOpen,
            })
          );
        }
      } catch (err) {
        console.error('Error syncing shopOwnerAuth:', err);
      }

      setInitialData(formData);
      showToast('Shop profile updated successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to update shop profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Cancel Button
  const handleCancel = () => {
    if (isFormDirty) {
      setIsDiscardModalOpen(true);
    } else {
      showToast('No unsaved changes.');
    }
  };

  const handleDiscardChanges = () => {
    setFormData(initialData);
    setErrors({});
    setIsDiscardModalOpen(false);
    showToast('Unsaved changes discarded.');
  };

  // Business Hours Handlers
  const handleDayToggle = (day) => {
    setFormData((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          isOpen: !prev.businessHours[day].isOpen,
        },
      },
    }));
  };

  const handleTimeChange = (day, field, val) => {
    setFormData((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: val,
        },
      },
    }));
  };

  // Safe Loading Check
  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '3rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
        <p style={{ color: '#6B7280', fontSize: '1rem', fontWeight: 500 }}>Loading shop profile...</p>
      </div>
    );
  }

  if (!ownerShop) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '3rem 2rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
          <Store size={36} />
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px 0' }}>No Shop Associated With Account</h2>
        <p style={{ color: '#6B7280', maxWidth: '440px', margin: '0 auto 1.5rem auto', fontSize: '0.925rem', lineHeight: 1.5 }}>
          You do not currently have a registered shop, or your shop was recently removed by an administrator. Please register your shop to start selling.
        </p>
        <Link
          to="/shop-owner/add-shop"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '8px',
            background: 'var(--color-primary, #16A34A)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.9rem',
            textDecoration: 'none',
            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
          }}
        >
          <span>Register New Shop</span>
        </Link>
      </div>
    );
  }

  // Cross-Shop Ownership Security Check
  if (ownerShop.ownerId && user?.id && String(ownerShop.ownerId) !== String(user.id) && user?.role === 'SHOP_OWNER') {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', textAlign: 'center', backgroundColor: '#FEF2F2', borderRadius: '16px', border: '1px solid #FCA5A5' }}>
        <AlertTriangle size={48} style={{ color: '#DC2626', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991B1B' }}>Access Denied</h2>
        <p style={{ color: '#B91C1C', marginTop: '4px' }}>You do not have permission to manage this shop profile.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '1rem', boxSizing: 'border-box' }}>
      
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

      {/* Pending Approval Notice */}
      {ownerShop.status === 'PENDING' && (
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Clock size={22} color="#D97706" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#92400E', fontSize: '0.95rem', display: 'block', marginBottom: '2px' }}>
              Shop Pending Administrator Approval
            </strong>
            <span style={{ color: '#78350F', fontSize: '0.875rem' }}>
              Your shop registration has been submitted and is awaiting administrator approval. You can review and update your shop details below.
            </span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', margin: 0, lineHeight: 1.2 }}>
            Shop Profile
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '4px' }}>
            Manage your shop information and customer-facing details.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSaving}
          style={{
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'background 0.2s ease',
          }}
        >
          {isSaving ? <ButtonLoader size="sm" color="white" /> : <Save size={18} />}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── Section 1: Live Shop Status Card (M19 Sync) ── */}
        <div
          style={{
            backgroundColor: formData.isOpen ? '#F0FDF4' : '#FEF2F2',
            border: formData.isOpen ? '1px solid #BBF7D0' : '1px solid #FECACA',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 280px', minWidth: 0 }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: formData.isOpen ? '#059669' : '#DC2626',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Power size={24} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: formData.isOpen ? '#065F46' : '#991B1B' }}>
                  {formData.isOpen ? 'Shop is Open' : 'Shop is Closed'}
                </span>
                <span
                  style={{
                    backgroundColor: formData.isOpen ? '#16A34A' : '#DC2626',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                  }}
                >
                  {formData.isOpen ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: formData.isOpen ? '#047857' : '#B91C1C', marginTop: '2px' }}>
                {formData.isOpen
                  ? 'Customers can currently discover your shop and place fresh grocery orders.'
                  : 'Your shop is currently offline. Customers cannot place new orders.'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleShopStatus}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: formData.isOpen ? '#DC2626' : '#16A34A',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <Power size={18} /> {formData.isOpen ? 'Close Shop' : 'Open Shop'}
          </button>
        </div>

        {/* ── Section 2: Shop Information ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Store size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={cardTitleStyle}>Shop Information</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            
            {/* Shop Name */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Shop Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sri Lakshmi General Store"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  ...inputStyle,
                  borderColor: errors.name ? '#EF4444' : '#D1D5DB',
                }}
              />
              {errors.name && <span style={errorTextStyle}>{errors.name}</span>}
            </div>

            {/* Shop Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>Shop Description</label>
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  {formData.description.length} / 300
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={300}
                placeholder="Brief description of products, specialties, and service..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Shop Phone */}
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                style={{
                  ...inputStyle,
                  borderColor: errors.phone ? '#EF4444' : '#D1D5DB',
                }}
              />
              {errors.phone && <span style={errorTextStyle}>{errors.phone}</span>}
            </div>

            {/* Category / Type */}
            <div>
              <label style={labelStyle}>Category / Store Type</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={inputStyle}
              >
                <option value="Grocery & Staples">Grocery & Staples</option>
                <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                <option value="Dairy & Bakery">Dairy & Bakery</option>
                <option value="Organic & Speciality">Organic & Speciality</option>
                <option value="Supermarket">Supermarket</option>
              </select>
            </div>

          </div>
        </div>

        {/* ── Section 3: Shop Address & Location ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <MapPin size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={cardTitleStyle}>Shop Business Address</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            
            {/* Street / Line 1 */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Full Street Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. 12-4-56, Main Market Road, Koramangala"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{
                  ...inputStyle,
                  borderColor: errors.address ? '#EF4444' : '#D1D5DB',
                }}
              />
              {errors.address && <span style={errorTextStyle}>{errors.address}</span>}
            </div>

            {/* City */}
            <div>
              <label style={labelStyle}>City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bengaluru"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* State */}
            <div>
              <label style={labelStyle}>State *</label>
              <input
                type="text"
                required
                placeholder="e.g. Karnataka"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Pincode */}
            <div>
              <label style={labelStyle}>Pincode *</label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 560034"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                style={{
                  ...inputStyle,
                  borderColor: errors.pincode ? '#EF4444' : '#D1D5DB',
                }}
              />
              {errors.pincode && <span style={errorTextStyle}>{errors.pincode}</span>}
            </div>

          </div>
        </div>

        {/* ── Section 4: Business Hours ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Clock size={20} style={{ color: 'var(--color-primary)' }} />
            <div>
              <h2 style={cardTitleStyle}>Business Hours</h2>
              <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: '2px 0 0' }}>
                Configure opening and closing times for each day of the week.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DAYS_OF_WEEK.map((day) => {
              const dayConfig = formData.businessHours[day] || { isOpen: true, openTime: '08:00 AM', closeTime: '09:00 PM' };
              const errorKey = `hours_${day}`;

              return (
                <div
                  key={day}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '10px 14px',
                    backgroundColor: dayConfig.isOpen ? '#F9FAFB' : '#FEF2F2',
                    borderRadius: '10px',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  {/* Day Label & Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '150px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                      <input
                        type="checkbox"
                        checked={dayConfig.isOpen}
                        onChange={() => handleDayToggle(day)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                      />
                      {day}
                    </label>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: dayConfig.isOpen ? '#059669' : '#DC2626',
                        backgroundColor: dayConfig.isOpen ? '#D1FAE5' : '#FEE2E2',
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      {dayConfig.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  {/* Time Inputs */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      disabled={!dayConfig.isOpen}
                      placeholder="08:00 AM"
                      value={dayConfig.isOpen ? dayConfig.openTime : 'Closed'}
                      onChange={(e) => handleTimeChange(day, 'openTime', e.target.value)}
                      style={{
                        width: '100px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        backgroundColor: dayConfig.isOpen ? '#FFFFFF' : '#E5E7EB',
                        color: dayConfig.isOpen ? '#111827' : '#9CA3AF',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>to</span>
                    <input
                      type="text"
                      disabled={!dayConfig.isOpen}
                      placeholder="09:00 PM"
                      value={dayConfig.isOpen ? dayConfig.closeTime : 'Closed'}
                      onChange={(e) => handleTimeChange(day, 'closeTime', e.target.value)}
                      style={{
                        width: '100px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        backgroundColor: dayConfig.isOpen ? '#FFFFFF' : '#E5E7EB',
                        color: dayConfig.isOpen ? '#111827' : '#9CA3AF',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {errors[errorKey] && (
                    <span style={{ ...errorTextStyle, width: '100%' }}>{errors[errorKey]}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 5: Read-Only Owner Information ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Shield size={20} style={{ color: 'var(--color-primary)' }} />
            <div>
              <h2 style={cardTitleStyle}>Shop Owner Account Info</h2>
              <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: '2px 0 0' }}>
                System-controlled ownership credentials (Read-Only).
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            
            <div style={readOnlyBoxStyle}>
              <div style={readOnlyLabelStyle}>Owner Name</div>
              <div style={readOnlyValueStyle}>{user?.name || 'Rajan Mehta'}</div>
            </div>

            <div style={readOnlyBoxStyle}>
              <div style={readOnlyLabelStyle}>Email Address</div>
              <div style={readOnlyValueStyle}>{user?.email || 'shopowner@locvia.com'}</div>
            </div>

            <div style={readOnlyBoxStyle}>
              <div style={readOnlyLabelStyle}>Role</div>
              <div style={{ ...readOnlyValueStyle, color: '#059669', fontWeight: 700 }}>
                {user?.role || 'SHOP_OWNER'}
              </div>
            </div>

            <div style={readOnlyBoxStyle}>
              <div style={readOnlyLabelStyle}>Shop ID & Owner ID</div>
              <div style={readOnlyValueStyle}>
                Shop: #{ownerShop.id} | Owner: #{user?.id || ownerShop.ownerId}
              </div>
            </div>

          </div>
        </div>

        {/* ── Bottom Form Action Bar ── */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: isFormDirty ? '#D97706' : '#6B7280', fontWeight: 500 }}>
            {isFormDirty ? '● Unsaved changes pending...' : 'All changes saved'}
          </span>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                color: '#374151',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RotateCcw size={16} /> Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '9px 22px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {isSaving ? <ButtonLoader size="sm" color="white" /> : <Save size={16} />}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

      </form>

      {/* Discard Unsaved Changes Modal */}
      {isDiscardModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <AlertTriangle size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--color-text)' }}>
                Discard Unsaved Changes?
              </h3>
              <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
                You have unsaved changes in your Shop Profile. If you discard, your edits will be lost and original data restored.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsDiscardModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Reusable Styles ─────────────────────────────────────────────
const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  padding: '1.5rem',
  boxSizing: 'border-box',
  width: '100%',
};

const cardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '1.25rem',
  paddingBottom: '10px',
  borderBottom: '1px solid #F3F4F6',
};

const cardTitleStyle = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: 'var(--color-text)',
  margin: 0,
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: '#FFFFFF',
};

const errorTextStyle = {
  color: '#EF4444',
  fontSize: '0.75rem',
  fontWeight: 600,
  marginTop: '4px',
  display: 'block',
};

const readOnlyBoxStyle = {
  backgroundColor: '#F9FAFB',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
};

const readOnlyLabelStyle = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#6B7280',
  textTransform: 'uppercase',
};

const readOnlyValueStyle = {
  fontSize: '0.9rem',
  fontWeight: 600,
  color: 'var(--color-text)',
  marginTop: '2px',
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
};

const modalContentStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '440px',
  padding: '1.5rem',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};
