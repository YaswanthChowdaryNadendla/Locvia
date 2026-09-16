// src/pages/info/HelpCenterPage.jsx
// Module: Information Pages — Help Centre (/help)

import { useState } from 'react';
import { HelpCircle, ChevronDown, ShoppingBag, Store, Truck, CreditCard } from 'lucide-react';
import InfoPageWrapper from '../../components/common/InfoPageWrapper';

const FAQ_SECTIONS = [
  {
    category: 'Customers',
    icon: ShoppingBag,
    color: '#16A34A',
    bg: '#DCFCE7',
    items: [
      {
        q: 'How do I create a Locvia account?',
        a: 'Select Create Account from the login page and complete the registration process.',
      },
      {
        q: 'How do I find a local shop?',
        a: 'Use the search and shop discovery features to find available shops near you.',
      },
      {
        q: 'How do I place an order?',
        a: 'Choose a shop, select products, add them to your cart, choose a delivery address and complete checkout.',
      },
      {
        q: 'How can I track my order?',
        a: 'Open your Orders section to view the current status of your order.',
      },
    ],
  },
  {
    category: 'Shop Owners',
    icon: Store,
    color: '#2563EB',
    bg: '#EFF6FF',
    items: [
      {
        q: 'How can I add my shop?',
        a: 'Sign in as a Shop Owner and use the Shop Owner dashboard to create and manage your shop.',
      },
      {
        q: 'How do I add products?',
        a: 'After creating your shop, use Product Management to add products, prices, images and inventory.',
      },
    ],
  },
  {
    category: 'Delivery Partners',
    icon: Truck,
    color: '#D97706',
    bg: '#FEF3C7',
    items: [
      {
        q: 'How do delivery partners receive orders?',
        a: 'Available delivery requests appear in the Delivery Partner dashboard.',
      },
      {
        q: 'How do I update delivery status?',
        a: 'Use the delivery status controls in your Delivery dashboard.',
      },
    ],
  },
  {
    category: 'Payments',
    icon: CreditCard,
    color: '#7C3AED',
    bg: '#F5F3FF',
    items: [
      {
        q: 'Which payment method is supported?',
        a: 'Locvia supports the payment methods currently enabled during checkout.',
      },
      {
        q: 'Is my payment information stored by Locvia?',
        a: 'Locvia does not store sensitive card security information such as CVV or PIN.',
      },
    ],
  },
];

export default function HelpCenterPage() {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (key) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <InfoPageWrapper
      badge="Help Centre"
      title="Help Centre"
      subtitle="Find answers to common questions about Locvia."
      breadcrumb={[{ label: 'Help Centre' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {FAQ_SECTIONS.map((sec, secIdx) => {
          const IconComp = sec.icon;
          return (
            <div key={secIdx}>
              {/* Category Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: sec.bg,
                    color: sec.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconComp size={20} />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                  {sec.category}
                </h2>
              </div>

              {/* Accordion Questions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sec.items.map((item, itemIdx) => {
                  const key = `${secIdx}-${itemIdx}`;
                  const isOpen = openItems[key] !== false; // default open for readability

                  return (
                    <div
                      key={itemIdx}
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(key)}
                        style={{
                          width: '100%',
                          padding: '1rem 1.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1E293B' }}>
                          {item.q}
                        </span>
                        <ChevronDown
                          size={18}
                          style={{
                            color: '#64748B',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            flexShrink: 0,
                          }}
                        />
                      </button>

                      {isOpen && (
                        <div
                          style={{
                            padding: '0 1.25rem 1rem 1.25rem',
                            fontSize: '0.875rem',
                            lineHeight: 1.6,
                            color: '#475569',
                            borderTop: '1px solid #F1F5F9',
                            paddingTop: '0.75rem',
                          }}
                        >
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </InfoPageWrapper>
  );
}
