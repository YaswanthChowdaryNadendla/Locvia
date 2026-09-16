// src/pages/delivery/DeliveryDashboardPage.jsx
// Dedicated Delivery Dashboard Page for Delivery Partners (Module 24)

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getDeliveryAvailability,
  setDeliveryAvailability,
  getAvailableDeliveryRequests,
  getActiveDelivery,
  getCompletedDeliveries,
  getDeliverySummary,
} from '../../services/deliveryService';
import {
  Truck,
  CheckCircle,
  Compass,
  PackageCheck,
  DollarSign,
  User,
  MapPin,
  Store,
  ChevronRight,
  AlertCircle,
  Power,
  Calendar,
} from 'lucide-react';

export default function DeliveryDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const partnerId = user?.id || 'user-partner';

  // State
  const [isOnline, setIsOnline] = useState(() => getDeliveryAvailability(partnerId));
  const [notification, setNotification] = useState(null);

  // Synchronize Availability state
  useEffect(() => {
    setIsOnline(getDeliveryAvailability(partnerId));
  }, [partnerId]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    setDeliveryAvailability(partnerId, nextState);
    if (nextState) {
      showToast("You're now online and available for delivery requests.");
    } else {
      showToast("You're now offline. New delivery requests are paused.", 'error');
    }
  };

  // Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Partner';

  // Dynamic Initials Avatar (e.g. Suresh Kumar -> SK)
  const initials = useMemo(() => {
    if (!user?.name) return 'DP';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }, [user?.name]);

  // Dynamic Data & Summary Metrics
  const summary = getDeliverySummary(partnerId);
  const activeDelivery = getActiveDelivery(partnerId);
  const availableRequests = getAvailableDeliveryRequests();
  const completedDeliveries = getCompletedDeliveries(partnerId);

  // Formatted Current Date
  const dateFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

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

      {/* Profile Header & Greeting Banner */}
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
          gap: '1.25rem',
        }}
      >
        {/* Profile Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            onClick={() => navigate('/delivery/profile')}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
              flexShrink: 0,
            }}
            title="View Delivery Profile"
          >
            {initials}
          </div>

          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
              {greeting}, {firstName}!
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Delivery Partner</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> {dateFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Availability Toggle Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isOnline ? '#059669' : '#6B7280' }}>
              {isOnline ? '● Online & Available' : '○ Offline'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
              {isOnline ? 'Ready for new delivery requests' : 'Not accepting new requests'}
            </div>
          </div>

          <button
            onClick={handleToggleOnline}
            style={{
              padding: '10px 18px',
              borderRadius: '24px',
              border: 'none',
              backgroundColor: isOnline ? '#10B981' : '#6B7280',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isOnline ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Power size={16} />
            {isOnline ? 'Available' : 'Go Online'}
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: Today's Deliveries */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Today's Deliveries</div>
              <div style={statValueStyle}>{summary.todayCount}</div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#E0F2FE', color: '#0284C7' }}>
              <Truck size={22} />
            </div>
          </div>
        </div>

        {/* Card 2: Active Delivery */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Active Delivery</div>
              <div style={{ ...statValueStyle, color: summary.activeCount > 0 ? '#7C3AED' : 'var(--color-text)' }}>
                {summary.activeCount}
              </div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
              <PackageCheck size={22} />
            </div>
          </div>
        </div>

        {/* Card 3: Completed */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Completed</div>
              <div style={{ ...statValueStyle, color: '#059669' }}>{summary.completedCount}</div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#D1FAE5', color: '#059669' }}>
              <CheckCircle size={22} />
            </div>
          </div>
        </div>

        {/* Card 4: Available Requests */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Available Requests</div>
              <div style={{ ...statValueStyle, color: '#2563EB' }}>{summary.availableCount}</div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Compass size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Delivery & Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Active Delivery Section */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
              <PackageCheck size={18} style={{ color: '#7C3AED' }} /> Active Delivery
            </div>
            {activeDelivery && (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#F5F3FF', color: '#7C3AED', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                OUT FOR DELIVERY
              </span>
            )}
          </div>

          <div style={{ padding: '1.25rem' }}>
            {activeDelivery ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text)' }}>
                    Order #{activeDelivery.orderId || activeDelivery.id}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '2px' }}>
                    {activeDelivery.items?.length || 1} items • ₹{activeDelivery.pricing?.finalTotal || 0}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Store size={16} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'block' }}>PICKUP LOCATION</span>
                      <strong style={{ color: 'var(--color-text)' }}>{activeDelivery.shops?.[0]?.name || activeDelivery.items?.[0]?.shopName || 'Sri Lakshmi General Store'}</strong>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed #E5E7EB', margin: '4px 0' }} />

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <MapPin size={16} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'block' }}>DELIVERY ADDRESS</span>
                      <span style={{ color: '#374151', lineHeight: 1.4 }}>
                        {activeDelivery.address ? `${activeDelivery.address.fullName || ''}, ${activeDelivery.address.addressLine1 || ''}, ${activeDelivery.address.city || ''}` : 'Customer Address'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/delivery/active')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
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
                  }}
                >
                  <span>Continue Delivery</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#6B7280' }}>
                <CheckCircle size={40} style={{ color: '#D1D5DB', marginBottom: '0.75rem' }} />
                <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '1rem' }}>
                  No active delivery right now
                </div>
                <p style={{ fontSize: '0.85rem', marginTop: '4px', color: '#9CA3AF' }}>
                  You are all caught up! Accept a request from below to get started.
                </p>
                <button
                  onClick={() => navigate('/delivery/requests')}
                  style={{
                    marginTop: '1rem',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  View Available Requests
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Grid Card */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
              Quick Actions
            </div>
          </div>

          <div
            style={{
              padding: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
            }}
          >
            <button
              onClick={() => navigate('/delivery/requests')}
              style={actionBoxStyle}
            >
              <div style={{ ...actionIconWrapStyle, backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                <Compass size={22} />
              </div>
              <span style={actionLabelStyle}>Delivery Requests</span>
            </button>

            <button
              onClick={() => navigate('/delivery/active')}
              style={actionBoxStyle}
            >
              <div style={{ ...actionIconWrapStyle, backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
                <PackageCheck size={22} />
              </div>
              <span style={actionLabelStyle}>Active Delivery</span>
            </button>

            <button
              onClick={() => navigate('/delivery/earnings')}
              style={actionBoxStyle}
            >
              <div style={{ ...actionIconWrapStyle, backgroundColor: '#D1FAE5', color: '#059669' }}>
                <DollarSign size={22} />
              </div>
              <span style={actionLabelStyle}>Earnings Overview</span>
            </button>

            <button
              onClick={() => navigate('/delivery/profile')}
              style={actionBoxStyle}
            >
              <div style={{ ...actionIconWrapStyle, backgroundColor: '#FEF3C7', color: '#D97706' }}>
                <User size={22} />
              </div>
              <span style={actionLabelStyle}>My Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Available Requests Preview & Recent Completed */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Available Delivery Requests Preview */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
              <Compass size={18} style={{ color: '#2563EB' }} /> Available Requests ({availableRequests.length})
            </div>
            <button
              onClick={() => navigate('/delivery/requests')}
              style={viewAllLinkStyle}
            >
              View All
            </button>
          </div>

          <div style={{ padding: '1rem' }}>
            {availableRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#9CA3AF', fontSize: '0.875rem' }}>
                No delivery requests available right now.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {availableRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id || req.orderId}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                        Order #{req.orderId || req.id}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px' }}>
                        Pickup: {req.shops?.[0]?.name || req.items?.[0]?.shopName || 'Local Store'}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/delivery/requests')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'var(--color-primary)',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      View Request
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Completed Deliveries Preview */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
              <CheckCircle size={18} style={{ color: '#059669' }} /> Recent Completed Deliveries
            </div>
            <button
              onClick={() => navigate('/delivery/earnings')}
              style={viewAllLinkStyle}
            >
              View Earnings
            </button>
          </div>

          <div style={{ padding: '1rem' }}>
            {completedDeliveries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#9CA3AF', fontSize: '0.875rem' }}>
                No completed deliveries recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {completedDeliveries.slice(0, 3).map((ord) => (
                  <div
                    key={ord.id || ord.orderId}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                        Order #{ord.orderId || ord.id}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px' }}>
                        Drop: {ord.address?.city || 'Bengaluru'}
                      </div>
                    </div>

                    <span
                      style={{
                        backgroundColor: '#DCFCE7',
                        color: '#16A34A',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      Delivered
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reusable Styles ─────────────────────────────────────────────
const statCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '1.25rem',
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const statLabelStyle = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
};

const statValueStyle = {
  fontSize: '1.75rem',
  fontWeight: 800,
  color: 'var(--color-text)',
  marginTop: '4px',
};

const iconBoxStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

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

const actionBoxStyle = {
  padding: '1.25rem 1rem',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
  backgroundColor: '#FFFFFF',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const actionIconWrapStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const actionLabelStyle = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: 'var(--color-text)',
  textAlign: 'center',
};

const viewAllLinkStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  fontWeight: 600,
  fontSize: '0.825rem',
  cursor: 'pointer',
  padding: 0,
};
