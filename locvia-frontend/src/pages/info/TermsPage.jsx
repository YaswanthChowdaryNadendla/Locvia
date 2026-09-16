// src/pages/info/TermsPage.jsx
// Module: Legal Pages — Terms of Service (/terms)

import { Link } from 'react-router-dom';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

export default function TermsPage() {
  return (
    <InfoPageWrapper
      badge="Legal"
      title="Terms of Service"
      subtitle="General terms and conditions governing the use of Locvia."
      breadcrumb={[{ label: 'Terms of Service' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', fontSize: '0.9375rem', lineHeight: 1.7, color: '#334155' }}>
        <p style={{ margin: 0 }}>
          Welcome to Locvia. By accessing or using our application, website, or services, you agree to comply with and be bound by these Terms of Service.
        </p>

        <div>
          <h2 style={sectionTitleStyle}>1. Using Locvia</h2>
          <p style={{ margin: 0 }}>
            Locvia provides a digital marketplace connecting buyers, neighborhood store merchants, and delivery partners. Users must be at least 18 years of age or possess legal parental consent to create an account and place orders.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>2. Customer Accounts</h2>
          <p style={{ margin: 0 }}>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account. Please notify us immediately of any unauthorized access.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>3. Shop Owner Responsibilities</h2>
          <p style={{ margin: 0 }}>
            Shop owners are responsible for the accuracy of their catalog listings, product pricing, inventory availability, product freshness, and operating hours. Merchants must adhere to all local food safety and commercial licensing regulations.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>4. Product Information</h2>
          <p style={{ margin: 0 }}>
            While we encourage merchants to provide precise item details and descriptions, product packaging, imagery, and weights may vary slightly from retail displays.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>5. Orders & Acceptance</h2>
          <p style={{ margin: 0 }}>
            Placing an order constitutes an offer to purchase. An order is confirmed once the fulfilling merchant accepts the request and initiates item preparation.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>6. Payments</h2>
          <p style={{ margin: 0 }}>
            Prices displayed are set by the respective merchants. Applicable delivery fees, packaging fees, and taxes are clearly itemized before checkout. Payment must be completed using authorized payment channels.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>7. Delivery</h2>
          <p style={{ margin: 0 }}>
            Delivery schedules are estimates determined by distance, weather, merchant preparation speed, and courier availability. Recipients must ensure a safe delivery location and reachable contact number.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>8. Cancellations & Returns</h2>
          <p style={{ margin: 0 }}>
            Order cancellation policies are subject to our <Link to="/refund-policy" style={{ color: '#16A34A', fontWeight: 600 }}>Refund Policy</Link>. Perishable food items cannot be returned once delivered in sound condition.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>9. Prohibited Use</h2>
          <p style={{ margin: 0 }}>
            Users must not misuse the platform, engage in fraudulent transactions, disrupt system services, scrape platform contents, or post offensive materials.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>10. Account Suspension</h2>
          <p style={{ margin: 0 }}>
            Locvia reserves the right to suspend or terminate accounts that breach these terms, commit payment fraud, or repeatedly fail merchant quality standards.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>11. Changes to Service</h2>
          <p style={{ margin: 0 }}>
            We reserve the right to modify or discontinue features of the platform with reasonable notice. Updated terms will be published on this page with revised effective dates.
          </p>
        </div>

        <div>
          <h2 style={sectionTitleStyle}>12. Contact</h2>
          <p style={{ margin: 0 }}>
            For inquiries regarding these Terms of Service, please reach out through our <Link to="/contact" style={{ color: '#16A34A', fontWeight: 600 }}>Contact Page</Link> or email{' '}
            <a href="mailto:legal@locvia.com" style={{ color: '#16A34A', fontWeight: 600 }}>
              legal@locvia.com
            </a>
            .
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
