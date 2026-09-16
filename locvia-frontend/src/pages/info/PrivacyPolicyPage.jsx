// src/pages/info/PrivacyPolicyPage.jsx
// Module: Legal Pages — Privacy Policy (/privacy-policy)

import { Link } from 'react-router-dom';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

export default function PrivacyPolicyPage() {
  return (
    <InfoPageWrapper
      badge="Legal"
      title="Privacy Policy"
      subtitle="How Locvia collects, protects, and handles your information."
      breadcrumb={[{ label: 'Privacy Policy' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', fontSize: '0.9375rem', lineHeight: 1.7, color: '#334155' }}>
        <p style={{ margin: 0 }}>
          Locvia Technologies Pvt. Ltd. ("Locvia", "we", "us", or "our") respects your privacy and is committed to protecting the personal information you share with us while using our hyperlocal shopping and delivery platform.
        </p>

        <div>
          <h2 style={sectionTitleStyle}>1. Information We Collect</h2>
          <p style={{ margin: 0 }}>
            To provide reliable delivery and e-commerce services, we collect information you provide directly to us through the platform.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>2. Account Information</h2>
          <p style={{ margin: 0 }}>
            When registering an account as a customer or shop owner, we collect your name, email address, phone number, and account credentials used for authentication.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>3. Address and Delivery Information</h2>
          <p style={{ margin: 0 }}>
            To fulfill orders, we collect recipient addresses, landmark instructions, and recipient contact telephone numbers. This information is shared with the fulfilling merchant and delivery personnel solely for order completion.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>4. Order Information</h2>
          <p style={{ margin: 0 }}>
            We maintain records of products ordered, quantities, shop identifiers, order timestamps, and transaction statuses for customer order tracking and invoice generation.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>5. Payment Processing</h2>
          <p style={{ margin: 0 }}>
            Payments are securely handled by regulated third-party payment gateways (such as Razorpay). Locvia does not store sensitive payment credentials, full credit card numbers, CVVs, or bank PINs on our servers.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>6. Device and Browser Information</h2>
          <p style={{ margin: 0 }}>
            We may collect basic technical data including IP addresses, device identifiers, and browser details to ensure session stability, enhance security, and diagnose technical errors.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>7. How Information is Used</h2>
          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
            <li>Processing, packing, and delivering grocery orders.</li>
            <li>Providing customer support and responding to inquiries.</li>
            <li>Enabling merchant order and inventory management.</li>
            <li>Sending essential service updates and order status alerts.</li>
            <li>Preventing fraud and securing user accounts.</li>
          </ul>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>8. Data Security</h2>
          <p style={{ margin: 0 }}>
            We implement administrative and technical security measures designed to safeguard your personal data against unauthorized access, loss, or disclosure. Access to user data is strictly restricted to authorized platform personnel.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>9. Third-Party Services</h2>
          <p style={{ margin: 0 }}>
            We may partner with trusted service providers for hosting, map delivery estimation, and payment processing. These providers only receive data strictly necessary to perform their respective services.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>10. User Rights</h2>
          <p style={{ margin: 0 }}>
            You may view, update, or correct your personal profile information at any time through your account settings. You may also contact our support team to request account deactivation or deletion.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>11. Contact Information</h2>
          <p style={{ margin: 0 }}>
            If you have questions regarding this Privacy Policy or our data handling practices, please contact us at{' '}
            <a href="mailto:privacy@locvia.com" style={{ color: '#16A34A', fontWeight: 600 }}>
              privacy@locvia.com
            </a>{' '}
            or visit our <Link to="/contact" style={{ color: '#16A34A', fontWeight: 600 }}>Contact Page</Link>.
          </p>
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
