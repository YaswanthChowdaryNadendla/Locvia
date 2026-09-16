// src/pages/admin/AdminDeliveryPage.jsx
// Main Admin Delivery Management Page (Module 34)

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  UserCheck,
  CheckCircle,
  Clock,
  Search,
  Eye,
  Store,
  MapPin,
  Phone,
  Mail,
  User,
  ShoppingBag,
} from 'lucide-react';
import {
  getAllDeliveryPartners,
  getAllDeliveryRecords,
  calculateDeliveryStats,
} from '../../services/adminDeliveryService';
import EmptyState from '../../components/common/EmptyState';

const AdminDeliveryPage = () => {
  const navigate = useNavigate();

  // State hooks
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('ALL');

  const [deliverySearch, setDeliverySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Master derived data
  const stats = useMemo(() => calculateDeliveryStats(), []);
  const allPartners = useMemo(() => getAllDeliveryPartners(), []);
  const allRecords = useMemo(() => getAllDeliveryRecords(), []);

  // Filtered Delivery Partners
  const filteredPartners = useMemo(() => {
    return allPartners.filter((p) => {
      const q = partnerSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phone && p.phone.includes(q)) ||
        p.id.toLowerCase().includes(q);

      const matchesFilter =
        partnerFilter === 'ALL' ||
        (partnerFilter === 'AVAILABLE' && p.partnerStatus === 'AVAILABLE') ||
        (partnerFilter === 'UNAVAILABLE' && p.partnerStatus === 'UNAVAILABLE') ||
        (partnerFilter === 'ON_DELIVERY' && p.partnerStatus === 'ON_DELIVERY');

      return matchesSearch && matchesFilter;
    });
  }, [allPartners, partnerSearch, partnerFilter]);

  // Active Deliveries (ASSIGNED, PICKUP, PICKED_UP, OUT_FOR_DELIVERY)
  const activeDeliveries = useMemo(() => {
    return allRecords.filter((r) =>
      ['ASSIGNED', 'PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(r.orderStatus)
    );
  }, [allRecords]);

  // Unassigned Deliveries (READY_FOR_PICKUP, PREPARING, CONFIRMED, PLACED without partner)
  const unassignedDeliveries = useMemo(() => {
    return allRecords.filter(
      (r) =>
        ['READY_FOR_PICKUP', 'PREPARING', 'CONFIRMED', 'PLACED'].includes(r.orderStatus) &&
        !r.deliveryPartnerId
    );
  }, [allRecords]);

  // Filtered & Sorted Delivery Records
  const filteredRecords = useMemo(() => {
    let result = allRecords.filter((r) => {
      const q = deliverySearch.toLowerCase().trim();
      const partnerName = r.partner?.name || '';
      const shopNames = r.shops.map((s) => s.name || '').join(' ');

      const matchesSearch =
        !q ||
        r.deliveryId.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q) ||
        r.customer.name.toLowerCase().includes(q) ||
        partnerName.toLowerCase().includes(q) ||
        shopNames.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' || r.orderStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'PARTNER_AZ') {
        return (a.partner?.name || 'Z').localeCompare(b.partner?.name || 'Z');
      }
      if (sortBy === 'PARTNER_ZA') {
        return (b.partner?.name || 'Z').localeCompare(a.partner?.name || 'Z');
      }
      if (sortBy === 'STATUS') {
        return a.orderStatus.localeCompare(b.orderStatus);
      }
      return 0;
    });

    return result;
  }, [allRecords, deliverySearch, statusFilter, sortBy]);

  // Status Badge Renderer
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
      case 'READY_FOR_PICKUP':
        return <span className="badge badge-warning">READY FOR PICKUP</span>;
      default:
        return <span className="badge badge-ghost">{status}</span>;
    }
  };

  // Partner Availability Badge
  const renderPartnerStatusBadge = (status) => {
    if (status === 'AVAILABLE') {
      return <span className="badge badge-success">Available</span>;
    }
    if (status === 'ON_DELIVERY') {
      return <span className="badge badge-primary">On Delivery</span>;
    }
    return <span className="badge badge-secondary">Offline / Unavailable</span>;
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-main, #1e293b)' }}>
          Delivery Management
        </h1>
        <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.95rem' }}>
          Monitor delivery partners, assignments, and active delivery operations
        </p>
      </div>

      {/* Summary Statistics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-primary, #059669)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Total Partners</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.25rem' }}>{stats.totalPartners}</h3>
            </div>
            <div style={{ backgroundColor: '#ecfdf5', padding: '0.75rem', borderRadius: '50%', color: '#059669' }}>
              <UserCheck size={22} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Available Partners</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.25rem' }}>{stats.availablePartners}</h3>
            </div>
            <div style={{ backgroundColor: '#d1fae5', padding: '0.75rem', borderRadius: '50%', color: '#10b981' }}>
              <User size={22} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Active Deliveries</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.25rem' }}>{stats.activeDeliveries}</h3>
            </div>
            <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '50%', color: '#3b82f6' }}>
              <Truck size={22} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Completed Deliveries</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.25rem' }}>{stats.completedDeliveries}</h3>
            </div>
            <div style={{ backgroundColor: '#ecfdf5', padding: '0.75rem', borderRadius: '50%', color: '#10b981' }}>
              <CheckCircle size={22} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Pending Assignments</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.25rem' }}>{stats.pendingAssignments}</h3>
            </div>
            <div style={{ backgroundColor: '#fffbeb', padding: '0.75rem', borderRadius: '50%', color: '#f59e0b' }}>
              <Clock size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Deliveries Highlight Section ──────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
            Active Operations ({activeDeliveries.length})
          </h2>
        </div>

        {activeDeliveries.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              border: '1px dashed #cbd5e1',
            }}
          >
            <Truck size={40} style={{ color: '#94a3b8', marginBottom: '0.5rem' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#334155' }}>No Active Deliveries</h4>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              There are currently no deliveries in progress.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {activeDeliveries.map((item) => (
              <div
                key={item.deliveryId}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>{item.deliveryId}</span>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>Order #{item.orderId}</h4>
                    </div>
                    {renderStatusBadge(item.orderStatus)}
                  </div>

                  <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <UserCheck size={16} style={{ color: '#059669' }} />
                      <span><strong>Partner:</strong> {item.partner?.name || 'Assigned Partner'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Store size={16} style={{ color: '#6366f1' }} />
                      <span><strong>Shop:</strong> {item.shops.map((s) => s.name).join(', ') || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} style={{ color: '#ef4444' }} />
                      <span><strong>Customer:</strong> {item.customer.name} ({item.address.city || 'Bengaluru'})</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '0.75rem',
                    marginTop: '0.75rem',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Assigned: {item.assignedAt ? new Date(item.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </span>
                  <button
                    onClick={() => navigate(`/admin/delivery/${item.deliveryId}`)}
                    className="btn btn-sm btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Eye size={14} /> Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Unassigned / Available Requests Section ─────────────────── */}
      {unassignedDeliveries.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
            Unassigned Delivery Requests ({unassignedDeliveries.length})
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1rem',
            }}
          >
            {unassignedDeliveries.map((item) => (
              <div
                key={item.deliveryId}
                className="card"
                style={{ padding: '1rem', borderLeft: '4px solid #f59e0b', backgroundColor: '#fffbeb' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>#{item.orderId}</span>
                  <span className="badge badge-warning">UNASSIGNED</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.25rem 0' }}>
                  <strong>Pickup:</strong> {item.shops.map((s) => s.name).join(', ')}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.25rem 0' }}>
                  <strong>Destination:</strong> {item.customer.name} ({item.address.city || 'N/A'})
                </p>
                <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                  <button
                    onClick={() => navigate(`/admin/delivery/${item.deliveryId}`)}
                    className="btn btn-xs btn-outline"
                  >
                    Inspect Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Delivery Partner Directory ───────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
            Delivery Partners Directory ({filteredPartners.length})
          </h2>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search delivery partners..."
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                className="input input-sm"
                style={{ paddingLeft: '2.25rem', width: '100%' }}
              />
            </div>

            {/* Filter buttons */}
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="select select-sm"
              style={{ minWidth: '140px' }}
            >
              <option value="ALL">All Availability</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_DELIVERY">On Delivery</option>
              <option value="UNAVAILABLE">Unavailable / Offline</option>
            </select>
          </div>
        </div>

        {filteredPartners.length === 0 ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <EmptyState
              icon={Truck}
              title="No delivery partners found"
              message="No delivery partners found matching your search or filter criteria."
              actionLabel={partnerSearch || partnerFilter !== 'ALL' ? "Clear Filters" : undefined}
              onAction={partnerSearch || partnerFilter !== 'ALL' ? () => { setPartnerSearch(''); setPartnerFilter('ALL'); } : undefined}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filteredPartners.map((partner) => (
              <div key={partner.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        fontWeight: '700',
                        color: '#334155',
                      }}
                    >
                      {partner.name ? partner.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a', margin: 0 }}>{partner.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {partner.id}</span>
                    </div>
                  </div>
                  {renderPartnerStatusBadge(partner.partnerStatus)}
                </div>

                <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} style={{ color: '#64748b' }} />
                    <span>{partner.phone || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} style={{ color: '#64748b' }} />
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{partner.email}</span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    display: 'flex',
                    justify: 'space-around',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Active</span>
                    <strong style={{ color: '#3b82f6', fontSize: '0.95rem' }}>{partner.activeCount}</strong>
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0' }} />
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Completed</span>
                    <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>{partner.completedCount}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── All Delivery Records Section ─────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
            All Delivery Records ({filteredRecords.length})
          </h2>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search deliveries..."
                value={deliverySearch}
                onChange={(e) => setDeliverySearch(e.target.value)}
                className="input input-sm"
                style={{ paddingLeft: '2.25rem', width: '100%' }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select select-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
            </select>

            {/* Sort options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select select-sm"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="PARTNER_AZ">Partner (A-Z)</option>
              <option value="PARTNER_ZA">Partner (Z-A)</option>
              <option value="STATUS">Delivery Status</option>
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <EmptyState
              icon={ShoppingBag}
              title="No delivery records found"
              message="Try adjusting your search term or active filters."
              actionLabel={deliverySearch || statusFilter !== 'ALL' ? "Clear Filters" : undefined}
              onAction={deliverySearch || statusFilter !== 'ALL' ? () => { setDeliverySearch(''); setStatusFilter('ALL'); setSortBy('NEWEST'); } : undefined}
            />
          </div>
        ) : (
          <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Delivery ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Order ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Partner</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Shop(s)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Assigned / Created</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => (
                  <tr key={r.deliveryId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#3b82f6', fontSize: '0.875rem' }}>
                      {r.deliveryId}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#1e293b', fontSize: '0.875rem' }}>
                      #{r.orderId}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                      {r.partner ? (
                        <div>
                          <strong style={{ color: '#0f172a', display: 'block' }}>{r.partner.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.partner.phone}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', italic: 'true' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                      <div>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{r.customer.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.address.city || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#475569' }}>
                      {r.shops.map((s) => s.name).join(', ') || 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {renderStatusBadge(r.orderStatus)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/admin/delivery/${r.deliveryId}`)}
                        className="btn btn-xs btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDeliveryPage;
