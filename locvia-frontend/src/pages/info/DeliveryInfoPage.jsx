// src/pages/info/DeliveryInfoPage.jsx
// Module: Information Pages — Delivery Information (/delivery-info)

import { Truck, Clock, CheckCircle2, MapPin, AlertCircle } from 'lucide-react';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

const STATUS_STEPS = [
  { name: 'Pending', desc: 'Order is placed by customer and awaiting shop acknowledgement.' },
  { name: 'Confirmed', desc: 'Shop has accepted the order and is preparing to assemble items.' },
  { name: 'Preparing', desc: 'Items are being packed and verified by the merchant.' },
  { name: 'Ready for Pickup', desc: 'Package is sealed and ready for courier pickup.' },
  { name: 'Out for Delivery', desc: 'Delivery partner has collected the order and is en route.' },
  { name: 'Delivered', desc: 'Order has been successfully handed over to the customer.' },
  { name: 'Cancelled', desc: 'Order was cancelled by the customer or merchant.' },
];

export default function DeliveryInfoPage() {
  return (
    <InfoPageWrapper
      badge="Delivery Info"
      title="Delivery Information"
      subtitle="How local delivery works on Locvia."
      breadcrumb={[{ label: 'Delivery Info' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '0.9375rem', lineHeight: 1.7, color: '#334155' }}>
        {/* Section 1: How delivery works */}
        <div>
          <h2 style={sectionTitleStyle}>How delivery works</h2>
          <p style={{ margin: 0 }}>
            Customers place orders from available local shops. Once the order is prepared, it can be assigned to a delivery partner for delivery.
          </p>
        </div>

        {/* Section 2: Order Status */}
        <div>
          <h2 style={sectionTitleStyle}>Order Status Lifecycle</h2>
          <p style={{ margin: '0 0 1rem 0', color: '#64748B' }}>
            Throughout the fulfillment journey, orders progress through transparent milestone statuses:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {STATUS_STEPS.map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <span
                  style={{
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    whiteSpace: 'nowrap',
                    marginTop: '2px',
                  }}
                >
                  {step.name}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#475569' }}>{step.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Delivery Updates */}
        <div>
          <h2 style={sectionTitleStyle}>Delivery Updates</h2>
          <p style={{ margin: 0 }}>
            Customers can view delivery and order status from their Orders section in real time as merchant and delivery updates occur.
          </p>
        </div>

        {/* Section 4: Delivery Availability */}
        <div>
          <h2 style={sectionTitleStyle}>Delivery Availability</h2>
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '1rem',
            }}
          >
            <p style={{ margin: 0 }}>
              Delivery availability depends on the shop, service area and delivery partner availability. Operating hours and service radius are set directly by each local store owner to ensure prompt local handling.
            </p>
          </div>
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
