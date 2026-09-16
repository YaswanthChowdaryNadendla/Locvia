// src/pages/shop-owner/ShopOwnerProductsPage.jsx
// Module 21 — Dedicated Product Management & Cloudinary-ready UI for Shop Owners

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getOwnerShop,
  getOwnerProducts,
  addOwnerProduct,
  updateOwnerProduct,
  deleteOwnerProduct,
} from '../../services/shopOwnerService';
import { categories } from '../../data/categories';
import ProductImageUploader from '../../components/shop-owner/ProductImageUploader';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import TableSkeleton from '../../components/common/loaders/TableSkeleton';
import ButtonLoader from '../../components/common/loaders/ButtonLoader';
import EmptyState from '../../components/common/EmptyState';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';

const UNITS = ['1 kg', '500 g', '250 g', '1 Litre', '500 ml', '1 Pack', '1 Piece', '1 Dozen'];

export default function ShopOwnerProductsPage() {
  const { user } = useAuth();
  const [ownerShop, setOwnerShop] = useState(null);

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK'

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: categories[0]?.name || 'Grocery & Staples',
    categoryId: categories[0]?.id || 10,
    price: '',
    mrp: '',
    unit: '1 kg',
    stock: 25,
    description: '',
    imageUrl: '',
    imagePublicId: '',
    isAvailable: true,
  });

  const [formErrors, setFormErrors] = useState({});
  const [notification, setNotification] = useState(null);

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
    setTimeout(() => setNotification(null), 3500);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

    let matchesStatus = true;
    const stockVal = p.stock !== undefined ? p.stock : 0;

    if (statusFilter === 'ACTIVE') matchesStatus = p.isAvailable !== false && stockVal > 0;
    if (statusFilter === 'INACTIVE') matchesStatus = p.isAvailable === false || stockVal === 0;
    if (statusFilter === 'LOW_STOCK') matchesStatus = stockVal > 0 && stockVal <= 10;
    if (statusFilter === 'OUT_OF_STOCK') matchesStatus = stockVal === 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Validation
  const validateForm = () => {
    const errs = {};

    // 1. Name
    const cleanName = formData.name.trim();
    if (!cleanName) {
      errs.name = 'Product name is required.';
    } else if (cleanName.length < 2) {
      errs.name = 'Product name must contain at least 2 characters.';
    }

    // 2. Price
    const numericPrice = Number(formData.price);
    if (!formData.price || isNaN(numericPrice) || numericPrice <= 0) {
      errs.price = 'Price must be greater than 0.';
    }

    // 3. MRP
    const numericMRP = Number(formData.mrp || formData.price);
    if (numericMRP < numericPrice) {
      errs.mrp = 'MRP must be greater than or equal to selling price.';
    }

    // 4. Stock
    const numericStock = Number(formData.stock);
    if (formData.stock === '' || isNaN(numericStock) || numericStock < 0) {
      errs.stock = 'Stock must be greater than or equal to 0.';
    }

    // 5. Image
    if (!formData.imageUrl) {
      errs.image = 'Product image is required.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Modal Open Handlers
  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      category: categories[0]?.name || 'Grocery & Staples',
      categoryId: categories[0]?.id || 10,
      price: '',
      mrp: '',
      unit: '1 kg',
      stock: 25,
      description: '',
      imageUrl: '',
      imagePublicId: '',
      isAvailable: true,
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || categories[0]?.name || 'Grocery & Staples',
      categoryId: product.categoryId || 10,
      price: product.price || '',
      mrp: product.mrp || product.originalPrice || product.price || '',
      unit: product.unit || '1 kg',
      stock: product.stock !== undefined ? product.stock : 25,
      description: product.description || '',
      imageUrl: product.imageUrl || product.image || '',
      imagePublicId: product.imagePublicId || '',
      isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
    });
    setFormErrors({});
  };

  // Image Uploader Handler
  const handleImageChange = ({ previewUrl, imageUrl, imagePublicId }) => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: imageUrl || previewUrl || '',
      imagePublicId: imagePublicId || '',
    }));
    if (formErrors.image) {
      setFormErrors((prev) => ({ ...prev, image: null }));
    }
  };

  // Form Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const price = Number(formData.price);
      const mrp = Number(formData.mrp || formData.price);
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        categoryId: formData.categoryId,
        price,
        mrp,
        originalPrice: mrp,
        discount,
        unit: formData.unit,
        stock: Number(formData.stock),
        imageUrl: formData.imageUrl,
        image: formData.imageUrl,
        imagePublicId: formData.imagePublicId || `locvia/products/${ownerShop.id}/${Date.now()}`,
        isAvailable: formData.isAvailable && Number(formData.stock) > 0,
      };

      if (editingProduct) {
        await updateOwnerProduct(ownerShop.id, editingProduct.id, payload);
        showToast('Product updated successfully!');
        setEditingProduct(null);
      } else {
        await addOwnerProduct(ownerShop.id, payload);
        showToast('Product added successfully!');
        setIsAddModalOpen(false);
      }

      await loadProducts(ownerShop.id);
    } catch (err) {
      showToast(err.message || 'Failed to save product.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deletingProduct || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteOwnerProduct(ownerShop.id, deletingProduct.id);
      await loadProducts(ownerShop.id);
      setDeletingProduct(null);
      showToast(`Product "${deletingProduct.name}" deleted successfully.`);
    } catch (err) {
      showToast(err.message || 'Failed to delete product.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats calculation
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.isAvailable !== false && (p.stock || 0) > 0).length;
  const lowStockCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
  const outOfStockCount = products.filter((p) => (p.stock || 0) === 0).length;

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '1rem', boxSizing: 'border-box' }}>
      
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

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', margin: 0, lineHeight: 1.2 }}>
            Products
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '4px' }}>
            Manage products available in <strong style={{ color: 'var(--color-primary)' }}>{ownerShop.name}</strong>
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'background 0.2s ease',
          }}
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ ...iconBadgeStyle, backgroundColor: '#E0F2FE', color: '#0284C7' }}>
              <Package size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Products
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {totalCount}
              </div>
            </div>
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ ...iconBadgeStyle, backgroundColor: '#D1FAE5', color: '#059669' }}>
              <CheckCircle size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                Active & In Stock
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
                {activeCount}
              </div>
            </div>
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ ...iconBadgeStyle, backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                Low Stock (≤10)
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>
                {lowStockCount}
              </div>
            </div>
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ ...iconBadgeStyle, backgroundColor: '#FEE2E2', color: '#DC2626' }}>
              <X size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                Out of Stock (0)
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626' }}>
                {outOfStockCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
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
            placeholder="Search products by name..."
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
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category & Status Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '0.85rem',
              outline: 'none',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Tabs */}
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'LOW_STOCK', label: 'Low Stock' },
            { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: isActive ? '1px solid var(--color-primary)' : '1px solid #D1D5DB',
                  backgroundColor: isActive ? 'var(--color-primary-light, #E6F4EA)' : '#FFFFFF',
                  color: isActive ? 'var(--color-primary)' : '#4B5563',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Table */}
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
          <TableSkeleton rows={6} cols={8} />
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '2rem 1rem' }}>
            <EmptyState
              icon={Package}
              title={searchTerm || selectedCategory !== 'All' || statusFilter !== 'ALL' ? 'No Products Found' : 'No Products Yet'}
              description={searchTerm || selectedCategory !== 'All' || statusFilter !== 'ALL' ? 'Try adjusting your search query or filter selection.' : 'Start adding products to your shop catalog.'}
              actionLabel={!(searchTerm || selectedCategory !== 'All' || statusFilter !== 'ALL') ? '+ Add Product' : 'Clear Filters'}
              onAction={!(searchTerm || selectedCategory !== 'All' || statusFilter !== 'ALL') ? handleOpenAddModal : () => { setSearchTerm(''); setSelectedCategory('All'); setStatusFilter('ALL'); }}
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                  <th style={thStyle}>Image</th>
                  <th style={thStyle}>Product Name</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Price / MRP</th>
                  <th style={thStyle}>Unit</th>
                  <th style={thStyle}>Stock</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isOut = (product.stock || 0) === 0;
                  const isLow = (product.stock || 0) > 0 && (product.stock || 0) <= 10;
                  const mrpVal = product.mrp || product.originalPrice || product.price;

                  return (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: '1px solid #F3F4F6',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Image Thumbnail */}
                      <td style={tdStyle}>
                        <img
                          src={normalizeImageUrl(product.imageUrl || product.image, 'product')}
                          alt={product.name}
                          onError={(e) => handleImageError(e, 'product')}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid #E5E7EB',
                            backgroundColor: '#F9FAFB',
                          }}
                        />
                      </td>

                      {/* Product Name */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.9rem' }}>
                          {product.name}
                        </div>
                        {product.description && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#9CA3AF',
                              maxWidth: '220px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {product.description}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            backgroundColor: '#F3F4F6',
                            color: '#374151',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        >
                          {product.category || 'Grocery & Staples'}
                        </span>
                      </td>

                      {/* Price & MRP & Discount */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: 'var(--color-text)', fontSize: '0.9rem' }}>
                          ₹{product.price}
                        </div>
                        {mrpVal > product.price && (
                          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', textDecoration: 'line-through' }}>
                            MRP: ₹{mrpVal} {product.discount ? `(${product.discount}% OFF)` : ''}
                          </div>
                        )}
                      </td>

                      {/* Unit */}
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                          {product.unit || '1 kg'}
                        </span>
                      </td>

                      {/* Stock */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: isOut ? '#DC2626' : isLow ? '#D97706' : '#059669',
                            fontSize: '0.9rem',
                          }}
                        >
                          {product.stock !== undefined ? product.stock : 0}
                        </span>
                      </td>

                      {/* Availability Status */}
                      <td style={tdStyle}>
                        {isOut ? (
                          <span style={badgeRedStyle}>Out of Stock</span>
                        ) : isLow ? (
                          <span style={badgeYellowStyle}>Low Stock</span>
                        ) : (
                          <span style={badgeGreenStyle}>Active</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            title="Edit Product"
                            style={actionBtnStyle}
                          >
                            <Edit2 size={16} color="#4B5563" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            title="Delete Product"
                            style={{ ...actionBtnStyle, backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }}
                          >
                            <Trash2 size={16} color="#DC2626" />
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

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #E5E7EB',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                
                {/* Product Name */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fresh Organic Apples"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      ...inputStyle,
                      borderColor: formErrors.name ? '#EF4444' : '#D1D5DB',
                    }}
                  />
                  {formErrors.name && <span style={errorTextStyle}>{formErrors.name}</span>}
                </div>

                {/* Category Selection */}
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const selectedObj = categories.find((c) => c.name === e.target.value);
                      setFormData({
                        ...formData,
                        category: e.target.value,
                        categoryId: selectedObj ? selectedObj.id : 10,
                      });
                    }}
                    style={inputStyle}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label style={labelStyle}>Unit / Package Size *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={inputStyle}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selling Price */}
                <div>
                  <label style={labelStyle}>Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 120"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    style={{
                      ...inputStyle,
                      borderColor: formErrors.price ? '#EF4444' : '#D1D5DB',
                    }}
                  />
                  {formErrors.price && <span style={errorTextStyle}>{formErrors.price}</span>}
                </div>

                {/* MRP / Original Price */}
                <div>
                  <label style={labelStyle}>MRP (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 150"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    style={{
                      ...inputStyle,
                      borderColor: formErrors.mrp ? '#EF4444' : '#D1D5DB',
                    }}
                  />
                  {formErrors.mrp && <span style={errorTextStyle}>{formErrors.mrp}</span>}
                </div>

                {/* Initial Stock */}
                <div>
                  <label style={labelStyle}>Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 25"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    style={{
                      ...inputStyle,
                      borderColor: formErrors.stock ? '#EF4444' : '#D1D5DB',
                    }}
                  />
                  {formErrors.stock && <span style={errorTextStyle}>{formErrors.stock}</span>}
                </div>

                {/* Availability Toggle */}
                <div>
                  <label style={labelStyle}>Availability Status</label>
                  <select
                    value={formData.isAvailable ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'true' })}
                    style={inputStyle}
                  >
                    <option value="true">Active & Available</option>
                    <option value="false">Inactive / Disabled</option>
                  </select>
                </div>

                {/* Cloudinary-Ready Product Image Uploader */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <ProductImageUploader
                    existingImageUrl={formData.imageUrl}
                    existingPublicId={formData.imagePublicId}
                    shopId={ownerShop.id}
                    productId={editingProduct?.id || null}
                    onImageChange={handleImageChange}
                  />
                  {formErrors.image && <span style={errorTextStyle}>{formErrors.image}</span>}
                </div>

                {/* Description */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Product Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about product quality, origin, or usage..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

              </div>

              {/* Form Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '20px',
                  paddingTop: '12px',
                  borderTop: '1px solid #E5E7EB',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: '#374151',
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
                    padding: '8px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isSubmitting && <ButtonLoader size="sm" color="white" />}
                  <span>{isSubmitting ? (editingProduct ? 'Saving...' : 'Adding...') : editingProduct ? 'Save Changes' : 'Add Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '420px' }}>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <Trash2 size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--color-text)' }}>
                Delete this product?
              </h3>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
                Are you sure you want to delete <strong style={{ color: '#111827' }}>{deletingProduct.name}</strong>?
                This action cannot be undone.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setDeletingProduct(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isDeleting && <ButtonLoader size="sm" color="white" />}
                  <span>{isDeleting ? 'Deleting...' : 'Delete Product'}</span>
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
const statCardStyle = {
  backgroundColor: '#FFFFFF',
  padding: '1.2rem',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  boxSizing: 'border-box',
  width: '100%',
};

const iconBadgeStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const thStyle = {
  padding: '12px 16px',
  fontWeight: 700,
};

const tdStyle = {
  padding: '12px 16px',
  verticalAlign: 'middle',
};

const badgeGreenStyle = {
  backgroundColor: '#D1FAE5',
  color: '#059669',
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 700,
};

const badgeYellowStyle = {
  backgroundColor: '#FEF3C7',
  color: '#D97706',
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 700,
};

const badgeRedStyle = {
  backgroundColor: '#FEE2E2',
  color: '#DC2626',
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 700,
};

const actionBtnStyle = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid #E5E7EB',
  backgroundColor: '#F9FAFB',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
};

const modalContentStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '580px',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '1.5rem',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '4px',
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: '#FFFFFF',
};

const errorTextStyle = {
  color: '#EF4444',
  fontSize: '0.75rem',
  fontWeight: 600,
  marginTop: '4px',
  display: 'block',
};
