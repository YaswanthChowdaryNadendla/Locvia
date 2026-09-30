// src/components/cart/CartToast.jsx
// Lightweight, non-blocking toast for instant cart feedback

import { CheckCircle2, AlertCircle } from 'lucide-react';

const CartToast = ({ toast }) => {
  if (!toast || !toast.message) return null;

  const isSuccess = toast.type === 'success' || !toast.type;

  return (
    <div
      role="status"
      aria-live="polite"
      className="cart-toast-notification"
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: isSuccess ? '#0c831f' : '#dc2626',
        color: '#ffffff',
        padding: '10px 18px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 600,
        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08)',
        pointerEvents: 'none',
        userSelect: 'none',
        animation: 'cartToastSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {isSuccess ? (
        <CheckCircle2 size={17} strokeWidth={2.5} className="shrink-0" />
      ) : (
        <AlertCircle size={17} strokeWidth={2.5} className="shrink-0" />
      )}
      <span>{toast.message}</span>
      <style>{`
        @keyframes cartToastSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (max-width: 640px) {
          .cart-toast-notification {
            bottom: 80px !important;
            right: 16px !important;
            left: 16px !important;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default CartToast;
