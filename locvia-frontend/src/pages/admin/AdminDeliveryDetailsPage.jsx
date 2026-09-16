// src/pages/admin/AdminDeliveryDetailsPage.jsx
// Detailed Admin Delivery Inspection Page (Module 34)

import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UserCheck,
  User,
  MapPin,
  Store,
  CheckCircle,
  Phone,
  Mail,
  AlertCircle,
  Package,
} from 'lucide-react';
import { getDeliveryDetails, formatINR } from '../../services/adminDeliveryService';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import EmptyState from '../../components/common/EmptyState';

const AdminDeliveryDetailsPage = () => {
  const { deliveryId } = useParams();
  const navigate = useNavigate();

  // Fetch delivery details
  const delivery = useMemo(() => {
    return getDeliveryDetails(deliveryId);
  }, [deliveryId]);

  // Invalid Delivery ID Fallback
  if (!delivery) {
    return (
      <div style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
        <EmptyState
          icon={AlertCircle}
          title="Delivery Not Found"
          message={`The requested delivery record "${deliveryId}" does not exist or has been removed.`}
          actionLabel="Back to Delivery Management"
          onAction={() => navigate('/admin/delivery')}
        />
      </div>
    );
  }

  // Delivery Timeline stages
  const timelineStages = [
    { key: 'ASSIGNED', title: 'Assigned', time: delivery.assignedAt },
    { key: 'PICKED_UP', title: 'Picked Up', time: delivery.pickedUpAt },
    { key: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', time: delivery.outForDeliveryAt },
    { key: 'DELIVERED', title: 'Delivered', time: delivery.deliveredAt },
  ];

  const getStageStatus = (stageKey) => {
    const statusOrder = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIdx = statusOrder.indexOf(delivery.orderStatus);
    const stageIdx = statusOrder.indexOf(stageKey);

    if (currentIdx > stageIdx || delivery.orderStatus === 'DELIVERED') return 'COMPLETED';
    if (currentIdx === stageIdx) return 'CURRENT';
    return 'PENDING';
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="badge badge-success">DELIVERED</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="badge badge-primary">OUT FOR DELIVERY</span>;
      case 'PICKED_UP':
      case 'PICKUP':
        return <span className="badge badge-secondary">PICKED UP</span>;
      case 'ASSIGNED':
        return <span className="badge badge-info">ASSIGNED</span>;
      default:
        return <span className="badge badge-warning">{status}</span>;
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/delivery')}
        className="btn btn-sm btn-ghost"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem', color: '#64748b' }}
      >
        <ArrowLeft size={16} /> Back to Delivery Management
      </button>

      {/* Title Header */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {delivery.deliveryId}
            </h1>
            {renderStatusBadge(delivery.orderStatus)}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Associated Order ID: <strong>#{delivery.orderId}</strong>
          </p>
        </div>

        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>
          <div>Placed: {delivery.createdAt ? new Date(delivery.createdAt).toLocaleString('en-IN') : 'N/A'}</div>
          <div>Payment: <strong style={{ color: '#059669' }}>{delivery.paymentStatus} ({delivery.paymentMethod})</strong></div>
        </div>
      </div>

      {/* Grid Layout for Partner, Customer, Pickup & Destination */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* Delivery Partner Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#059669' }}>
            <UserCheck size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
              Delivery Partner
            </h3>
          </div>

          {delivery.partner ? (
            <div>
              <h4 style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                {delivery.partner.name}
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>Partner ID: {delivery.partner.id}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem', color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} style={{ color: '#64748b' }} />
                  <span>{delivery.partner.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={14} style={{ color: '#64748b' }} />
                  <span>{delivery.partner.email}</span>
                </div>
              </div>

              {delivery.partnerPerformance && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    display: 'flex',
                    justify: 'space-around',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Completed</span>
                    <strong style={{ color: '#10b981' }}>{delivery.partnerPerformance.completedCount}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Total Assigned</span>
                    <strong>{delivery.partnerPerformance.totalAssigned}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Completion Rate</span>
                    <strong style={{ color: '#059669' }}>{delivery.partnerPerformance.completionRate}</strong>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '6px', color: '#92400e', fontSize: '0.9rem' }}>
              <AlertCircle size={18} style={{ display: 'inline', marginRight: '0.35rem' }} />
              <strong>Unassigned Delivery</strong>
              <p style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                No delivery partner has accepted this request yet.
              </p>
            </div>
          )}
        </div>

        {/* Customer Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#3b82f6' }}>
            <User size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
              Customer Information
            </h3>
          </div>

          <h4 style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1e293b', marginBottom: '0.25rem' }}>
            {delivery.customer.name}
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>User ID: {delivery.customer.userId}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem', color: '#334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={14} style={{ color: '#64748b' }} />
              <span>{delivery.customer.phone}</span>
            </div>
          </div>
        </div>

        {/* Pickup Information Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#6366f1' }}>
            <Store size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
              Pickup Shop(s)
            </h3>
          </div>

          {delivery.shops.map((shop, idx) => (
            <div key={idx} style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: idx < delivery.shops.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <h4 style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e293b', margin: 0 }}>
                {shop.name}
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                Pickup Address: Registered Merchant Location ({delivery.address.city || 'Bengaluru'})
              </p>
            </div>
          ))}
        </div>

        {/* Historical Delivery Destination Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#ef4444' }}>
            <MapPin size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
              Historical Delivery Destination
            </h3>
          </div>

          <p style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e293b', marginBottom: '0.35rem' }}>
            {delivery.address.fullName || delivery.customer.name}
          </p>
          <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.4' }}>
            <div>{delivery.address.addressLine1 || delivery.address.line1 || 'N/A'}</div>
            {delivery.address.addressLine2 && <div>{delivery.address.addressLine2}</div>}
            <div>
              {delivery.address.city}, {delivery.address.state} {delivery.address.pincode || delivery.address.zipCode}
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
              Phone: <strong>{delivery.address.phone || 'N/A'}</strong> | Type: <strong>{delivery.address.type || 'Home'}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Delivery Lifecycle Timeline */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.25rem' }}>
          Delivery Lifecycle Progress
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', position: 'relative' }}>
          {timelineStages.map((stage) => {
            const status = getStageStatus(stage.key);
            const isDone = status === 'COMPLETED';
            const isCurrent = status === 'CURRENT';

            return (
              <div
                key={stage.key}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: isCurrent ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  backgroundColor: isDone ? '#ecfdf5' : isCurrent ? '#eff6ff' : '#f8fafc',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <CheckCircle size={18} style={{ color: isDone ? '#10b981' : isCurrent ? '#3b82f6' : '#cbd5e1' }} />
                  <strong style={{ fontSize: '0.9rem', color: isDone ? '#065f46' : isCurrent ? '#1e40af' : '#64748b' }}>
                    {stage.title}
                  </strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {stage.time ? new Date(stage.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order & Multi-Shop Products Breakdown */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.25rem' }}>
          Order Items & Pricing Summary
        </h3>

        {Object.entries(delivery.groupedItems).map(([shopName, items]) => (
          <div key={shopName} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
              <Store size={16} style={{ color: '#6366f1' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#334155', margin: 0 }}>
                {shopName}
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {item.image ? (
                      <img
                        src={normalizeImageUrl(item.image, 'product')}
                        alt={item.name}
                        onError={(e) => handleImageError(e, 'product')}
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={20} style={{ color: '#94a3b8' }} />
                      </div>
                    )}
                    <div>
                      <strong style={{ color: '#1e293b', display: 'block' }}>{item.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Qty: {item.quantity} × {formatINR(item.price)}</span>
                    </div>
                  </div>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Pricing Total Summary */}
        <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#475569', marginBottom: '0.35rem' }}>
            <span>Items Subtotal</span>
            <span>{formatINR(delivery.pricing.subtotal || delivery.pricing.finalTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#475569', marginBottom: '0.35rem' }}>
            <span>Delivery Fee</span>
            <span>{formatINR(delivery.pricing.deliveryFee || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
            <span>Final Order Total</span>
            <span style={{ color: 'var(--color-primary, #059669)' }}>{formatINR(delivery.pricing.finalTotal || delivery.pricing.subtotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDeliveryDetailsPage;
