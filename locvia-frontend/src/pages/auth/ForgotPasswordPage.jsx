// src/pages/auth/ForgotPasswordPage.jsx
// Module 6 — Authentication UI (Forgot Password)
// Password recovery flow — Email only

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import heroImage from '../../assets/hero1.png';
import { isValidEmail } from '../../utils/validators';

const ForgotPasswordPage = () => {
  const [email, setEmail]             = useState('');
  const [error, setError]             = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitted(true);
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
            Get fresh groceries, daily essentials, and quick local delivery right to your doorstep in Ongole.
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

          {!isSubmitted ? (
            <>
              <h1 className="auth-title">Forgot your password?</h1>
              <p className="auth-subtitle">
                Enter your email and we'll send you a verification code.
              </p>

              {error && (
                <div className="auth-error-banner" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="auth-field">
                  <label htmlFor="email" className="auth-label">
                    Email
                  </label>
                  <div className="auth-input-wrap">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className={`auth-input ${error ? 'auth-input--error' : ''}`}
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button type="submit" className="auth-btn-primary">
                  Continue
                </button>
              </form>
            </>
          ) : (
            <div className="auth-success-box">
              <CheckCircle2 size={48} className="auth-success-icon" />
              <h2 className="auth-title" style={{ marginTop: '1rem' }}>Check your inbox</h2>
              <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
                We have sent a verification code to <strong>{email}</strong> to help you reset your password.
              </p>
              <button
                type="button"
                className="auth-btn-secondary"
                onClick={() => { setIsSubmitted(false); setEmail(''); }}
              >
                Send again
              </button>
            </div>
          )}

          {/* Footer Back Link */}
          <div className="auth-footer-link" style={{ marginTop: '1.75rem' }}>
            <Link to="/login" className="auth-back-link">
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
};

export default ForgotPasswordPage;
