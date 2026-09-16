// src/pages/admin/AdminCategoriesPage.jsx
// Module 32 — Admin Category Management Page

import { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Package,
  PackageX,
  Search,
  Filter,
  Plus,
  Edit2,
  Eye,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  getAllCategories,
  addCategory,
  updateCategory,
  updateCategoryStatus,
  calculateCategoryStats,
  getCategoryInitials,
} from '../../services/adminCategoryService';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton, ButtonLoader } from '../../components/common/loaders';

const PAGE_SIZE = 10;

const AdminCategoriesPage = () => {
  const [categoriesList, setCategoriesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Toast State
  const [selectedCategoryForDetails, setSelectedCategoryForDetails] = useState(null);
  const [categoryToEdit, setCategoryToEdit] = useState(null); // null = add, obj = edit
  const [showCategoryFormModal, setShowCategoryFormModal] = useState(false);
  const [categoryToToggleStatus, setCategoryToToggleStatus] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Form Modal Fields & Errors
  const [formName, setFormName] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formError, setFormError] = useState('');

  // Load categories on mount
  useEffect(() => {
    setCategoriesList(getAllCategories());
    setIsLoading(false);
  }, []);

  // Clear toast after 3s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Master Stats
  const stats = useMemo(() => calculateCategoryStats(categoriesList), [categoriesList]);

  // Filter & Sort
  const filteredCategories = useMemo(() => {
    let result = [...categoriesList];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.slug && c.slug.toLowerCase().includes(q)) ||
          (String(c.id).toLowerCase().includes(q))
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter((c) => c.status === statusFilter);
    }

    return result;
  }, [categoriesList, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCategories.slice(start, start + PAGE_SIZE);
  }, [filteredCategories, currentPage]);

  // Open Form Modal (Add)
  const handleOpenAddModal = () => {
    setCategoryToEdit(null);
    setFormName('');
    setFormImage('');
    setFormStatus('ACTIVE');
    setFormError('');
    setShowCategoryFormModal(true);
  };

  // Open Form Modal (Edit)
  const handleOpenEditModal = (cat) => {
    setCategoryToEdit(cat);
    setFormName(cat.name);
    setFormImage(cat.image || '');
    setFormStatus(cat.status || 'ACTIVE');
    setFormError('');
    setShowCategoryFormModal(true);
  };

  // Submit Form Modal (Add / Edit)
  const handleSaveCategorySubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError('');
    setIsSubmitting(true);

    try {
      if (categoryToEdit) {
        // Edit existing
        const updated = updateCategory(categoryToEdit.id, {
          name: formName,
          image: formImage || null,
          status: formStatus,
        });
        setCategoriesList(updated);
        setToastMessage(`Category "${formName.trim()}" updated successfully.`);
      } else {
        // Add new
        const updated = addCategory({
          name: formName,
          image: formImage || null,
          status: formStatus,
        });
        setCategoriesList(updated);
        setToastMessage(`Category "${formName.trim()}" created successfully.`);
      }

      setShowCategoryFormModal(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status toggle handler
  const handleConfirmStatusToggle = async () => {
    if (!categoryToToggleStatus || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const newStatus = categoryToToggleStatus.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updated = updateCategoryStatus(categoryToToggleStatus.id, newStatus);
      setCategoriesList(updated);

      const actionText = newStatus === 'ACTIVE' ? 'activated' : 'deactivated';
      setToastMessage(`Category "${categoryToToggleStatus.name}" ${actionText} successfully.`);
      setCategoryToToggleStatus(null);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
  };

  return (
    <div className="admin-categories-page" style={{ width: '100%', minWidth: 0 }}>
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
            Category Management
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            Organize and manage product categories across Locvia.
          </p>
        </div>

        {/* Add Category Button */}
        <button
          onClick={handleOpenAddModal}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            background: 'var(--color-primary, #16A34A)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
          }}
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Statistics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Total Categories */}
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
            <Layers size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Total Categories
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.totalCategories}
            </span>
          </div>
        </div>

        {/* Active Categories */}
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
              Active Categories
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#10B981' }}>
              {stats.activeCategories}
            </span>
          </div>
        </div>

        {/* Inactive Categories */}
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
              Inactive Categories
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#EF4444' }}>
              {stats.inactiveCategories}
            </span>
          </div>
        </div>

        {/* Categories With Products */}
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
              {stats.categoriesWithProducts}
            </span>
          </div>
        </div>

        {/* Empty Categories */}
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
              Empty Categories
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.emptyCategories}
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
            placeholder="Search categories by name or slug..."
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

        {/* Status Filter */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
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
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== 'ALL') && (
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
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '20px' }} aria-busy="true" aria-label="Loading categories">
          <TableSkeleton rows={6} columns={5} />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div style={{ marginBottom: '24px' }}>
          <EmptyState
            icon={Layers}
            title={categoriesList.length === 0 ? 'No categories yet' : 'No matching categories found'}
            message={
              categoriesList.length === 0
                ? 'Click "Add Category" above to create your first category.'
                : 'Try adjusting your search query or clearing status filters.'
            }
            actionLabel={categoriesList.length > 0 ? 'Clear Filters' : undefined}
            onAction={categoriesList.length > 0 ? handleClearFilters : undefined}
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
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Slug</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Products</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.map((cat) => {
                  const isActive = cat.status === 'ACTIVE';

                  return (
                    <tr
                      key={cat.id}
                      style={{
                        borderBottom: '1px solid var(--color-border, #F1F5F9)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Category Image & Name */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.name}
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
                                background: '#4F46E5',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {getCategoryInitials(cat.name)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                              {cat.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              ID: {cat.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td style={{ padding: '14px 18px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        <code>{cat.slug}</code>
                      </td>

                      {/* Product Count */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: cat.productCount > 0 ? '#ECFDF5' : '#FEF3C7',
                            color: cat.productCount > 0 ? '#047857' : '#B45309',
                          }}
                        >
                          {cat.productCount} {cat.productCount === 1 ? 'Product' : 'Products'}
                        </span>
                      </td>

                      {/* Status */}
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

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedCategoryForDetails(cat)}
                            style={{
                              padding: '6px 10px',
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
                            onClick={() => handleOpenEditModal(cat)}
                            style={{
                              padding: '6px 10px',
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
                            <Edit2 size={14} />
                            Edit
                          </button>

                          <button
                            onClick={() => setCategoryToToggleStatus(cat)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: isActive ? '#FFEBEE' : '#E8F5E9',
                              color: isActive ? '#C62828' : '#2E7D32',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
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
            {paginatedCategories.map((cat) => {
              const isActive = cat.status === 'ACTIVE';

              return (
                <div
                  key={cat.id}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
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
                            background: '#4F46E5',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getCategoryInitials(cat.name)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '14px' }}>
                          {cat.name}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {cat.slug}
                        </span>
                      </div>
                    </div>

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
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      marginBottom: '14px',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-muted)' }}>Products in Category:</span>
                    <span style={{ fontWeight: 600, color: '#047857' }}>{cat.productCount} Products</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setSelectedCategoryForDetails(cat)}
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
                        gap: '2px',
                      }}
                    >
                      <Eye size={14} />
                      Details
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(cat)}
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
                        gap: '2px',
                      }}
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>

                    <button
                      onClick={() => setCategoryToToggleStatus(cat)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isActive ? '#FFEBEE' : '#E8F5E9',
                        color: isActive ? '#C62828' : '#2E7D32',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
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
                <strong>{Math.min(currentPage * PAGE_SIZE, filteredCategories.length)}</strong> of{' '}
                <strong>{filteredCategories.length}</strong> categories
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

      {/* ── Add / Edit Category Modal ── */}
      {showCategoryFormModal && (
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
                {categoryToEdit ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setShowCategoryFormModal(false)}
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

            {/* Modal Form */}
            <form onSubmit={handleSaveCategorySubmit}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Form Error Banner */}
                {formError && (
                  <div
                    style={{
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#DC2626',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    {formError}
                  </div>
                )}

                {/* Category Name */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    Category Name <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Organic & Healthy Living"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Category Image URL */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    Category Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                    Leave blank to use default fallback icon.
                  </span>
                </div>

                {/* Status */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  background: '#F8FAFC',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowCategoryFormModal(false)}
                  style={{
                    padding: '10px 18px',
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
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSubmitting ? '#94A3B8' : 'var(--color-primary, #16A34A)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmitting ? (
                    <ButtonLoader size={16} color="#FFFFFF" text={categoryToEdit ? 'Saving...' : 'Creating...'} />
                  ) : (
                    categoryToEdit ? 'Save Changes' : 'Create Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Category Details Modal ── */}
      {selectedCategoryForDetails && (
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
                Category Details
              </h3>
              <button
                onClick={() => setSelectedCategoryForDetails(null)}
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

            {/* Modal Body */}
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
                {selectedCategoryForDetails.image ? (
                  <img
                    src={selectedCategoryForDetails.image}
                    alt={selectedCategoryForDetails.name}
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
                      background: '#4F46E5',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getCategoryInitials(selectedCategoryForDetails.name)}
                  </div>
                )}
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                    {selectedCategoryForDetails.name}
                  </h4>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: selectedCategoryForDetails.status === 'ACTIVE' ? '#E8F5E9' : '#FFEBEE',
                      color: selectedCategoryForDetails.status === 'ACTIVE' ? '#2E7D32' : '#C62828',
                    }}
                  >
                    {selectedCategoryForDetails.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Data Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Category ID:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedCategoryForDetails.id}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Slug:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}><code>{selectedCategoryForDetails.slug}</code></span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Products in Category:</span>
                  <span style={{ color: '#047857', fontWeight: 700 }}>{selectedCategoryForDetails.productCount}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', background: '#F8FAFC', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedCategoryForDetails(null)}
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
      {categoryToToggleStatus && (
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
                background: categoryToToggleStatus.status === 'ACTIVE' ? '#FEF2F2' : '#ECFDF5',
                color: categoryToToggleStatus.status === 'ACTIVE' ? '#EF4444' : '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              {categoryToToggleStatus.status === 'ACTIVE' ? 'Deactivate Category?' : 'Activate Category?'}
            </h3>

            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Are you sure you want to {categoryToToggleStatus.status === 'ACTIVE' ? 'deactivate' : 'activate'}{' '}
              <strong>{categoryToToggleStatus.name}</strong>?{' '}
              {categoryToToggleStatus.status === 'ACTIVE'
                ? 'Products in this category may be affected in customer-facing category browsing.'
                : 'This category will regain active status.'}
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setCategoryToToggleStatus(null)}
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
                  background: isUpdatingStatus ? '#94A3B8' : categoryToToggleStatus.status === 'ACTIVE' ? '#DC2626' : '#16A34A',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isUpdatingStatus ? 'not-allowed' : 'pointer',
                }}
              >
                {isUpdatingStatus ? (
                  <ButtonLoader size={16} color="#FFFFFF" text="Updating..." />
                ) : (
                  categoryToToggleStatus.status === 'ACTIVE' ? 'Deactivate' : 'Activate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
