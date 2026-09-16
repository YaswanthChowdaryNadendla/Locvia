// src/modules/shop-owner/auth/ShopOwnerLogin.jsx
// Module 19 — Shop Owner Login Page (/shop/login)

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Eye, EyeOff, Lock, Mail, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { useShopOwnerAuth } from './ShopOwnerAuthContext';
import { LocviaLogo } from '../../../components/layout/Navbar';

export default function ShopOwnerLogin() {
  const { login, isAuthenticated } = useShopOwnerAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/shop/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleFillDemo = () => {
    setEmail('shopowner@locvia.com');
    setPassword('shopowner123');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address or Shop ID.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate brief network delay
      await new Promise((res) => setTimeout(res, 400));
      login({ email, password });
      navigate('/shop/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="shop-auth-container">
      <div className="shop-auth-card animate-scale-in">
        
        {/* Top Branding Header */}
        <div className="shop-auth-header">
          <LocviaLogo size="md" />
          <div className="shop-portal-badge">
            <Store size={14} />
            <span>Shop Owner Portal</span>
          </div>
        </div>

        <div className="shop-auth-welcome">
          <h1 className="shop-auth-title">Welcome back, Partner</h1>
          <p className="shop-auth-subtitle">Sign in to manage your grocery store, orders, and inventory.</p>
        </div>

        {/* Demo Credentials Box */}
        <div className="shop-demo-box">
          <div className="shop-demo-header">
            <ShieldCheck size={16} className="text-primary" />
            <span>Demo Shop Credentials</span>
          </div>
          <p className="shop-demo-text">
            Email: <code>shopowner@locvia.com</code><br />
            Password: <code>shopowner123</code>
          </p>
          <button type="button" onClick={handleFillDemo} className="shop-demo-btn">
            Auto-fill Demo Details
          </button>
        </div>

        {error && (
          <div className="shop-auth-error">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="shop-auth-form">
          {/* Email Input */}
          <div className="form-group">
            <label className="form-label">Email Address or Shop ID</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. shopowner@locvia.com"
                className="form-input icon-padding"
                autoFocus
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form-input icon-padding"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember & Forgot Password */}
          <div className="shop-auth-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('For demo, use password: shopowner123'); }} className="forgot-link">
              Forgot password?
            </a>
          </div>

          {/* Submit CTA */}
          <button type="submit" disabled={isSubmitting} className="shop-auth-submit-btn">
            {isSubmitting ? 'Signing in...' : 'Sign in to Dashboard'}
          </button>
        </form>

        {/* Footer links */}
        <div className="shop-auth-footer">
          <p>
            Don't have a shop account?{' '}
            <Link to="/shop/register" className="shop-link-highlight">
              Apply to become a shop partner
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
