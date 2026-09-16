// src/pages/info/ContactPage.jsx
// Module: Information Pages — Contact Locvia (/contact)

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, AlertCircle, CheckCircle2, MessageSquare, Headphones, Store, Building2 } from 'lucide-react';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [formStatus, setFormStatus] = useState(null); // 'OFFLINE_NOTICE' | null

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Please enter your name.';
    if (!formData.email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.subject.trim()) errs.subject = 'Please enter a subject.';
    if (!formData.message.trim()) errs.message = 'Please enter your message.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Transparent status notification: backend contact API is not yet connected
    setFormStatus('OFFLINE_NOTICE');
  };

  return (
    <InfoPageWrapper
      badge="Contact Us"
      title="Contact Locvia"
      subtitle="We're here to help."
      breadcrumb={[{ label: 'Contact Us' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* Intro */}
        <p style={{ margin: 0, fontSize: '1.0625rem', lineHeight: 1.7, color: '#334155' }}>
          For questions, feedback, partnerships or business enquiries, get in touch with the Locvia team.
        </p>

        {/* 3 Department Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={channelCardStyle}>
            <div style={{ ...iconCircleStyle, backgroundColor: '#DCFCE7', color: '#16A34A' }}>
              <Headphones size={20} />
            </div>
            <h3 style={channelTitleStyle}>Customer Support</h3>
            <p style={channelDescStyle}>
              For help with orders, accounts or deliveries, contact the Locvia support team.
            </p>
          </div>

          <div style={channelCardStyle}>
            <div style={{ ...iconCircleStyle, backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Store size={20} />
            </div>
            <h3 style={channelTitleStyle}>Shop Owner Support</h3>
            <p style={channelDescStyle}>
              For questions about joining Locvia, managing your shop or listing products, contact us.
            </p>
          </div>

          <div style={channelCardStyle}>
            <div style={{ ...iconCircleStyle, backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <Building2 size={20} />
            </div>
            <h3 style={channelTitleStyle}>Business Enquiries</h3>
            <p style={channelDescStyle}>
              For partnerships and business enquiries, reach out to the Locvia team.
            </p>
          </div>
        </div>

        {/* Direct Contact Info Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            padding: '1.25rem',
            backgroundColor: '#F8FAFC',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontSize: '0.9375rem' }}>
            <Mail size={18} style={{ color: '#16A34A' }} />
            <a href="mailto:hello@locvia.com" style={{ color: '#0F172A', textDecoration: 'none', fontWeight: 600 }}>
              hello@locvia.com
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontSize: '0.9375rem' }}>
            <Phone size={18} style={{ color: '#16A34A' }} />
            <a href="tel:+919876543210" style={{ color: '#0F172A', textDecoration: 'none', fontWeight: 600 }}>
              +91 98765 43210
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontSize: '0.9375rem' }}>
            <MapPin size={18} style={{ color: '#16A34A' }} />
            <span>Ongole, Andhra Pradesh, India</span>
          </div>
        </div>

        {/* Contact Form */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
            Send Us a Message
          </h2>
          <p style={{ margin: '0 0 1.5rem 0', color: '#64748B', fontSize: '0.875rem' }}>
            Fill out the form below and our team will get in touch.
          </p>

          {formStatus === 'OFFLINE_NOTICE' && (
            <div
              style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <AlertCircle size={20} style={{ color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: '#1E40AF', fontSize: '0.875rem' }}>
                  Online Form Submissions Temporarily Offline
                </p>
                <p style={{ margin: 0, color: '#1E3A8A', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                  The web contact form endpoint is currently in maintenance. For immediate support, please email us directly at{' '}
                  <a href="mailto:hello@locvia.com" style={{ color: '#1D4ED8', fontWeight: 600 }}>
                    hello@locvia.com
                  </a>{' '}
                  or call{' '}
                  <a href="tel:+919876543210" style={{ color: '#1D4ED8', fontWeight: 600 }}>
                    +91 98765 43210
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={labelStyle} htmlFor="contact-name">
                  Full Name *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  placeholder="Your full name"
                  style={{ ...inputStyle, borderColor: errors.name ? '#EF4444' : '#CBD5E1' }}
                />
                {errors.name && <span style={errorStyle}>{errors.name}</span>}
              </div>

              <div>
                <label style={labelStyle} htmlFor="contact-email">
                  Email Address *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  placeholder="name@example.com"
                  style={{ ...inputStyle, borderColor: errors.email ? '#EF4444' : '#CBD5E1' }}
                />
                {errors.email && <span style={errorStyle}>{errors.email}</span>}
              </div>
            </div>

            <div>
              <label style={labelStyle} htmlFor="contact-subject">
                Subject *
              </label>
              <input
                id="contact-subject"
                type="text"
                value={formData.subject}
                onChange={(e) => {
                  setFormData({ ...formData, subject: e.target.value });
                  if (errors.subject) setErrors({ ...errors, subject: null });
                }}
                placeholder="e.g. Order Inquiry / Shop Registration"
                style={{ ...inputStyle, borderColor: errors.subject ? '#EF4444' : '#CBD5E1' }}
              />
              {errors.subject && <span style={errorStyle}>{errors.subject}</span>}
            </div>

            <div>
              <label style={labelStyle} htmlFor="contact-message">
                Message *
              </label>
              <textarea
                id="contact-message"
                rows={4}
                value={formData.message}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value });
                  if (errors.message) setErrors({ ...errors, message: null });
                }}
                placeholder="How can we help you today?"
                style={{ ...inputStyle, resize: 'vertical', borderColor: errors.message ? '#EF4444' : '#CBD5E1' }}
              />
              {errors.message && <span style={errorStyle}>{errors.message}</span>}
            </div>

            <button
              type="submit"
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.9375rem',
                padding: '0.625rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803D')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16A34A')}
            >
              <Send size={16} /> Send Message
            </button>
          </form>
        </div>
      </div>
    </InfoPageWrapper>
  );
}

const channelCardStyle = {
  backgroundColor: '#F8FAFC',
  borderRadius: '12px',
  padding: '1.25rem',
  border: '1px solid #E2E8F0',
};

const channelTitleStyle = {
  margin: '0.75rem 0 0.25rem 0',
  fontSize: '1rem',
  fontWeight: 700,
  color: '#0F172A',
};

const channelDescStyle = {
  margin: 0,
  fontSize: '0.875rem',
  color: '#64748B',
  lineHeight: 1.5,
};

const iconCircleStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#334155',
  marginBottom: '0.375rem',
};

const inputStyle = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '0.875rem',
  color: '#0F172A',
  backgroundColor: '#FFFFFF',
  boxSizing: 'border-box',
  outline: 'none',
};

const errorStyle = {
  display: 'block',
  fontSize: '0.75rem',
  color: '#EF4444',
  marginTop: '0.25rem',
};
