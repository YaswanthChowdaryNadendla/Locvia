// src/pages/customer/CustomerOrdersPage.jsx
// MODULE 16 — Customer Orders List Page Implementation for Locvia
// MODULE 36 — Review actions for delivered orders

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Store,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  Truck,
  Check,
  XCircle,
  Filter,
  Star,
  MessageSquare,
} from 'lucide-react';
import Container from '../../components/common/Container';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByCustomer } from '../../services/orderService';
import { getReviewForProduct } from '../../services/reviewService';
import { formatPrice } from '../../utils/formatters';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/loaders/SkeletonLoader';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'PLACED', label: 'Placed' },
  { id: 'PREPARING', label: 'Preparing' },
  { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const CustomerOrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Load orders on mount
  useEffect(() => {
    try {
      const customerOrders = getOrdersByCustomer(user?.id || 'cust-01');
      setOrders(customerOrders);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Filter orders by selected status
  const filteredOrders = useMemo(() => {
    if (activeFilter === 'ALL') return orders;
    return orders.filter(
      (o) => (o.orderStatus || 'PLACED').toUpperCase() === activeFilter
    );
  }, [orders, activeFilter]);

  // Format Date cleanly
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

  return (
    <div className="orders-page-wrapper animate-fade-in">
      <Container style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        {/* Header Bar */}
        <div className="orders-header-bar">
          <div className="orders-header-title-wrap">
            <h1 className="orders-page-title">My Orders</h1>
            {!loading && (
              <span className="orders-count-badge">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
            )}
          </div>
          <p className="orders-page-subtitle">
            Track, review, and view details for all your recent purchases.
          </p>
        </div>

        {/* ── 1. LOADING SKELETON STATE ────────────────────────────────────── */}
        {loading ? (
          <div className="orders-cards-list" aria-busy="true" aria-label="Loading your orders">
            {[1, 2, 3].map((n) => (
              <div key={n} className="order-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <SkeletonLoader width="140px" height="20px" />
                  <SkeletonLoader width="90px" height="24px" borderRadius="12px" />
                </div>
                <SkeletonLoader width="180px" height="18px" style={{ marginBottom: '1rem' }} />
                <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem' }}>
                  <SkeletonLoader width="60px" height="60px" borderRadius="8px" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <SkeletonLoader width="60%" height="18px" />
                    <SkeletonLoader width="30%" height="16px" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <SkeletonLoader width="100px" height="22px" />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <SkeletonLoader width="90px" height="34px" borderRadius="8px" />
                    <SkeletonLoader width="90px" height="34px" borderRadius="8px" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          /* ── 2. EMPTY STATE: NO ORDERS EVER ───────────────────────────────── */
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet"
            description="Your orders will appear here after you place your first order."
            actionLabel="Start Shopping"
            onAction={() => navigate('/customer/products')}
          />
        ) : (
          <>
            {/* ── 3. FILTER TABS BAR ────────────────────────────────────────── */}
            <div className="orders-filter-bar">
              <div className="filter-scroll-container">
                {STATUS_FILTERS.map(({ id, label }) => {
                  const count =
                    id === 'ALL'
                      ? orders.length
                      : orders.filter((o) => (o.orderStatus || 'PLACED').toUpperCase() === id).length;

                  return (
                    <button
                      key={id}
                      onClick={() => setActiveFilter(id)}
                      className={`filter-tab-pill ${activeFilter === id ? 'active' : ''}`}
                    >
                      <span>{label}</span>
                      {count > 0 && <span className="tab-count">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 4. EMPTY FILTERED RESULTS STATE ───────────────────────────── */}
            {filteredOrders.length === 0 ? (
              <EmptyState
                icon={Filter}
                title={`No ${STATUS_FILTERS.find((f) => f.id === activeFilter)?.label} orders`}
                description="You don't have any orders matching this status filter."
                actionLabel="View All Orders"
                onAction={() => setActiveFilter('ALL')}
              />
            ) : (
              /* ── 5. ORDERS CARDS LIST ────────────────────────────────────── */
              <div className="orders-cards-list">
                {filteredOrders.map((ord) => {
                  const primaryShopName =
                    ord.shops && ord.shops.length > 0
                      ? ord.shops.length === 1
                        ? ord.shops[0].name
                        : `${ord.shops[0].name} + ${ord.shops.length - 1} more shop`
                      : ord.items?.[0]?.shopName || 'Local Store';

                  const previewItems = (ord.items || []).slice(0, 2);
                  const remainingCount = (ord.items || []).length - 2;

                  return (
                    <div key={ord.orderId || ord.id} className="order-card animate-scale-in">
                      
                      {/* Top Header Line */}
                      <div className="order-card-header">
                        <div className="header-left">
                          <span className="order-id-text font-mono">{ord.orderId}</span>
                          <span className="order-date-text">
                            <Calendar size={13} />
                            {formatDate(ord.createdAt)}
                          </span>
                        </div>

                        <div className="header-right-badges">
                          {renderStatusBadge(ord.orderStatus)}
                          <span className="payment-paid-tag">
                            <Check size={11} /> PAID
                          </span>
                        </div>
                      </div>

                      {/* Shop Name Line */}
                      <div className="order-shop-line">
                        <Store size={15} className="text-primary" />
                        <span className="shop-name-text">{primaryShopName}</span>
                      </div>

                      {/* Product Preview Items */}
                      <div className="order-card-preview-list">
                        {previewItems.map((item, idx) => (
                          <div key={item.id || idx} className="preview-item-row">
                            <div className="preview-thumb-wrap">
                              <img
                                src={normalizeImageUrl(item.image, 'product')}
                                alt={item.name}
                                onError={(e) => handleImageError(e, 'product')}
                                className="preview-thumb-img"
                                loading="lazy"
                              />
                            </div>
                            <div className="preview-info-col">
                              <span className="preview-product-name">{item.name}</span>
                              <span className="preview-qty-price">
                                {formatPrice(item.price)} <strong className="qty-badge">× {item.quantity}</strong>
                              </span>
                            </div>
                          </div>
                        ))}

                        {remainingCount > 0 && (
                          <p className="remaining-items-tag">
                            + {remainingCount} more {remainingCount === 1 ? 'item' : 'items'}
                          </p>
                        )}
                      </div>

                      {/* Review actions for delivered orders */}
                      {(ord.orderStatus || '').toUpperCase() === 'DELIVERED' && (
                        <div style={{ padding: '10px 0 2px', borderTop: '1px dashed #e5e7eb', marginTop: '8px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: '#0c831f', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={11} fill="#0c831f" /> Rate Your Products
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {(ord.items || []).map((item) => {
                              const existing = getReviewForProduct(user?.id || 'cust-01', item.productId || item.id);
                              return (
                                <button
                                  key={item.productId || item.id}
                                  onClick={() => navigate(`/customer/product/${item.productId || item.id}`)}
                                  title={item.name}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                                    border: `1px solid ${existing ? '#bbf7d0' : '#d1d5db'}`,
                                    background: existing ? '#f0fdf4' : '#f9fafb',
                                    color: existing ? '#15803d' : '#374151',
                                    cursor: 'pointer', fontWeight: 500,
                                    maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  }}
                                >
                                  {existing
                                    ? <><Check size={11} /> Reviewed</>
                                    : <><MessageSquare size={11} /> Review</>}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Card Footer Line */}
                      <div className="order-card-footer">
                        <div className="footer-left-info">
                          <span className="total-items-badge">
                            {ord.items?.length || 0} {ord.items?.length === 1 ? 'item' : 'items'}
                          </span>
                          <span className="footer-total-price">
                            Total: <strong>{formatPrice(ord.pricing?.finalTotal || 0)}</strong>
                          </span>
                        </div>

                        <button
                          onClick={() => navigate(`/customer/orders/${ord.orderId}`)}
                          className="btn btn-outline btn-sm view-details-btn"
                        >
                          <span>View Details</span>
                          <ChevronRight size={16} />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </Container>
    </div>
  );
};

export default CustomerOrdersPage;
