// src/pages/auth/LoginPage.jsx
// Module 6 — Authentication UI (Login Page)
// Updated: Role selector added for all 4 Locvia user types.

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, User, Store, Bike, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import heroImage from '../../assets/hero1.png';

// ── Role configuration ────────────────────────────────────────────────────
const ROLES = [
  {
    value: 'CUSTOMER',
    label: 'Customer',
    Icon: User,
    subtitle: 'Login to continue shopping locally.',
  },
  {
    value: 'SHOP_OWNER',
    label: 'Shop Owner',
    Icon: Store,
    subtitle: 'Login to manage your shop and products.',
  },
  {
    value: 'DELIVERY_PARTNER',
    label: 'Delivery',
    Icon: Bike,
    subtitle: 'Login to manage your deliveries.',
  },
  {
    value: 'ADMIN',
    label: 'Admin',
    Icon: ShieldCheck,
    subtitle: 'Login to access the Locvia administration panel.',
  },
];

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  // Shows a reassuring "waking up backend…" hint after 3.5s of loading
  const [slowConnection, setSlowConnection] = useState(false);
  const slowTimerRef = useRef(null);

  const { handleLogin, handleGoogleLogin, isLoading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const googleBtnContainerRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const navigate = useNavigate();
  const location = useLocation();
  const [infoMessage, setInfoMessage] = useState(location.state?.message || '');

  // Current role config (for dynamic subtitle)
  const activeRole = ROLES.find((r) => r.value === selectedRole) || ROLES[0];

  // Start / clear the slow-connection hint timer whenever loading state changes
  useEffect(() => {
    if (isLoading) {
      slowTimerRef.current = setTimeout(() => setSlowConnection(true), 3500);
    } else {
      clearTimeout(slowTimerRef.current);
      setSlowConnection(false);
    }
    return () => clearTimeout(slowTimerRef.current);
  }, [isLoading]);

  // ── Google Identity Services (GIS) Initialization ────────────────────────
  useEffect(() => {
    if (!googleClientId) return;

    let checkInterval = null;

    const initializeGis = () => {
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        if (checkInterval) clearInterval(checkInterval);

        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              if (!response?.credential) return;
              setGoogleLoading(true);
              setServerError('');
              try {
                const result = await handleGoogleLogin(response.credential, selectedRole);
                navigate(result.redirectTo || '/');
              } catch (err) {
                setServerError(err.message || 'Google authentication failed. Please try again.');
              } finally {
                setGoogleLoading(false);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: googleBtnContainerRef.current.offsetWidth || 380,
          });
          setGisLoaded(true);
        } catch (e) {
          console.warn('GIS initialization error:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initializeGis();
    } else {
      checkInterval = setInterval(initializeGis, 250);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [googleClientId, selectedRole, handleGoogleLogin, navigate]);

  const validate = () => {
    const newErrors = {};
    if (!identifier.trim()) {
      newErrors.identifier = 'Email is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setInfoMessage('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      const result = await handleLogin({
        email: identifier,
        password,
        selectedRole,
      });
      navigate(result?.redirectTo || '/', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Invalid credentials. Please try again.');
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
            Shop from trusted neighborhood stores near you and get daily essentials delivered in minutes.
          </p>
        </div>
      </section>

      {/* ── Right Form Section ── */}
      <section className="auth-form-section">
        <div className="auth-card">

          {/* Logo */}
          <div className="auth-card-logo">
            <Link to="/" className="locvia-wordmark">
              <span className="loc">Loc</span>
              <span className="via">via</span>
              <span className="dot" />
            </Link>
          </div>

          <h1 className="auth-title">Welcome back</h1>

          {/* ── Role Selector ── */}
          <div className="role-selector" role="group" aria-label="Login as">
            <p className="role-selector__label">Login as</p>
            <div className="role-selector__grid">
              {ROLES.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`role-option-btn${selectedRole === value ? ' role-option-btn--active' : ''}`}
                  onClick={() => {
                    setSelectedRole(value);
                    setServerError('');
                  }}
                  aria-pressed={selectedRole === value}
                  aria-label={`Login as ${label}`}
                  disabled={isLoading}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic subtitle */}
          <p className="auth-subtitle">{activeRole.subtitle}</p>

          {infoMessage && (
            <div className="auth-success-banner" role="status" style={{ marginBottom: '1.25rem' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{infoMessage}</span>
            </div>
          )}

          {serverError && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>{serverError}</span>
                {serverError.toLowerCase().includes('verify your email') && (
                  <Link
                    to={`/register?step=verify&email=${encodeURIComponent(identifier.trim())}`}
                    style={{
                      color: '#0c831f',
                      fontWeight: 700,
                      textDecoration: 'underline',
                      fontSize: '12.5px',
                      marginTop: '2px',
                    }}
                  >
                    Verify your email now &rarr;
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            
            {/* Email field */}
            <div className="auth-field">
              <label htmlFor="identifier" className="auth-label">
                Email
              </label>
              <div className="auth-input-wrap">
                <input
                  id="identifier"
                  type="email"
                  className={`auth-input ${errors.identifier ? 'auth-input--error' : ''}`}
                  placeholder="Enter your email address"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errors.identifier) setErrors(prev => ({ ...prev, identifier: null }));
                  }}
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
              {errors.identifier && <span className="auth-field-error">{errors.identifier}</span>}
            </div>

            {/* Password field */}
            <div className="auth-field">
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <div className="auth-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`auth-input ${errors.password ? 'auth-input--error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                  }}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="auth-field-error">{errors.password}</span>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="auth-options-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  className="auth-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Remember me</span>
              </label>

              <Link to="/forgot-password" className="auth-link-forgot">
                Forgot Password?
              </Link>
            </div>

            {/* Primary Submit */}
            <button type="submit" className="auth-btn-primary" disabled={isLoading}>
              {isLoading ? (
                <span className="auth-btn-loading">
                  <Loader2 size={16} className="auth-spinner" aria-hidden="true" />
                  {slowConnection ? 'Starting up server, please wait…' : 'Logging in…'}
                </span>
              ) : (
                'Login'
              )}
            </button>

            {/* Cold-start reassurance hint shown after 3.5s */}
            {slowConnection && (
              <p className="auth-slow-hint" role="status" aria-live="polite">
                Our server is waking up — this takes about 30–50 seconds on the first request. Please wait.
              </p>
            )}
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>OR</span>
          </div>

          {/* Google Button */}
          <div className="auth-google-wrapper">
            {googleLoading ? (
              <button type="button" className="auth-btn-google" disabled>
                <Loader2 className="animate-spin" size={18} />
                <span>Signing in with Google...</span>
              </button>
            ) : (
              <>
                <div
                  ref={googleBtnContainerRef}
                  className="auth-google-gis-container"
                  style={{ display: gisLoaded ? 'flex' : 'none' }}
                />
                {!gisLoaded && (
                  <button
                    type="button"
                    className="auth-btn-google"
                    onClick={() => {
                      if (!googleClientId) {
                        setServerError('Google Sign-In is not configured. Please set VITE_GOOGLE_CLIENT_ID.');
                      } else {
                        setServerError('Google Sign-In is loading, please wait a moment...');
                      }
                    }}
                  >
                    <svg className="auth-google-icon" width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Create Account Link */}
          <div className="auth-footer-text">
            <span>Don't have an account?</span>{' '}
            <Link to="/register" className="auth-link-bold">
              Create Account
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
};

export default LoginPage;
