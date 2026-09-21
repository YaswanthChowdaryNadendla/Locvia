// src/pages/auth/RegisterPage.jsx
// Module 6 — Authentication UI (Register Page with Email OTP Verification)

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Mail, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { verifyEmail, resendVerification } from '../../services/api/authApi';
import heroImage from '../../assets/hero1.png';

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
  const isQueryVerify = searchParams.get('step') === 'verify' && Boolean(queryEmail);

  // Flow step: 'form' | 'verify'
  const [step, setStep] = useState(isQueryVerify ? 'verify' : 'form');
  const [registeredEmail, setRegisteredEmail] = useState(queryEmail);

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

  // 60-second Resend cooldown state
  const [cooldown, setCooldown] = useState(isQueryVerify ? 60 : 0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendFeedback, setResendFeedback] = useState('');
  const cooldownRef = useRef(null);

  const { handleRegister, isLoading } = useAuth();
  const navigate = useNavigate();

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
      });

      if (result?.emailVerificationRequired) {
        setRegisteredEmail(result.email || email.trim());
        setStep('verify');
        setOtpDigits(['', '', '', '', '', '']);
        setVerifyError('');
        setResendFeedback('');
        startCooldown();
      } else {
        navigate(result?.redirectTo || '/', { replace: true });
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
      await verifyEmail({
        email: registeredEmail,
        otp: fullOtp,
      });

      setVerifySuccess(true);
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: 'Email verified successfully! Please log in to continue.' },
        });
      }, 1500);
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
      const res = await resendVerification({ email: registeredEmail });
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

          {step === 'verify' ? (
            <div>
              {verifySuccess ? (
                <div className="auth-success-box">
                  <CheckCircle2 size={54} className="auth-success-icon" />
                  <h2 className="auth-title" style={{ marginTop: '1rem', color: '#16a34a' }}>
                    Email Verified!
                  </h2>
                  <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
                    Your email address has been successfully verified. Redirecting to login...
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
                    Verify Your Email
                  </h1>
                  <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    We\'ve sent a 6-digit verification code to:
                  </p>

                  <div style={{ textAlign: 'center' }}>
                    <div className="auth-masked-email-box">
                      <span>{maskEmail(registeredEmail)}</span>
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
                      Verification code
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
                    <p style={{ margin: '0 0 4px', color: '#64748b' }}>Didn\'t receive the code?</p>
                    {cooldown > 0 ? (
                      <span style={{ color: '#94a3af', fontWeight: 600 }}>
                        Resend code in {cooldown}s
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
            </>
          )}

        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
