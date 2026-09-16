// src/pages/customer/OrderDetailsPage.jsx
// MODULE 16 — Customer Order Details Page Implementation for Locvia
// MODULE 36 — Review integration for delivered orders

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Home,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  Truck,
  Check,
  XCircle,
  Store,
  Tag,
  ShieldCheck,
  PackageCheck,
  AlertCircle,
  ChevronRight,
  Compass,
  MessageSquare,
} from 'lucide-react';
import Container from '../../components/common/Container';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/loaders/SkeletonLoader';
import { getOrderById } from '../../services/orderService';
import { getReviewForProduct } from '../../services/reviewService';
import { formatPrice } from '../../utils/formatters';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import { useAuth } from '../../context/AuthContext';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Auth — for review ownership checks
  const authCtx = useAuth();
  const currentUser = authCtx?.user || null;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const found = getOrderById(orderId);
    setOrder(found);
    setLoading(false);
  }, [orderId]);

  // Format Date string
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Status Badge Component Helper
  const renderStatusBadge = (status = 'PLACED') => {
    const upper = status.toUpperCase();
    if (upper === 'DELIVERED') {
      return (
        <span className="order-status-badge delivered">
          <Check size={12} /> Delivered
        </span>
      );
    }
    if (upper === 'OUT_FOR_DELIVERY') {
      return (
        <span className="order-status-badge out-for-delivery">
          <Truck size={12} /> Out for Delivery
        </span>
      );
    }
    if (upper === 'PREPARING') {
      return (
        <span className="order-status-badge preparing">
          <Clock size={12} /> Preparing
        </span>
      );
    }
    if (upper === 'CANCELLED') {
      return (
        <span className="order-status-badge cancelled">
          <XCircle size={12} /> Cancelled
        </span>
      );
    }
    return (
      <span className="order-status-badge placed">
        <CheckCircle2 size={12} /> Placed
      </span>
    );
  };

  // ── 1. LOADING STATE ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="order-detail-page-wrapper" aria-busy="true" aria-label="Loading order details">
        <Container style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
          {/* Header Skeleton */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonLoader width="140px" height="24px" />
            <SkeletonLoader width="100px" height="28px" borderRadius="14px" />
          </div>

          {/* Main Grid Skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Left Col Skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <SkeletonLoader width="160px" height="22px" style={{ marginBottom: '1rem' }} />
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <SkeletonLoader width="50px" height="50px" borderRadius="8px" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <SkeletonLoader width="70%" height="16px" />
                    <SkeletonLoader width="40%" height="14px" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <SkeletonLoader width="50px" height="50px" borderRadius="8px" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <SkeletonLoader width="60%" height="16px" />
                    <SkeletonLoader width="35%" height="14px" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col Skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <SkeletonLoader width="140px" height="20px" style={{ marginBottom: '1rem' }} />
                <SkeletonLoader width="80%" height="16px" style={{ marginBottom: '8px' }} />
                <SkeletonLoader width="90%" height="16px" />
              </div>
              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <SkeletonLoader width="120px" height="20px" style={{ marginBottom: '1rem' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <SkeletonLoader width="80px" height="16px" />
                  <SkeletonLoader width="60px" height="16px" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <SkeletonLoader width="60px" height="18px" />
                  <SkeletonLoader width="80px" height="18px" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // ── 2. INVALID / NOT FOUND GUARD ─────────────────────────────────────────
  if (!order) {
    return (
      <div className="order-detail-page-wrapper animate-fade-in">
        <Container style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
          <EmptyState
            icon={AlertCircle}
            title="Order Not Found"
            description={`We couldn't find an order matching "${orderId}". It may have been removed or the ID is invalid.`}
            actionLabel="Back to My Orders"
            onAction={() => navigate('/customer/orders')}
          />
        </Container>
      </div>
    );
  }

  // Address Type Icon Helper
  const TypeIcon =
    order.address?.type === 'Work'
      ? Briefcase
      : order.address?.type === 'Other'
      ? Building
      : Home;

  // Group items by shop from historical snapshot
  const shopGroups =
    order.shops && order.shops.length > 0
      ? order.shops
      : [{ id: 'default', name: 'Local Store', address: 'Local Market' }];

  return (
    <div className="order-detail-page-wrapper animate-fade-in">
      <Container style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        {/* Header Navigation Bar */}
        <div className="order-detail-header-bar">
          <button
            onClick={() => navigate('/customer/orders')}
            className="back-to-orders-btn"
            aria-label="Back to My Orders"
          >
            <ArrowLeft size={18} />
            <span>Back to My Orders</span>
          </button>

          <div className="header-titles-row">
            <div className="header-titles-left">
              <h1 className="order-detail-title">
                Order <span className="font-mono">{order.orderId}</span>
              </h1>
              <p className="order-detail-subtitle">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="header-badges-right">
              {renderStatusBadge(order.orderStatus)}
              <span className="payment-paid-tag">
                <Check size={11} /> PAID
              </span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Responsive Grid */}
        <div className="order-detail-main-grid">

          {/* LEFT COLUMN: Payment details, Address, Products */}
          <div className="detail-left-col">

            {/* 1. PAYMENT INFORMATION CARD */}
            <div className="detail-card payment-info-card">
              <div className="detail-card-header">
                <div className="card-title-wrap">
                  <ShieldCheck size={20} className="text-primary" />
                  <h2>Payment Details</h2>
                </div>
                <span className="paid-status-badge">
                  <Check size={12} /> {order.paymentStatus || 'PAID'}
                </span>
              </div>

              <div className="payment-info-grid">
                <div className="pay-info-item">
                  <span className="info-label">Payment ID</span>
                  <span className="info-value font-mono">{order.paymentId || 'MOCK_PAY_XXXXXX'}</span>
                </div>

                <div className="pay-info-item">
                  <span className="info-label">Payment Method</span>
                  <span className="info-value uppercase">{order.paymentMethod || 'UPI'}</span>
                </div>

                <div className="pay-info-item">
                  <span className="info-label">Gateway</span>
                  <span className="info-value">Razorpay (Mock Gateway)</span>
                </div>

                <div className="pay-info-item">
                  <span className="info-label">Total Amount Paid</span>
                  <span className="info-value text-green font-bold">
                    {formatPrice(order.pricing?.finalTotal || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. HISTORICAL DELIVERY ADDRESS SNAPSHOT CARD */}
            {order.address && (
              <div className="detail-card address-snapshot-card">
                <div className="detail-card-header">
                  <div className="card-title-wrap">
                    <MapPin size={20} className="text-primary" />
                    <h2>Delivery Address</h2>
                  </div>
                  <span className="address-type-pill">
                    <TypeIcon size={13} /> {order.address.type || 'Home'}
                  </span>
                </div>

                <div className="address-snapshot-body">
                  <strong className="person-name">{order.address.fullName}</strong>
                  <p className="person-phone">+91 {order.address.phone}</p>
                  <p className="address-lines">
                    {order.address.addressLine1}
                    {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}
                    {order.address.landmark ? ` (Landmark: ${order.address.landmark})` : ''}
                  </p>
                  <p className="address-city">
                    <strong>{order.address.city}</strong>, {order.address.state} — {order.address.pincode}
                  </p>
                </div>
              </div>
            )}

            {/* 3. HISTORICAL PURCHASED PRODUCTS GROUPED BY SHOP */}
            <div className="detail-card products-snapshot-card">
              <div className="detail-card-header">
                <div className="card-title-wrap">
                  <PackageCheck size={20} className="text-primary" />
                  <h2>Ordered Items ({order.items?.length || 0})</h2>
                </div>
              </div>

              <div className="shops-snapshot-list">
                {shopGroups.map((shop) => {
                  const shopItems = (order.items || []).filter(
                    (it) => it.shopId === shop.id || shop.id === 'default'
                  );
                  const displayItems = shopItems.length > 0 ? shopItems : order.items || [];

                  return (
                    <div key={shop.id || shop.name} className="shop-snapshot-block">
                      <div className="shop-snapshot-header">
                        <Store size={16} className="text-primary" />
                        <span className="shop-name">{shop.name || 'Local Store'}</span>
                        {shop.address && <span className="shop-addr">• {shop.address}</span>}
                      </div>

                      <div className="items-snapshot-list">
                        {displayItems.map((item, idx) => (
                          <div key={item.id || idx} className="item-snapshot-row">
                            <div className="item-thumb-wrap">
                              <img
                                src={normalizeImageUrl(item.image, 'product')}
                                alt={item.name}
                                onError={(e) => handleImageError(e, 'product')}
                                className="item-thumb-img"
                                loading="lazy"
                              />
                            </div>

                            <div className="item-details-col">
                              <h4 className="item-title">{item.name}</h4>
                              <p className="item-price-qty">
                                {formatPrice(item.price)} <span className="qty-badge">× {item.quantity}</span>
                                {item.originalPrice && item.originalPrice > item.price && (
                                  <span className="mrp-crossed">{formatPrice(item.originalPrice)}</span>
                                )}
                              </p>
                              {/* Review action — only for DELIVERED orders */}
                              {(order.orderStatus || '').toUpperCase() === 'DELIVERED' && (() => {
                                const pid = item.productId || item.id;
                                const existing = getReviewForProduct(currentUser?.id || 'cust-01', pid);
                                return (
                                  <button
                                    onClick={() => navigate(`/customer/product/${pid}`)}
                                    style={{
                                      marginTop: '6px',
                                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                                      border: `1px solid ${existing ? '#bbf7d0' : '#d1d5db'}`,
                                      background: existing ? '#f0fdf4' : '#f8fafc',
                                      color: existing ? '#15803d' : '#0c831f',
                                      cursor: 'pointer', fontWeight: 600,
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.outline = '2px solid #0c831f'; }}
                                    onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
                                  >
                                    {existing ? <><Check size={10} /> Reviewed</> : <><MessageSquare size={10} /> Write Review</>}
                                  </button>
                                );
                              })()}
                            </div>

                            <div className="item-total-col">
                              <span className="item-total-price">
                                {formatPrice(item.itemTotal || item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Pricing breakdown & Action Buttons */}
          <div className="detail-right-col">
            
            <div className="detail-card summary-snapshot-card">
              <h2 className="summary-title">Price Breakdown</h2>

              <div className="summary-rows">
                <div className="summary-row">
                  <span className="summary-label">Items Subtotal</span>
                  <span className="summary-value">{formatPrice(order.pricing?.subtotal || 0)}</span>
                </div>

                {order.pricing?.mrpTotal > order.pricing?.subtotal && (
                  <div className="summary-row">
                    <span className="summary-label">MRP Total</span>
                    <span className="summary-value mrp-crossed">{formatPrice(order.pricing.mrpTotal)}</span>
                  </div>
                )}

                {order.pricing?.productDiscount > 0 && (
                  <div className="summary-row summary-row-green">
                    <span className="summary-label">Product Discount</span>
                    <span className="summary-value">- {formatPrice(order.pricing.productDiscount)}</span>
                  </div>
                )}

                {order.pricing?.couponDiscount > 0 && (
                  <div className="summary-row summary-row-coupon">
                    <div className="coupon-label-wrap">
                      <Tag size={13} className="text-primary" />
                      <span>Coupon ({order.coupon?.code || 'Applied'})</span>
                    </div>
                    <span className="summary-value text-green">
                      - {formatPrice(order.pricing.couponDiscount)}
                    </span>
                  </div>
                )}

                <div className="summary-row">
                  <span className="summary-label">Delivery Fee</span>
                  <span className="summary-value">
                    {order.pricing?.deliveryFee === 0 ? (
                      <span className="free-delivery-tag">FREE</span>
                    ) : (
                      formatPrice(order.pricing?.deliveryFee || 0)
                    )}
                  </span>
                </div>

                <div className="summary-divider" />

                <div className="summary-row summary-row-total">
                  <span className="total-label">Total Paid</span>
                  <span className="total-value text-green">
                    {formatPrice(order.pricing?.finalTotal || 0)}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="detail-actions-block">
                <button
                  onClick={() => navigate(`/customer/orders/${order.orderId}/tracking`)}
                  className="btn btn-primary btn-block track-order-btn"
                >
                  <Compass size={18} />
                  <span>Track Order</span>
                </button>

                <button
                  onClick={() => navigate('/customer')}
                  className="btn btn-outline btn-block continue-shop-btn"
                >
                  <span>Continue Shopping</span>
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="detail-footer-note">
                <ShieldCheck size={14} className="text-primary flex-shrink-0" />
                <span>100% Verified Locvia Purchase</span>
              </div>

            </div>

          </div>

        </div>

      </Container>
    </div>
  );
};

export default OrderDetailsPage;
