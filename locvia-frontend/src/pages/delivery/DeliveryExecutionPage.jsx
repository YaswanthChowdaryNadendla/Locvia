// src/pages/delivery/DeliveryExecutionPage.jsx
// Dedicated Delivery Execution Page for Delivery Partners (Module 27)

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getActiveDelivery,
  updateDeliveryExecutionStatus,
} from '../../services/deliveryService';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import {
  PackageCheck,
  Truck,
  CheckCircle,
  Store,
  MapPin,
  Phone,
  Package,
  AlertCircle,
  Check,
  Building,
  Layers,
  X,
} from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonLoader, ButtonLoader } from '../../components/common/loaders';

export default function DeliveryExecutionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const partnerId = user?.id || 'user-partner';

  // State
  const [activeOrder, setActiveOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load current active delivery
  const loadActiveDelivery = () => {
    try {
      const order = getActiveDelivery(partnerId);
      setActiveOrder(order);
    } catch (err) {
      console.error('Error loading active delivery:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveDelivery();
  }, [partnerId]);

  // Current status helper
  const status = (activeOrder?.orderStatus || activeOrder?.status || '').toUpperCase();
  const isMultiShop = activeOrder?.shops && activeOrder.shops.length > 1;

  // Status Stage Computations
  const stage = useMemo(() => {
    if (status === 'DELIVERED') return 4;
    if (status === 'OUT_FOR_DELIVERY') return 3;
    if (status === 'PICKED_UP') return 2;
    return 1; // ASSIGNED / PICKUP / PLACED / PREPARING / CONFIRMED
  }, [status]);

  // Format Timestamps
  const formatTime = (ts) => {
    if (!ts) return null;
    try {
      return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  };

  // Action Handlers
  const handleMarkPickedUp = async () => {
    if (isUpdating || !activeOrder) return;
    setIsUpdating(true);
    try {
      const res = updateDeliveryExecutionStatus(activeOrder.id || activeOrder.orderId, partnerId, 'PICKED_UP');
      if (res.success) {
        setActiveOrder(res.order);
        showToast('Order marked as picked up successfully!');
      } else {
        showToast(res.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartDelivery = async () => {
    if (isUpdating || !activeOrder) return;
    setIsUpdating(true);
    try {
      const res = updateDeliveryExecutionStatus(activeOrder.id || activeOrder.orderId, partnerId, 'OUT_FOR_DELIVERY');
      if (res.success) {
        setActiveOrder(res.order);
        showToast('Delivery started! Out for delivery to customer.');
      } else {
        showToast(res.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (isUpdating || !activeOrder) return;
    setIsUpdating(true);
    setIsCompletionModalOpen(false);
    try {
      const res = updateDeliveryExecutionStatus(activeOrder.id || activeOrder.orderId, partnerId, 'DELIVERED');
      if (res.success) {
        setActiveOrder(res.order);
        showToast('Delivery completed successfully!');
      } else {
        showToast(res.message || 'Failed to complete delivery.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to complete delivery.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }} aria-busy="true" aria-label="Loading delivery details">
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem 1.5rem', border: '1px solid #E5E7EB', marginBottom: '1.25rem' }}>
          <SkeletonLoader width="240px" height="28px" borderRadius="6px" style={{ marginBottom: '12px' }} />
          <SkeletonLoader width="100%" height="48px" borderRadius="10px" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '1.25rem' }}>
            <SkeletonLoader width="160px" height="22px" borderRadius="4px" style={{ marginBottom: '16px' }} />
            <SkeletonLoader width="100%" height="70px" borderRadius="10px" style={{ marginBottom: '12px' }} />
            <SkeletonLoader width="100%" height="42px" borderRadius="8px" />
          </div>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '1.25rem' }}>
            <SkeletonLoader width="160px" height="22px" borderRadius="4px" style={{ marginBottom: '16px' }} />
            <SkeletonLoader width="100%" height="70px" borderRadius="10px" style={{ marginBottom: '12px' }} />
            <SkeletonLoader width="100%" height="42px" borderRadius="8px" />
          </div>
        </div>
      </div>
    );
  }

  // NO ACTIVE DELIVERY VIEW
  if (!activeOrder && status !== 'DELIVERED') {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <EmptyState
          icon={PackageCheck}
          title="No Active Delivery"
          message="You don't currently have an active delivery. Browse available delivery requests to accept an order and start delivering."
          actionLabel="View Delivery Requests"
          onAction={() => navigate('/delivery/requests')}
          secondaryActionLabel="Back to Dashboard"
          onSecondaryAction={() => navigate('/delivery/dashboard')}
        />
      </div>
    );
  }

  // COMPLETED DELIVERY VIEW
  if (status === 'DELIVERED') {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
        {/* Toast */}
        {notification && (
          <div style={toastStyle}>
            <CheckCircle size={18} />
            {notification.message}
          </div>
        )}

        <div style={emptyCardStyle}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <CheckCircle size={36} />
          </div>

          <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
            ✓ DELIVERY COMPLETED
          </span>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', margin: '0.75rem 0 0.25rem' }}>
            Order #{activeOrder.orderId || activeOrder.id}
          </h2>

          <p style={{ fontSize: '0.9rem', color: '#4B5563', margin: '0 0 1.5rem' }}>
            Delivered successfully at {formatTime(activeOrder.deliveredAt) || 'recently'}.
          </p>

          <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1.25rem', maxWidth: '480px', margin: '0 auto 1.75rem', textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
              DELIVERY SUMMARY
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '6px' }}>
              <span style={{ color: '#6B7280' }}>Customer:</span>
              <strong style={{ color: 'var(--color-text)' }}>{activeOrder.address?.fullName || 'Customer'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '6px' }}>
              <span style={{ color: '#6B7280' }}>Destination:</span>
              <span style={{ color: '#374151', textAlign: 'right', maxWidth: '60%', overflowWrap: 'anywhere' }}>
                {activeOrder.address?.city || 'Bengaluru'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: '#6B7280' }}>Total Paid:</span>
              <strong style={{ color: '#059669' }}>₹{activeOrder.pricing?.finalTotal || activeOrder.pricing?.total || 0}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/delivery/dashboard')}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate('/delivery/requests')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                color: '#374151',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              View Delivery Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE DELIVERY EXECUTION VIEW
  const orderId = activeOrder.orderId || activeOrder.id;
  const items = activeOrder.items || [];
  const address = activeOrder.address || {};
  const shops = activeOrder.shops || [{ id: 101, name: items[0]?.shopName || 'Sri Lakshmi General Store' }];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={toastStyle}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Page Header Card */}
      <div style={headerBannerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={headerIconWrapStyle}>
            <Truck size={24} style={{ color: '#7C3AED' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                Active Delivery — Order #{orderId}
              </h1>
              {isMultiShop && (
                <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.725rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                  <Layers size={11} style={{ marginRight: '3px' }} /> MULTI-SHOP
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '2px', margin: 0 }}>
              Complete your assigned delivery step by step.
            </p>
          </div>
        </div>

        {/* Current Status Badge */}
        <span style={getStatusBadgeStyle(stage)}>
          {stage === 1 && '● ASSIGNED / PICKUP'}
          {stage === 2 && '● PICKED UP'}
          {stage === 3 && '● OUT FOR DELIVERY'}
          {stage === 4 && '✓ DELIVERED'}
        </span>
      </div>

      {/* STEPPER PROGRESS TRACKER */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
            Delivery Progress Tracker
          </span>
        </div>

        <div style={{ padding: '1.25rem' }}>
          <div style={stepperWrapperStyle}>
            {/* Step 1: Assigned */}
            <div style={stepItemStyle(stage >= 1)}>
              <div style={stepCircleStyle(stage >= 1)}>
                {stage >= 1 ? <Check size={14} /> : 1}
              </div>
              <div style={stepLabelWrapStyle}>
                <span style={stepTitleStyle(stage >= 1)}>Assigned</span>
                <span style={stepSubStyle}>
                  {formatTime(activeOrder.assignedAt || activeOrder.createdAt) || 'Confirmed'}
                </span>
              </div>
            </div>

            <div style={stepLineStyle(stage >= 2)} />

            {/* Step 2: Picked Up */}
            <div style={stepItemStyle(stage >= 2)}>
              <div style={stepCircleStyle(stage >= 2)}>
                {stage >= 2 ? <Check size={14} /> : 2}
              </div>
              <div style={stepLabelWrapStyle}>
                <span style={stepTitleStyle(stage >= 2)}>Picked Up</span>
                <span style={stepSubStyle}>
                  {formatTime(activeOrder.pickedUpAt) || (stage === 1 ? 'Pending pickup' : 'Done')}
                </span>
              </div>
            </div>

            <div style={stepLineStyle(stage >= 3)} />

            {/* Step 3: Out for Delivery */}
            <div style={stepItemStyle(stage >= 3)}>
              <div style={stepCircleStyle(stage >= 3)}>
                {stage >= 3 ? <Check size={14} /> : 3}
              </div>
              <div style={stepLabelWrapStyle}>
                <span style={stepTitleStyle(stage >= 3)}>Out for Delivery</span>
                <span style={stepSubStyle}>
                  {formatTime(activeOrder.outForDeliveryAt) || (stage < 3 ? 'Pending' : 'In Transit')}
                </span>
              </div>
            </div>

            <div style={stepLineStyle(stage >= 4)} />

            {/* Step 4: Delivered */}
            <div style={stepItemStyle(stage >= 4)}>
              <div style={stepCircleStyle(stage >= 4)}>
                {stage >= 4 ? <Check size={14} /> : 4}
              </div>
              <div style={stepLabelWrapStyle}>
                <span style={stepTitleStyle(stage >= 4)}>Delivered</span>
                <span style={stepSubStyle}>
                  {formatTime(activeOrder.deliveredAt) || 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID: Pickup Details & Delivery Address */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
        {/* PICKUP DETAILS CARD */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
              <Store size={18} style={{ color: 'var(--color-primary)' }} />
              <span>Pickup Details ({shops.length} Store{shops.length > 1 ? 's' : ''})</span>
            </div>
            {stage >= 2 && (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                ✓ Picked Up
              </span>
            )}
          </div>

          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {shops.map((shop, idx) => (
              <div key={shop.id || idx} style={shopBoxStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Building size={18} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                      {shop.name}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#6B7280', marginTop: '2px' }}>
                      Bengaluru, Karnataka
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Checklist Preview */}
            <div style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '10px 12px', border: '1px solid #E5E7EB', fontSize: '0.825rem', color: '#4B5563' }}>
              <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>Pickup Check:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} style={{ color: stage >= 2 ? '#10B981' : '#9CA3AF' }} />
                <span>Verify item quantities and shop packaging before departure.</span>
              </div>
            </div>

            {/* Stage 1 CTA: Mark as Picked Up */}
            {stage === 1 && (
              <button
                onClick={handleMarkPickedUp}
                disabled={isUpdating}
                style={primaryActionBtnStyle}
              >
                {isUpdating ? (
                  <ButtonLoader size={16} color="#FFFFFF" text="Marking as Picked Up..." />
                ) : (
                  'Mark as Picked Up'
                )}
              </button>
            )}
          </div>
        </div>

        {/* DELIVERY DESTINATION CARD */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
              <MapPin size={18} style={{ color: '#E11D48' }} />
              <span>Deliver To</span>
            </div>
            {stage === 3 && (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#F5F3FF', color: '#7C3AED', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                OUT FOR DELIVERY
              </span>
            )}
          </div>

          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-text)' }}>
                {address.fullName || 'Customer Destination'}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, marginTop: '4px' }}>
                {address.addressLine1 || 'Customer Address'}, {address.city || 'Bengaluru'}, {address.state || 'Karnataka'} - {address.pincode || ''}
              </div>
            </div>

            {/* Call Customer Action */}
            {address.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <a
                  href={`tel:${address.phone}`}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Phone size={15} />
                  Call Customer (+91 {address.phone})
                </a>
              </div>
            )}

            {/* Stage 2 CTA: Start Delivery */}
            {stage === 2 && (
              <button
                onClick={handleStartDelivery}
                disabled={isUpdating}
                style={{ ...primaryActionBtnStyle, backgroundColor: '#7C3AED' }}
              >
                {isUpdating ? (
                  <ButtonLoader size={16} color="#FFFFFF" text="Starting Delivery..." />
                ) : (
                  'Start Delivery'
                )}
              </button>
            )}

            {/* Stage 3 CTA: Mark as Delivered */}
            {stage === 3 && (
              <button
                onClick={() => setIsCompletionModalOpen(true)}
                disabled={isUpdating}
                style={{ ...primaryActionBtnStyle, backgroundColor: '#10B981' }}
              >
                Mark as Delivered
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ORDER ITEMS SUMMARY CARD */}
      <div style={{ ...cardStyle, marginTop: '1.25rem' }}>
        <div style={cardHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
            <Package size={18} style={{ color: '#0284C7' }} />
            <span>Order Items Summary ({items.length} product{items.length === 1 ? '' : 's'})</span>
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#059669' }}>
            Total Value: ₹{activeOrder.pricing?.finalTotal || activeOrder.pricing?.total || 0}
          </span>
        </div>

        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: idx < items.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.image ? (
                    <img
                      src={normalizeImageUrl(item.image, 'product')}
                      alt={item.name}
                      onError={(e) => handleImageError(e, 'product')}
                      style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                      <Package size={20} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                      Qty: {item.quantity} • {item.shopName || 'Local Store'}
                    </div>
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                  ₹{(item.price || 0) * (item.quantity || 1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DELIVERY COMPLETION CONFIRMATION MODAL ───────────────── */}
      {isCompletionModalOpen && (
        <div style={modalBackdropStyle} onClick={() => setIsCompletionModalOpen(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                Complete Delivery?
              </h3>
              <button
                onClick={() => setIsCompletionModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle size={26} />
              </div>

              <p style={{ fontSize: '0.9rem', color: '#4B5563', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                Are you sure this order (<strong>#{orderId}</strong>) has been delivered to the customer at {address.addressLine1 || 'the destination'}?
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => setIsCompletionModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCompletion}
                  disabled={isUpdating}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  {isUpdating ? (
                    <ButtonLoader size={16} color="#FFFFFF" text="Completing..." />
                  ) : (
                    'Confirm Delivery'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable Styles ─────────────────────────────────────────────
const headerBannerStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '1.25rem 1.5rem',
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  marginBottom: '1.25rem',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
};

const headerIconWrapStyle = {
  width: '46px',
  height: '46px',
  borderRadius: '12px',
  backgroundColor: '#F5F3FF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const getStatusBadgeStyle = (stage) => ({
  backgroundColor: stage === 4 ? '#DCFCE7' : stage === 3 ? '#F5F3FF' : '#FEF3C7',
  color: stage === 4 ? '#15803D' : stage === 3 ? '#7C3AED' : '#D97706',
  border: `1px solid ${stage === 4 ? '#86EFAC' : stage === 3 ? '#DDD6FE' : '#FDE68A'}`,
  fontSize: '0.8rem',
  fontWeight: 800,
  padding: '4px 12px',
  borderRadius: '20px',
});

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
  padding: '0.875rem 1.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const stepperWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '8px',
};

const stepItemStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  opacity: active ? 1 : 0.6,
});

const stepCircleStyle = (active) => ({
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: active ? 'var(--color-primary)' : '#E5E7EB',
  color: active ? '#FFFFFF' : '#6B7280',
  fontWeight: 800,
  fontSize: '0.78rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const stepLabelWrapStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const stepTitleStyle = (active) => ({
  fontSize: '0.825rem',
  fontWeight: active ? 800 : 600,
  color: active ? 'var(--color-text)' : '#6B7280',
});

const stepSubStyle = {
  fontSize: '0.725rem',
  color: '#9CA3AF',
};

const stepLineStyle = (active) => ({
  flex: 1,
  height: '2px',
  backgroundColor: active ? 'var(--color-primary)' : '#E5E7EB',
  minWidth: '16px',
});

const shopBoxStyle = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  padding: '10px 12px',
  borderRadius: '10px',
};

const primaryActionBtnStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: 'var(--color-primary)',
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: '0.9rem',
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

const toastStyle = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  zIndex: 9999,
  backgroundColor: '#10B981',
  color: '#FFFFFF',
  padding: '12px 20px',
  borderRadius: '8px',
  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: 600,
  fontSize: '14px',
};

const modalBackdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
  padding: '1rem',
};

const modalContentStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '420px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  overflow: 'hidden',
};

const modalHeaderStyle = {
  padding: '1rem 1.25rem',
  borderBottom: '1px solid #E5E7EB',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#F9FAFB',
};
