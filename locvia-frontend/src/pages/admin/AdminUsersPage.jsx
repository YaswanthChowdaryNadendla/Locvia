// src/pages/admin/AdminUsersPage.jsx
// Module 30 — Admin User Management Page

import { useState, useMemo, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Store,
  Truck,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  getAllUsers,
  updateUserStatus,
  calculateUserStats,
  getUserInitials,
  formatJoinedDate,
} from '../../services/adminUserService';
import { ROLES } from '../../data/users';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton, ButtonLoader } from '../../components/common/loaders';

const ROLE_LABELS = {
  [ROLES.CUSTOMER]: 'Customer',
  [ROLES.SHOP_OWNER]: 'Shop Owner',
  [ROLES.DELIVERY_PARTNER]: 'Delivery Partner',
  [ROLES.ADMIN]: 'Admin',
};

const ROLE_BADGE_STYLES = {
  [ROLES.CUSTOMER]: { background: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9' },
  [ROLES.SHOP_OWNER]: { background: '#E3F2FD', color: '#1565C0', border: '1px solid #BBDEFB' },
  [ROLES.DELIVERY_PARTNER]: { background: '#FFF3E0', color: '#E65100', border: '1px solid #FFE0B2' },
  [ROLES.ADMIN]: { background: '#EDE7F6', color: '#512DA8', border: '1px solid #D1C4E9' },
};

const PAGE_SIZE = 10;

const AdminUsersPage = () => {
  const { user: authUser } = useAuth();

  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Toast State
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Load initial users
  useEffect(() => {
    const data = getAllUsers();
    setUsersList(data);
    setIsLoading(false);
  }, []);

  // Clear toast after 3s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, sortOption]);

  // Calculate master stats
  const stats = useMemo(() => calculateUserStats(usersList), [usersList]);

  // Filter & Sort
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...usersList];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q)) ||
          (u.id && u.id.toLowerCase().includes(q))
      );
    }

    // 2. Role Filter
    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.role === roleFilter);
    }

    // 3. Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter((u) => u.status === statusFilter);
    }

    // 4. Sort
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
      return 0;
    });

    return result;
  }, [usersList, searchQuery, roleFilter, statusFilter, sortOption]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedUsers.length / PAGE_SIZE));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedUsers.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedUsers, currentPage]);

  // Status toggle action
  const handleConfirmStatusToggle = async () => {
    if (!userToToggleStatus || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const newStatus = userToToggleStatus.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updated = updateUserStatus(userToToggleStatus.id, newStatus);
      setUsersList(updated);

      const actionText = newStatus === 'ACTIVE' ? 'activated' : 'deactivated';
      setToastMessage(`User ${userToToggleStatus.name} ${actionText} successfully.`);
      setUserToToggleStatus(null);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setSortOption('newest');
  };

  return (
    <div className="admin-users-page" style={{ width: '100%', minWidth: 0 }}>
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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0' }}>
          User Management
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
          Manage and monitor Locvia platform users.
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
        {/* Total Users */}
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
              Total Users
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.totalUsers}
            </span>
          </div>
        </div>

        {/* Customers */}
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
              background: 'rgba(46, 125, 50, 0.1)',
              color: '#2E7D32',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UserCheck size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Customers
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.customers}
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
              Shop Owners
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.shopOwners}
            </span>
          </div>
        </div>

        {/* Delivery Partners */}
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
              Delivery Partners
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.deliveryPartners}
            </span>
          </div>
        </div>

        {/* Active Users */}
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
              Active Users
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#10B981' }}>
              {stats.activeUsers}
            </span>
          </div>
        </div>

        {/* Inactive Users */}
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
            <UserX size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Inactive Users
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#EF4444' }}>
              {stats.inactiveUsers}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
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
            placeholder="Search by name, email, phone, or ID..."
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
            width: 'auto',
          }}
        >
          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="var(--color-text-muted)" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
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
              <option value="ALL">All Roles</option>
              <option value={ROLES.CUSTOMER}>Customer</option>
              <option value={ROLES.SHOP_OWNER}>Shop Owner</option>
              <option value={ROLES.DELIVERY_PARTNER}>Delivery Partner</option>
              <option value={ROLES.ADMIN}>Admin</option>
            </select>
          </div>

          {/* Status Filter */}
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
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
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
            </select>
          </div>

          {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL' || sortOption !== 'newest') && (
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

      {/* Main Table / Cards View */}
      {isLoading ? (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '20px' }} aria-busy="true" aria-label="Loading users">
          <TableSkeleton rows={6} columns={6} />
        </div>
      ) : filteredAndSortedUsers.length === 0 ? (
        <div style={{ marginBottom: '24px' }}>
          <EmptyState
            icon={Users}
            title={usersList.length === 0 ? 'No users yet' : 'No matching users found'}
            message={
              usersList.length === 0
                ? 'No user accounts have been created on the platform yet.'
                : 'Try adjusting your search terms or clearing role and status filters.'
            }
            actionLabel={usersList.length > 0 ? 'Clear Filters' : undefined}
            onAction={usersList.length > 0 ? handleClearFilters : undefined}
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
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>User</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Phone</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Joined</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => {
                  const isSelf = authUser?.id === u.id;
                  const roleStyle = ROLE_BADGE_STYLES[u.role] || { background: '#F1F5F9', color: '#475569' };
                  const roleLabel = ROLE_LABELS[u.role] || u.role;
                  const isActive = u.status !== 'INACTIVE';

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--color-border, #F1F5F9)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* User Column */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: '#E2E8F0',
                              color: '#334155',
                              fontWeight: 700,
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {getUserInitials(u.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{u.name}</span>
                              {isSelf && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: '#FEF3C7',
                                    color: '#92400E',
                                    fontWeight: 700,
                                  }}
                                >
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              ID: {u.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 18px', color: 'var(--color-text)', overflowWrap: 'anywhere' }}>
                        {u.email}
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '14px 18px', color: 'var(--color-text-muted)' }}>
                        {u.phone || 'N/A'}
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            ...roleStyle,
                          }}
                        >
                          {roleLabel}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '14px 18px' }}>
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
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: '14px 18px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        {formatJoinedDate(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedUserForDetails(u)}
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

                          <button
                            disabled={isSelf}
                            onClick={() => setUserToToggleStatus(u)}
                            title={isSelf ? 'You cannot deactivate your own account' : ''}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              background: isSelf
                                ? '#E2E8F0'
                                : isActive
                                ? '#FFEBEE'
                                : '#E8F5E9',
                              color: isSelf
                                ? '#94A3B8'
                                : isActive
                                ? '#C62828'
                                : '#2E7D32',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                              opacity: isSelf ? 0.6 : 1,
                            }}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid View (< 768px) */}
          <div
            className="hide-desktop"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              marginBottom: '20px',
            }}
          >
            {paginatedUsers.map((u) => {
              const isSelf = authUser?.id === u.id;
              const roleStyle = ROLE_BADGE_STYLES[u.role] || { background: '#F1F5F9', color: '#475569' };
              const roleLabel = ROLE_LABELS[u.role] || u.role;
              const isActive = u.status !== 'INACTIVE';

              return (
                <div
                  key={u.id}
                  style={{
                    background: 'var(--color-surface, #FFFFFF)',
                    border: '1px solid var(--color-border, #E2E8F0)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Card Top Header */}
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
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: '#E2E8F0',
                          color: '#334155',
                          fontWeight: 700,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getUserInitials(u.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '14px' }}>
                          {u.name} {isSelf && <span style={{ fontSize: '10px', color: '#92400E', background: '#FEF3C7', padding: '1px 4px', borderRadius: '4px' }}>YOU</span>}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          ID: {u.id}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        ...roleStyle,
                      }}
                    >
                      {roleLabel}
                    </span>
                  </div>

                  {/* Card Info Details */}
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
                        Email
                      </span>
                      <span style={{ color: 'var(--color-text)', wordBreak: 'break-all' }}>{u.email}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Phone
                      </span>
                      <span style={{ color: 'var(--color-text)' }}>{u.phone || 'N/A'}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Status
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: isActive ? '#2E7D32' : '#C62828',
                        }}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Joined
                      </span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{formatJoinedDate(u.createdAt)}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      onClick={() => setSelectedUserForDetails(u)}
                      style={{
                        flex: 1,
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
                      View Details
                    </button>

                    <button
                      disabled={isSelf}
                      onClick={() => setUserToToggleStatus(u)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isSelf ? '#E2E8F0' : isActive ? '#FFEBEE' : '#E8F5E9',
                        color: isSelf ? '#94A3B8' : isActive ? '#C62828' : '#2E7D32',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: isSelf ? 'not-allowed' : 'pointer',
                        opacity: isSelf ? 0.6 : 1,
                      }}
                    >
                      {isActive ? 'Deactivate' : 'Activate'}
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
                <strong>{Math.min(currentPage * PAGE_SIZE, filteredAndSortedUsers.length)}</strong> of{' '}
                <strong>{filteredAndSortedUsers.length}</strong> users
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

      {/* ── View User Details Modal ── */}
      {selectedUserForDetails && (
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
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out',
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
                User Details
              </h3>
              <button
                onClick={() => setSelectedUserForDetails(null)}
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

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
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
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getUserInitials(selectedUserForDetails.name)}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                    {selectedUserForDetails.name}
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        ...ROLE_BADGE_STYLES[selectedUserForDetails.role],
                      }}
                    >
                      {ROLE_LABELS[selectedUserForDetails.role] || selectedUserForDetails.role}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: selectedUserForDetails.status !== 'INACTIVE' ? '#E8F5E9' : '#FFEBEE',
                        color: selectedUserForDetails.status !== 'INACTIVE' ? '#2E7D32' : '#C62828',
                      }}
                    >
                      {selectedUserForDetails.status !== 'INACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>User ID:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedUserForDetails.id}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Email Address:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600, wordBreak: 'break-all' }}>{selectedUserForDetails.email}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Phone Number:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedUserForDetails.phone || 'N/A'}</span>
                </div>

                {selectedUserForDetails.shopId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Assigned Shop:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedUserForDetails.shopId}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Member Since:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{formatJoinedDate(selectedUserForDetails.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', background: '#F8FAFC', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedUserForDetails(null)}
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
      {userToToggleStatus && (
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
                background: userToToggleStatus.status === 'ACTIVE' ? '#FEF2F2' : '#ECFDF5',
                color: userToToggleStatus.status === 'ACTIVE' ? '#EF4444' : '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              {userToToggleStatus.status === 'ACTIVE' ? 'Deactivate User?' : 'Activate User?'}
            </h3>

            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Are you sure you want to {userToToggleStatus.status === 'ACTIVE' ? 'deactivate' : 'activate'}{' '}
              <strong>{userToToggleStatus.name}</strong>?{' '}
              {userToToggleStatus.status === 'ACTIVE'
                ? 'This user will no longer be active on the platform.'
                : 'This user will regain active access to the platform.'}
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setUserToToggleStatus(null)}
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
                  background: isUpdatingStatus ? '#94A3B8' : userToToggleStatus.status === 'ACTIVE' ? '#DC2626' : '#16A34A',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isUpdatingStatus ? 'not-allowed' : 'pointer',
                }}
              >
                {isUpdatingStatus ? (
                  <ButtonLoader size={16} color="#FFFFFF" text="Updating..." />
                ) : (
                  userToToggleStatus.status === 'ACTIVE' ? 'Deactivate' : 'Activate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
