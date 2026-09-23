// src/pages/admin/AdminUsersPage.jsx
// Module 30 — Admin User Management Page
// Connects to the real Spring Boot backend API for user data.

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  Clock,
  ThumbsUp,
  ThumbsDown,
  Trash2,
} from 'lucide-react';
import {
  getAllUsers,
  approveUser,
  rejectUser,
  deleteAdminUser,
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

const APPROVAL_BADGE = {
  PENDING: { bg: '#FFF8E1', color: '#F57F17', border: '1px solid #FFE082', label: 'Pending Approval' },
  APPROVED: { bg: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9', label: 'Approved' },
  REJECTED: { bg: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2', label: 'Rejected' },
};

const PAGE_SIZE = 10;

const AdminUsersPage = () => {
  const { user: authUser } = useAuth();

  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [approvalFilter, setApprovalFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Toast State
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'approve'|'reject', user }
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'

  // ── Load users from real backend API ──
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getAllUsers();
      setUsersList(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err?.message || 'Failed to load users. Please try again.');
      setUsersList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Clear toast after 4s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, approvalFilter, sortOption]);

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

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
          (u.id && String(u.id).includes(q))
      );
    }

    // 2. Role Filter
    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.role === roleFilter);
    }

    // 3. Approval Status Filter
    if (approvalFilter !== 'ALL') {
      result = result.filter((u) => u.accountStatus === approvalFilter);
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortOption === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortOption === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortOption === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      return 0;
    });

    return result;
  }, [usersList, searchQuery, roleFilter, approvalFilter, sortOption]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedUsers.length / PAGE_SIZE));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedUsers.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedUsers, currentPage]);

  // ── Approve Action ──
  const handleConfirmApprove = async () => {
    if (!confirmAction || isActionLoading) return;
    setIsActionLoading(true);
    try {
      const updated = await approveUser(confirmAction.user.id);
      setUsersList((prev) =>
        prev.map((u) => (u.id === confirmAction.user.id ? { ...u, ...updated } : u))
      );
      showToast(`${confirmAction.user.name} has been approved successfully.`, 'success');
    } catch (err) {
      showToast(err?.message || 'Failed to approve user. Please try again.', 'error');
    } finally {
      setIsActionLoading(false);
      setConfirmAction(null);
    }
  };

  // ── Reject Action ──
  const handleConfirmReject = async () => {
    if (!confirmAction || isActionLoading) return;
    setIsActionLoading(true);
    try {
      const updated = await rejectUser(confirmAction.user.id);
      setUsersList((prev) =>
        prev.map((u) => (u.id === confirmAction.user.id ? { ...u, ...updated } : u))
      );
      showToast(`${confirmAction.user.name} has been rejected.`, 'success');
    } catch (err) {
      showToast(err?.message || 'Failed to reject user. Please try again.', 'error');
    } finally {
      setIsActionLoading(false);
      setConfirmAction(null);
    }
  };

  // ── Delete Action ──
  const handleConfirmDelete = async () => {
    if (!userToDelete || isDeleteLoading) return;
    setIsDeleteLoading(true);
    try {
      await deleteAdminUser(userToDelete.id);
      setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
      showToast('Account deleted successfully.', 'success');
      setUserToDelete(null);
      await loadUsers();
    } catch (err) {
      showToast(err?.message || 'Failed to delete account. Please try again.', 'error');
      setUserToDelete(null);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setApprovalFilter('ALL');
    setSortOption('newest');
  };

  const requiresApproval = (u) =>
    u.role === ROLES.SHOP_OWNER || u.role === ROLES.DELIVERY_PARTNER;

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
            background: toastType === 'error' ? '#DC2626' : '#1E293B',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 500,
            maxWidth: '380px',
          }}
        >
          {toastType === 'error' ? (
            <AlertTriangle size={18} color="#FCA5A5" />
          ) : (
            <CheckCircle2 size={18} color="#4ADE80" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0' }}>
            User Management
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            Manage and monitor Locvia platform users. Approve or reject Shop Owner and Delivery Partner accounts.
          </p>
        </div>
        <button
          onClick={loadUsers}
          disabled={isLoading}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--color-border, #CBD5E1)',
            background: '#FFFFFF',
            color: '#334155',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Total Users */}
        <StatCard icon={<Users size={22} />} iconBg="rgba(79,70,229,0.1)" iconColor="#4F46E5" label="Total Users" value={stats.totalUsers} />
        {/* Customers */}
        <StatCard icon={<UserCheck size={22} />} iconBg="rgba(46,125,50,0.1)" iconColor="#2E7D32" label="Customers" value={stats.customers} />
        {/* Shop Owners */}
        <StatCard icon={<Store size={22} />} iconBg="rgba(21,101,192,0.1)" iconColor="#1565C0" label="Shop Owners" value={stats.shopOwners} />
        {/* Delivery Partners */}
        <StatCard icon={<Truck size={22} />} iconBg="rgba(230,81,0,0.1)" iconColor="#E65100" label="Delivery Partners" value={stats.deliveryPartners} />
        {/* Pending Approval */}
        <StatCard icon={<Clock size={22} />} iconBg="rgba(245,127,23,0.1)" iconColor="#F57F17" label="Pending Approval" value={stats.pendingApproval} valueColor="#F57F17" />
        {/* Active Users */}
        <StatCard icon={<CheckCircle2 size={22} />} iconBg="rgba(16,185,129,0.1)" iconColor="#10B981" label="Active Users" value={stats.activeUsers} valueColor="#10B981" />
      </div>

      {/* Error Banner */}
      {loadError && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#DC2626',
            fontSize: '14px',
          }}
        >
          <AlertTriangle size={18} />
          <span>{loadError}</span>
          <button
            onClick={loadUsers}
            style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '6px', border: '1px solid #FCA5A5', background: '#FFFFFF', color: '#DC2626', cursor: 'pointer', fontSize: '13px' }}
          >
            Retry
          </button>
        </div>
      )}

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
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="var(--color-text-muted)" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={selectStyle}>
              <option value="ALL">All Roles</option>
              <option value={ROLES.CUSTOMER}>Customer</option>
              <option value={ROLES.SHOP_OWNER}>Shop Owner</option>
              <option value={ROLES.DELIVERY_PARTNER}>Delivery Partner</option>
              <option value={ROLES.ADMIN}>Admin</option>
            </select>
          </div>

          {/* Approval Status Filter */}
          <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)} style={selectStyle}>
            <option value="ALL">All Approval Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Sort Option */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={15} color="var(--color-text-muted)" />
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={selectStyle}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>

          {(searchQuery || roleFilter !== 'ALL' || approvalFilter !== 'ALL' || sortOption !== 'newest') && (
            <button onClick={handleClearFilters} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#E2E8F0', color: '#475569', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table / Cards View */}
      {isLoading ? (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '20px' }}>
          <TableSkeleton rows={6} columns={7} />
        </div>
      ) : filteredAndSortedUsers.length === 0 ? (
        <div style={{ marginBottom: '24px' }}>
          <EmptyState
            icon={Users}
            title={usersList.length === 0 ? 'No users yet' : 'No matching users found'}
            message={
              usersList.length === 0
                ? 'No user accounts have been created on the platform yet.'
                : 'Try adjusting your search terms or clearing filters.'
            }
            actionLabel={usersList.length > 0 ? 'Clear Filters' : undefined}
            onAction={usersList.length > 0 ? handleClearFilters : undefined}
          />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--color-border, #E2E8F0)', color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Account Status</th>
                  <th style={thStyle}>Joined</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => {
                  const isSelf = authUser?.id === u.id;
                  const roleStyle = ROLE_BADGE_STYLES[u.role] || { background: '#F1F5F9', color: '#475569' };
                  const roleLabel = ROLE_LABELS[u.role] || u.role;
                  const approvalKey = u.accountStatus || 'APPROVED';
                  const approvalStyle = APPROVAL_BADGE[approvalKey] || APPROVAL_BADGE.APPROVED;
                  const isPending = u.accountStatus === 'PENDING';
                  const needsApproval = requiresApproval(u);

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border, #F1F5F9)' }}>
                      {/* User Column */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: isPending ? '#FFF3E0' : '#E2E8F0', color: isPending ? '#E65100' : '#334155', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {getUserInitials(u.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{u.name}</span>
                              {isSelf && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>YOU</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>ID: {u.id}</div>
                          </div>
                        </div>
                      </td>
                      {/* Email */}
                      <td style={{ ...tdStyle, overflowWrap: 'anywhere' }}>{u.email}</td>
                      {/* Phone */}
                      <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{u.phone || 'N/A'}</td>
                      {/* Role Badge */}
                      <td style={tdStyle}>
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, ...roleStyle }}>
                          {roleLabel}
                        </span>
                      </td>
                      {/* Account Status */}
                      <td style={tdStyle}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: approvalStyle.bg, color: approvalStyle.color, border: approvalStyle.border }}>
                          {approvalKey === 'PENDING' && <Clock size={11} />}
                          {approvalKey === 'APPROVED' && <CheckCircle2 size={11} />}
                          {approvalKey === 'REJECTED' && <X size={11} />}
                          {approvalStyle.label}
                        </span>
                      </td>
                      {/* Joined Date */}
                      <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontSize: '13px' }}>{formatJoinedDate(u.createdAt)}</td>
                      {/* Actions */}
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button onClick={() => setSelectedUserForDetails(u)} style={actionBtnStyle('#FFFFFF', '#334155', '1px solid #CBD5E1')}>
                            <Eye size={13} /> Details
                          </button>
                          <button
                            onClick={() => setUserToDelete(u)}
                            disabled={isDeleteLoading || isActionLoading}
                            style={actionBtnStyle('#FEF2F2', '#DC2626', '1px solid #FECACA')}
                            title="Delete this account"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                          {needsApproval && !isSelf && (
                            <>
                              {isPending || u.accountStatus === 'REJECTED' ? (
                                <button
                                  onClick={() => setConfirmAction({ type: 'approve', user: u })}
                                  style={actionBtnStyle('#ECFDF5', '#047857', '1px solid #6EE7B7')}
                                  title="Approve this account"
                                >
                                  <ThumbsUp size={13} /> Approve
                                </button>
                              ) : null}
                              {isPending || u.accountStatus === 'APPROVED' ? (
                                <button
                                  onClick={() => setConfirmAction({ type: 'reject', user: u })}
                                  style={actionBtnStyle('#FEF2F2', '#DC2626', '1px solid #FECACA')}
                                  title="Reject this account"
                                >
                                  <ThumbsDown size={13} /> Reject
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid View */}
          <div className="hide-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            {paginatedUsers.map((u) => {
              const isSelf = authUser?.id === u.id;
              const roleStyle = ROLE_BADGE_STYLES[u.role] || { background: '#F1F5F9', color: '#475569' };
              const roleLabel = ROLE_LABELS[u.role] || u.role;
              const approvalKey = u.accountStatus || 'APPROVED';
              const approvalStyle = APPROVAL_BADGE[approvalKey] || APPROVAL_BADGE.APPROVED;
              const isPending = u.accountStatus === 'PENDING';
              const needsApproval = requiresApproval(u);

              return (
                <div key={u.id} style={{ background: 'var(--color-surface, #FFFFFF)', border: `1px solid ${isPending ? '#FFE082' : 'var(--color-border, #E2E8F0)'}`, borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isPending ? '#FFF3E0' : '#E2E8F0', color: isPending ? '#E65100' : '#334155', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getUserInitials(u.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '14px' }}>
                          {u.name} {isSelf && <span style={{ fontSize: '10px', color: '#92400E', background: '#FEF3C7', padding: '1px 4px', borderRadius: '4px' }}>YOU</span>}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>ID: {u.id}</span>
                      </div>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, ...roleStyle }}>{roleLabel}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '14px' }}>
                    <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Email</span><span style={{ color: 'var(--color-text)', wordBreak: 'break-all' }}>{u.email}</span></div>
                    <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Phone</span><span>{u.phone || 'N/A'}</span></div>
                    <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Approval</span><span style={{ fontWeight: 600, color: approvalStyle.color }}>{approvalStyle.label}</span></div>
                    <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Joined</span><span style={{ color: 'var(--color-text-muted)' }}>{formatJoinedDate(u.createdAt)}</span></div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => setSelectedUserForDetails(u)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Eye size={13} /> Details
                    </button>
                    <button
                      onClick={() => setUserToDelete(u)}
                      disabled={isDeleteLoading || isActionLoading}
                      style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: 600, cursor: isDeleteLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      title="Delete this account"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                    {needsApproval && !isSelf && (
                      <>
                        {(isPending || u.accountStatus === 'REJECTED') && (
                          <button onClick={() => setConfirmAction({ type: 'approve', user: u })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #6EE7B7', background: '#ECFDF5', color: '#047857', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <ThumbsUp size={13} /> Approve
                          </button>
                        )}
                        {(isPending || u.accountStatus === 'APPROVED') && (
                          <button onClick={() => setConfirmAction({ type: 'reject', user: u })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <ThumbsDown size={13} /> Reject
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface, #FFFFFF)', border: '1px solid var(--color-border, #E2E8F0)', borderRadius: '12px', padding: '12px 18px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Showing <strong>{(currentPage - 1) * PAGE_SIZE + 1}</strong> to <strong>{Math.min(currentPage * PAGE_SIZE, filteredAndSortedUsers.length)}</strong> of <strong>{filteredAndSortedUsers.length}</strong> users
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} style={pageBtnStyle(currentPage === 1)}><ChevronLeft size={16} /></button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((pg) => (
                  <button key={pg} onClick={() => setCurrentPage(pg)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid', borderColor: pg === currentPage ? 'var(--color-primary, #16A34A)' : '#CBD5E1', background: pg === currentPage ? 'var(--color-primary, #16A34A)' : '#FFFFFF', color: pg === currentPage ? '#FFFFFF' : '#334155', fontWeight: pg === currentPage ? 700 : 500, fontSize: '13px', cursor: 'pointer' }}>
                    {pg}
                  </button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} style={pageBtnStyle(currentPage === totalPages)}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── View User Details Modal ── */}
      {selectedUserForDetails && (
        <div style={modalOverlayStyle}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>User Details</h3>
              <button onClick={() => setSelectedUserForDetails(null)} style={{ border: 'none', background: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#4F46E5', color: '#FFFFFF', fontWeight: 700, fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {getUserInitials(selectedUserForDetails.name)}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>{selectedUserForDetails.name}</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, ...ROLE_BADGE_STYLES[selectedUserForDetails.role] }}>{ROLE_LABELS[selectedUserForDetails.role] || selectedUserForDetails.role}</span>
                    {selectedUserForDetails.accountStatus && (
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: APPROVAL_BADGE[selectedUserForDetails.accountStatus]?.bg, color: APPROVAL_BADGE[selectedUserForDetails.accountStatus]?.color }}>
                        {APPROVAL_BADGE[selectedUserForDetails.accountStatus]?.label || selectedUserForDetails.accountStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
                {[
                  ['User ID', selectedUserForDetails.id],
                  ['Email Address', selectedUserForDetails.email],
                  ['Phone Number', selectedUserForDetails.phone || 'N/A'],
                  ['Account Active', selectedUserForDetails.active !== false ? 'Yes' : 'No'],
                  ['Member Since', formatJoinedDate(selectedUserForDetails.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>{label}:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 24px', background: '#F8FAFC', textAlign: 'right' }}>
              <button onClick={() => setSelectedUserForDetails(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Approve / Reject Confirmation Modal ── */}
      {confirmAction && (
        <div style={modalOverlayStyle}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '420px', width: '100%', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: confirmAction.type === 'approve' ? '#ECFDF5' : '#FEF2F2', color: confirmAction.type === 'approve' ? '#047857' : '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px auto' }}>
              {confirmAction.type === 'approve' ? <ThumbsUp size={28} /> : <ThumbsDown size={28} />}
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              {confirmAction.type === 'approve' ? 'Approve Account?' : 'Reject Account?'}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 8px 0', lineHeight: 1.6 }}>
              {confirmAction.type === 'approve'
                ? <>Approving <strong>{confirmAction.user.name}</strong> will allow them to perform their role on the platform.</>
                : <>Rejecting <strong>{confirmAction.user.name}</strong> will block them from operational platform access.</>}
            </p>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 24px 0' }}>Role: {ROLE_LABELS[confirmAction.user.role]}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={confirmAction.type === 'approve' ? handleConfirmApprove : handleConfirmReject}
                disabled={isActionLoading}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: isActionLoading ? '#94A3B8' : confirmAction.type === 'approve' ? '#047857' : '#DC2626', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, cursor: isActionLoading ? 'not-allowed' : 'pointer' }}
              >
                {isActionLoading ? (
                  <ButtonLoader size={16} color="#FFFFFF" text={confirmAction.type === 'approve' ? 'Approving...' : 'Rejecting...'} />
                ) : (
                  confirmAction.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Account Confirmation Modal ── */}
      {userToDelete && (
        <div style={modalOverlayStyle}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '420px', width: '100%', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px auto' }}>
              <Trash2 size={28} />
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              Delete Account?
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 16px 0', lineHeight: 1.6 }}>
              Are you sure you want to permanently delete this account?
            </p>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', marginBottom: '20px', textAlign: 'left', fontSize: '13px' }}>
              <div style={{ marginBottom: '6px', color: '#334155' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>User: </span>
                <strong>{userToDelete.name}</strong>
              </div>
              <div style={{ marginBottom: '6px', color: '#334155', wordBreak: 'break-all' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Email: </span>
                <strong>{userToDelete.email}</strong>
              </div>
              <div style={{ color: '#334155' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Role: </span>
                <strong>{ROLE_LABELS[userToDelete.role] || userToDelete.role}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setUserToDelete(null)}
                disabled={isDeleteLoading}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: '14px', fontWeight: 600, cursor: isDeleteLoading ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleteLoading}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: isDeleteLoading ? '#94A3B8' : '#DC2626', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, cursor: isDeleteLoading ? 'not-allowed' : 'pointer' }}
              >
                {isDeleteLoading ? (
                  <ButtonLoader size={16} color="#FFFFFF" text="Deleting..." />
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Shared Style Constants ──────────────────────────────────────────────────

const thStyle = { padding: '14px 18px', fontWeight: 600 };
const tdStyle = { padding: '14px 18px', color: 'var(--color-text)' };
const selectStyle = {
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-border, #CBD5E1)',
  fontSize: '13px',
  background: 'var(--color-background, #F8FAFC)',
  color: 'var(--color-text)',
  cursor: 'pointer',
};
const actionBtnStyle = (bg, color, border) => ({
  padding: '6px 10px',
  borderRadius: '6px',
  border,
  background: bg,
  color,
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  whiteSpace: 'nowrap',
});
const pageBtnStyle = (disabled) => ({
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid var(--color-border, #CBD5E1)',
  background: '#FFFFFF',
  color: disabled ? '#94A3B8' : '#334155',
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex',
  alignItems: 'center',
});
const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 999,
  background: 'rgba(15, 23, 42, 0.5)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
};

// ── Stat Card Sub-Component ────────────────────────────────────────────────

const StatCard = ({ icon, iconBg, iconColor, label, value, valueColor }) => (
  <div style={{ background: 'var(--color-surface, #FFFFFF)', border: '1px solid var(--color-border, #E2E8F0)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>{label}</span>
      <span style={{ fontSize: '20px', fontWeight: 700, color: valueColor || 'var(--color-text)' }}>{value}</span>
    </div>
  </div>
);

export default AdminUsersPage;
