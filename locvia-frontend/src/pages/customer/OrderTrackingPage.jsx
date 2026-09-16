// src/pages/customer/OrderTrackingPage.jsx
// MODULE 17 — Customer Order Tracking Page Implementation for Locvia

import { useState, useEffect, useMemo } from 'react';
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
  Bike
} from 'lucide-react';
import Container from '../../components/common/Container';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/loaders/SkeletonLoader';
import { getOrderById } from '../../services/orderService';
import { formatPrice } from '../../utils/formatters';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

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

  // Format Time only string
  const formatTimeOnly = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Calculate Stable Estimated Delivery Window
  const deliveryWindow = useMemo(() => {
    if (!order) return '20-30 mins';
    if (order.estimatedDelivery) return order.estimatedDelivery;
    
    // Stable calculation from order.createdAt
    const created = order.createdAt ? new Date(order.createdAt) : new Date();
    const start = new Date(created.getTime() + 20 * 60000);
    const end = new Date(created.getTime() + 35 * 60000);
    return `${formatTimeOnly(start)} – ${formatTimeOnly(end)}`;
  }, [order]);

  // ── 1. LOADING STATE ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="tracking-page-wrapper" aria-busy="true" aria-label="Loading tracking information">
        <Container style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
          {/* Header Skeleton */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonLoader width="150px" height="24px" />
            <SkeletonLoader width="110px" height="28px" borderRadius="14px" />
          </div>

          {/* Hero Banner Skeleton */}
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <SkeletonLoader width="180px" height="24px" style={{ marginBottom: '8px' }} />
            <SkeletonLoader width="280px" height="18px" />
          </div>

          {/* 2-Column Grid Skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Timeline Column Skeleton */}
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <SkeletonLoader width="160px" height="22px" style={{ marginBottom: '1.5rem' }} />
              {[1, 2, 3, 4].map((step) => (
                <div key={step} style={{ display: 'flex', gap: '16px', marginBottom: '1.5rem' }}>
                  <SkeletonLoader width="36px" height="36px" borderRadius="50%" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <SkeletonLoader width="50%" height="18px" />
                    <SkeletonLoader width="70%" height="14px" />
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Column Skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <SkeletonLoader width="140px" height="20px" style={{ marginBottom: '1rem' }} />
                <SkeletonLoader width="80%" height="16px" style={{ marginBottom: '8px' }} />
                <SkeletonLoader width="60%" height="16px" />
              </div>
              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <SkeletonLoader width="120px" height="20px" style={{ marginBottom: '1rem' }} />
                <SkeletonLoader width="100%" height="50px" borderRadius="8px" />
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
      <div className="tracking-page-wrapper animate-fade-in">
        <Container style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
          <EmptyState
            icon={AlertCircle}
            title="Order Not Found"
            description={`We couldn't find an order matching "${orderId}". It may have been removed or the ID is invalid.`}
            actionLabel="Back to My Orders"
            onAction={() => navigate('/customer/orders')}
            secondaryActionLabel="Continue Shopping"
            onSecondaryAction={() => navigate('/customer')}
          />
        </Container>
      </div>
    );
  }

  // Current Order Status normalized
  const currentStatus = (order.orderStatus || 'PLACED').toUpperCase();

  // Timeline Step Status Evaluator
  const getStepState = (stepKey) => {
    if (currentStatus === 'CANCELLED') {
      return stepKey === 'PLACED' ? 'completed' : 'cancelled';
    }

    const orderMap = {
      PLACED: 1,
      PREPARING: 2,
      OUT_FOR_DELIVERY: 3,
      DELIVERED: 4,
    };

    const currentLevel = orderMap[currentStatus] || 1;
    const stepLevel = orderMap[stepKey] || 1;

    if (stepLevel < currentLevel) return 'completed';
    if (stepLevel === currentLevel) return 'current';
    return 'upcoming';
  };

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
    <div className="tracking-page-wrapper animate-fade-in">
      <Container style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>

        {/* Top Navigation Bar Header */}
        <div className="tracking-header-bar">
          <button
            onClick={() => navigate(`/customer/orders/${order.orderId}`)}
            className="back-details-link-btn"
            aria-label="Back to Order Details"
          >
            <ArrowLeft size={18} />
            <span>Back to Order Details</span>
          </button>

          <div className="tracking-header-titles-row">
            <div className="titles-left">
              <h1 className="tracking-page-title">Order Tracking</h1>
              <p className="tracking-page-subtitle">
                Order <strong className="font-mono">#{order.orderId}</strong> • Placed on {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="badges-right">
              <span className="live-demo-tag">
                <span className="live-dot" /> Live Status
              </span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="tracking-main-grid">

          {/* LEFT COLUMN: Status Header, Timeline, Delivery Time */}
          <div className="tracking-left-col">

            {/* 1. PROMINENT STATUS CARD */}
            <div className={`tracking-status-card status-${currentStatus.toLowerCase()}`}>
              <div className="status-card-inner">
                <div className="status-icon-badge">
                  {currentStatus === 'DELIVERED' && <CheckCircle2 size={36} className="text-green" />}
                  {currentStatus === 'OUT_FOR_DELIVERY' && <Truck size={36} className="text-blue" />}
                  {currentStatus === 'PREPARING' && <Clock size={36} className="text-amber" />}
                  {currentStatus === 'CANCELLED' && <XCircle size={36} className="text-red" />}
                  {currentStatus === 'PLACED' && <CheckCircle2 size={36} className="text-green" />}
                </div>

                <div className="status-info-text">
                  <h2 className="status-main-heading">
                    {currentStatus === 'DELIVERED' && 'Order Delivered'}
                    {currentStatus === 'OUT_FOR_DELIVERY' && 'Out for Delivery'}
                    {currentStatus === 'PREPARING' && 'Preparing Your Order'}
                    {currentStatus === 'CANCELLED' && 'Order Cancelled'}
                    {currentStatus === 'PLACED' && 'Order Placed'}
                  </h2>
                  <p className="status-sub-desc">
                    {currentStatus === 'DELIVERED' && 'Your order has been delivered successfully. Thank you for shopping!'}
                    {currentStatus === 'OUT_FOR_DELIVERY' && 'Your order is picked up and is on the way to your delivery address.'}
                    {currentStatus === 'PREPARING' && 'The shop is currently picking and packing your items.'}
                    {currentStatus === 'CANCELLED' && 'This order was cancelled. Payment details remain stored in your history.'}
                    {currentStatus === 'PLACED' && 'Your order has been received and confirmed by Locvia.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. OUT FOR DELIVERY SPECIAL CALLOUT BANNER */}
            {currentStatus === 'OUT_FOR_DELIVERY' && (
              <div className="out-for-delivery-banner animate-scale-in">
                <div className="bike-icon-wrap">
                  <Bike size={28} className="text-primary" />
                </div>
                <div className="banner-text">
                  <h3>On the way!</h3>
                  <p>Our delivery partner is en route with your fresh groceries.</p>
                </div>
                <div className="eta-badge font-mono">ETA: {deliveryWindow}</div>
              </div>
            )}

            {/* 3. ESTIMATED DELIVERY TIMEFRAME CARD */}
            <div className="tracking-card estimated-delivery-card">
              <div className="est-card-inner">
                <div className="est-icon-wrap">
                  <Clock size={22} className="text-primary" />
                </div>
                <div className="est-info-col">
                  <span className="est-label">Estimated Delivery</span>
                  <h3 className="est-time-value">
                    {currentStatus === 'DELIVERED'
                      ? 'Delivered Successfully'
                      : currentStatus === 'CANCELLED'
                      ? 'Cancelled Order'
                      : deliveryWindow}
                  </h3>
                  <p className="est-note">
                    {currentStatus === 'DELIVERED'
                      ? 'Delivered to your selected address'
                      : currentStatus === 'CANCELLED'
                      ? 'No active delivery'
                      : 'Delivery timeframe is estimated based on current vendor queue.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. VERTICAL DELIVERY TIMELINE CARD */}
            <div className="tracking-card timeline-card">
              <div className="tracking-card-header">
                <h2>Delivery Progress</h2>
              </div>

              <div className="vertical-timeline-container">

                {/* STEP 1: PLACED */}
                {(() => {
                  const state = getStepState('PLACED');
                  return (
                    <div className={`timeline-step ${state}`}>
                      <div className="step-left-col">
                        <div className="timeline-node">
                          {state === 'completed' || state === 'current' ? (
                            <Check size={14} className="node-icon" />
                          ) : (
                            <div className="node-dot" />
                          )}
                        </div>
                        <div className="timeline-line" />
                      </div>
                      <div className="step-content-col">
                        <div className="step-title-line">
                          <h4 className="step-title">Order Placed</h4>
                          <span className="step-time-badge">
                            {formatTimeOnly(order.createdAt)}
                          </span>
                        </div>
                        <p className="step-desc">Your order has been successfully placed and confirmed.</p>
                      </div>
                    </div>
                  );
                })()}

                {/* STEP 2: PREPARING */}
                {(() => {
                  const state = getStepState('PREPARING');
                  return (
                    <div className={`timeline-step ${state}`}>
                      <div className="step-left-col">
                        <div className="timeline-node">
                          {state === 'completed' ? (
                            <Check size={14} className="node-icon" />
                          ) : state === 'current' ? (
                            <div className="pulse-dot" />
                          ) : (
                            <div className="node-dot" />
                          )}
                        </div>
                        <div className="timeline-line" />
                      </div>
                      <div className="step-content-col">
                        <div className="step-title-line">
                          <h4 className="step-title">Preparing</h4>
                          <span className="step-time-badge">
                            {state === 'completed'
                              ? 'Completed'
                              : state === 'current'
                              ? 'In Progress'
                              : 'Pending'}
                          </span>
                        </div>
                        <p className="step-desc">The store is gathering and packing your items.</p>
                      </div>
                    </div>
                  );
                })()}

                {/* STEP 3: OUT FOR DELIVERY */}
                {(() => {
                  const state = getStepState('OUT_FOR_DELIVERY');
                  return (
                    <div className={`timeline-step ${state}`}>
                      <div className="step-left-col">
                        <div className="timeline-node">
                          {state === 'completed' ? (
                            <Check size={14} className="node-icon" />
                          ) : state === 'current' ? (
                            <div className="pulse-dot" />
                          ) : (
                            <div className="node-dot" />
                          )}
                        </div>
                        <div className="timeline-line" />
                      </div>
                      <div className="step-content-col">
                        <div className="step-title-line">
                          <h4 className="step-title">Out for Delivery</h4>
                          <span className="step-time-badge">
                            {state === 'completed'
                              ? 'Completed'
                              : state === 'current'
                              ? 'En Route'
                              : 'Pending'}
                          </span>
                        </div>
                        <p className="step-desc">Your order is picked up and en route to your location.</p>
                      </div>
                    </div>
                  );
                })()}

                {/* STEP 4: DELIVERED */}
                {(() => {
                  const state = getStepState('DELIVERED');
                  return (
                    <div className={`timeline-step ${state} last-step`}>
                      <div className="step-left-col">
                        <div className="timeline-node">
                          {state === 'completed' ? (
                            <Check size={14} className="node-icon" />
                          ) : (
                            <div className="node-dot" />
                          )}
                        </div>
                      </div>
                      <div className="step-content-col">
                        <div className="step-title-line">
                          <h4 className="step-title">Delivered</h4>
                          <span className="step-time-badge">
                            {state === 'completed' ? 'Delivered' : 'Pending'}
                          </span>
                        </div>
                        <p className="step-desc">Order delivered safely to your address.</p>
                      </div>
                    </div>
                  );
                })()}

                {/* CANCELLED OVERRIDE STEP IF CANCELLED */}
                {currentStatus === 'CANCELLED' && (
                  <div className="timeline-step cancelled-step">
                    <div className="step-left-col">
                      <div className="timeline-node cancelled-node">
                        <XCircle size={16} />
                      </div>
                    </div>
                    <div className="step-content-col">
                      <div className="step-title-line">
                        <h4 className="step-title text-red">Order Cancelled</h4>
                        <span className="step-time-badge red">Cancelled</span>
                      </div>
                      <p className="step-desc">This order was cancelled before delivery.</p>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Address Snapshot, Items Summary, Pricing */}
          <div className="tracking-right-col">

            {/* 1. HISTORICAL ADDRESS SNAPSHOT */}
            {order.address && (
              <div className="tracking-card address-card">
                <div className="tracking-card-header">
                  <div className="title-left">
                    <MapPin size={18} className="text-primary" />
                    <h2>Delivering To</h2>
                  </div>
                  <span className="address-type-pill">
                    <TypeIcon size={12} /> {order.address.type || 'Home'}
                  </span>
                </div>

                <div className="address-card-body">
                  <strong className="person-name">{order.address.fullName}</strong>
                  <p className="person-phone">+91 {order.address.phone}</p>
                  <p className="address-text">
                    {order.address.addressLine1}
                    {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}
                    {order.address.landmark ? ` (Landmark: ${order.address.landmark})` : ''}
                  </p>
                  <p className="city-pin-text">
                    <strong>{order.address.city}</strong>, {order.address.state} — {order.address.pincode}
                  </p>
                </div>
              </div>
            )}

            {/* 2. ORDERED ITEMS SNAPSHOT */}
            <div className="tracking-card items-summary-card">
              <div className="tracking-card-header">
                <div className="title-left">
                  <PackageCheck size={18} className="text-primary" />
                  <h2>Order Summary ({order.items?.length || 0})</h2>
                </div>
              </div>

              <div className="shops-items-wrapper">
                {shopGroups.map((shop) => {
                  const shopItems = (order.items || []).filter(
                    (it) => it.shopId === shop.id || shop.id === 'default'
                  );
                  const displayItems = shopItems.length > 0 ? shopItems : order.items || [];

                  return (
                    <div key={shop.id || shop.name} className="shop-group-block">
                      <div className="shop-title-line">
                        <Store size={14} className="text-primary" />
                        <span className="shop-name">{shop.name || 'Local Store'}</span>
                      </div>

                      <div className="items-mini-list">
                        {displayItems.map((item, idx) => (
                          <div key={item.id || idx} className="item-mini-row">
                            <div className="mini-thumb-wrap">
                              <img
                                src={normalizeImageUrl(item.image, 'product')}
                                alt={item.name}
                                onError={(e) => handleImageError(e, 'product')}
                                className="mini-thumb-img"
                              />
                            </div>
                            <div className="mini-info-col">
                              <span className="mini-name">{item.name}</span>
                              <span className="mini-price">
                                {formatPrice(item.price)} × <strong>{item.quantity}</strong>
                              </span>
                            </div>
                            <div className="mini-total-col">
                              <span>{formatPrice(item.itemTotal || item.price * item.quantity)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. HISTORICAL PRICING SNAPSHOT */}
            <div className="tracking-card pricing-summary-card">
              <h2 className="card-mini-title">Payment Breakdown</h2>

              <div className="summary-rows">
                <div className="summary-row">
                  <span className="summary-label">Items Subtotal</span>
                  <span className="summary-value">{formatPrice(order.pricing?.subtotal || 0)}</span>
                </div>

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
                      <span>Coupon</span>
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
              <div className="tracking-action-buttons">
                <button
                  onClick={() => navigate(`/customer/orders/${order.orderId}`)}
                  className="btn btn-outline btn-block back-details-btn"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Order Details</span>
                </button>

                <button
                  onClick={() => navigate('/customer/orders')}
                  className="btn btn-outline btn-block view-my-orders-btn"
                >
                  <span>View My Orders</span>
                </button>

                <button
                  onClick={() => navigate('/customer')}
                  className="btn btn-primary btn-block continue-shop-btn"
                >
                  <span>Continue Shopping</span>
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="tracking-security-footer">
                <ShieldCheck size={14} className="text-primary flex-shrink-0" />
                <span>Locvia Verified Tracking System</span>
              </div>

            </div>

          </div>

        </div>

      </Container>
    </div>
  );
};

export default OrderTrackingPage;
