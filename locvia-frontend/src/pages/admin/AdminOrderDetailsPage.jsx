// src/pages/admin/AdminOrderDetailsPage.jsx
// Module 33 — Admin Order Details Inspection Page

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  User,
  MapPin,
  CreditCard,
  Truck,
  AlertCircle,
  PackageCheck,
  Store,
  XCircle,
  IndianRupee,
} from 'lucide-react';
import {
  getOrderDetails,
  formatINR,
  formatOrderDate,
} from '../../services/adminOrderService';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonLoader } from '../../components/common/loaders';

const ORDER_STATUS_STYLES = {
  PLACED: { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' },
  CONFIRMED: { background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' },
  PREPARING: { background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' },
  READY_FOR_PICKUP: { background: '#FEF08A', color: '#854D0E', border: '1px solid #FDE047' },
  ASSIGNED: { background: '#EDE7F6', color: '#512DA8', border: '1px solid #D1C4E9' },
  PICKED_UP: { background: '#F3E8FF', color: '#7E22CE', border: '1px solid #E9D5FF' },
  OUT_FOR_DELIVERY: { background: '#E0E7FF', color: '#4338CA', border: '1px solid #C7D2FE' },
  DELIVERED: { background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' },
  CANCELLED: { background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' },
};

const LIFECYCLE_STAGES = [
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'ASSIGNED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

const AdminOrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      const details = getOrderDetails(orderId);
      setOrder(details);
    }
    setLoading(false);
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ width: '100%', minWidth: 0 }} aria-busy="true" aria-label="Loading order details">
        <SkeletonLoader width="140px" height="32px" borderRadius="6px" style={{ marginBottom: '20px' }} />
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '24px' }}>
          <SkeletonLoader width="220px" height="28px" borderRadius="6px" style={{ marginBottom: '12px' }} />
          <SkeletonLoader width="350px" height="18px" borderRadius="4px" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
            <SkeletonLoader width="150px" height="20px" borderRadius="4px" style={{ marginBottom: '16px' }} />
            <SkeletonLoader width="100%" height="80px" borderRadius="8px" style={{ marginBottom: '12px' }} />
            <SkeletonLoader width="100%" height="40px" borderRadius="8px" />
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
            <SkeletonLoader width="150px" height="20px" borderRadius="4px" style={{ marginBottom: '16px' }} />
            <SkeletonLoader width="100%" height="80px" borderRadius="8px" style={{ marginBottom: '12px' }} />
            <SkeletonLoader width="100%" height="40px" borderRadius="8px" />
          </div>
        </div>
      </div>
    );
  }

  // Invalid Order Fallback
  if (!order) {
    return (
      <div style={{ width: '100%', minWidth: 0 }}>
        <button
          onClick={() => navigate('/admin/orders')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '20px',
          }}
        >
          <ArrowLeft size={18} />
          Back to Orders
        </button>

        <EmptyState
          icon={AlertCircle}
          title="Order Not Found"
          message={`Order ID #${orderId} does not exist or is no longer available.`}
          actionLabel="Back to Orders"
          onAction={() => navigate('/admin/orders')}
        />
      </div>
    );
  }

  const statusStyle = ORDER_STATUS_STYLES[order.orderStatus] || { background: '#F1F5F9', color: '#475569' };
  const currentStageIndex = LIFECYCLE_STAGES.indexOf(order.orderStatus);

  return (
    <div className="admin-order-details-page" style={{ width: '100%', minWidth: 0 }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/orders')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '20px',
          padding: '6px 0',
        }}
      >
        <ArrowLeft size={18} />
        Back to Orders
      </button>

      {/* Header Banner */}
      <div
        style={{
          background: 'var(--color-surface, #FFFFFF)',
          border: '1px solid var(--color-border, #E2E8F0)',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              Order #{order.id}
            </h1>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                ...statusStyle,
              }}
            >
              {order.orderStatus}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
            Placed on {formatOrderDate(order.createdAt)} • Estimated: {order.estimatedDelivery}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
            Final Payable Amount
          </span>
          <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary, #16A34A)' }}>
            {formatINR(order.finalTotal)}
          </span>
        </div>
      </div>

      {/* Main Grid: 2 Columns on Desktop */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Customer, Address & Ordered Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Customer Details Card */}
          <div
            style={{
              background: 'var(--color-surface, #FFFFFF)',
              border: '1px solid var(--color-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <User size={20} color="var(--color-primary, #16A34A)" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                Customer Information
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Name:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{order.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Email:</span>
                <span style={{ fontWeight: 500, color: 'var(--color-text)', wordBreak: 'break-all' }}>{order.customerEmail}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Phone:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{order.customerPhone}</span>
              </div>
              {order.userId && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Customer ID:</span>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-muted)' }}>{order.userId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Historical Delivery Address Card */}
          <div
            style={{
              background: 'var(--color-surface, #FFFFFF)',
              border: '1px solid var(--color-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <MapPin size={20} color="var(--color-primary, #16A34A)" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                Historical Delivery Address
              </h3>
            </div>

            {order.address ? (
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text)' }}>
                <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{order.address.fullName || order.customerName}</span>
                  {order.address.type && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: '#F1F5F9',
                        color: '#475569',
                        fontWeight: 600,
                      }}
                    >
                      {order.address.type}
                    </span>
                  )}
                </div>
                <div>{order.address.addressLine1}</div>
                {order.address.addressLine2 && <div>{order.address.addressLine2}</div>}
                <div>
                  {order.address.city}, {order.address.state} - {order.address.pincode}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Phone: {order.address.phone || order.customerPhone}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                Delivery address snapshot unavailable.
              </div>
            )}
          </div>

          {/* Ordered Products (Grouped by Shop) */}
          <div
            style={{
              background: 'var(--color-surface, #FFFFFF)',
              border: '1px solid var(--color-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '10px',
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingBag size={20} color="var(--color-primary, #16A34A)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                  Ordered Items ({order.totalItemCount})
                </h3>
              </div>
            </div>

            {/* Shop Groups */}
            {Object.entries(order.itemsByShop || {}).map(([shopName, itemsList]) => {
              const shopSubtotal = itemsList.reduce((sum, item) => sum + item.price * item.quantity, 0);

              return (
                <div
                  key={shopName}
                  style={{
                    marginBottom: '20px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Shop Header */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      padding: '10px 14px',
                      borderBottom: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: '#1E293B' }}>
                      <Store size={16} color="#1565C0" />
                      <span>{shopName}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Subtotal: <strong>{formatINR(shopSubtotal)}</strong>
                    </span>
                  </div>

                  {/* Items List */}
                  <div style={{ padding: '12px 14px' }}>
                    {itemsList.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '8px 0',
                          borderBottom: idx < itemsList.length - 1 ? '1px solid #F1F5F9' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {item.image ? (
                            <img
                              src={normalizeImageUrl(item.image, 'product')}
                              alt={item.name}
                              onError={(e) => handleImageError(e, 'product')}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '6px',
                                objectFit: 'cover',
                                border: '1px solid #E2E8F0',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '6px',
                                background: '#F1F5F9',
                                color: '#64748B',
                                fontWeight: 700,
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              QTY
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {formatINR(item.price)} × {item.quantity}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>
                          {formatINR(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Pricing, Payment, Delivery Info & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Order Lifecycle Progress Timeline */}
          <div
            style={{
              background: 'var(--color-surface, #FFFFFF)',
              border: '1px solid var(--color-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
                paddingBottom: '10px',
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <PackageCheck size={20} color="var(--color-primary, #16A34A)" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                Order Lifecycle Timeline
              </h3>
            </div>

            {order.orderStatus === 'CANCELLED' ? (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '14px',
                  color: '#991B1B',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <XCircle size={20} />
                <span>This order was CANCELLED.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {LIFECYCLE_STAGES.map((stage, index) => {
                  const isDone = currentStageIndex >= index;
                  const isCurrent = currentStageIndex === index;

                  return (
                    <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isCurrent
                            ? 'var(--color-primary, #16A34A)'
                            : isDone
                            ? '#DCFCE7'
                            : '#F1F5F9',
                          color: isCurrent ? '#FFFFFF' : isDone ? '#16A34A' : '#94A3B8',
                          fontWeight: 700,
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isDone ? '✓' : index + 1}
                      </div>

                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                          color: isCurrent ? 'var(--color-text)' : isDone ? '#16A34A' : '#94A3B8',
                        }}
                      >
                        {stage} {isCurrent && '(Current Stage)'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Pricing Breakdown Card */}
          <div
            style={{
              background: 'var(--color-surface, #FFFFFF)',
              border: '1px solid var(--color-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <IndianRupee size={20} color="var(--color-primary, #16A34A)" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                Pricing Breakdown
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Items Subtotal:</span>
                <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{formatINR(order.pricing.subtotal)}</span>
              </div>

              {order.pricing.mrpTotal > order.pricing.subtotal && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>MRP Total:</span>
                  <span style={{ color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>{formatINR(order.pricing.mrpTotal)}</span>
                </div>
              )}

              {order.pricing.productDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                  <span>Product Discount:</span>
                  <span style={{ fontWeight: 600 }}>- {formatINR(order.pricing.productDiscount)}</span>
                </div>
              )}

              {order.pricing.couponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                  <span>Coupon Discount:</span>
                  <span style={{ fontWeight: 600 }}>- {formatINR(order.pricing.couponDiscount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Delivery Fee:</span>
                <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                  {order.pricing.deliveryFee === 0 ? 'FREE' : formatINR(order.pricing.deliveryFee)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '12px',
                  marginTop: '4px',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                }}
              >
                <span>Final Payable:</span>
                <span style={{ color: 'var(--color-primary, #16A34A)' }}>{formatINR(order.finalTotal)}</span>
              </div>

              {order.pricing.totalSavings > 0 && (
                <div
                  style={{
                    background: '#ECFDF5',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#047857',
                    marginTop: '6px',
                  }}
                >
                  🎉 Customer saved {formatINR(order.pricing.totalSavings)} on this order!
                </div>
              )}
            </div>
          </div>

          {/* Safe Payment Information Card */}
          <div
            style={{
              background: 'var(--color-surface, #FFFFFF)',
              border: '1px solid var(--color-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <CreditCard size={20} color="var(--color-primary, #16A34A)" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                Payment Information
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Payment Status:</span>
                <span style={{ fontWeight: 700, color: order.paymentStatus === 'PAID' ? '#16A34A' : '#D97706' }}>
                  {order.paymentStatus}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Payment Method:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{order.paymentMethod}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Transaction / Pay ID:</span>
                <span style={{ fontWeight: 500, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                  {order.paymentId}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Info Card */}
          <div
            style={{
              background: 'var(--color-surface, #FFFFFF)',
              border: '1px solid var(--color-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <Truck size={20} color="var(--color-primary, #16A34A)" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                Delivery Assignment
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Delivery Partner:</span>
                <span style={{ fontWeight: 600, color: order.deliveryPartnerName ? 'var(--color-text)' : '#94A3B8' }}>
                  {order.deliveryPartnerName || 'Not Assigned'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Estimated Delivery:</span>
                <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{order.estimatedDelivery}</span>
              </div>

              {order.timestamps?.delivered && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Delivered Timestamp:</span>
                  <span style={{ fontWeight: 500, color: '#16A34A' }}>{formatOrderDate(order.timestamps.delivered)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailsPage;
