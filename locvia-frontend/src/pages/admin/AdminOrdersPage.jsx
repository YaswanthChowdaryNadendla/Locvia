// src/pages/admin/AdminOrdersPage.jsx
// Module 33 — Admin Order Management Page

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Truck,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getAllOrders,
  calculateOrderStats,
  formatINR,
  formatOrderDate,
} from '../../services/adminOrderService';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/loaders';

const PAGE_SIZE = 10;

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

const PAYMENT_STATUS_STYLES = {
  PAID: { background: '#DCFCE7', color: '#15803D' },
  PENDING: { background: '#FEF3C7', color: '#B45309' },
  FAILED: { background: '#FEE2E2', color: '#B91C1C' },
  REFUNDED: { background: '#F3E8FF', color: '#7E22CE' },
};

const AdminOrdersPage = () => {
  const navigate = useNavigate();

  const [ordersList, setOrdersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Load orders on mount
  useEffect(() => {
    setOrdersList(getAllOrders());
    setIsLoading(false);
  }, []);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, paymentFilter, dateFilter, sortOption]);

  // Master stats
  const stats = useMemo(() => calculateOrderStats(ordersList), [ordersList]);

  // Filter & Sort Orders
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...ordersList];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (o) =>
          (o.id && o.id.toLowerCase().includes(q)) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
          (o.customerPhone && o.customerPhone.includes(q)) ||
          (o.shopNames && o.shopNames.toLowerCase().includes(q))
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter((o) => o.orderStatus === statusFilter);
    }

    // 3. Payment Filter
    if (paymentFilter !== 'ALL') {
      result = result.filter((o) => o.paymentStatus === paymentFilter);
    }

    // 4. Date Filter
    if (dateFilter !== 'ALL') {
      const now = new Date();
      result = result.filter((o) => {
        if (!o.createdAt) return false;
        const oDate = new Date(o.createdAt);
        if (dateFilter === 'TODAY') {
          return oDate.toDateString() === now.toDateString();
        }
        if (dateFilter === 'LAST_7_DAYS') {
          const diffDays = (now - oDate) / (1000 * 3600 * 24);
          return diffDays <= 7;
        }
        if (dateFilter === 'LAST_30_DAYS') {
          const diffDays = (now - oDate) / (1000 * 3600 * 24);
          return diffDays <= 30;
        }
        return true;
      });
    }

    // 5. Sort Option
    result.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortOption === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortOption === 'total_high') {
        return (b.finalTotal || 0) - (a.finalTotal || 0);
      }
      if (sortOption === 'total_low') {
        return (a.finalTotal || 0) - (b.finalTotal || 0);
      }
      if (sortOption === 'customer_asc') {
        return (a.customerName || '').localeCompare(b.customerName || '');
      }
      return 0;
    });

    return result;
  }, [ordersList, searchQuery, statusFilter, paymentFilter, dateFilter, sortOption]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedOrders.length / PAGE_SIZE));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedOrders.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedOrders, currentPage]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPaymentFilter('ALL');
    setDateFilter('ALL');
    setSortOption('newest');
  };

  return (
    <div className="admin-orders-page" style={{ width: '100%', minWidth: 0 }}>
      {/* Header Section */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0' }}>
          Order Management
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
          Monitor and manage all platform orders across Locvia.
        </p>
      </div>

      {/* Statistics Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Total Orders */}
        <div
          style={{
            background: 'var(--color-surface, #FFFFFF)',
            border: '1px solid var(--color-border, #E2E8F0)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(79, 70, 229, 0.1)',
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShoppingBag size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Total Orders
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.totalOrders}
            </span>
          </div>
        </div>

        {/* Pending Orders */}
        <div
          style={{
            background: 'var(--color-surface, #FFFFFF)',
            border: '1px solid var(--color-border, #E2E8F0)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(217, 119, 6, 0.1)',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Pending Orders
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#D97706' }}>
              {stats.pendingOrders}
            </span>
          </div>
        </div>

        {/* Completed Orders */}
        <div
          style={{
            background: 'var(--color-surface, #FFFFFF)',
            border: '1px solid var(--color-border, #E2E8F0)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Completed
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#10B981' }}>
              {stats.completedOrders}
            </span>
          </div>
        </div>

        {/* Cancelled Orders */}
        <div
          style={{
            background: 'var(--color-surface, #FFFFFF)',
            border: '1px solid var(--color-border, #E2E8F0)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <XCircle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Cancelled
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#EF4444' }}>
              {stats.cancelledOrders}
            </span>
          </div>
        </div>

        {/* Total Revenue */}
        <div
          style={{
            background: 'var(--color-surface, #FFFFFF)',
            border: '1px solid var(--color-border, #E2E8F0)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(22, 163, 74, 0.1)',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IndianRupee size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Total Revenue
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#16A34A' }}>
              {formatINR(stats.totalRevenue)}
            </span>
          </div>
        </div>

        {/* Active Deliveries */}
        <div
          style={{
            background: 'var(--color-surface, #FFFFFF)',
            border: '1px solid var(--color-border, #E2E8F0)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(230, 81, 0, 0.1)',
              color: '#E65100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Truck size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Active Deliveries
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.activeDeliveries}
            </span>
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div
        style={{
          background: 'var(--color-surface, #FFFFFF)',
          border: '1px solid var(--color-border, #E2E8F0)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 240px',
            minWidth: '200px',
          }}
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search orders by ID, customer name, email, phone, or shop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: '8px',
              border: '1px solid var(--color-border, #CBD5E1)',
              fontSize: '14px',
              outline: 'none',
              background: 'var(--color-background, #F8FAFC)',
              color: 'var(--color-text)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Dropdown Filters */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="var(--color-text-muted)" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #CBD5E1)',
                fontSize: '13px',
                background: 'var(--color-background, #F8FAFC)',
                color: 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Order Statuses</option>
              <option value="PLACED">Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border, #CBD5E1)',
              fontSize: '13px',
              background: 'var(--color-background, #F8FAFC)',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="var(--color-text-muted)" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #CBD5E1)',
                fontSize: '13px',
                background: 'var(--color-background, #F8FAFC)',
                color: 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
            </select>
          </div>

          {/* Sort Option */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={15} color="var(--color-text-muted)" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #CBD5E1)',
                fontSize: '13px',
                background: 'var(--color-background, #F8FAFC)',
                color: 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="total_high">Highest Total</option>
              <option value="total_low">Lowest Total</option>
              <option value="customer_asc">Customer (A-Z)</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== 'ALL' || paymentFilter !== 'ALL' || dateFilter !== 'ALL' || sortOption !== 'newest') && (
            <button
              onClick={handleClearFilters}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: '#E2E8F0',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table / Cards Content */}
      {isLoading ? (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '20px' }} aria-busy="true" aria-label="Loading orders">
          <TableSkeleton rows={6} columns={7} />
        </div>
      ) : filteredAndSortedOrders.length === 0 ? (
        <div style={{ marginBottom: '24px' }}>
          <EmptyState
            icon={ShoppingBag}
            title={ordersList.length === 0 ? 'No orders yet' : 'No matching orders found'}
            message={
              ordersList.length === 0
                ? 'All customer platform orders will appear here once placed.'
                : 'Try changing your search query or clearing status and date filters.'
            }
            actionLabel={ordersList.length > 0 ? 'Clear Filters' : undefined}
            onAction={ordersList.length > 0 ? handleClearFilters : undefined}
          />
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div
            className="hide-mobile"
            style={{
              background: 'var(--color-surface, #FFFFFF)',
              border: '1px solid var(--color-border, #E2E8F0)',
              borderRadius: '12px',
              overflowX: 'auto',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              marginBottom: '20px',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '14px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#F8FAFC',
                    borderBottom: '1px solid var(--color-border, #E2E8F0)',
                    color: 'var(--color-text-muted)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Order ID</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Shop(s)</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Items</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Payment</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Order Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((o) => {
                  const statusStyle = ORDER_STATUS_STYLES[o.orderStatus] || { background: '#F1F5F9', color: '#475569' };
                  const paymentStyle = PAYMENT_STATUS_STYLES[o.paymentStatus] || { background: '#F1F5F9', color: '#475569' };

                  return (
                    <tr
                      key={o.id}
                      style={{
                        borderBottom: '1px solid var(--color-border, #F1F5F9)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Order ID */}
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--color-text)' }}>
                        #{o.id}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{o.customerName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', overflowWrap: 'anywhere' }}>
                          {o.customerPhone || o.customerEmail}
                        </div>
                      </td>

                      {/* Shop(s) */}
                      <td style={{ padding: '14px 18px', color: 'var(--color-text)', maxWidth: '180px' }}>
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '13px',
                          }}
                          title={o.shopNames}
                        >
                          {o.shopNames}
                        </div>
                      </td>

                      {/* Items */}
                      <td style={{ padding: '14px 18px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        {o.totalItemCount} {o.totalItemCount === 1 ? 'item' : 'items'}
                      </td>

                      {/* Total */}
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--color-text)' }}>
                        {formatINR(o.finalTotal)}
                      </td>

                      {/* Payment */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            ...paymentStyle,
                          }}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>

                      {/* Order Status */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            ...statusStyle,
                          }}
                        >
                          {o.orderStatus}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 18px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                        {formatOrderDate(o.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => navigate(`/admin/orders/${o.id}`)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border, #CBD5E1)',
                            background: '#FFFFFF',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (< 768px) */}
          <div
            className="hide-desktop"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              marginBottom: '20px',
            }}
          >
            {paginatedOrders.map((o) => {
              const statusStyle = ORDER_STATUS_STYLES[o.orderStatus] || { background: '#F1F5F9', color: '#475569' };
              const paymentStyle = PAYMENT_STATUS_STYLES[o.paymentStatus] || { background: '#F1F5F9', color: '#475569' };

              return (
                <div
                  key={o.id}
                  style={{
                    background: 'var(--color-surface, #FFFFFF)',
                    border: '1px solid var(--color-border, #E2E8F0)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid #F1F5F9',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '15px' }}>
                        #{o.id}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {formatOrderDate(o.createdAt)}
                      </span>
                    </div>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        ...statusStyle,
                      }}
                    >
                      {o.orderStatus}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      fontSize: '13px',
                      marginBottom: '14px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Customer
                      </span>
                      <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{o.customerName}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Shop(s)
                      </span>
                      <span style={{ color: 'var(--color-text)', wordBreak: 'break-word' }}>{o.shopNames}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Total Payable
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{formatINR(o.finalTotal)}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Payment
                      </span>
                      <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, ...paymentStyle }}>
                        {o.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/admin/orders/${o.id}`)}
                    style={{
                      width: '100%',
                      padding: '9px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border, #CBD5E1)',
                      background: '#FFFFFF',
                      color: '#334155',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Eye size={16} />
                    View Order Details
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--color-surface, #FFFFFF)',
                border: '1px solid var(--color-border, #E2E8F0)',
                borderRadius: '12px',
                padding: '12px 18px',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Showing <strong>{(currentPage - 1) * PAGE_SIZE + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * PAGE_SIZE, filteredAndSortedOrders.length)}</strong> of{' '}
                <strong>{filteredAndSortedOrders.length}</strong> orders
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border, #CBD5E1)',
                    background: '#FFFFFF',
                    color: currentPage === 1 ? '#94A3B8' : '#334155',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: pg === currentPage ? 'var(--color-primary, #16A34A)' : '#CBD5E1',
                      background: pg === currentPage ? 'var(--color-primary, #16A34A)' : '#FFFFFF',
                      color: pg === currentPage ? '#FFFFFF' : '#334155',
                      fontWeight: pg === currentPage ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border, #CBD5E1)',
                    background: '#FFFFFF',
                    color: currentPage === totalPages ? '#94A3B8' : '#334155',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminOrdersPage;
