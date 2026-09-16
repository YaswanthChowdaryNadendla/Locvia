// src/pages/shop-owner/ShopOwnerOrderDetailsPage.jsx
// Dedicated Order Details Page for Shop Owners (Module 23)

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getOwnerShop,
  getOwnerOrderById,
  updateOwnerOrderStatus,
} from '../../services/shopOwnerService';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/loaders/SkeletonLoader';
import ButtonLoader from '../../components/common/loaders/ButtonLoader';
import {
  ArrowLeft,
  ShoppingBag,
  CheckCircle,
  MapPin,
  Phone,
  User,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  PackageCheck,
  AlertCircle,
  X,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

const STATUS_BADGES = {
  PLACED: { label: 'NEW (PLACED)', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  CONFIRMED: { label: 'CONFIRMED', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  PREPARING: { label: 'PREPARING', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  READY_FOR_PICKUP: { label: 'READY FOR PICKUP', color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
  OUT_FOR_DELIVERY: { label: 'OUT FOR DELIVERY', color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' },
  DELIVERED: { label: 'DELIVERED', color: '#16A34A', bg: '#DCFCE7', border: '#BBF7D0' },
  CANCELLED: { label: 'CANCELLED', color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
};

export default function ShopOwnerOrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ownerShop, setOwnerShop] = useState(null);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    getOwnerShop().then(shop => setOwnerShop(shop)).catch(() => setOwnerShop(null));
  }, []);

  const loadOrder = async (targetShopId) => {
    setLoading(true);
    setAccessError(null);
    const shopId = targetShopId || ownerShop?.id;
    if (shopId && orderId) {
      try {
        const found = await getOwnerOrderById(shopId, orderId);
        if (!found) {
          setAccessError('ORDER_NOT_FOUND');
        } else {
          setOrder(found);
        }
      } catch (err) {
        setAccessError(err.message || 'ACCESS_DENIED');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ownerShop?.id && orderId) {
      loadOrder(ownerShop.id);
    }
  }, [ownerShop?.id, orderId]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Execute Status Transition
  const executeStatusChange = async (newStatus, message) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await updateOwnerOrderStatus(ownerShop.id, orderId, newStatus);
      await loadOrder(ownerShop.id);
      showToast(message || `Order status updated to "${newStatus}".`);
      setModalConfig(null);
    } catch (err) {
      showToast(err.message || 'Failed to update order status.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Open confirmation modal
  const promptStatusChange = (targetStatus, title, text, actionText) => {
    setModalConfig({
      targetStatus,
      title,
      text,
      actionText,
    });
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }} aria-busy="true" aria-label="Loading order details">
        {/* Header Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <SkeletonLoader width="140px" height="24px" />
          <SkeletonLoader width="110px" height="28px" borderRadius="14px" />
        </div>

        {/* 2-Column Grid Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Left Column Skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.5rem' }}>
              <SkeletonLoader width="160px" height="22px" style={{ marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <SkeletonLoader width="48px" height="48px" borderRadius="8px" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <SkeletonLoader width="60%" height="16px" />
                  <SkeletonLoader width="30%" height="14px" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.5rem' }}>
              <SkeletonLoader width="140px" height="20px" style={{ marginBottom: '1rem' }} />
              <SkeletonLoader width="80%" height="16px" style={{ marginBottom: '8px' }} />
              <SkeletonLoader width="90%" height="16px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Access Denied or Order Not Found Error View
  if (accessError || !order) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '1rem' }}>
        <EmptyState
          icon={AlertTriangle}
          title={accessError === 'ORDER_NOT_FOUND' ? 'Order Not Found' : 'Access Denied'}
          description={
            accessError === 'ORDER_NOT_FOUND'
              ? `Order #${orderId} could not be found in the system.`
              : `Order #${orderId} does not contain products from your shop or you do not have permission to view it.`
          }
          actionLabel="Back to Orders"
          onAction={() => navigate('/shop-owner/orders')}
        />
      </div>
    );
  }

  const currentStatus = (order.orderStatus || order.status || 'PLACED').toUpperCase();
  const statusConfig = STATUS_BADGES[currentStatus] || STATUS_BADGES.PLACED;
  const items = Array.isArray(order.items) ? order.items : [];
  const shopSubtotal = order.shopSubtotal || 0;

  const dateFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent Order';

  const customerName = order.address?.fullName || order.address?.name || 'Customer';
  const customerPhone = order.address?.phone || 'N/A';
  const addressText = order.address
    ? `${order.address.addressLine1 || ''}${order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}${order.address.landmark ? ` (Near ${order.address.landmark})` : ''}, ${order.address.city || ''}, ${order.address.state || ''} - ${order.address.pincode || ''}`
    : 'Standard Delivery Address';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: notification.type === 'error' ? '#EF4444' : '#10B981',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          {notification.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Top Navigation & Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/shop-owner/orders')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '10px',
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> Back to All Orders
        </button>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
              Order #{order.orderId || order.id}
            </h1>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Placed on {dateFormatted}
            </p>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 700,
              backgroundColor: statusConfig.bg,
              color: statusConfig.color,
              border: `1px solid ${statusConfig.border}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusConfig.color }} />
            {statusConfig.label}
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: Customer Info & Products List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Customer & Delivery Address Card */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                <MapPin size={18} style={{ color: 'var(--color-primary)' }} /> Customer Delivery Information
              </div>
              <span style={{ fontSize: '0.75rem', backgroundColor: '#E0F2FE', color: '#0284C7', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                {order.address?.type || 'Home'}
              </span>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={16} style={{ color: 'var(--color-primary)' }} />
                <strong style={{ color: 'var(--color-text)' }}>{customerName}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={16} style={{ color: 'var(--color-primary)' }} />
                <span>+91 {customerPhone}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={16} style={{ color: 'var(--color-primary)', marginTop: '3px', flexShrink: 0 }} />
                <span style={{ color: '#4B5563', lineHeight: 1.5 }}>{addressText}</span>
              </div>
            </div>
          </div>

          {/* Shop Products Table */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                <ShoppingBag size={18} style={{ color: 'var(--color-primary)' }} />
                Shop Products ({items.length})
              </div>
              <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                Historical Order Snapshot
              </span>
            </div>

            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((item, idx) => {
                  const unitPrice = Number(item.price || 0);
                  const qty = Number(item.quantity || 1);
                  const itemTotal = unitPrice * qty;

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={normalizeImageUrl(item.image, 'product')}
                          alt={item.name}
                          onError={(e) => handleImageError(e, 'product')}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid #E5E7EB',
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '2px' }}>
                            ₹{unitPrice} × {qty} {item.unit ? `(${item.unit})` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>
                          ₹{itemTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal Summary */}
              <div
                style={{
                  marginTop: '1.25rem',
                  paddingTop: '12px',
                  borderTop: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4B5563' }}>
                    Shop Products Subtotal
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                    Excludes delivery fees and other shops
                  </div>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  ₹{shopSubtotal.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Actions, Payment & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Fulfillment Actions Card */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                Fulfillment Controls
              </div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.4 }}>
                Current Status: <strong style={{ color: statusConfig.color }}>{statusConfig.label}</strong>
              </div>

              {/* Status Action Buttons */}
              {currentStatus === 'PLACED' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() =>
                      promptStatusChange(
                        'CONFIRMED',
                        'Accept Order?',
                        `Accept order #${order.orderId || order.id} and notify customer?`,
                        'Accept Order'
                      )
                    }
                    style={primaryActionBtnStyle}
                  >
                    Accept Order
                  </button>
                  <button
                    onClick={() =>
                      promptStatusChange(
                        'CANCELLED',
                        'Cancel Order?',
                        'Are you sure you want to cancel this order? This action cannot be undone.',
                        'Confirm Cancel'
                      )
                    }
                    style={cancelBtnStyle}
                  >
                    Cancel Order
                  </button>
                </div>
              )}

              {currentStatus === 'CONFIRMED' && (
                <button
                  onClick={() =>
                    promptStatusChange(
                      'PREPARING',
                      'Start Preparing Order?',
                      `Mark order #${order.orderId || order.id} as currently being prepared in your shop?`,
                      'Start Preparing'
                    )
                  }
                  style={primaryActionBtnStyle}
                >
                  Start Preparing
                </button>
              )}

              {currentStatus === 'PREPARING' && (
                <button
                  onClick={() =>
                    promptStatusChange(
                      'READY_FOR_PICKUP',
                      'Mark Ready for Pickup?',
                      `Mark order #${order.orderId || order.id} as ready and packed for delivery pickup?`,
                      'Mark Ready'
                    )
                  }
                  style={primaryActionBtnStyle}
                >
                  Mark Ready for Pickup
                </button>
              )}

              {currentStatus === 'READY_FOR_PICKUP' && (
                <div
                  style={{
                    backgroundColor: '#D1FAE5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#059669',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <PackageCheck size={20} /> Order is packed and waiting for delivery partner.
                </div>
              )}

              {currentStatus === 'DELIVERED' && (
                <div
                  style={{
                    backgroundColor: '#DCFCE7',
                    border: '1px solid #BBF7D0',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#16A34A',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={20} /> Order successfully delivered to customer.
                </div>
              )}

              {currentStatus === 'CANCELLED' && (
                <div
                  style={{
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#DC2626',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={20} /> This order was cancelled.
                </div>
              )}
            </div>
          </div>

          {/* Payment & Verification Snapshot Card */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                <CreditCard size={18} style={{ color: 'var(--color-primary)' }} /> Payment Details
              </div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Payment Status:</span>
                <span style={{ fontWeight: 700, color: '#059669', backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: '4px' }}>
                  {order.paymentStatus || 'PAID'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Payment Method:</span>
                <span style={{ fontWeight: 600, color: '#374151', textTransform: 'uppercase' }}>
                  {order.paymentMethod || 'Online'}
                </span>
              </div>

              {order.paymentId && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Payment ID:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#374151', fontSize: '0.8rem' }}>
                    {order.paymentId}
                  </span>
                </div>
              )}

              <div
                style={{
                  marginTop: '6px',
                  paddingTop: '8px',
                  borderTop: '1px solid #E5E7EB',
                  fontSize: '0.78rem',
                  color: '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={14} /> Razorpay Verified Mock Payment
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {modalConfig && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} style={{ color: modalConfig.targetStatus === 'CANCELLED' ? '#DC2626' : 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                  {modalConfig.title}
                </h3>
              </div>
              <button
                onClick={() => setModalConfig(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {modalConfig.text}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalConfig(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#4B5563',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  executeStatusChange(
                    modalConfig.targetStatus,
                    `Order status updated to "${modalConfig.targetStatus}".`
                  )
                }
                disabled={isUpdating}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: modalConfig.targetStatus === 'CANCELLED' ? '#DC2626' : 'var(--color-primary)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {isUpdating && <ButtonLoader size="sm" color="white" />}
                <span>{isUpdating ? 'Updating...' : modalConfig.actionText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable Styles ─────────────────────────────────────────────
const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const cardHeaderStyle = {
  backgroundColor: '#F9FAFB',
  borderBottom: '1px solid #E5E7EB',
  padding: '0.875rem 1.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const primaryActionBtnStyle = {
  width: '100%',
  padding: '10px 16px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: 'var(--color-primary)',
  color: '#FFFFFF',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
};

const cancelBtnStyle = {
  width: '100%',
  padding: '10px 16px',
  borderRadius: '8px',
  border: '1px solid #FCA5A5',
  backgroundColor: '#FEF2F2',
  color: '#DC2626',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
};
