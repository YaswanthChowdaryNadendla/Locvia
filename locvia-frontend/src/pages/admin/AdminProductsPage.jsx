// src/pages/admin/AdminProductsPage.jsx
// Module 32 — Admin Product Management Page

import { useState, useMemo, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  XCircle,
  Layers,
  AlertTriangle,
  Store,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  getAllProducts,
  updateProductStatus,
  calculateProductStats,
  getProductInitials,
} from '../../services/adminProductService';
import { getAllShops } from '../../services/adminShopService';
import { getAllCategories } from '../../services/adminCategoryService';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton, ButtonLoader } from '../../components/common/loaders';

const PAGE_SIZE = 10;

const AdminProductsPage = () => {
  const [productsList, setProductsList] = useState([]);
  const [shopsList, setShopsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [shopFilter, setShopFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Toast State
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);
  const [productToToggleStatus, setProductToToggleStatus] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Load data on mount
  useEffect(() => {
    setProductsList(getAllProducts());
    setShopsList(getAllShops());
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, shopFilter, statusFilter, stockFilter, sortOption]);

  // Master stats
  const stats = useMemo(() => calculateProductStats(productsList), [productsList]);

  // Filter & Sort Products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...productsList];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (String(p.id).toLowerCase().includes(q)) ||
          (p.shopName && p.shopName.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter
    if (categoryFilter !== 'ALL') {
      result = result.filter(
        (p) => p.category && p.category.trim().toLowerCase() === categoryFilter.trim().toLowerCase()
      );
    }

    // 3. Shop Filter
    if (shopFilter !== 'ALL') {
      result = result.filter((p) => String(p.shopId) === String(shopFilter));
    }

    // 4. Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter((p) => p.status === statusFilter);
    }

    // 5. Stock Filter
    if (stockFilter === 'IN_STOCK') {
      result = result.filter((p) => p.stock > 0);
    } else if (stockFilter === 'LOW_STOCK') {
      result = result.filter((p) => p.stock > 0 && p.stock <= 10);
    } else if (stockFilter === 'OUT_OF_STOCK') {
      result = result.filter((p) => p.stock === 0);
    }

    // 6. Sort
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
      if (sortOption === 'price_asc') {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortOption === 'price_desc') {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortOption === 'stock_asc') {
        return (a.stock || 0) - (b.stock || 0);
      }
      if (sortOption === 'stock_desc') {
        return (b.stock || 0) - (a.stock || 0);
      }
      return 0;
    });

    return result;
  }, [productsList, searchQuery, categoryFilter, shopFilter, statusFilter, stockFilter, sortOption]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedProducts.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedProducts, currentPage]);

  // Status toggle handler
  const handleConfirmStatusToggle = async () => {
    if (!productToToggleStatus || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const newStatus = productToToggleStatus.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updated = updateProductStatus(productToToggleStatus.id, newStatus);
      setProductsList(updated);

      const actionText = newStatus === 'ACTIVE' ? 'activated' : 'deactivated';
      setToastMessage(`Product "${productToToggleStatus.name}" ${actionText} successfully.`);
      setProductToToggleStatus(null);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setShopFilter('ALL');
    setStatusFilter('ALL');
    setStockFilter('ALL');
    setSortOption('newest');
  };

  return (
    <div className="admin-products-page" style={{ width: '100%', minWidth: 0 }}>
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
          Product Management
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
          Manage products, categories, pricing and shop inventory across Locvia.
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
        {/* Total Products */}
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
              Total Products
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.totalProducts}
            </span>
          </div>
        </div>

        {/* Active Products */}
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
              Active Products
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#10B981' }}>
              {stats.activeProducts}
            </span>
          </div>
        </div>

        {/* Inactive Products */}
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
              Inactive Products
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#EF4444' }}>
              {stats.inactiveProducts}
            </span>
          </div>
        </div>

        {/* Categories */}
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
              Categories
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.categoriesCount}
            </span>
          </div>
        </div>

        {/* Out of Stock */}
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
            <AlertTriangle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Out of Stock
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#D97706' }}>
              {stats.outOfStockCount}
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
              Shops Offering
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
              {stats.shopsWithProductsCount}
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
            placeholder="Search products by name, ID, shop, or category..."
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
          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="var(--color-text-muted)" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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
              <option value="ALL">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Shop Filter */}
          <select
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
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
            <option value="ALL">All Shops</option>
            {shopsList.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>

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

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
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
            <option value="ALL">All Stock</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock (≤10)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
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
              <option value="price_asc">Price (Low → High)</option>
              <option value="price_desc">Price (High → Low)</option>
              <option value="stock_asc">Stock (Low → High)</option>
              <option value="stock_desc">Stock (High → Low)</option>
            </select>
          </div>

          {(searchQuery || categoryFilter !== 'ALL' || shopFilter !== 'ALL' || statusFilter !== 'ALL' || stockFilter !== 'ALL' || sortOption !== 'newest') && (
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
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '20px' }} aria-busy="true" aria-label="Loading products">
          <TableSkeleton rows={6} columns={6} />
        </div>
      ) : filteredAndSortedProducts.length === 0 ? (
        <div style={{ marginBottom: '24px' }}>
          <EmptyState
            icon={Package}
            title={productsList.length === 0 ? 'No products available' : 'No matching products found'}
            message={
              productsList.length === 0
                ? 'No products have been added to the platform catalog yet.'
                : 'Try adjusting your search query or clearing category and stock filters.'
            }
            actionLabel={productsList.length > 0 ? 'Clear Filters' : undefined}
            onAction={productsList.length > 0 ? handleClearFilters : undefined}
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
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Product</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Shop</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Price / MRP</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Stock</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((p) => {
                  const isActive = p.status === 'ACTIVE';

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--color-border, #F1F5F9)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Product Image & Name */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {p.image ? (
                            <img
                              src={normalizeImageUrl(p.image, 'product')}
                              alt={p.name}
                              onError={(e) => handleImageError(e, 'product')}
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
                                background: '#059669',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {getProductInitials(p.name)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              ID: {p.id} • {p.unit}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Shop Name */}
                      <td style={{ padding: '14px 18px', color: 'var(--color-text)', fontWeight: 500 }}>
                        {p.shopName}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: '#F1F5F9',
                            color: '#334155',
                          }}
                        >
                          {p.category}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>₹{p.price}</span>
                          {p.mrp > p.price && (
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                              ₹{p.mrp}
                            </span>
                          )}
                          {p.discount > 0 && (
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: '#DCFCE7', color: '#15803D' }}>
                              {p.discount}% OFF
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: p.stock > 10 ? '#ECFDF5' : p.stock > 0 ? '#FEF3C7' : '#FEF2F2',
                            color: p.stock > 10 ? '#047857' : p.stock > 0 ? '#B45309' : '#DC2626',
                          }}
                        >
                          {p.stock === 0 ? 'Out of Stock' : `${p.stock} in stock`}
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
                            onClick={() => setSelectedProductForDetails(p)}
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
                            onClick={() => setProductToToggleStatus(p)}
                            style={{
                              padding: '6px 12px',
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
            {paginatedProducts.map((p) => {
              const isActive = p.status === 'ACTIVE';

              return (
                <div
                  key={p.id}
                  style={{
                    background: 'var(--color-surface, #FFFFFF)',
                    border: '1px solid var(--color-border, #E2E8F0)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Top Product Header */}
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
                      {p.image ? (
                        <img
                          src={normalizeImageUrl(p.image, 'product')}
                          alt={p.name}
                          onError={(e) => handleImageError(e, 'product')}
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
                            background: '#059669',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getProductInitials(p.name)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '14px' }}>
                          {p.name}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          ID: {p.id} • {p.unit}
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

                  {/* Product Metadata Grid */}
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
                        Shop
                      </span>
                      <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{p.shopName}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Category
                      </span>
                      <span style={{ color: 'var(--color-text)' }}>{p.category}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Price
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>₹{p.price}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Stock
                      </span>
                      <span style={{ fontWeight: 600, color: p.stock > 0 ? '#047857' : '#DC2626' }}>
                        {p.stock === 0 ? 'Out of stock' : `${p.stock} units`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedProductForDetails(p)}
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
                      onClick={() => setProductToToggleStatus(p)}
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
                <strong>{Math.min(currentPage * PAGE_SIZE, filteredAndSortedProducts.length)}</strong> of{' '}
                <strong>{filteredAndSortedProducts.length}</strong> products
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

      {/* ── View Product Details Modal ── */}
      {selectedProductForDetails && (
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
              maxWidth: '500px',
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
                Product Details
              </h3>
              <button
                onClick={() => setSelectedProductForDetails(null)}
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
                {selectedProductForDetails.image ? (
                  <img
                    src={normalizeImageUrl(selectedProductForDetails.image, 'product')}
                    alt={selectedProductForDetails.name}
                    onError={(e) => handleImageError(e, 'product')}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      border: '1px solid #CBD5E1',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      background: '#059669',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getProductInitials(selectedProductForDetails.name)}
                  </div>
                )}
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                    {selectedProductForDetails.name}
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: '#F1F5F9',
                        color: '#334155',
                      }}
                    >
                      {selectedProductForDetails.category}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: selectedProductForDetails.status === 'ACTIVE' ? '#E8F5E9' : '#FFEBEE',
                        color: selectedProductForDetails.status === 'ACTIVE' ? '#2E7D32' : '#C62828',
                      }}
                    >
                      {selectedProductForDetails.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Product ID:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedProductForDetails.id}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Selling Shop:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedProductForDetails.shopName}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Selling Price:</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>₹{selectedProductForDetails.price}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>MRP:</span>
                  <span style={{ color: '#64748B', textDecoration: 'line-through' }}>₹{selectedProductForDetails.mrp}</span>
                </div>

                {selectedProductForDetails.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Discount:</span>
                    <span style={{ color: '#15803D', fontWeight: 700 }}>{selectedProductForDetails.discount}% OFF</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Unit Size:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedProductForDetails.unit}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Available Stock:</span>
                  <span style={{ color: selectedProductForDetails.stock > 0 ? '#047857' : '#DC2626', fontWeight: 700 }}>
                    {selectedProductForDetails.stock === 0 ? 'Out of stock' : `${selectedProductForDetails.stock} units`}
                  </span>
                </div>

                {selectedProductForDetails.rating && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Rating:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>
                      ★ {selectedProductForDetails.rating} ({selectedProductForDetails.reviewCount} reviews)
                    </span>
                  </div>
                )}

                {selectedProductForDetails.description && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ color: '#64748B', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Description:
                    </span>
                    <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.5, background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
                      {selectedProductForDetails.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', background: '#F8FAFC', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedProductForDetails(null)}
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
      {productToToggleStatus && (
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
                background: productToToggleStatus.status === 'ACTIVE' ? '#FEF2F2' : '#ECFDF5',
                color: productToToggleStatus.status === 'ACTIVE' ? '#EF4444' : '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              {productToToggleStatus.status === 'ACTIVE' ? 'Deactivate Product?' : 'Activate Product?'}
            </h3>

            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Are you sure you want to {productToToggleStatus.status === 'ACTIVE' ? 'deactivate' : 'activate'}{' '}
              <strong>{productToToggleStatus.name}</strong>?{' '}
              {productToToggleStatus.status === 'ACTIVE'
                ? 'This product will no longer appear as active on the platform.'
                : 'This product will regain active listing status.'}
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setProductToToggleStatus(null)}
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
                  background: isUpdatingStatus ? '#94A3B8' : productToToggleStatus.status === 'ACTIVE' ? '#DC2626' : '#16A34A',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isUpdatingStatus ? 'not-allowed' : 'pointer',
                }}
              >
                {isUpdatingStatus ? (
                  <ButtonLoader size={16} color="#FFFFFF" text="Updating..." />
                ) : (
                  productToToggleStatus.status === 'ACTIVE' ? 'Deactivate' : 'Activate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
