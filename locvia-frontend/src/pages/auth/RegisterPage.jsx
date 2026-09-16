// src/pages/auth/RegisterPage.jsx
// Module 6 — Authentication UI (Register Page)

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import heroImage from '../../assets/hero1.png';

const RegisterPage = () => {
  const [fullName, setFullName]             = useState('');
  const [mobileNumber, setMobileNumber]     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors]           = useState({});
  const [serverError, setServerError] = useState('');

  const { handleRegister, isLoading } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[0-9+\s-]{10,15}$/.test(mobileNumber.trim())) {
      newErrors.mobileNumber = 'Please enter a valid mobile number';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      const result = await handleRegister({
        name: fullName,
        email,
        phone: mobileNumber,
        password,
      });
      navigate(result?.redirectTo || '/', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Failed to create account. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left Visual Section (Desktop) ── */}
      <section className="auth-visual">
        <img src={heroImage} alt="Fresh Groceries" />
        <div className="auth-overlay"></div>
        <div className="auth-marketing">
          <div className="auth-brand">LOCVIA</div>
          <h1>
            Everything Local.
            <br />
            Delivered Fast.
          </h1>
          <p>
            Join thousands of happy customers shopping daily essentials from verified local stores.
          </p>
        </div>
      </section>

      {/* ── Right Form Section ── */}
      <section className="auth-form-section">
        <div className="auth-card auth-card--register">

          {/* Logo */}
          <div className="auth-card-logo">
            <Link to="/" className="locvia-wordmark">
              <span className="loc">Loc</span>
              <span className="via">via</span>
              <span className="dot" />
            </Link>
          </div>

          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join Locvia and shop from trusted local stores.</p>

          {serverError && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={16} />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            
            {/* Full Name */}
            <div className="auth-field">
              <label htmlFor="fullName" className="auth-label">
                Full Name
              </label>
              <div className="auth-input-wrap">
                <input
                  id="fullName"
                  type="text"
                  className={`auth-input ${errors.fullName ? 'auth-input--error' : ''}`}
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: null }));
                  }}
                  autoComplete="name"
                />
              </div>
              {errors.fullName && <span className="auth-field-error">{errors.fullName}</span>}
            </div>

            {/* Mobile Number */}
            <div className="auth-field">
              <label htmlFor="mobileNumber" className="auth-label">
                Mobile Number
              </label>
              <div className="auth-input-wrap">
                <input
                  id="mobileNumber"
                  type="tel"
                  className={`auth-input ${errors.mobileNumber ? 'auth-input--error' : ''}`}
                  placeholder="e.g. +91 9876543210"
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    if (errors.mobileNumber) setErrors(prev => ({ ...prev, mobileNumber: null }));
                  }}
                  autoComplete="tel"
                />
              </div>
              {errors.mobileNumber && <span className="auth-field-error">{errors.mobileNumber}</span>}
            </div>

            {/* Email Address */}
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">
                Email
              </label>
              <div className="auth-input-wrap">
                <input
                  id="email"
                  type="email"
                  className={`auth-input ${errors.email ? 'auth-input--error' : ''}`}
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                  }}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="auth-field-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <div className="auth-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`auth-input ${errors.password ? 'auth-input--error' : ''}`}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="auth-field-error">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label htmlFor="confirmPassword" className="auth-label">
                Confirm Password
              </label>
              <div className="auth-input-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`auth-input ${errors.confirmPassword ? 'auth-input--error' : ''}`}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }));
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}
            </div>

            {/* Primary Submit */}
            <button type="submit" className="auth-btn-primary" style={{ marginTop: '0.4rem' }} disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="auth-footer-text">
            <span>Already have an account?</span>{' '}
            <Link to="/login" className="auth-link-bold">
              Login
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
