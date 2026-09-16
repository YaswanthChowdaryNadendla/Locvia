// src/pages/customer/OrderConfirmationPage.jsx
// MODULE 15 — Customer Order Confirmation Page Implementation for Locvia

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  MapPin,
  Home,
  Briefcase,
  Building,
  ShoppingBag,
  Store,
  Tag,
  Clock,
  ChevronRight,
  ShieldCheck,
  PackageCheck,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import Container from '../../components/common/Container';
import { getLastOrder } from '../../services/orderService';
import { formatPrice } from '../../utils/formatters';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';

const OrderConfirmationPage = () => {
  const navigate = useNavigate();

  // Order state initialized from localStorage snapshot
  const [order, setOrder] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    // Read the last placed order snapshot
    const lastOrder = getLastOrder();
    setOrder(lastOrder);
  }, []);

  // Copy Order ID to clipboard
  const handleCopyOrderId = () => {
    if (!order?.orderId) return;
    navigator.clipboard.writeText(order.orderId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Format Date string cleanly
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

  // ── 1. GUARD: NO RECENT ORDER FOUND ──────────────────────────────────────
  if (!order) {
    return (
      <div className="order-conf-wrapper animate-fade-in">
        <Container style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
          <div className="order-conf-empty-card">
            <div className="empty-icon-circle">
              <AlertCircle size={48} className="text-warning" />
            </div>
            <h2 className="empty-title">No recent order found</h2>
            <p className="empty-sub">
              You haven't placed an order recently, or your session details have expired.
            </p>
            <div className="empty-actions">
              <button
                onClick={() => navigate('/customer')}
                className="btn btn-primary btn-lg continue-shop-btn"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => navigate('/customer/orders')}
                className="btn btn-outline btn-lg view-orders-btn"
              >
                Go to My Orders
              </button>
            </div>
          </div>
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

  // Group items by shop if shops list isn't pre-grouped
  const shopGroups = order.shops && order.shops.length > 0 ? order.shops : [
    { id: 'default', name: 'Local Store', address: 'Local Market' }
  ];

  return (
    <div className="order-conf-wrapper animate-fade-in">
      <Container style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>

        {/* ── TOP HERO CONFIRMATION CARD ────────────────────────────────────── */}
        <div className="order-conf-hero-card animate-scale-in">
          
          <div className="hero-check-circle">
            <CheckCircle2 size={64} className="text-green" />
          </div>

          <span className="hero-demo-pill">Order Confirmed</span>

          <h1 className="hero-title">Order Confirmed!</h1>
          <p className="hero-subtitle">
            Thank you for shopping with Locvia. Your order has been placed successfully.
          </p>

          {/* Order ID Pill with Copy button */}
          <div className="hero-order-id-bar">
            <span className="id-label">Order ID:</span>
            <strong className="id-value font-mono">{order.orderId}</strong>
            <button
              onClick={handleCopyOrderId}
              className="copy-id-btn"
              title="Copy Order ID"
              aria-label="Copy Order ID"
            >
              {copiedId ? <Check size={14} className="text-green" /> : <Copy size={14} />}
            </button>
          </div>

          {order.createdAt && (
            <p className="hero-timestamp">
              Placed on {formatDate(order.createdAt)}
            </p>
          )}

        </div>

        {/* ── MAIN 2-COLUMN GRID ────────────────────────────────────────────── */}
        <div className="order-conf-main-grid">

          {/* LEFT COLUMN: Payment Badge, Delivery Estimate, Address, Products */}
          <div className="conf-left-col">

            {/* 1. PAYMENT STATUS CARD */}
            <div className="conf-card conf-payment-status-card">
              <div className="conf-card-header">
                <div className="card-header-title">
                  <ShieldCheck size={20} className="text-primary" />
                  <h2>Payment Details</h2>
                </div>
                <span className="status-badge paid-badge">
                  <Check size={12} /> PAID
                </span>
              </div>

              <div className="conf-payment-details-grid">
                <div className="pay-detail-item">
                  <span className="pay-detail-label">Payment Gateway</span>
                  <span className="pay-detail-value">Razorpay (Mock Gateway)</span>
                </div>
                <div className="pay-detail-item">
                  <span className="pay-detail-label">Payment ID</span>
                  <span className="pay-detail-value font-mono">{order.paymentId}</span>
                </div>
                <div className="pay-detail-item">
                  <span className="pay-detail-label">Payment Method</span>
                  <span className="pay-detail-value uppercase">{order.paymentMethod || 'UPI'}</span>
                </div>
                <div className="pay-detail-item">
                  <span className="pay-detail-label">Total Amount Paid</span>
                  <span className="pay-detail-value text-green font-bold">
                    {formatPrice(order.pricing?.finalTotal || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. ESTIMATED DELIVERY CARD */}
            <div className="conf-card conf-delivery-time-card">
              <div className="delivery-time-inner">
                <div className="time-icon-wrap">
                  <Clock size={24} className="text-primary" />
                </div>
                <div className="time-text-wrap">
                  <span className="time-sub-label">Estimated Delivery</span>
                  <h3 className="time-main-title">{order.estimatedDelivery || '20-30 mins'}</h3>
                  <p className="time-desc">Your order is being processed by the vendor.</p>
                </div>
              </div>

              {/* Progress Step Bar */}
              <div className="order-status-stepper">
                <div className="step-item active">
                  <div className="step-dot" />
                  <span className="step-label">Order Placed</span>
                </div>
                <div className="step-line" />
                <div className="step-item">
                  <div className="step-dot" />
                  <span className="step-label">Preparing</span>
                </div>
                <div className="step-line" />
                <div className="step-item">
                  <div className="step-dot" />
                  <span className="step-label">Out for Delivery</span>
                </div>
              </div>
            </div>

            {/* 3. DELIVERY ADDRESS CARD */}
            {order.address && (
              <div className="conf-card conf-address-card">
                <div className="conf-card-header">
                  <div className="card-header-title">
                    <MapPin size={20} className="text-primary" />
                    <h2>Delivery Address</h2>
                  </div>
                  <span className="address-type-pill">
                    <TypeIcon size={13} /> {order.address.type || 'Home'}
                  </span>
                </div>

                <div className="conf-address-body">
                  <strong className="person-name">{order.address.fullName}</strong>
                  <p className="person-phone">+91 {order.address.phone}</p>
                  <p className="address-lines">
                    {order.address.addressLine1}
                    {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}
                    {order.address.landmark ? ` (Landmark: ${order.address.landmark})` : ''}
                  </p>
                  <p className="address-city-state">
                    <strong>{order.address.city}</strong>, {order.address.state} — {order.address.pincode}
                  </p>
                </div>
              </div>
            )}

            {/* 4. PURCHASED PRODUCTS BY SHOP */}
            <div className="conf-card conf-products-card">
              <div className="conf-card-header">
                <div className="card-header-title">
                  <PackageCheck size={20} className="text-primary" />
                  <h2>Ordered Items ({order.items?.length || 0})</h2>
                </div>
              </div>

              <div className="conf-shops-list">
                {shopGroups.map((shop) => {
                  const shopItems = (order.items || []).filter(
                    (it) => it.shopId === shop.id || shop.id === 'default'
                  );
                  const displayItems = shopItems.length > 0 ? shopItems : order.items || [];

                  return (
                    <div key={shop.id || shop.name} className="conf-shop-block">
                      <div className="conf-shop-header">
                        <Store size={16} className="text-primary" />
                        <span className="conf-shop-name">{shop.name || 'Local Store'}</span>
                        {shop.address && <span className="conf-shop-addr">• {shop.address}</span>}
                      </div>

                      <div className="conf-items-list">
                        {displayItems.map((item, idx) => (
                          <div key={item.id || idx} className="conf-item-row">
                            <div className="conf-item-thumb-wrap">
                              <img
                                src={normalizeImageUrl(item.image, 'product')}
                                alt={item.name}
                                onError={(e) => handleImageError(e, 'product')}
                                className="conf-item-thumb-img"
                                loading="lazy"
                              />
                            </div>

                            <div className="conf-item-info">
                              <h4 className="item-name">{item.name}</h4>
                              <p className="item-unit-price-line">
                                {formatPrice(item.price)} <span className="qty-badge">× {item.quantity}</span>
                                {item.originalPrice && item.originalPrice > item.price && (
                                  <span className="mrp-crossed">{formatPrice(item.originalPrice)}</span>
                                )}
                              </p>
                            </div>

                            <div className="conf-item-total">
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

          {/* RIGHT COLUMN: Order Summary & Actions */}
          <div className="conf-right-col">
            
            {/* PRICING BREAKDOWN CARD */}
            <div className="conf-card conf-summary-card">
              <h2 className="summary-title">Order Total Breakdown</h2>

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
              <div className="conf-action-buttons">
                <button
                  onClick={() => navigate('/customer/orders')}
                  className="btn btn-primary btn-block conf-my-orders-btn"
                >
                  <ShoppingBag size={18} />
                  <span>View My Orders</span>
                </button>

                <button
                  onClick={() => navigate('/customer')}
                  className="btn btn-outline btn-block conf-continue-btn"
                >
                  <span>Continue Shopping</span>
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="conf-help-footer">
                <p>Need help with your order? Contact customer support anytime.</p>
              </div>

            </div>

          </div>

        </div>

      </Container>
    </div>
  );
};

export default OrderConfirmationPage;
