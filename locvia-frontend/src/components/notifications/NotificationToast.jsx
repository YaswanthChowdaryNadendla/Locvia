// src/components/notifications/NotificationToast.jsx
// Module 38 — Live In-App Notification Toast
// Pops up when a new order or delivery assignment event arrives in real time.

import { useNavigate } from 'react-router-dom';
import { Bell, Truck, X, ArrowRight } from 'lucide-react';

export default function NotificationToast({ toast, onDismiss, onMarkAsRead }) {
  const navigate = useNavigate();

  if (!toast) return null;

  const isOrder = toast.type === 'NEW_ORDER';
  const isDelivery = toast.type === 'DELIVERY_ASSIGNED';

  const handleClickAction = () => {
    if (onMarkAsRead) onMarkAsRead(toast.id);
    if (onDismiss) onDismiss();

    if (isOrder) {
      navigate(`/shop-owner/orders/${toast.orderId}`);
    } else if (isDelivery) {
      navigate('/delivery/active');
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        maxWidth: '380px',
        width: 'calc(100% - 40px)',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: '0 12px 30px -4px rgba(0,0,0,0.25), 0 4px 10px rgba(0,0,0,0.1)',
        border: '2px solid var(--color-primary)',
        padding: '14px 16px',
        animation: 'slideInDown 0.25s ease-out',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Leading Icon Badge */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: isOrder ? 'var(--color-primary-lighter, #DCFCE7)' : '#E0F2FE',
            color: isOrder ? 'var(--color-primary, #0C831F)' : '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isOrder ? <Bell size={20} className="animate-bounce" /> : <Truck size={20} className="animate-bounce" />}
        </div>

        {/* Text Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#111827',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {toast.title}
            </span>
            <button
              onClick={onDismiss}
              aria-label="Dismiss notification"
              style={{
                background: 'none',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
              }}
              onFocus={(e) => { e.currentTarget.style.color = '#111827'; }}
              onBlur={(e) => { e.currentTarget.style.color = '#9CA3AF'; }}
            >
              <X size={16} />
            </button>
          </div>

          <p
            style={{
              margin: '4px 0 8px',
              fontSize: '13px',
              color: '#374151',
              fontWeight: 500,
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {toast.message}
          </p>

          {/* Action Button */}
          <button
            onClick={handleClickAction}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--color-primary, #0C831F)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(12,131,31,0.3)',
              transition: 'opacity 0.15s',
            }}
          >
            <span>{isOrder ? 'View Order' : 'View Delivery'}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
