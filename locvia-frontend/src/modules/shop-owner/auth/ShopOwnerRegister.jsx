// src/modules/shop-owner/auth/ShopOwnerRegister.jsx
// Module 19 — Shop Owner Registration Page (/shop/register)

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Upload, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useShopOwnerAuth } from './ShopOwnerAuthContext';
import { LocviaLogo } from '../../../components/layout/Navbar';

const CATEGORIES = [
  'Grocery',
  'Fruits & Vegetables',
  'Bakery',
  'Pharmacy',
  'Electronics',
  'General Store',
  'Other',
];

export default function ShopOwnerRegister() {
  const { register } = useShopOwnerAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    email: '',
    category: 'Grocery',
    address: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.shopName.trim()) errs.shopName = 'Shop name is required.';
    if (!formData.ownerName.trim()) errs.ownerName = 'Owner name is required.';

    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim().replace(/\s+/g, ''))) {
      errs.phone = 'Enter a valid 10-digit Indian phone number.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address.';
    }

    if (!formData.address.trim()) errs.address = 'Shop address is required.';

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.agreeTerms) {
      errs.agreeTerms = 'You must accept the terms and conditions.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      register(formData);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrors({ submit: err.message || 'Registration failed.' });
    }
  };

  return (
    <div className="shop-auth-container" style={{ padding: '2rem 1rem' }}>
      <div className="shop-auth-card animate-scale-in" style={{ maxWidth: '640px' }}>
        
        {/* Top Header */}
        <div className="shop-auth-header">
          <LocviaLogo size="md" />
          <div className="shop-portal-badge">
            <Store size={14} />
            <span>Shop Partner Application</span>
          </div>
        </div>

        <div className="shop-auth-welcome">
          <h1 className="shop-auth-title">Grow Your Grocery Business</h1>
          <p className="shop-auth-subtitle">Join Locvia to deliver fresh groceries to thousands of local customers.</p>
        </div>

        {isSuccess ? (
          <div className="shop-register-success-box animate-fade-in">
            <CheckCircle2 size={48} className="text-primary" />
            <h2>Application Submitted Successfully!</h2>
            <p>Your shop account has been created. Redirecting to Shop Owner Login...</p>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
              Go to Login Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="shop-register-form">
            
            {errors.submit && (
              <div className="shop-auth-error">
                <AlertCircle size={16} />
                <span>{errors.submit}</span>
              </div>
            )}

            <div className="form-grid-2">
              {/* Shop Name */}
              <div className="form-group">
                <label className="form-label">Shop Name *</label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  placeholder="e.g. Green Fresh Supermarket"
                  className={`form-input ${errors.shopName ? 'error' : ''}`}
                />
                {errors.shopName && <p className="form-error-msg">{errors.shopName}</p>}
              </div>

              {/* Owner Name */}
              <div className="form-group">
                <label className="form-label">Owner Name *</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="e.g. Rajan Mehta"
                  className={`form-input ${errors.ownerName ? 'error' : ''}`}
                />
                {errors.ownerName && <p className="form-error-msg">{errors.ownerName}</p>}
              </div>
            </div>

            <div className="form-grid-2">
              {/* Phone */}
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                />
                {errors.phone && <p className="form-error-msg">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. shopowner@locvia.com"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                />
                {errors.email && <p className="form-error-msg">{errors.email}</p>}
              </div>
            </div>

            <div className="form-grid-2">
              {/* Category */}
              <div className="form-group">
                <label className="form-label">Business Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Logo Upload Placeholder */}
              <div className="form-group">
                <label className="form-label">Shop Logo (Optional)</label>
                <div className="shop-logo-upload-box">
                  <Upload size={18} className="text-primary" />
                  <span>Upload Logo Image</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label className="form-label">Shop Address *</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full street address, area, city, pincode"
                className={`form-input ${errors.address ? 'error' : ''}`}
              />
              {errors.address && <p className="form-error-msg">{errors.address}</p>}
            </div>

            <div className="form-grid-2">
              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                />
                {errors.password && <p className="form-error-msg">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                />
                {errors.confirmPassword && <p className="form-error-msg">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="checkbox-label" style={{ alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  style={{ marginTop: '3px' }}
                />
                <span style={{ fontSize: '13px', color: 'var(--color-gray-600)' }}>
                  I agree to Locvia Merchant Terms of Service and Partner Agreement.
                </span>
              </label>
              {errors.agreeTerms && <p className="form-error-msg">{errors.agreeTerms}</p>}
            </div>

            {/* Submit CTA */}
            <button type="submit" className="shop-auth-submit-btn" style={{ marginTop: '1.25rem' }}>
              Submit Shop Partner Application
            </button>

          </form>
        )}

        <div className="shop-auth-footer">
          <p>
            Already have a shop account?{' '}
            <Link to="/login" className="shop-link-highlight">
              Sign in here
            </Link>
          </p>
          <div className="shop-footer-divider" />
          <Link to="/login" className="back-customer-link">
            <ArrowLeft size={16} /> Back to Customer Login
          </Link>
        </div>

      </div>
    </div>
  );
}
