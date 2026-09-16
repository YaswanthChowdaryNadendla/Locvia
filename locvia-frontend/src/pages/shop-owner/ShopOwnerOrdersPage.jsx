// src/pages/shop-owner/ShopOwnerOrdersPage.jsx
// Dedicated Customer Orders Management Page for Shop Owners (Module 23)

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getOwnerShop,
  getOwnerOrders,
  updateOwnerOrderStatus,
} from '../../services/shopOwnerService';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/loaders/SkeletonLoader';
import ButtonLoader from '../../components/common/loaders/ButtonLoader';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  MapPin,
  Phone,
  User,
  AlertTriangle,
  Calendar,
  Search,
  CheckCircle2,
  PackageCheck,
  AlertCircle,
  X,
  Eye,
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

export default function ShopOwnerOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ownerShop, setOwnerShop] = useState(null);

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'NEW' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Confirmation Modal State
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    getOwnerShop().then(shop => setOwnerShop(shop)).catch(() => setOwnerShop(null));
  }, []);

  const loadOrders = async (targetShopId) => {
    const shopId = targetShopId || ownerShop?.id;
    if (shopId) {
      try {
        const data = await getOwnerOrders(shopId);
        setOrders(data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ownerShop?.id) {
      loadOrders(ownerShop.id);
    }
  }, [ownerShop?.id]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Status transition execution
  const executeStatusChange = async (orderId, newStatus, message) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await updateOwnerOrderStatus(ownerShop.id, orderId, newStatus);
      await loadOrders(ownerShop.id);
      showToast(message || `Order #${orderId} updated to "${newStatus}".`);
      setModalConfig(null);
    } catch (err) {
      showToast(err.message || 'Failed to update order status.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Open confirmation dialog
  const promptStatusChange = (order, targetStatus, title, text, actionText) => {
    setModalConfig({
      order,
      targetStatus,
      title,
      text,
      actionText,
    });
  };

  // Metric Summary Counts
  const newOrdersCount = useMemo(
    () => orders.filter((o) => ['PLACED', 'CONFIRMED'].includes((o.orderStatus || 'PLACED').toUpperCase())).length,
    [orders]
  );
  const preparingCount = useMemo(
    () => orders.filter((o) => (o.orderStatus || '').toUpperCase() === 'PREPARING').length,
    [orders]
  );
  const readyCount = useMemo(
    () => orders.filter((o) => (o.orderStatus || '').toUpperCase() === 'READY_FOR_PICKUP').length,
    [orders]
  );
  const completedCount = useMemo(
    () => orders.filter((o) => (o.orderStatus || '').toUpperCase() === 'DELIVERED').length,
    [orders]
  );

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        String(order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.address?.fullName || order.address?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const currentStatus = (order.orderStatus || 'PLACED').toUpperCase();

      let matchesStatus = true;
      if (activeTab === 'NEW') matchesStatus = ['PLACED', 'CONFIRMED'].includes(currentStatus);
      else if (activeTab === 'PREPARING') matchesStatus = currentStatus === 'PREPARING';
      else if (activeTab === 'READY') matchesStatus = currentStatus === 'READY_FOR_PICKUP';
      else if (activeTab === 'OUT_FOR_DELIVERY') matchesStatus = currentStatus === 'OUT_FOR_DELIVERY';
      else if (activeTab === 'DELIVERED') matchesStatus = currentStatus === 'DELIVERED';
      else if (activeTab === 'CANCELLED') matchesStatus = currentStatus === 'CANCELLED';

      return matchesSearch && matchesStatus;
    });
  }, [orders, activeTab, searchTerm]);

  // Helper for Status Badges
  const renderStatusBadge = (statusStr) => {
    const key = (statusStr || 'PLACED').toUpperCase();
    const config = STATUS_BADGES[key] || STATUS_BADGES.PLACED;

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 700,
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: config.color,
          }}
        />
        {config.label}
      </span>
    );
  };

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
          {notification.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Orders
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '4px' }}>
          Manage and fulfill orders containing products from <strong style={{ color: 'var(--color-primary)' }}>{ownerShop.name}</strong>
        </p>
      </div>

      {/* Metric Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: New Orders */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>New Orders</div>
              <div style={{ ...statValueStyle, color: newOrdersCount > 0 ? '#2563EB' : 'var(--color-text)' }}>
                {newOrdersCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: newOrdersCount > 0 ? '#2563EB' : '#9CA3AF', marginTop: '2px', fontWeight: 600 }}>
                {newOrdersCount > 0 ? '● Needs attention' : 'No new orders'}
              </div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <ShoppingBag size={22} />
            </div>
          </div>
        </div>

        {/* Card 2: Preparing */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Preparing</div>
              <div style={{ ...statValueStyle, color: '#7C3AED' }}>{preparingCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>In kitchen/packing</div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
              <Clock size={22} />
            </div>
          </div>
        </div>

        {/* Card 3: Ready */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Ready for Pickup</div>
              <div style={{ ...statValueStyle, color: '#059669' }}>{readyCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>Awaiting rider</div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#D1FAE5', color: '#059669' }}>
              <PackageCheck size={22} />
            </div>
          </div>
        </div>

        {/* Card 4: Completed */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Completed</div>
              <div style={{ ...statValueStyle, color: '#16A34A' }}>{completedCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>Successfully delivered</div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#DCFCE7', color: '#16A34A' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
              }}
            />
            <input
              type="text"
              placeholder="Search by Order ID or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: '12px',
                paddingTop: '9px',
                paddingBottom: '9px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { id: 'ALL', label: `All (${orders.length})` },
            { id: 'NEW', label: `New (${newOrdersCount})` },
            { id: 'PREPARING', label: `Preparing (${preparingCount})` },
            { id: 'READY', label: `Ready (${readyCount})` },
            { id: 'DELIVERED', label: `Delivered (${completedCount})` },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: isActive ? '1px solid var(--color-primary)' : '1px solid #D1D5DB',
                  backgroundColor: isActive ? 'var(--color-primary-light, #E6F4EA)' : '#FFFFFF',
                  color: isActive ? 'var(--color-primary)' : '#4B5563',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List View */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} aria-busy="true" aria-label="Loading shop orders">
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <SkeletonLoader width="180px" height="22px" />
                <SkeletonLoader width="110px" height="26px" borderRadius="12px" />
              </div>
              <SkeletonLoader width="220px" height="18px" style={{ marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem' }}>
                <SkeletonLoader width="48px" height="48px" borderRadius="8px" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <SkeletonLoader width="50%" height="16px" />
                  <SkeletonLoader width="30%" height="14px" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #F3F4F6' }}>
                <SkeletonLoader width="120px" height="22px" />
                <SkeletonLoader width="110px" height="34px" borderRadius="8px" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            padding: '2rem 1rem',
          }}
        >
          <EmptyState
            icon={ShoppingBag}
            title="No Orders Found"
            description={activeTab !== 'ALL' || searchTerm ? 'No orders match your search or selected status filter.' : 'When customers order products from your shop, they will appear here.'}
            actionLabel={activeTab !== 'ALL' || searchTerm ? 'Clear Filters' : undefined}
            onAction={activeTab !== 'ALL' || searchTerm ? () => { setSearchTerm(''); setActiveTab('ALL'); } : undefined}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredOrders.map((order) => {
            const orderIdStr = order.orderId || order.id || 'LOC-ORDER';
            const dateStr = order.createdAt
              ? new Date(order.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent Order';

            const currentStatus = (order.orderStatus || order.status || 'PLACED').toUpperCase();
            const customerName = order.address?.fullName || order.address?.name || 'Customer';
            const customerPhone = order.address?.phone || 'N/A';
            const addressText = order.address
              ? `${order.address.addressLine1 || ''} ${order.address.addressLine2 || ''}, ${order.address.city || ''} - ${order.address.pincode || ''}`
              : 'Delivery Address Provided';

            const items = Array.isArray(order.items) ? order.items : [];
            const shopSubtotal = order.shopSubtotal || 0;

            return (
              <div
                key={order.id || order.orderId}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: currentStatus === 'PLACED' ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                }}
              >
                {/* Order Top Bar */}
                <div
                  style={{
                    backgroundColor: currentStatus === 'PLACED' ? '#EFF6FF' : '#F9FAFB',
                    borderBottom: '1px solid #E5E7EB',
                    padding: '0.875rem 1.25rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-primary-light, #E6F4EA)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                          Order #{orderIdStr}
                        </span>
                        {renderStatusBadge(currentStatus)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Calendar size={12} /> {dateStr}
                      </div>
                    </div>
                  </div>

                  {/* Payment Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        backgroundColor: '#D1FAE5',
                        color: '#059669',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle size={12} /> {order.paymentStatus || 'PAID'} ({order.paymentMethod || 'Online'})
                    </span>
                  </div>
                </div>

                {/* Main Content Body (Grid) */}
                <div
                  style={{
                    padding: '1.25rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem',
                  }}
                >
                  {/* Left Column: Items List */}
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      Shop Items ({items.length})
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            backgroundColor: '#F9FAFB',
                            borderRadius: '8px',
                            border: '1px solid #F3F4F6',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={normalizeImageUrl(item.image, 'product')}
                              alt={item.name}
                              onError={(e) => handleImageError(e, 'product')}
                              style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                            />
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                Qty: {item.quantity || 1} × ₹{item.price}
                              </div>
                            </div>
                          </div>

                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shop Subtotal Line */}
                    <div
                      style={{
                        marginTop: '1rem',
                        paddingTop: '8px',
                        borderTop: '1px solid #E5E7EB',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.875rem', color: '#4B5563', fontWeight: 600 }}>
                        Shop Subtotal:
                      </span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        ₹{shopSubtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Customer Info & Actions */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backgroundColor: '#F9FAFB',
                      padding: '1rem',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                        Customer & Delivery Info
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
                          <User size={16} style={{ color: 'var(--color-primary)' }} />
                          <strong style={{ color: 'var(--color-text)' }}>{customerName}</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
                          <Phone size={16} style={{ color: 'var(--color-primary)' }} />
                          <span>{customerPhone}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#374151' }}>
                          <MapPin size={16} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ color: '#4B5563', lineHeight: 1.4 }}>{addressText}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div
                      style={{
                        marginTop: '1.25rem',
                        paddingTop: '10px',
                        borderTop: '1px solid #E5E7EB',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      {/* View Details button */}
                      <button
                        onClick={() => navigate(`/shop-owner/orders/${order.orderId || order.id}`)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: '#FFFFFF',
                          color: '#374151',
                          fontWeight: 600,
                          fontSize: '0.825rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Eye size={14} /> View Details
                      </button>

                      {/* Status Transition Action Buttons */}
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {currentStatus === 'PLACED' && (
                          <>
                            <button
                              onClick={() =>
                                promptStatusChange(
                                  order,
                                  'CANCELLED',
                                  'Cancel Order?',
                                  'Are you sure you want to cancel this order? This action cannot be undone.',
                                  'Confirm Cancel'
                                )
                              }
                              style={cancelBtnStyle}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() =>
                                promptStatusChange(
                                  order,
                                  'CONFIRMED',
                                  'Accept Order?',
                                  `Accept order #${orderIdStr} and notify the customer?`,
                                  'Accept Order'
                                )
                              }
                              style={primaryActionBtnStyle}
                            >
                              Accept Order
                            </button>
                          </>
                        )}

                        {currentStatus === 'CONFIRMED' && (
                          <button
                            onClick={() =>
                              promptStatusChange(
                                order,
                                'PREPARING',
                                'Start Preparing Order?',
                                `Mark order #${orderIdStr} as currently being prepared in your shop?`,
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
                                order,
                                'READY_FOR_PICKUP',
                                'Mark Ready for Pickup?',
                                `Mark order #${orderIdStr} as ready and packed for delivery pickup?`,
                                'Mark Ready'
                              )
                            }
                            style={primaryActionBtnStyle}
                          >
                            Mark Ready
                          </button>
                        )}

                        {currentStatus === 'READY_FOR_PICKUP' && (
                          <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Packed & Ready for Pickup
                          </span>
                        )}

                        {currentStatus === 'DELIVERED' && (
                          <span style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={14} /> Order Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Action Modal */}
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
                    modalConfig.order.id || modalConfig.order.orderId,
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

const primaryActionBtnStyle = {
  padding: '7px 16px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: 'var(--color-primary)',
  color: '#FFFFFF',
  fontWeight: 600,
  fontSize: '0.825rem',
  cursor: 'pointer',
  transition: 'opacity 0.15s ease',
};

const cancelBtnStyle = {
  padding: '7px 14px',
  borderRadius: '8px',
  border: '1px solid #FCA5A5',
  backgroundColor: '#FEF2F2',
  color: '#DC2626',
  fontWeight: 600,
  fontSize: '0.825rem',
  cursor: 'pointer',
};
