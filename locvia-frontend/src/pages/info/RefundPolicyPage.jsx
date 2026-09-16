// src/pages/info/RefundPolicyPage.jsx
// Module: Information Pages — Refund Policy (/refund-policy)

import { Link } from 'react-router-dom';
import { ArrowRight, ShieldAlert, CreditCard, RefreshCw, AlertCircle, Headphones } from 'lucide-react';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

export default function RefundPolicyPage() {
  return (
    <InfoPageWrapper
      badge="Refunds & Cancellations"
      title="Refund Policy"
      subtitle="Clear information about cancellations, refunds, and order issues."
      breadcrumb={[{ label: 'Refund Policy' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '0.9375rem', lineHeight: 1.7, color: '#334155' }}>
        <p style={{ margin: 0 }}>
          At Locvia, we strive to ensure a smooth, reliable experience for all customers ordering from neighborhood stores. This policy outlines how order cancellations, failed payments, and refunds are handled.
        </p>

        {/* 1. Order Cancellation */}
        <div>
          <h2 style={sectionTitleStyle}>1. Order Cancellation</h2>
          <p style={{ margin: 0 }}>
            Customers may cancel an order before it has been confirmed or prepared by the merchant. Once a shop owner begins preparing fresh items or packaging products, cancellation may not be possible to avoid food and resource wastage.
          </p>
        </div>

        {/* 2. Failed & Duplicate Payments */}
        <div>
          <h2 style={sectionTitleStyle}>2. Failed & Duplicate Payments</h2>
          <p style={{ margin: 0 }}>
            If funds were deducted from your bank or payment method for a transaction that was marked as failed or unconfirmed, the transaction is automatically flagged for reversal by the banking gateway. If an accidental duplicate charge occurs, the excess charge will be refunded upon verification.
          </p>
        </div>

        {/* 3. Eligible Refund Situations */}
        <div>
          <h2 style={sectionTitleStyle}>3. Eligible Refund Situations</h2>
          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
            <li>An item was missing from the delivered order and not substituted.</li>
            <li>The merchant cancelled the order due to item unavailability or store closure.</li>
            <li>The delivered goods arrived damaged, spoiled, or past expiration date.</li>
            <li>A delivery failed due to a verified merchant or logistics issue.</li>
          </ul>
        </div>

        {/* 4. Refund Processing */}
        <div>
          <h2 style={sectionTitleStyle}>4. Refund Processing</h2>
          <div
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              padding: '1rem',
              color: '#1E40AF',
              fontSize: '0.875rem',
            }}
          >
            <p style={{ margin: 0, fontWeight: 500 }}>
              Refund processing time may vary depending on the payment provider and circumstances.
            </p>
          </div>
          <p style={{ margin: '0.75rem 0 0 0' }}>
            Approved refunds are credited back to the original payment method used during checkout. Depending on your financial institution or UPI provider, standard banking processing windows apply.
          </p>
        </div>

        {/* 5. Product & Order Issues */}
        <div>
          <h2 style={sectionTitleStyle}>5. Reporting Product or Order Issues</h2>
          <p style={{ margin: 0 }}>
            If you encounter an issue with your items upon delivery, please report it within 24 hours through your order details page or by reaching out to our support team with your order number and details.
          </p>
        </div>

        {/* 6. Contact Support CTA */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
              Have questions regarding a refund?
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
              Our support team is available to investigate your order and assist you.
            </p>
          </div>

          <Link
            to="/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803D')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16A34A')}
          >
            <Headphones size={16} /> Contact Support <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </InfoPageWrapper>
  );
}

const sectionTitleStyle = {
  fontSize: '1.125rem',
  fontWeight: 700,
  color: '#0F172A',
  margin: '0 0 0.5rem 0',
};
