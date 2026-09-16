// src/pages/shop-owner/ShopOwnerInventoryPage.jsx
// Dedicated Inventory Management Page for Shop Owners (Module 22)

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getOwnerShop,
  getOwnerProducts,
  updateOwnerProduct,
} from '../../services/shopOwnerService';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import TableSkeleton from '../../components/common/loaders/TableSkeleton';
import ButtonLoader from '../../components/common/loaders/ButtonLoader';
import EmptyState from '../../components/common/EmptyState';
import {
  LayoutGrid,
  Search,
  AlertTriangle,
  CheckCircle,
  Plus,
  Minus,
  Save,
  Package,
  X,
  Filter,
  TrendingDown,
  Edit3,
  RefreshCw,
} from 'lucide-react';

export default function ShopOwnerInventoryPage() {
  const { user } = useAuth();
  const [ownerShop, setOwnerShop] = useState(null);

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockEdits, setStockEdits] = useState({});
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  // Modal State
  const [modalProduct, setModalProduct] = useState(null);
  const [modalMode, setModalMode] = useState('SET'); // 'SET' | 'ADD' | 'REMOVE'
  const [modalAmount, setModalAmount] = useState('');
  const [modalError, setModalError] = useState('');

  // Load owner's shop on mount
  useEffect(() => {
    getOwnerShop().then(shop => setOwnerShop(shop)).catch(() => setOwnerShop(null));
  }, []);

  const loadProducts = async (targetShopId) => {
    const shopId = targetShopId || ownerShop?.id;
    if (shopId) {
      try {
        const data = await getOwnerProducts(shopId);
        setProducts(data);
        // Initialize edit buffer
        const buffer = {};
        data.forEach((p) => {
          buffer[p.id] = p.stock !== undefined ? p.stock : 0;
        });
        setStockEdits(buffer);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ownerShop?.id) {
      loadProducts(ownerShop.id);
    }
  }, [ownerShop?.id]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Metric summary counts
  const totalProducts = products.length;
  const inStockCount = products.filter((p) => (p.stock || 0) > 10).length;
  const lowStockCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
  const outOfStockCount = products.filter((p) => (p.stock || 0) === 0).length;

  // Categories list
  const categories = ['ALL', ...new Set(products.map((p) => p.category).filter(Boolean))];

  // Inline Quick Stock Handlers
  const handleStockChange = (productId, newVal) => {
    const parsed = Math.max(0, parseInt(newVal, 10) || 0);
    setStockEdits((prev) => ({
      ...prev,
      [productId]: parsed,
    }));
  };

  const handleIncrement = (productId) => {
    const current = stockEdits[productId] !== undefined ? stockEdits[productId] : 0;
    setStockEdits((prev) => ({
      ...prev,
      [productId]: current + 1,
    }));
  };

  const handleDecrement = (productId) => {
    const current = stockEdits[productId] !== undefined ? stockEdits[productId] : 0;
    if (current > 0) {
      setStockEdits((prev) => ({
        ...prev,
        [productId]: current - 1,
      }));
    }
  };

  const handleSaveInlineStock = async (product) => {
    const newStock = stockEdits[product.id];
    if (newStock === undefined || savingId === product.id) return;
    setSavingId(product.id);
    try {
      await updateOwnerProduct(ownerShop.id, product.id, { stock: newStock });
      loadProducts();
      showToast(`Updated stock for "${product.name}" to ${newStock} units.`);
    } catch (err) {
      showToast(err.message || 'Failed to update stock.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  // Modal Handlers
  const openStockModal = (product) => {
    setModalProduct(product);
    setModalMode('SET');
    setModalAmount(String(product.stock || 0));
    setModalError('');
  };

  const closeStockModal = () => {
    setModalProduct(null);
    setModalAmount('');
    setModalError('');
  };

  const handleApplyModalStock = async () => {
    if (!modalProduct || isApplying) return;
    setModalError('');

    const val = parseInt(modalAmount, 10);
    if (isNaN(val) || val < 0) {
      setModalError('Please enter a valid non-negative integer.');
      return;
    }

    let finalStock = modalProduct.stock || 0;
    if (modalMode === 'SET') {
      finalStock = val;
    } else if (modalMode === 'ADD') {
      finalStock += val;
    } else if (modalMode === 'REMOVE') {
      if (val > finalStock) {
        setModalError(`Cannot remove ${val} units. Current stock is only ${finalStock}.`);
        return;
      }
      finalStock -= val;
    }

    setIsApplying(true);
    try {
      await updateOwnerProduct(ownerShop.id, modalProduct.id, { stock: finalStock });
      loadProducts();
      showToast(`Updated "${modalProduct.name}" stock to ${finalStock} units.`);
      closeStockModal();
    } catch (err) {
      setModalError(err.message || 'Failed to update inventory.');
    } finally {
      setIsApplying(false);
    }
  };

  // Filtered Products List
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

    const currentStock = stockEdits[p.id] !== undefined ? stockEdits[p.id] : p.stock || 0;

    let matchesFilter = true;
    if (stockFilter === 'IN_STOCK') matchesFilter = currentStock > 10;
    if (stockFilter === 'LOW_STOCK') matchesFilter = currentStock > 0 && currentStock <= 10;
    if (stockFilter === 'OUT_OF_STOCK') matchesFilter = currentStock === 0;

    return matchesSearch && matchesCategory && matchesFilter;
  });

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
          Inventory Management
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '4px' }}>
          Monitor stock levels and manage item availability for <strong style={{ color: 'var(--color-primary)' }}>{ownerShop.name}</strong>
        </p>
      </div>

      {/* Summary Stat Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: Total Products */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Total Products</div>
              <div style={statValueStyle}>{totalProducts}</div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#E0F2FE', color: '#0284C7' }}>
              <Package size={22} />
            </div>
          </div>
        </div>

        {/* Card 2: In Stock */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>In Stock (&gt;10 units)</div>
              <div style={{ ...statValueStyle, color: '#059669' }}>{inStockCount}</div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#D1FAE5', color: '#059669' }}>
              <CheckCircle size={22} />
            </div>
          </div>
        </div>

        {/* Card 3: Low Stock */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Low Stock (1-10 units)</div>
              <div style={{ ...statValueStyle, color: '#D97706' }}>{lowStockCount}</div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <TrendingDown size={22} />
            </div>
          </div>
        </div>

        {/* Card 4: Out of Stock */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={statLabelStyle}>Out of Stock (0 units)</div>
              <div style={{ ...statValueStyle, color: '#DC2626' }}>{outOfStockCount}</div>
            </div>
            <div style={{ ...iconBoxStyle, backgroundColor: '#FEE2E2', color: '#DC2626' }}>
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockCount > 0 && (
        <div
          style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertTriangle size={24} style={{ color: '#D97706', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.95rem' }}>
              Attention: {lowStockCount} product(s) have low stock (10 or fewer units)!
            </div>
            <div style={{ fontSize: '0.85rem', color: '#B45309', marginTop: '2px' }}>
              Restock these items promptly to ensure uninterrupted product availability for customers.
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search Controls */}
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
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Search Input */}
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
              placeholder="Search product name or category..."
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

          {/* Category Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: '#6B7280' }} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
                backgroundColor: '#FFFFFF',
                color: '#374151',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stock Status Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { id: 'ALL', label: `All (${products.length})` },
            { id: 'IN_STOCK', label: `In Stock (>10)` },
            { id: 'LOW_STOCK', label: `Low Stock (1-10)` },
            { id: 'OUT_OF_STOCK', label: `Out of Stock (0)` },
          ].map((tab) => {
            const isActive = stockFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStockFilter(tab.id)}
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

      {/* Inventory Table Container */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '2rem 1rem' }}>
            <EmptyState
              icon={LayoutGrid}
              title="No Inventory Items Match Filter"
              description="Try adjusting your category selection, stock filter, or search term."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
                setStockFilter('ALL');
              }}
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderBottom: '1px solid #E5E7EB',
                    color: '#6B7280',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={thStyle}>Item Details</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>Stock Status</th>
                  <th style={thStyle}>Quick Stock Adjust</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const currentEditStock = stockEdits[product.id] !== undefined ? stockEdits[product.id] : product.stock;
                  const isDirty = currentEditStock !== product.stock;
                  const isOut = currentEditStock === 0;
                  const isLow = currentEditStock > 0 && currentEditStock <= 10;

                  return (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: '1px solid #F3F4F6',
                        backgroundColor: isOut ? '#FEF2F2' : isLow ? '#FFFBEB' : 'transparent',
                      }}
                    >
                      {/* Item Details */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={normalizeImageUrl(product.image, 'product')}
                            alt={product.name}
                            onError={(e) => handleImageError(e, 'product')}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1px solid #E5E7EB',
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.9rem' }}>
                              {product.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                              Unit: {product.unit || '1 unit'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                          {product.category || 'General'}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.9rem' }}>
                          ₹{product.price}
                        </span>
                      </td>

                      {/* Stock Status Badge */}
                      <td style={tdStyle}>
                        {isOut ? (
                          <span style={badgeRedStyle}>Out of Stock (0)</span>
                        ) : isLow ? (
                          <span style={badgeYellowStyle}>Low Stock ({currentEditStock})</span>
                        ) : (
                          <span style={badgeGreenStyle}>In Stock ({currentEditStock})</span>
                        )}
                      </td>

                      {/* Quick Inline Adjust */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleDecrement(product.id)}
                            style={counterBtnStyle}
                            title="Decrease Stock"
                          >
                            <Minus size={14} />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={currentEditStock}
                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                            style={{
                              width: '60px',
                              textAlign: 'center',
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #D1D5DB',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                            }}
                          />

                          <button
                            onClick={() => handleIncrement(product.id)}
                            style={counterBtnStyle}
                            title="Increase Stock"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {/* Save Inline */}
                          <button
                            onClick={() => handleSaveInlineStock(product)}
                            disabled={!isDirty || savingId === product.id}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: isDirty ? 'var(--color-primary)' : '#E5E7EB',
                              color: isDirty ? '#FFFFFF' : '#9CA3AF',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: (isDirty && savingId !== product.id) ? 'pointer' : 'not-allowed',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {savingId === product.id ? <ButtonLoader size="sm" color="white" /> : <Save size={13} />}
                            <span>{savingId === product.id ? 'Saving...' : 'Save'}</span>
                          </button>

                          {/* Update Stock Modal Trigger */}
                          <button
                            onClick={() => openStockModal(product)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #D1D5DB',
                              backgroundColor: '#FFFFFF',
                              color: '#374151',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Open Stock Adjustment Modal"
                          >
                            <Edit3 size={13} /> Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {modalProduct && (
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
              maxWidth: '460px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                  Update Product Stock
                </h3>
              </div>
              <button
                onClick={closeStockModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Product Summary Box */}
            <div
              style={{
                backgroundColor: '#F9FAFB',
                padding: '12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '1.25rem',
                border: '1px solid #E5E7EB',
              }}
            >
              <img
                src={normalizeImageUrl(modalProduct.image, 'product')}
                alt={modalProduct.name}
                onError={(e) => handleImageError(e, 'product')}
                style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                  {modalProduct.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                  Current Stock: <strong style={{ color: 'var(--color-primary)' }}>{modalProduct.stock} units</strong> ({modalProduct.unit})
                </div>
              </div>
            </div>

            {/* Operation Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
              {[
                { id: 'SET', label: 'Set Exact' },
                { id: 'ADD', label: '+ Add Stock' },
                { id: 'REMOVE', label: '- Remove' },
              ].map((op) => {
                const isActive = modalMode === op.id;
                return (
                  <button
                    key={op.id}
                    onClick={() => {
                      setModalMode(op.id);
                      setModalAmount(op.id === 'SET' ? String(modalProduct.stock || 0) : '');
                      setModalError('');
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: isActive ? '2px solid var(--color-primary)' : '1px solid #D1D5DB',
                      backgroundColor: isActive ? 'var(--color-primary-light, #E6F4EA)' : '#FFFFFF',
                      color: isActive ? 'var(--color-primary)' : '#4B5563',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {op.label}
                  </button>
                );
              })}
            </div>

            {/* Input Field */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                {modalMode === 'SET' && 'New Total Quantity'}
                {modalMode === 'ADD' && 'Quantity to Add'}
                {modalMode === 'REMOVE' && 'Quantity to Remove'}
              </label>
              <input
                type="number"
                min="0"
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                placeholder="Enter stock quantity..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            {/* Error Message */}
            {modalError && (
              <div style={{ color: '#DC2626', fontSize: '0.825rem', marginBottom: '1rem', fontWeight: 500 }}>
                {modalError}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeStockModal}
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
                onClick={handleApplyModalStock}
                disabled={isApplying}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: isApplying ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {isApplying && <ButtonLoader size="sm" color="white" />}
                <span>{isApplying ? 'Applying...' : 'Apply Update'}</span>
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

const thStyle = {
  padding: '12px 16px',
  fontWeight: 600,
};

const tdStyle = {
  padding: '14px 16px',
  verticalAlign: 'middle',
};

const badgeGreenStyle = {
  backgroundColor: '#D1FAE5',
  color: '#059669',
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 600,
  display: 'inline-block',
  whiteSpace: 'nowrap',
};

const badgeYellowStyle = {
  backgroundColor: '#FEF3C7',
  color: '#D97706',
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 600,
  display: 'inline-block',
  whiteSpace: 'nowrap',
};

const badgeRedStyle = {
  backgroundColor: '#FEE2E2',
  color: '#DC2626',
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 600,
  display: 'inline-block',
  whiteSpace: 'nowrap',
};

const counterBtnStyle = {
  width: '30px',
  height: '30px',
  borderRadius: '6px',
  border: '1px solid #D1D5DB',
  backgroundColor: '#FFFFFF',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#374151',
};

