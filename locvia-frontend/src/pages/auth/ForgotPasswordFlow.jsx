// src/pages/auth/ForgotPasswordFlow.jsx
// Module 6 - Authentication UI (Forgot Password - Full Production Flow)
// 3-step password recovery: Email -> OTP -> New Password -> Success
// This file replaces ForgotPasswordPage.jsx for the full Resend OTP flow.

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, Mail, KeyRound } from 'lucide-react';
import heroImage from '../../assets/hero1.png';
import { isValidEmail } from '../../utils/validators';
import { forgotPassword, verifyResetOtp, resetPassword } from '../../services/api/authApi';

const RESEND_COOLDOWN = 60;

const ForgotPasswordFlow = () => {
  const [step, setStep]                       = useState('email');
  const [email, setEmail]                     = useState('');
  const [resetToken, setResetToken]           = useState('');
  const [error, setError]                     = useState('');
  const [isEmailNotFound, setIsEmailNotFound] = useState(false);
  const [isLoading, setIsLoading]             = useState(false);
  const [otp, setOtp]                         = useState('');
  const [cooldown, setCooldown]               = useState(0);
  const cooldownRef                           = useRef(null);
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd]           = useState(false);
  const [showConfirmPwd, setShowConfirmPwd]   = useState(false);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsEmailNotFound(false);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) { setError('Email is required.'); return; }
    if (!isValidEmail(trimmedEmail)) { setError('Please enter a valid email address.'); return; }
    setIsLoading(true);
    try {
      await forgotPassword({ email: trimmedEmail });
      startCooldown();
      setStep('otp');
    } catch (err) {
      const isNotFound = err?.status === 404 || err?.response?.status === 404;
      if (isNotFound) {
        setIsEmailNotFound(true);
        setError(err?.message || err?.response?.data?.message || 'Email does not exist. Please create an account first.');
      } else {
        setIsEmailNotFound(false);
        setError(err?.message || err?.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) { setError('Please enter the verification code.'); return; }
    if (!/^\d{6}$/.test(trimmedOtp)) { setError('Code must be exactly 6 digits.'); return; }
    setIsLoading(true);
    try {
      const data = await verifyResetOtp({ email: email.trim(), otp: trimmedOtp });
      setResetToken(data.resetToken);
      setStep('password');
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isLoading) return;
    setError(''); setOtp('');
    setIsLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
      startCooldown();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!newPassword) { setError('New password is required.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setIsLoading(true);
    try {
      await resetPassword({ email: email.trim(), resetToken, newPassword });
      setStep('success');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const ErrorBanner = ({ msg }) => msg ? (
    <div className="auth-error-banner" role="alert">
      <AlertCircle size={16} /><span>{msg}</span>
    </div>
  ) : null;

  const resetFlow = () => {
    setStep('email'); setError(''); setOtp(''); setIsEmailNotFound(false);
    setNewPassword(''); setConfirmPassword('');
  };

  return (
    <div className="auth-page">
      <section className="auth-visual">
        <img src={heroImage} alt="Fresh Groceries" />
        <div className="auth-overlay"></div>
        <div className="auth-marketing">
          <div className="auth-brand">LOCVIA</div>
          <h1>Everything Local.<br />Delivered Fast.</h1>
          <p>Get fresh groceries, daily essentials, and quick local delivery right to your doorstep in Ongole.</p>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-card">

          <div className="auth-card-logo">
            <Link to="/" className="locvia-wordmark">
              <span className="loc">Loc</span>
              <span className="via">via</span>
              <span className="dot" />
            </Link>
          </div>

          {step === 'email' && (
            <>
              <h1 className="auth-title">Forgot your password?</h1>
              <p className="auth-subtitle">
                Enter your email and we'll send you a verification code.
              </p>
              <ErrorBanner msg={error} />
              <form onSubmit={handleEmailSubmit} className="auth-form" noValidate>
                <div className="auth-field">
                  <label htmlFor="email" className="auth-label">Email</label>
                  <div className="auth-input-wrap">
                    <input id="email" name="email" type="email"
                      className={`auth-input ${error ? 'auth-input--error' : ''}`}
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); setIsEmailNotFound(false); }}
                      autoComplete="email" autoFocus />
                  </div>
                </div>
                <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>

              {isEmailNotFound && (
                <div style={{ marginTop: '1rem' }}>
                  <Link
                    to="/register"
                    className="auth-btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      width: '100%',
                    }}
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </>
          )}

          {step === 'otp' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <Mail size={40} color="#16a34a" />
              </div>
              <h1 className="auth-title">Check your inbox</h1>
              <p className="auth-subtitle">
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
              </p>
              <ErrorBanner msg={error} />
              <form onSubmit={handleOtpSubmit} className="auth-form" noValidate>
                <div className="auth-field">
                  <label htmlFor="otp" className="auth-label">Verification Code</label>
                  <div className="auth-input-wrap">
                    <input id="otp" name="otp" type="text" inputMode="numeric" maxLength={6}
                      className={`auth-input ${error ? 'auth-input--error' : ''}`}
                      placeholder="000000" value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                      autoFocus
                      style={{ letterSpacing: '6px', fontSize: '1.25rem', textAlign: 'center' }} />
                  </div>
                </div>
                <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{"Didn't receive the code? "}</span>
                <button type="button" onClick={handleResend} disabled={cooldown > 0 || isLoading}
                  style={{
                    background: 'none', border: 'none',
                    cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                    color: cooldown > 0 ? '#9ca3af' : '#16a34a',
                    fontSize: '0.875rem', fontWeight: 600, padding: 0,
                  }}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
                </button>
              </div>
            </>
          )}

          {step === 'password' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <KeyRound size={40} color="#16a34a" />
              </div>
              <h1 className="auth-title">Create new password</h1>
              <p className="auth-subtitle">Choose a strong password for your account.</p>
              <ErrorBanner msg={error} />
              <form onSubmit={handlePasswordSubmit} className="auth-form" noValidate>
                <div className="auth-field">
                  <label htmlFor="new-password" className="auth-label">New Password</label>
                  <div className="auth-input-wrap">
                    <input id="new-password" name="newPassword"
                      type={showNewPwd ? 'text' : 'password'}
                      className={`auth-input ${error ? 'auth-input--error' : ''}`}
                      placeholder="At least 6 characters" value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      autoFocus autoComplete="new-password" />
                    <button type="button" className="auth-eye-btn"
                      onClick={() => setShowNewPwd(v => !v)} tabIndex={-1}
                      aria-label={showNewPwd ? 'Hide password' : 'Show password'}>
                      {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="confirm-password" className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrap">
                    <input id="confirm-password" name="confirmPassword"
                      type={showConfirmPwd ? 'text' : 'password'}
                      className={`auth-input ${error ? 'auth-input--error' : ''}`}
                      placeholder="Repeat your new password" value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      autoComplete="new-password" />
                    <button type="button" className="auth-eye-btn"
                      onClick={() => setShowConfirmPwd(v => !v)} tabIndex={-1}
                      aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}>
                      {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {step === 'success' && (
            <div className="auth-success-box">
              <CheckCircle2 size={52} className="auth-success-icon" />
              <h2 className="auth-title" style={{ marginTop: '1rem' }}>Password reset!</h2>
              <p className="auth-subtitle" style={{ marginBottom: '1.75rem' }}>
                Your password has been updated. You can now log in with your new password.
              </p>
              <Link to="/login" className="auth-btn-primary"
                style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
                Go to Login
              </Link>
            </div>
          )}

          {step !== 'success' && (
            <div className="auth-footer-link" style={{ marginTop: '1.75rem' }}>
              {step === 'email' ? (
                <Link to="/login" className="auth-back-link">
                  <ArrowLeft size={16} /><span>Back to Login</span>
                </Link>
              ) : (
                <button type="button" className="auth-back-link" onClick={resetFlow}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <ArrowLeft size={16} /><span>Start over</span>
                </button>
              )}
            </div>
          )}

        </div>
      </section>
    </div>
  );
};

export default ForgotPasswordFlow;