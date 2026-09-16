// src/pages/delivery/DeliveryEarningsPage.jsx
// Dedicated Delivery Partner Earnings Page for Locvia (Module 28)

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getDeliveryEarnings,
  formatINR,
} from '../../services/deliveryService';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  AlertCircle,
  Building,
} from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonLoader, TableSkeleton } from '../../components/common/loaders';

export default function DeliveryEarningsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const partnerId = user?.id || 'user-partner';

  // State
  const [earningsData, setEarningsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH'

  // Load Earnings Data
  const loadEarnings = useCallback(() => {
    try {
      setError(null);
      const data = getDeliveryEarnings(partnerId);
      setEarningsData(data);
    } catch (err) {
      console.error('Error loading delivery earnings:', err);
      setError('Failed to calculate delivery earnings.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [partnerId]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadEarnings();
    }, 400);
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    if (!earningsData || !earningsData.history) return [];

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return earningsData.history.filter((item) => {
      const dateStr = item.deliveredAt || '';
      const itemDate = dateStr ? new Date(dateStr) : new Date();

      if (periodFilter === 'TODAY') {
        return dateStr.slice(0, 10) === todayStr;
      }
      if (periodFilter === 'WEEK') {
        return itemDate >= startOfWeek;
      }
      if (periodFilter === 'MONTH') {
        return itemDate >= startOfMonth;
      }
      return true;
    });
  }, [earningsData, periodFilter]);

  // Format Date for History Rows
  const formatDateStr = (ts) => {
    if (!ts) return 'N/A';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      {/* Page Header */}
      <div style={headerBannerStyle}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={iconWrapStyle}>
              <DollarSign size={24} style={{ color: '#059669' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                Delivery Earnings
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '2px', margin: 0 }}>
                Track your earnings from completed deliveries.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={refreshBtnStyle}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* LOADING SKELETON */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} aria-busy="true" aria-label="Loading earnings">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={statCardStyle}>
                <SkeletonLoader width="50%" height="14px" borderRadius="4px" style={{ marginBottom: '10px' }} />
                <SkeletonLoader width="70%" height="28px" borderRadius="4px" />
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '1.25rem' }}>
            <TableSkeleton rows={4} columns={6} />
          </div>
        </div>
      ) : error ? (
        /* ERROR STATE */
        <EmptyState
          icon={AlertCircle}
          title="Unable to load earnings"
          message={error}
          actionLabel="Try Again"
          onAction={loadEarnings}
        />
      ) : (
        <>
          {/* SUMMARY METRIC CARDS GRID */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Card 1: Total Earnings */}
            <div style={statCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={statLabelStyle}>Total Earnings</div>
                  <div style={{ ...statValueStyle, color: '#059669' }}>
                    {formatINR(earningsData?.totalEarnings)}
                  </div>
                </div>
                <div style={{ ...iconBoxStyle, backgroundColor: '#D1FAE5', color: '#059669' }}>
                  <DollarSign size={22} />
                </div>
              </div>
            </div>

            {/* Card 2: Today's Earnings */}
            <div style={statCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={statLabelStyle}>Today's Earnings</div>
                  <div style={{ ...statValueStyle, color: '#0284C7' }}>
                    {formatINR(earningsData?.todayEarnings)}
                  </div>
                </div>
                <div style={{ ...iconBoxStyle, backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                  <Clock size={22} />
                </div>
              </div>
            </div>

            {/* Card 3: This Week */}
            <div style={statCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={statLabelStyle}>This Week</div>
                  <div style={{ ...statValueStyle, color: '#7C3AED' }}>
                    {formatINR(earningsData?.weeklyEarnings)}
                  </div>
                </div>
                <div style={{ ...iconBoxStyle, backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
                  <TrendingUp size={22} />
                </div>
              </div>
            </div>

            {/* Card 4: This Month */}
            <div style={statCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={statLabelStyle}>This Month</div>
                  <div style={{ ...statValueStyle, color: '#D97706' }}>
                    {formatINR(earningsData?.monthlyEarnings)}
                  </div>
                </div>
                <div style={{ ...iconBoxStyle, backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <Calendar size={22} />
                </div>
              </div>
            </div>

            {/* Card 5: Completed Deliveries Count */}
            <div style={statCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={statLabelStyle}>Completed Deliveries</div>
                  <div style={{ ...statValueStyle, color: 'var(--color-text)' }}>
                    {earningsData?.completedCount || 0}
                  </div>
                </div>
                <div style={{ ...iconBoxStyle, backgroundColor: '#ECFDF5', color: '#047857' }}>
                  <CheckCircle size={22} />
                </div>
              </div>
            </div>
          </div>

          {/* MAIN SECTION: Earnings History & Filters */}
          <div style={cardStyle}>
            {/* Section Header with Period Filter Tabs */}
            <div
              style={{
                ...cardHeaderStyle,
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                Earnings History ({filteredHistory.length})
              </div>

              {/* Date Period Filter Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setPeriodFilter('ALL')}
                  style={periodFilter === 'ALL' ? activeFilterTabStyle : filterTabStyle}
                >
                  All Time
                </button>
                <button
                  onClick={() => setPeriodFilter('TODAY')}
                  style={periodFilter === 'TODAY' ? activeFilterTabStyle : filterTabStyle}
                >
                  Today
                </button>
                <button
                  onClick={() => setPeriodFilter('WEEK')}
                  style={periodFilter === 'WEEK' ? activeFilterTabStyle : filterTabStyle}
                >
                  This Week
                </button>
                <button
                  onClick={() => setPeriodFilter('MONTH')}
                  style={periodFilter === 'MONTH' ? activeFilterTabStyle : filterTabStyle}
                >
                  This Month
                </button>
              </div>
            </div>

            {/* EMPTY STATE */}
            {filteredHistory.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="No earnings yet"
                message={periodFilter !== 'ALL' ? "No deliveries completed in this time period." : "Complete your first delivery to start building your earnings history."}
                actionLabel={periodFilter !== 'ALL' ? "Show All Time" : "View Delivery Requests"}
                onAction={periodFilter !== 'ALL' ? () => setPeriodFilter('ALL') : () => navigate('/delivery/requests')}
              />
            ) : (
              <div>
                {/* DESKTOP TABLE VIEW (>=769px) */}
                <div className="hide-mobile" style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={tableHeaderRowStyle}>
                        <th style={thStyle}>ORDER ID</th>
                        <th style={thStyle}>DELIVERED DATE</th>
                        <th style={thStyle}>PICKUP STORE</th>
                        <th style={thStyle}>DESTINATION</th>
                        <th style={thStyle}>STATUS</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>EARNED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((item) => (
                        <tr key={item.id} style={tableRowStyle}>
                          <td style={tdStyle}>
                            <span style={orderIdBadgeStyle}>
                              #{item.orderId}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, color: '#4B5563', fontSize: '0.825rem' }}>
                            {formatDateStr(item.deliveredAt)}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Building size={14} style={{ color: 'var(--color-primary)' }} />
                              <span>{item.shops?.[0]?.name || 'Local Grocery Store'}</span>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, color: '#4B5563', fontSize: '0.825rem' }}>
                            {item.address?.city || 'Bengaluru'}
                          </td>
                          <td style={tdStyle}>
                            <span style={completedBadgeStyle}>
                              ✓ COMPLETED
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                            {formatINR(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARDS VIEW (<=768px down to 320px) */}
                <div className="hide-desktop" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredHistory.map((item) => (
                    <div key={item.id} style={mobileCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={orderIdBadgeStyle}>#{item.orderId}</span>
                        <span style={completedBadgeStyle}>✓ COMPLETED</span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#6B7280', marginBottom: '8px' }}>
                        Delivered on {formatDateStr(item.deliveredAt)}
                      </div>

                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Building size={14} style={{ color: 'var(--color-primary)' }} />
                        <span>{item.shops?.[0]?.name || 'Local Store'}</span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <MapPin size={14} style={{ color: '#E11D48' }} />
                        <span>Drop: {item.address?.city || 'Bengaluru'}</span>
                      </div>

                      <div style={{ borderTop: '1px border #E5E7EB', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>
                          DELIVERY EARNING
                        </span>
                        <strong style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669' }}>
                          {formatINR(item.amount)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Reusable Inline Styles ───────────────────────────────────────
const headerBannerStyle = {
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
};

const iconWrapStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  backgroundColor: '#D1FAE5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const statCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '1.25rem',
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const statLabelStyle = {
  fontSize: '0.78rem',
  fontWeight: 600,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
};

const statValueStyle = {
  fontSize: '1.5rem',
  fontWeight: 800,
  color: 'var(--color-text)',
  marginTop: '4px',
};

const iconBoxStyle = {
  width: '42px',
  height: '42px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '14px',
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const cardHeaderStyle = {
  backgroundColor: '#F9FAFB',
  borderBottom: '1px solid #E5E7EB',
  padding: '1rem 1.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
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

const refreshBtnStyle = {
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
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyle = {
  backgroundColor: '#F9FAFB',
  borderBottom: '1px solid #E5E7EB',
};

const thStyle = {
  padding: '10px 16px',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#6B7280',
  letterSpacing: '0.03em',
};

const tableRowStyle = {
  borderBottom: '1px solid #F3F4F6',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '0.875rem',
  verticalAlign: 'middle',
};

const orderIdBadgeStyle = {
  fontFamily: 'monospace',
  fontWeight: 700,
  fontSize: '0.85rem',
  backgroundColor: '#F3F4F6',
  color: '#374151',
  padding: '3px 8px',
  borderRadius: '6px',
};

const completedBadgeStyle = {
  backgroundColor: '#DCFCE7',
  color: '#15803D',
  fontSize: '0.725rem',
  fontWeight: 800,
  padding: '2px 8px',
  borderRadius: '12px',
};

const mobileCardStyle = {
  backgroundColor: '#F9FAFB',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
  padding: '1rem',
};
