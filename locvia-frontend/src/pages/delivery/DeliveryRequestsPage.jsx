// src/pages/delivery/DeliveryRequestsPage.jsx
// Dedicated Delivery Requests Page for Delivery Partners (Module 26)

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getDeliveryAvailability,
  setDeliveryAvailability,
  getAvailableDeliveryRequests,
  acceptDeliveryRequest,
  dismissDeliveryRequest,
  getActiveDelivery,
} from '../../services/deliveryService';
import {
  Compass,
  RefreshCw,
  Power,
  Store,
  MapPin,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronRight,
  Search,
  PackageCheck,
  Building,
  Layers,
} from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonLoader, ButtonLoader } from '../../components/common/loaders';

export default function DeliveryRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const partnerId = user?.id || 'user-partner';

  // Core State
  const [isOnline, setIsOnline] = useState(() => getDeliveryAvailability(partnerId));
  const [requests, setRequests] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'MULTI_SHOP' | 'READY'

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Synchronize Availability state
  useEffect(() => {
    setIsOnline(getDeliveryAvailability(partnerId));
  }, [partnerId]);

  // Load Requests Data
  const loadRequests = useCallback(() => {
    try {
      setError(null);
      const active = getActiveDelivery(partnerId);
      setActiveDelivery(active);

      const available = getAvailableDeliveryRequests(partnerId);
      setRequests(available);
    } catch (err) {
      console.error('Error loading delivery requests:', err);
      setError('Failed to load delivery requests.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [partnerId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Manual Refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadRequests();
      showToast('Delivery requests updated.');
    }, 400);
  };

  // Toggle Online / Offline Availability
  const handleToggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    setDeliveryAvailability(partnerId, nextState);
    if (nextState) {
      showToast("You're now online and available for new delivery requests.");
      loadRequests();
    } else {
      showToast("You're now offline. Delivery requests are paused.", 'error');
    }
  };

  // Handle Accept Delivery Request
  const handleAcceptRequest = async (reqId) => {
    if (acceptingId) return; // Prevent double click

    if (activeDelivery) {
      showToast('You already have an active delivery. Complete it first.', 'error');
      return;
    }

    setAcceptingId(reqId);

    try {
      // Simulate minor async processing time
      await new Promise((res) => setTimeout(res, 500));

      const result = acceptDeliveryRequest(reqId, partnerId);

      if (result.success) {
        showToast(`Delivery Order #${reqId} accepted! Redirecting to Active Delivery...`);
        // Refresh local requests
        loadRequests();
        setTimeout(() => {
          navigate('/delivery/active');
        }, 1000);
      } else {
        showToast(result.message || 'This delivery request is no longer available.', 'error');
        loadRequests();
      }
    } catch (err) {
      showToast(err.message || 'Failed to accept delivery request.', 'error');
      loadRequests();
    } finally {
      setAcceptingId(null);
    }
  };

  // Handle Dismiss Request
  const handleDismissRequest = (reqId) => {
    dismissDeliveryRequest(reqId, partnerId);
    setRequests((prev) => prev.filter((r) => String(r.id || r.orderId).trim() !== String(reqId).trim()));
    showToast('Delivery request dismissed from view.');
  };

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const idMatch =
        !searchQuery.trim() ||
        String(req.id || req.orderId)
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());

      if (!idMatch) return false;

      if (activeFilter === 'MULTI_SHOP') {
        return req.shops && req.shops.length > 1;
      }
      if (activeFilter === 'READY') {
        const status = (req.orderStatus || req.status || '').toUpperCase();
        return status === 'READY_FOR_PICKUP';
      }

      return true;
    });
  }, [requests, searchQuery, activeFilter]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
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
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={24} style={{ color: '#2563EB' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
              Delivery Requests
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '4px', margin: 0 }}>
            View and manage delivery requests available near you.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Availability Status Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: isOnline ? '#F0FDF4' : '#F9FAFB',
              border: `1px solid ${isOnline ? '#BBF7D0' : '#E5E7EB'}`,
              padding: '6px 12px',
              borderRadius: '20px',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isOnline ? '#15803D' : '#6B7280' }}>
              {isOnline ? '● Online' : '○ Offline'}
            </span>
            <button
              onClick={handleToggleOnline}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isOnline ? '#10B981' : '#6B7280',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Power size={12} />
              {isOnline ? 'Available' : 'Go Online'}
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              color: 'var(--color-text)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* OFFLINE STATE VIEW */}
      {!isOnline ? (
        <div style={emptyCardStyle}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F3F4F6', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Power size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 0.5rem' }}>
            You're Currently Offline
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: '0 0 1.5rem', maxWidth: '400px', marginInline: 'auto' }}>
            Go online to receive new delivery requests in your area and start fulfilling orders.
          </p>
          <button
            onClick={handleToggleOnline}
            style={{
              padding: '10px 24px',
              borderRadius: '24px',
              border: 'none',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
            }}
          >
            <Power size={16} />
            Go Online
          </button>
        </div>
      ) : (
        <>
          {/* Active Delivery Warning Banner */}
          {activeDelivery && (
            <div
              style={{
                backgroundColor: '#F5F3FF',
                border: '1px solid #DDD6FE',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <PackageCheck size={24} style={{ color: '#7C3AED', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#5B21B6' }}>
                    Active Delivery In Progress (Order #{activeDelivery.orderId || activeDelivery.id})
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#6D28D9', marginTop: '2px' }}>
                    Complete your current active delivery before accepting new delivery requests.
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/delivery/active')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>View Active Delivery</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search by Order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 38px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveFilter('ALL')}
                style={activeFilter === 'ALL' ? activeFilterTabStyle : filterTabStyle}
              >
                All Requests ({requests.length})
              </button>
              <button
                onClick={() => setActiveFilter('MULTI_SHOP')}
                style={activeFilter === 'MULTI_SHOP' ? activeFilterTabStyle : filterTabStyle}
              >
                Multi-Shop ({requests.filter((r) => r.shops?.length > 1).length})
              </button>
              <button
                onClick={() => setActiveFilter('READY')}
                style={activeFilter === 'READY' ? activeFilterTabStyle : filterTabStyle}
              >
                Ready for Pickup ({requests.filter((r) => (r.orderStatus || r.status || '').toUpperCase() === 'READY_FOR_PICKUP').length})
              </button>
            </div>
          </div>

          {/* LOADING SKELETON STATE */}
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }} aria-busy="true" aria-label="Loading delivery requests">
              {[1, 2, 3].map((i) => (
                <div key={i} style={skeletonCardStyle}>
                  <SkeletonLoader width="40%" height="20px" borderRadius="4px" style={{ marginBottom: '1rem' }} />
                  <SkeletonLoader width="80%" height="16px" borderRadius="4px" style={{ marginBottom: '8px' }} />
                  <SkeletonLoader width="60%" height="16px" borderRadius="4px" style={{ marginBottom: '1.5rem' }} />
                  <SkeletonLoader width="100%" height="38px" borderRadius="8px" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* ERROR STATE */
            <EmptyState
              icon={XCircle}
              title="Unable to load delivery requests"
              message={error}
              actionLabel="Try Again"
              onAction={loadRequests}
            />
          ) : filteredRequests.length === 0 ? (
            /* EMPTY REQUESTS STATE */
            <EmptyState
              icon={Compass}
              title="No delivery requests available"
              message={searchQuery ? "No requests match your search criteria." : "New delivery requests will appear here when customers place orders in your area."}
              actionLabel={searchQuery ? "Clear Search" : "Refresh Requests"}
              onAction={searchQuery ? () => setSearchQuery('') : handleRefresh}
            />
          ) : (
            /* REQUEST CARDS GRID */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filteredRequests.map((req) => {
                const reqId = req.orderId || req.id;
                const isAccepting = acceptingId === reqId;
                const isMultiShop = req.shops && req.shops.length > 1;
                const totalItems = req.items ? req.items.reduce((acc, item) => acc + (item.quantity || 1), 0) : 1;
                const finalTotal = req.pricing?.finalTotal || req.pricing?.total || 250;

                // Format order creation time
                const createdTimeStr = req.createdAt
                  ? new Date(req.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : 'Just now';

                return (
                  <div key={reqId} style={requestCardStyle}>
                    {/* Card Top Header */}
                    <div style={requestHeaderStyle}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={badgeStyle}>NEW REQUEST</span>
                          {isMultiShop && (
                            <span style={{ ...badgeStyle, backgroundColor: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' }}>
                              <Layers size={11} style={{ marginRight: '3px' }} /> MULTI-SHOP
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>
                          Order #{reqId}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>RECEIVED</div>
                        <div style={{ fontSize: '0.8rem', color: '#4B5563', fontWeight: 700, marginTop: '2px' }}>
                          {createdTimeStr}
                        </div>
                      </div>
                    </div>

                    {/* Card Body Details */}
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Pickup Shops Section */}
                      <div style={infoBoxStyle}>
                        <div style={sectionLabelStyle}>
                          <Store size={14} style={{ color: 'var(--color-primary)' }} />
                          <span>PICKUP LOCATION{isMultiShop ? 'S' : ''} ({req.shops?.length || 1})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                          {(req.shops && req.shops.length > 0
                            ? req.shops
                            : [{ id: 101, name: req.items?.[0]?.shopName || 'Sri Lakshmi General Store' }]
                          ).map((shop, idx) => (
                            <div key={shop.id || idx} style={{ fontSize: '0.875rem', color: 'var(--color-text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Building size={14} style={{ color: '#6B7280' }} />
                              <span>{shop.name}</span>
                            </div>
                          ))}
                          <span style={{ fontSize: '0.78rem', color: '#6B7280', marginLeft: '20px' }}>
                            Bengaluru, Karnataka
                          </span>
                        </div>
                      </div>

                      {/* Delivery Address Section */}
                      <div style={{ ...infoBoxStyle, backgroundColor: '#FAFAFA' }}>
                        <div style={sectionLabelStyle}>
                          <MapPin size={14} style={{ color: '#E11D48' }} />
                          <span>DELIVERY DESTINATION</span>
                        </div>
                        <div style={{ marginTop: '6px', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>
                            {req.address?.fullName || 'Customer Destination'}
                          </div>
                          <div style={{ fontSize: '0.825rem', color: '#4B5563', lineHeight: 1.4, marginTop: '2px' }}>
                            {req.address
                              ? `${req.address.addressLine1 || ''}, ${req.address.city || 'Bengaluru'}, ${req.address.pincode || ''}`
                              : '12 MG Road, Indiranagar, Bengaluru'}
                          </div>
                        </div>
                      </div>

                      {/* Order Metrics Summary Row */}
                      <div style={metricsRowStyle}>
                        <div style={metricItemStyle}>
                          <Package size={16} style={{ color: '#0284C7' }} />
                          <div>
                            <div style={metricLabelStyle}>Items</div>
                            <div style={metricValueStyle}>{totalItems} items</div>
                          </div>
                        </div>

                        <div style={metricItemStyle}>
                          <DollarSign size={16} style={{ color: '#059669' }} />
                          <div>
                            <div style={metricLabelStyle}>Order Value</div>
                            <div style={{ ...metricValueStyle, color: '#059669' }}>₹{finalTotal}</div>
                          </div>
                        </div>

                        <div style={metricItemStyle}>
                          <Clock size={16} style={{ color: '#D97706' }} />
                          <div>
                            <div style={metricLabelStyle}>Est. Delivery</div>
                            <div style={metricValueStyle}>{req.estimatedDelivery || '20-30 mins'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '0.25rem' }}>
                        <button
                          onClick={() => handleDismissRequest(reqId)}
                          disabled={isAccepting}
                          style={rejectBtnStyle}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAcceptRequest(reqId)}
                          disabled={isAccepting || Boolean(activeDelivery)}
                          style={{
                            ...acceptBtnStyle,
                            backgroundColor: activeDelivery ? '#9CA3AF' : isAccepting ? '#059669' : 'var(--color-primary)',
                            cursor: activeDelivery ? 'not-allowed' : 'pointer',
                          }}
                          title={activeDelivery ? 'Complete active delivery first' : 'Accept this delivery request'}
                        >
                          {isAccepting ? (
                            <ButtonLoader size={16} color="#FFFFFF" text="Accepting..." />
                          ) : (
                            <>
                              <span>Accept Delivery</span>
                              <ChevronRight size={18} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Reusable Inline Styles ───────────────────────────────────────
const requestCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '14px',
  border: '1px solid #E5E7EB',
  boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const requestHeaderStyle = {
  backgroundColor: '#F9FAFB',
  borderBottom: '1px solid #E5E7EB',
  padding: '1rem 1.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const badgeStyle = {
  backgroundColor: '#DCFCE7',
  color: '#15803D',
  border: '1px solid #86EFAC',
  fontSize: '0.725rem',
  fontWeight: 800,
  padding: '2px 8px',
  borderRadius: '12px',
  display: 'inline-flex',
  alignItems: 'center',
};

const infoBoxStyle = {
  backgroundColor: '#F0FDF4',
  border: '1px solid #DCFCE7',
  padding: '10px 12px',
  borderRadius: '10px',
};

const sectionLabelStyle = {
  fontSize: '0.725rem',
  fontWeight: 800,
  color: '#6B7280',
  letterSpacing: '0.03em',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const metricsRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '8px',
  backgroundColor: '#F9FAFB',
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid #E5E7EB',
};

const metricItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const metricLabelStyle = {
  fontSize: '0.7rem',
  color: '#9CA3AF',
  fontWeight: 600,
  textTransform: 'uppercase',
};

const metricValueStyle = {
  fontSize: '0.85rem',
  fontWeight: 800,
  color: 'var(--color-text)',
};

const acceptBtnStyle = {
  flex: 2,
  padding: '11px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: 'var(--color-primary)',
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  transition: 'all 0.15s ease',
};

const rejectBtnStyle = {
  flex: 1,
  padding: '11px',
  borderRadius: '10px',
  border: '1px solid #D1D5DB',
  backgroundColor: '#FFFFFF',
  color: '#4B5563',
  fontWeight: 700,
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const emptyCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  border: '1px solid #E5E7EB',
  padding: '3rem 1.5rem',
  textAlign: 'center',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const skeletonCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '14px',
  border: '1px solid #E5E7EB',
  padding: '1.25rem',
};

const filterTabStyle = {
  padding: '6px 14px',
  borderRadius: '20px',
  border: '1px solid #D1D5DB',
  backgroundColor: '#FFFFFF',
  color: '#4B5563',
  fontWeight: 600,
  fontSize: '0.8rem',
  cursor: 'pointer',
};

const activeFilterTabStyle = {
  padding: '6px 14px',
  borderRadius: '20px',
  border: '1px solid var(--color-primary)',
  backgroundColor: '#ECFDF5',
  color: '#047857',
  fontWeight: 700,
  fontSize: '0.8rem',
  cursor: 'pointer',
};
