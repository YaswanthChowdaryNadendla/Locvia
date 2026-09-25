// src/pages/shop-owner/AddShopPage.jsx
// Shop Registration / Onboarding Page for Shop Owners
// Connects to Spring Boot backend via shopOwnerService / shopApi.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  FileText,
  Image,
  Tag,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createShop } from '../../services/shopOwnerService';
import { getErrorMessage } from '../../services/api/errorHandler';
import { ButtonLoader } from '../../components/common/loaders';

const CATEGORIES = [
  'Grocery',
  'Fruits & Vegetables',
  'Dairy & Bakery',
  'Organic Essentials',
  'Beverages & Snacks',
  'Meat & Seafood',
  'Personal Care',
  'Household Items',
];

export default function AddShopPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Grocery',
    description: '',
    address: '',
    phone: user?.phone || '',
    email: user?.email || '',
    imageUrl: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successShop, setSuccessShop] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Shop name is required';
    } else if (formData.name.trim().length > 150) {
      errs.name = 'Shop name must not exceed 150 characters';
    }

    if (!formData.address.trim()) {
      errs.address = 'Shop address is required';
    } else if (formData.address.trim().length > 255) {
      errs.address = 'Shop address must not exceed 255 characters';
    }

    if (formData.phone && formData.phone.trim().length > 30) {
      errs.phone = 'Phone number must not exceed 30 characters';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (formData.imageUrl && formData.imageUrl.trim().length > 500) {
      errs.imageUrl = 'Image URL must not exceed 500 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (apiError) setApiError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        address: formData.address.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
      };

      const result = await createShop(payload);
      setSuccessShop(result);
    } catch (err) {
      console.error('Failed to create shop:', err);
      setApiError(getErrorMessage(err) || 'Failed to register shop. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successShop) {
    return (
      <div style={{ maxWidth: '640px', margin: '2rem auto', padding: '0 1rem' }}>
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            padding: '2.5rem 2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px 0' }}>
            Shop Registered Successfully!
          </h2>

          <p style={{ fontSize: '0.95rem', color: '#4B5563', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
            <strong>{successShop.name}</strong> has been registered on Locvia. Your shop is currently{' '}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: '#FEF3C7',
                color: '#92400E',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              <Clock size={12} /> PENDING APPROVAL
            </span>
            . An administrator will review your shop registration shortly.
          </p>

          <div
            style={{
              background: '#F9FAFB',
              borderRadius: '12px',
              padding: '1rem',
              textAlign: 'left',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              color: '#374151',
            }}
          >
            <div style={{ marginBottom: '6px' }}>
              <strong>Address:</strong> {successShop.address}
            </div>
            {successShop.phone && (
              <div style={{ marginBottom: '6px' }}>
                <strong>Phone:</strong> {successShop.phone}
              </div>
            )}
            {successShop.email && (
              <div>
                <strong>Email:</strong> {successShop.email}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link
              to="/shop-owner/dashboard"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                background: '#FFFFFF',
                color: '#374151',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Go to Dashboard
            </Link>
            <Link
              to="/shop-owner/shop-profile"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--color-primary, #16A34A)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>View Profile</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '1.5rem auto', padding: '0 1rem' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px 0' }}>
          Register Your Shop
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', margin: 0 }}>
          Provide your local store details to register on the Locvia platform. Once submitted, your shop will be reviewed by Admin.
        </p>
      </div>

      {apiError && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ color: '#991B1B', fontSize: '0.875rem', fontWeight: 500 }}>{apiError}</div>
        </div>
      )}

      {/* Registration Form Card */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '2rem',
        }}
      >
        {/* Section 1: Basic Information */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              margin: '0 0 1rem 0',
              paddingBottom: '8px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Store size={18} color="var(--color-primary, #16A34A)" />
            Basic Shop Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>
                Shop Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Yash Fresh Supermarket"
                style={inputStyle(Boolean(errors.name))}
                maxLength={150}
              />
              {errors.name && <span style={errorTextStyle}>{errors.name}</span>}
            </div>

            <div>
              <label style={labelStyle}>Category</label>
              <div style={{ position: 'relative' }}>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={inputStyle(false)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief summary of fresh produce, groceries, or specialties your store offers..."
                rows={3}
                style={{ ...inputStyle(false), resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Location */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              margin: '0 0 1rem 0',
              paddingBottom: '8px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <MapPin size={18} color="var(--color-primary, #16A34A)" />
            Location & Contact Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>
                Shop Address <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. 14 Market Street, Near Clock Tower, Ongole"
                style={inputStyle(Boolean(errors.address))}
                maxLength={255}
              />
              {errors.address && <span style={errorTextStyle}>{errors.address}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Contact Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  style={inputStyle(Boolean(errors.phone))}
                  maxLength={30}
                />
                {errors.phone && <span style={errorTextStyle}>{errors.phone}</span>}
              </div>

              <div>
                <label style={labelStyle}>Shop Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. store@example.com"
                  style={inputStyle(Boolean(errors.email))}
                  maxLength={150}
                />
                {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Branding */}
        <div style={{ marginBottom: '2rem' }}>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              margin: '0 0 1rem 0',
              paddingBottom: '8px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Image size={18} color="var(--color-primary, #16A34A)" />
            Store Image URL (Optional)
          </h3>

          <div>
            <label style={labelStyle}>Image URL</label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/images/my-shop.jpg"
              style={inputStyle(Boolean(errors.imageUrl))}
              maxLength={500}
            />
            {errors.imageUrl && <span style={errorTextStyle}>{errors.imageUrl}</span>}
          </div>
        </div>

        {/* Notice Box */}
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            color: '#166534',
          }}
        >
          <Clock size={18} style={{ flexShrink: 0 }} />
          <span>
            Upon submission, your shop starts with <strong>PENDING</strong> status. Admin approval is required before your shop becomes active.
          </span>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/shop-owner/dashboard')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              background: '#FFFFFF',
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
            disabled={isSubmitting}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--color-primary, #16A34A)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
            }}
          >
            {isSubmitting ? (
              <>
                <ButtonLoader size="sm" color="white" />
                <span>Registering Shop...</span>
              </>
            ) : (
              <span>Add Shop</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.825rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '6px',
};

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: hasError ? '1px solid #EF4444' : '1px solid #D1D5DB',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: '#FFFFFF',
});

const errorTextStyle = {
  color: '#EF4444',
  fontSize: '0.75rem',
  fontWeight: 600,
  marginTop: '4px',
  display: 'block',
};
