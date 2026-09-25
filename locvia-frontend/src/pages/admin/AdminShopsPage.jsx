// src/pages/admin/AdminShopsPage.jsx
// Module 31 — Admin Shop Management Page

import { useState, useMemo, useEffect } from 'react';
import {
  Store,
  CheckCircle2,
  XCircle,
  Users,
  Package,
  PackageX,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Plus,
  Star,
  Clock,
  MapPin,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  getAllShops,
  approveShop,
  removeShop,
  updateShopStatus,
  calculateShopStats,
  getShopInitials,
  getUniqueCities,
} from '../../services/adminShopService';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton, ButtonLoader } from '../../components/common/loaders';

const PAGE_SIZE = 10;

const AdminShopsPage = () => {
  const [shopsList, setShopsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Toast State
  const [selectedShopForDetails, setSelectedShopForDetails] = useState(null);
  const [shopToToggleStatus, setShopToToggleStatus] = useState(null);
  const [shopToRemove, setShopToRemove] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Load shops on mount
  const loadShops = async () => {
    setIsLoading(true);
    try {
      const data = await getAllShops();
      setShopsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load shops:', err);
      setShopsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  // Clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, locationFilter, ratingFilter, sortOption]);

  // Master stats
  const stats = useMemo(() => calculateShopStats(shopsList), [shopsList]);

  // Unique cities list for location filter
  const uniqueCities = useMemo(() => getUniqueCities(shopsList), [shopsList]);

  // Filter & Sort
  const filteredAndSortedShops = useMemo(() => {
    let result = [...shopsList];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (String(s.id).toLowerCase().includes(q)) ||
          (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
          (s.ownerId && String(s.ownerId).toLowerCase().includes(q)) ||
          (s.address && s.address.toLowerCase().includes(q)) ||
          (s.city && s.city.toLowerCase().includes(q)) ||
          (s.phone && s.phone.includes(q))
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter((s) => s.status === statusFilter);
    }

    // 3. Location Filter
    if (locationFilter !== 'ALL') {
      result = result.filter((s) => s.city === locationFilter);
    }

    // 4. Rating Filter
    if (ratingFilter !== 'ALL') {
      const minRating = parseFloat(ratingFilter);
      result = result.filter((s) => typeof s.rating === 'number' && s.rating >= minRating);
    }

    // 5. Sort
    result.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortOption === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortOption === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortOption === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortOption === 'rating_high') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortOption === 'rating_low') {
        return (a.rating || 0) - (b.rating || 0);
      }
      if (sortOption === 'products_high') {
        return (b.productCount || 0) - (a.productCount || 0);
      }
      if (sortOption === 'products_low') {
        return (a.productCount || 0) - (b.productCount || 0);
      }
      return 0;
    });

    return result;
  }, [shopsList, searchQuery, statusFilter, locationFilter, ratingFilter, sortOption]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedShops.length / PAGE_SIZE));
  const paginatedShops = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedShops.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedShops, currentPage]);

  // Status toggle handler
  const handleConfirmStatusToggle = async () => {
    if (!shopToToggleStatus || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const newStatus = shopToToggleStatus.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updated = updateShopStatus(shopToToggleStatus.id, newStatus);
      setShopsList(updated);

      const actionText = newStatus === 'ACTIVE' ? 'activated' : 'deactivated';
      setToastMessage(`Shop "${shopToToggleStatus.name}" ${actionText} successfully.`);
      setShopToToggleStatus(null);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Approve pending shop handler
  const handleApproveShop = async (shop) => {
    if (isApproving) return;
    setIsApproving(true);
    try {
      await approveShop(shop.id);
      setShopsList((prev) =>
        prev.map((s) => (String(s.id) === String(shop.id) ? { ...s, status: 'APPROVED', active: true } : s))
      );
      setToastMessage(`Shop "${shop.name}" approved successfully.`);
    } catch (err) {
      console.error('Failed to approve shop:', err);
      setToastMessage(err?.message || 'Failed to approve shop.');
    } finally {
      setIsApproving(false);
    }
  };

  // Remove shop handler
  const handleConfirmRemoveShop = async () => {
    if (!shopToRemove || isRemoving) return;
    setIsRemoving(true);
    try {
      await removeShop(shopToRemove.id);
      setShopsList((prev) => prev.filter((s) => String(s.id) !== String(shopToRemove.id)));
      setToastMessage(`Shop "${shopToRemove.name}" removed successfully.`);
      setShopToRemove(null);
    } catch (err) {
      console.error('Failed to remove shop:', err);
      setToastMessage(err?.message || 'Failed to remove shop.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setLocationFilter('ALL');
    setRatingFilter('ALL');
    setSortOption('newest');
  };

  return (
    <div className="admin-shops-page" style={{ width: '100%', minWidth: 0 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: '#1E293B',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} color="#4ADE80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0' }}>
            Shop Management
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            Manage and monitor shops registered on the Locvia platform.
          </p>
        </div>
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
        {/* Total Shops */}
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
              background: 'rgba(21, 101, 192, 0.1)',
              color: '#1565C0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Store size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Total Shops
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.totalShops}
            </span>
          </div>
        </div>

        {/* Active Shops */}
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
              Active Shops
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#10B981' }}>
              {stats.activeShops}
            </span>
          </div>
        </div>

        {/* Inactive Shops */}
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
              Inactive Shops
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#EF4444' }}>
              {stats.inactiveShops}
            </span>
          </div>
        </div>

        {/* Shop Owners */}
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
            <Users size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Shop Owners
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.shopOwners}
            </span>
          </div>
        </div>

        {/* Shops With Products */}
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
              background: 'rgba(5, 150, 105, 0.1)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Package size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              With Products
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.shopsWithProducts}
            </span>
          </div>
        </div>

        {/* Shops Without Products */}
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
            <PackageX size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Without Products
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.shopsWithoutProducts}
            </span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
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
            placeholder="Search by shop name, ID, owner, city, or phone..."
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
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Location Filter */}
          {uniqueCities.length > 0 && (
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
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
              <option value="ALL">All Locations</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          )}

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
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
            <option value="ALL">All Ratings</option>
            <option value="4.5">4.5★ & above</option>
            <option value="4.0">4.0★ & above</option>
            <option value="3.5">3.5★ & above</option>
          </select>

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
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="rating_high">Highest Rated</option>
              <option value="rating_low">Lowest Rated</option>
              <option value="products_high">Most Products</option>
              <option value="products_low">Least Products</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== 'ALL' || locationFilter !== 'ALL' || ratingFilter !== 'ALL' || sortOption !== 'newest') && (
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

      {/* Main Content Area */}
      {isLoading ? (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '20px' }} aria-busy="true" aria-label="Loading shops">
          <TableSkeleton rows={6} columns={6} />
        </div>
      ) : filteredAndSortedShops.length === 0 ? (
        <div style={{ marginBottom: '24px' }}>
          <EmptyState
            icon={Store}
            title={shopsList.length === 0 ? 'No shops registered yet' : 'No matching shops found'}
            message={
              shopsList.length === 0
                ? 'No shop records have been registered on the platform yet.'
                : 'Try adjusting your search query or clearing location and rating filters.'
            }
            actionLabel={shopsList.length > 0 ? 'Clear Filters' : undefined}
            onAction={shopsList.length > 0 ? handleClearFilters : undefined}
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
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Shop</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Owner</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Location</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Products</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Rating</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Delivery Time</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedShops.map((s) => {
                  const isActive = s.status === 'ACTIVE';

                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: '1px solid var(--color-border, #F1F5F9)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Shop Image / Logo & Name */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {s.image ? (
                            <img
                              src={normalizeImageUrl(s.image, 'shop')}
                              alt={s.name}
                              onError={(e) => handleImageError(e, 'shop')}
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: '1px solid #E2E8F0',
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '8px',
                                background: '#1565C0',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {getShopInitials(s.name)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                              {s.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span>ID: {s.id}</span>
                              <span>•</span>
                              <span style={{ color: '#1565C0', fontWeight: 500 }}>{s.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{s.ownerName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', overflowWrap: 'anywhere' }}>
                          {s.ownerEmail}
                        </div>
                      </td>

                      {/* Location */}
                      <td style={{ padding: '14px 18px', maxWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                          <MapPin size={14} color="var(--color-text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '13px' }}>{s.city}</div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: 'var(--color-text-muted)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '160px',
                              }}
                              title={s.address}
                            >
                              {s.address}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Product Count */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: s.productCount > 0 ? '#ECFDF5' : '#FEF3C7',
                            color: s.productCount > 0 ? '#047857' : '#B45309',
                          }}
                        >
                          {s.productCount} {s.productCount === 1 ? 'Product' : 'Products'}
                        </span>
                      </td>

                      {/* Rating */}
                      <td style={{ padding: '14px 18px' }}>
                        {s.rating ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={14} color="#F59E0B" fill="#F59E0B" />
                            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{s.rating}</span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              ({s.reviewCount})
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Delivery Time */}
                      <td style={{ padding: '14px 18px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} />
                          <span>{s.deliveryTime}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px' }}>
                        {s.status === 'PENDING' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: '#FFFBEB',
                              color: '#B45309',
                              border: '1px solid #FDE68A',
                            }}
                          >
                            <Clock size={12} />
                            Pending Approval
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: isActive ? '#E8F5E9' : '#FFEBEE',
                              color: isActive ? '#2E7D32' : '#C62828',
                              border: isActive ? '1px solid #C8E6C9' : '1px solid #FFCDD2',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: isActive ? '#2E7D32' : '#C62828',
                              }}
                            />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedShopForDetails(s)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid var(--color-border, #CBD5E1)',
                              background: '#FFFFFF',
                              color: '#334155',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Eye size={14} />
                            Details
                          </button>

                          {s.status === 'PENDING' && (
                            <button
                              onClick={() => handleApproveShop(s)}
                              disabled={isApproving}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#E8F5E9',
                                color: '#2E7D32',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: isApproving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <CheckCircle2 size={13} />
                              Approve
                            </button>
                          )}

                          <button
                            onClick={() => setShopToRemove(s)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              background: '#FFEBEE',
                              color: '#C62828',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <XCircle size={13} />
                            Remove
                          </button>
                        </div>
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
            {paginatedShops.map((s) => {
              const isActive = s.status === 'ACTIVE';

              return (
                <div
                  key={s.id}
                  style={{
                    background: 'var(--color-surface, #FFFFFF)',
                    border: '1px solid var(--color-border, #E2E8F0)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Top Shop Info */}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {s.image ? (
                        <img
                          src={normalizeImageUrl(s.image, 'shop')}
                          alt={s.name}
                          onError={(e) => handleImageError(e, 'shop')}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: '#1565C0',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getShopInitials(s.name)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '14px' }}>
                          {s.name}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          ID: {s.id} • {s.category}
                        </span>
                      </div>
                    </div>

                    {s.status === 'PENDING' ? (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: '#FFFBEB',
                          color: '#B45309',
                          border: '1px solid #FDE68A',
                        }}
                      >
                        Pending
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: isActive ? '#E8F5E9' : '#FFEBEE',
                          color: isActive ? '#2E7D32' : '#C62828',
                        }}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>

                  {/* Details Grid */}
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
                        Owner
                      </span>
                      <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{s.ownerName}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        City / Location
                      </span>
                      <span style={{ color: 'var(--color-text)' }}>{s.city}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Products
                      </span>
                      <span style={{ fontWeight: 600, color: '#047857' }}>{s.productCount}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Rating
                      </span>
                      <span style={{ color: 'var(--color-text)' }}>
                        {s.rating ? `★ ${s.rating}` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSelectedShopForDetails(s)}
                      style={{
                        flex: 1,
                        minWidth: '80px',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border, #CBD5E1)',
                        background: '#FFFFFF',
                        color: '#334155',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Eye size={14} />
                      Details
                    </button>

                    {s.status === 'PENDING' && (
                      <button
                        onClick={() => handleApproveShop(s)}
                        disabled={isApproving}
                        style={{
                          flex: 1,
                          minWidth: '80px',
                          padding: '8px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#E8F5E9',
                          color: '#2E7D32',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: isApproving ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={13} />
                        Approve
                      </button>
                    )}

                    <button
                      onClick={() => setShopToRemove(s)}
                      style={{
                        flex: 1,
                        minWidth: '80px',
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#FFEBEE',
                        color: '#C62828',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <XCircle size={13} />
                      Remove
                    </button>
                  </div>
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
                <strong>{Math.min(currentPage * PAGE_SIZE, filteredAndSortedShops.length)}</strong> of{' '}
                <strong>{filteredAndSortedShops.length}</strong> shops
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

      {/* ── View Shop Details Modal ── */}
      {selectedShopForDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                Shop Details
              </h3>
              <button
                onClick={() => setSelectedShopForDetails(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content Body */}
            <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '20px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid #F1F5F9',
                }}
              >
                {selectedShopForDetails.image ? (
                  <img
                    src={normalizeImageUrl(selectedShopForDetails.image, 'shop')}
                    alt={selectedShopForDetails.name}
                    onError={(e) => handleImageError(e, 'shop')}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      border: '1px solid #CBD5E1',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      background: '#1565C0',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getShopInitials(selectedShopForDetails.name)}
                  </div>
                )}
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                    {selectedShopForDetails.name}
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: '#E3F2FD',
                        color: '#1565C0',
                      }}
                    >
                      {selectedShopForDetails.category}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: selectedShopForDetails.status === 'ACTIVE' ? '#E8F5E9' : '#FFEBEE',
                        color: selectedShopForDetails.status === 'ACTIVE' ? '#2E7D32' : '#C62828',
                      }}
                    >
                      {selectedShopForDetails.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Shop ID:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedShopForDetails.id}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Shop Owner:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedShopForDetails.ownerName}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Owner Email:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600, wordBreak: 'break-all' }}>{selectedShopForDetails.ownerEmail}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Phone:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedShopForDetails.phone}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>City / Location:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedShopForDetails.city}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Full Address:</span>
                  <span style={{ color: '#0F172A', fontWeight: 500, textAlign: 'right', maxWidth: '240px' }}>{selectedShopForDetails.address}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Total Products:</span>
                  <span style={{ color: '#047857', fontWeight: 700 }}>{selectedShopForDetails.productCount}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Rating:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>
                    {selectedShopForDetails.rating ? `★ ${selectedShopForDetails.rating} (${selectedShopForDetails.reviewCount} reviews)` : '—'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Delivery Time:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedShopForDetails.deliveryTime}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Opening Hours:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedShopForDetails.openingHours}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', background: '#F8FAFC', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedShopForDetails(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Toggle Confirmation Modal ── */}
      {shopToToggleStatus && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: shopToToggleStatus.status === 'ACTIVE' ? '#FEF2F2' : '#ECFDF5',
                color: shopToToggleStatus.status === 'ACTIVE' ? '#EF4444' : '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              {shopToToggleStatus.status === 'ACTIVE' ? 'Deactivate Shop?' : 'Activate Shop?'}
            </h3>

            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Are you sure you want to {shopToToggleStatus.status === 'ACTIVE' ? 'deactivate' : 'activate'}{' '}
              <strong>{shopToToggleStatus.name}</strong>?{' '}
              {shopToToggleStatus.status === 'ACTIVE'
                ? 'Customers will no longer be able to discover or order from this shop while it is inactive.'
                : 'Customers will be able to discover and place orders from this shop.'}
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShopToToggleStatus(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmStatusToggle}
                disabled={isUpdatingStatus}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isUpdatingStatus ? '#94A3B8' : shopToToggleStatus.status === 'ACTIVE' ? '#DC2626' : '#16A34A',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isUpdatingStatus ? 'not-allowed' : 'pointer',
                }}
              >
                {isUpdatingStatus ? (
                  <ButtonLoader size={16} color="#FFFFFF" text="Updating..." />
                ) : (
                  shopToToggleStatus.status === 'ACTIVE' ? 'Deactivate' : 'Activate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove Shop Confirmation Modal ── */}
      {shopToRemove && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              Remove Shop
            </h3>

            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Are you sure you want to remove this shop?
              <br />
              The Shop Owner will need to register the shop again and receive admin approval.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShopToRemove(null)}
                disabled={isRemoving}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemoveShop}
                disabled={isRemoving}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isRemoving ? 'not-allowed' : 'pointer',
                }}
              >
                {isRemoving ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShopsPage;
