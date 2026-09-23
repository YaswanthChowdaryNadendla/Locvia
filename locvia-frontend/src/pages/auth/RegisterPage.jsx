// src/pages/auth/RegisterPage.jsx
// Module 6 — Authentication UI (Register Page with Email OTP Verification)

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Mail, CheckCircle2, Loader2, ArrowLeft, User, Store, Bike, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { verifySignupEmail, resendSignupOtp } from '../../services/api/authApi';
import heroImage from '../../assets/hero1.png';

// ── Supported Public Signup Roles & Configuration ────────────────────────────
const SIGNUP_ROLES = [
  {
    value: 'CUSTOMER',
    label: 'Customer',
    Icon: User,
    heading: 'Create your Customer account',
    subtitle: 'Join Locvia and shop from trusted local stores.',
    buttonText: 'Create Customer Account',
  },
  {
    value: 'SHOP_OWNER',
    label: 'Shop Owner',
    Icon: Store,
    heading: 'Create your Shop Owner account',
    subtitle: 'Register your store and start selling on Locvia.',
    buttonText: 'Create Shop Owner Account',
  },
  {
    value: 'DELIVERY_PARTNER',
    label: 'Delivery Partner',
    Icon: Bike,
    heading: 'Create your Delivery Partner account',
    subtitle: 'Join Locvia and deliver orders from local stores.',
    buttonText: 'Create Delivery Partner Account',
  },
  {
    value: 'ADMIN',
    label: 'Admin',
    Icon: ShieldCheck,
    heading: 'Admin Account',
    subtitle: '',
    buttonText: '',
  },
];

/**
 * Safely masks email for display: user@example.com -> u***@example.com
 */
const maskEmail = (str) => {
  if (!str || !str.includes('@')) return str || '';
  const [local, domain] = str.split('@');
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
};

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const queryEmail = searchParams.get('email') || '';
  const isVerificationConfigEnabled = import.meta.env.VITE_EMAIL_VERIFICATION_ENABLED === 'true';
  const isQueryVerify = isVerificationConfigEnabled && searchParams.get('step') === 'verify' && Boolean(queryEmail);

  // Read initial role from URL query param if valid, else default to CUSTOMER
  const roleParam = (searchParams.get('role') || '').toUpperCase();
  const initialRole = SIGNUP_ROLES.some((r) => r.value === roleParam) ? roleParam : 'CUSTOMER';
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [registeredRole, setRegisteredRole] = useState(initialRole);

  // Flow step: 'form' | 'verify' | 'success'
  const [step, setStep] = useState(isQueryVerify ? 'verify' : 'form');
  const [registeredEmail, setRegisteredEmail] = useState(queryEmail);
  const [registrationSuccessMessage, setRegistrationSuccessMessage] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // 6-digit OTP verification state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [verifySuccessMessage, setVerifySuccessMessage] = useState('');

  // 60-second Resend cooldown state
  const [cooldown, setCooldown] = useState(isQueryVerify ? 60 : 0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendFeedback, setResendFeedback] = useState('');
  const cooldownRef = useRef(null);

  const { handleRegister, isLoading } = useAuth();
  const navigate = useNavigate();

  const activeRole = SIGNUP_ROLES.find((r) => r.value === selectedRole) || SIGNUP_ROLES[0];

  useEffect(() => {
    if (isQueryVerify) {
      startCooldown();
    }
    return () => clearInterval(cooldownRef.current);
  }, []);

  const startCooldown = () => {
    setCooldown(60);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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

    if (selectedRole === 'ADMIN') {
      setServerError('Admin accounts cannot be created via public registration.');
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      const result = await handleRegister({
        name: fullName.trim(),
        email: email.trim(),
        phone: mobileNumber.trim(),
        password,
        role: selectedRole,
      });

      if (result?.emailVerificationRequired) {
        setRegisteredEmail(result.email || email.trim());
        setRegisteredRole(selectedRole);
        setStep('verify');
        setOtpDigits(['', '', '', '', '', '']);
        setVerifyError('');
        setResendFeedback('');
        startCooldown();
      } else {
        const defaultRoleMsg = selectedRole === 'SHOP_OWNER'
          ? 'Account created successfully! Your shop owner application is pending administrator approval.'
          : selectedRole === 'DELIVERY_PARTNER'
          ? 'Account created successfully! Your delivery partner application is pending administrator approval.'
          : 'Account created successfully! You can now log in to Locvia.';
        const successMsg = result?.message || defaultRoleMsg;

        setRegistrationSuccessMessage(successMsg);
        setRegisteredEmail(email.trim());
        setRegisteredRole(selectedRole);
        setStep('success');

        setTimeout(() => {
          navigate('/login', {
            replace: true,
            state: { message: successMsg, email: email.trim(), role: selectedRole },
          });
        }, 2200);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to create account. Please try again.');
    }
  };

  // OTP handlers
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    const next = [...otpDigits];
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        next[i] = chars[i] || '';
      }
      setOtpDigits(next);
      const focusIndex = Math.min(chars.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    next[index] = cleaned[0];
    setOtpDigits(next);

    if (index < 5 && cleaned[0]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;
    const next = [...otpDigits];
    const chars = pasteData.split('');
    for (let i = 0; i < 6; i++) {
      next[i] = chars[i] || '';
    }
    setOtpDigits(next);
    const focusIndex = Math.min(chars.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const isOtpComplete = otpDigits.every((d) => d !== '');

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setVerifyError('Please enter all 6 digits of the verification code.');
      return;
    }

    setVerifyError('');
    setResendFeedback('');
    setVerifyLoading(true);

    try {
      const res = await verifySignupEmail({
        email: registeredEmail,
        otp: fullOtp,
      });

      const defaultMsg =
        registeredRole === 'SHOP_OWNER'
          ? 'Email verified successfully. Your Shop Owner account has been created and is pending admin approval.'
          : registeredRole === 'DELIVERY_PARTNER'
          ? 'Email verified successfully. Your Delivery Partner account has been created and is pending admin approval.'
          : 'Email verified successfully. Your Customer account has been created. You can now login.';

      const successMsg = res?.message || defaultMsg;
      setVerifySuccessMessage(successMsg);
      setVerifySuccess(true);
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: successMsg },
        });
      }, 1800);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid verification code.';
      setVerifyError(msg);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || resendLoading) return;

    setVerifyError('');
    setResendFeedback('');
    setResendLoading(true);

    try {
      const res = await resendSignupOtp({ email: registeredEmail });
      setResendFeedback(res?.message || 'New verification code sent to your email.');
      startCooldown();
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Could not resend verification code. Please try again.';
      setVerifyError(msg);
    } finally {
      setResendLoading(false);
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

          {step === 'success' ? (
            <div className="auth-success-box" style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  marginBottom: '1rem',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h2 className="auth-title" style={{ marginTop: '0.5rem', color: '#16a34a', fontSize: '1.5rem' }}>
                Account Created Successfully!
              </h2>
              <p className="auth-subtitle" style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: '#4b5563' }}>
                {registrationSuccessMessage}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="auth-btn auth-btn--primary"
                  style={{ width: '100%', maxWidth: '280px' }}
                  onClick={() =>
                    navigate('/login', {
                      replace: true,
                      state: { message: registrationSuccessMessage, email: registeredEmail, role: registeredRole },
                    })
                  }
                >
                  Go to Login
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  <Loader2 size={16} className="auth-spinner" />
                  <span>Redirecting to login...</span>
                </div>
              </div>
            </div>
          ) : step === 'verify' ? (
            <div>
              {verifySuccess ? (
                <div className="auth-success-box">
                  <CheckCircle2 size={54} className="auth-success-icon" />
                  <h2 className="auth-title" style={{ marginTop: '1rem', color: '#16a34a' }}>
                    Email Verified!
                  </h2>
                  <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
                    {verifySuccessMessage || 'Your email address has been successfully verified. Redirecting to login...'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Loader2 size={24} className="auth-spinner" color="#16a34a" />
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#dcfce7',
                        color: '#16a34a',
                      }}
                    >
                      <Mail size={28} />
                    </div>
                  </div>

                  <h1 className="auth-title" style={{ textAlign: 'center' }}>
                    Verify your email
                  </h1>
                  <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    We've sent a 6-digit verification code to
                  </p>

                  <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    <div className="auth-masked-email-box">
                      <span>{registeredEmail}</span>
                    </div>
                  </div>

                  {verifyError && (
                    <div className="auth-error-banner" role="alert">
                      <AlertCircle size={16} />
                      <span>{verifyError}</span>
                    </div>
                  )}

                  {resendFeedback && (
                    <div className="auth-success-banner" role="status">
                      <CheckCircle2 size={16} />
                      <span>{resendFeedback}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtp} className="auth-form" noValidate>
                    <label className="auth-label" style={{ textAlign: 'center', display: 'block' }}>
                      Enter the 6-digit verification code sent to your email.
                    </label>

                    <div className="otp-boxes-wrap" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          autoComplete="one-time-code"
                          aria-label={`Digit ${index + 1} of verification code`}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className={`otp-box-input ${digit ? 'otp-box-input--filled' : ''} ${
                            verifyError ? 'otp-box-input--error' : ''
                          }`}
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="auth-btn-primary"
                      disabled={!isOtpComplete || verifyLoading}
                      style={{ marginTop: '0.5rem' }}
                    >
                      {verifyLoading ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <Loader2 size={18} className="auth-spinner" />
                          <span>Verifying...</span>
                        </span>
                      ) : (
                        'Verify Email'
                      )}
                    </button>
                  </form>

                  {/* Resend section */}
                  <div className="auth-resend-wrap">
                    <p style={{ margin: '0 0 4px', color: '#64748b' }}>Didn't receive the code?</p>
                    {cooldown > 0 ? (
                      <span style={{ color: '#94a3af', fontWeight: 600 }}>
                        Resend available in {cooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="auth-resend-btn"
                        onClick={handleResendOtp}
                        disabled={resendLoading}
                      >
                        {resendLoading ? 'Sending new code...' : 'Resend Code'}
                      </button>
                    )}
                  </div>

                  {/* Footer Back Link */}
                  <div className="auth-footer-link" style={{ marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      className="auth-back-link"
                      onClick={() => {
                        setStep('form');
                        setVerifyError('');
                        setResendFeedback('');
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <ArrowLeft size={16} />
                      <span>Back to registration</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* ── Role Selector ── */}
              <div className="role-selector" role="group" aria-label="Account Type">
                <p className="role-selector__label">Account Type</p>
                <div className="role-selector__grid">
                  {SIGNUP_ROLES.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      className={`role-option-btn${selectedRole === value ? ' role-option-btn--active' : ''}`}
                      onClick={() => {
                        setSelectedRole(value);
                        setServerError('');
                      }}
                      aria-pressed={selectedRole === value}
                      aria-label={`Select ${label}`}
                      disabled={isLoading}
                    >
                      <Icon size={18} aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedRole === 'ADMIN' ? (
                <div className="auth-admin-restriction" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: '#fef2f2',
                      color: '#dc2626',
                      marginBottom: '1rem',
                    }}
                  >
                    <ShieldCheck size={28} />
                  </div>
                  <h2 className="auth-title" style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#1e293b' }}>
                    Admin accounts cannot be created here.
                  </h2>
                  <p className="auth-subtitle" style={{ marginBottom: '1.5rem', color: '#64748b' }}>
                    Admin accounts are created and managed by the Locvia system administrator.
                  </p>
                  <button
                    type="button"
                    className="auth-btn-secondary"
                    onClick={() => {
                      setSelectedRole('CUSTOMER');
                      setServerError('');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                    }}
                  >
                    Back to Account Types
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="auth-title">{activeRole.heading}</h1>
                  <p className="auth-subtitle">{activeRole.subtitle}</p>

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
                            if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
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
                            if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: null }));
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
                            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
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
                            if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                          }}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="auth-eye-btn"
                          onClick={() => setShowPassword((prev) => !prev)}
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
                            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                          }}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="auth-eye-btn"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}
                    </div>

                    {/* Primary Submit */}
                    <button
                      type="submit"
                      className="auth-btn-primary"
                      style={{ marginTop: '0.4rem' }}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending verification code...' : activeRole.buttonText}
                    </button>
                  </form>

                  {/* Login Link */}
                  <div className="auth-footer-text">
                    <span>Already have an account?</span>{' '}
                    <Link to="/login" className="auth-link-bold">
                      Login
                    </Link>
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
