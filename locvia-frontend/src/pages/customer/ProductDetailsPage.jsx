// src/pages/customer/ProductDetailsPage.jsx
// MODULE 10 — Product Details Page
// MODULE 36 — Reviews & Ratings integration

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, Minus, Plus, ShoppingBag, Check, MapPin,
  Clock, ShieldCheck, AlertCircle, MessageSquare, Pencil, LogIn,
} from 'lucide-react';
import ProductCard from '../../components/products/ProductCard';
import { fetchProductById, fetchRelatedProducts } from '../../services/productService';
import { getShopById } from '../../services/shopService';
import { formatPrice, formatRating } from '../../utils/formatters';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../data/users';
import {
  getProductReviews,
  calculateReviewSummary,
  getReviewForProduct,
  canUserReviewProduct,
  addReview,
  updateReview,
  deleteReview,
} from '../../services/reviewService';
import StarRating from '../../components/reviews/StarRating';
import RatingDistribution from '../../components/reviews/RatingDistribution';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReviewList from '../../components/reviews/ReviewList';

import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/loaders/SkeletonLoader';
import { getFriendlyErrorMessage } from '../../utils/errorHandler';

// Simple toast
const Toast = ({ msg, type }) => (
  <div style={{
    position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000,
    background: type === 'success' ? '#0c831f' : '#dc2626',
    color: '#fff', padding: '12px 20px', borderRadius: '10px',
    fontSize: '14px', fontWeight: 600,
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    animation: 'fadeInUp 0.25s ease',
  }}>
    {msg}
  </div>
);

const ProductDetailsPage = () => {
  const { id, productId } = useParams();
  const targetId = id || productId;
  const navigate = useNavigate();

  // Auth
  const authCtx = useAuth();
  const currentUser = authCtx?.user || null;
  const isCustomer = currentUser?.role === ROLES.CUSTOMER;

  // Safely connect to CartContext
  const cart = useCart();

  // Data states
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interaction states
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [userReview, setUserReview] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadReviews = useCallback((pid) => {
    const all = getProductReviews(pid);
    setReviews(all);
    setReviewSummary(calculateReviewSummary(all));
    if (currentUser) {
      setUserReview(getReviewForProduct(currentUser.id, pid));
      setCanReview(canUserReviewProduct(currentUser.id, pid));
    }
  }, [currentUser]);


  const loadProductData = useCallback(async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      setError(null);

      const p = await fetchProductById(targetId);
      setProduct(p);

      // Fetch corresponding shop data dynamically using shopId
      if (p.shopId) {
        try {
          const s = await getShopById(p.shopId);
          setShop(s || null);
        } catch {
          setShop(null);
        }
      } else {
        setShop(null);
      }

      // Fetch related products (same category or same shop)
      const related = await fetchRelatedProducts(p.category, p.id);
      setRelatedProducts(related);

      // Load reviews for this product
      loadReviews(p.id);

      // Reset state for newly selected product
      setQuantity(1);
      setIsAdded(false);
      setActiveImageIndex(0);
      setShowForm(false);
      setEditingReview(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [targetId, loadReviews]);

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  // Handle quantity changes
  const stockLimit = product?.stock !== undefined ? product.stock : (product?.isAvailable ? 20 : 0);

  const handleIncrement = () => {
    if (quantity < stockLimit) {
      setQuantity(q => q + 1);

    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const handleAddToCart = () => {
    if (!product || !product.isAvailable) return;
    if (cart) {
      cart.addItem(product, quantity);
    }
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  // ── Review handlers ──────────────────────────────────────────
  const getUserDisplayName = () => {
    if (!currentUser?.name) return 'Customer';
    const parts = currentUser.name.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  };

  const handleSubmitReview = ({ rating, comment }) => {
    if (!currentUser || !product) return;
    setReviewLoading(true);
    try {
      if (editingReview) {
        updateReview(editingReview.id, currentUser.id, { rating, comment });
        showToast('Review updated successfully!');
      } else {
        addReview({
          productId: String(product.id),
          shopId: product.shopId ? String(product.shopId) : null,
          orderId: null, // product-page submission (not order-linked)
          userId: currentUser.id,
          userName: getUserDisplayName(),
          rating,
          comment,
        });
        showToast('Review submitted! Thank you.');
      }
      setShowForm(false);
      setEditingReview(null);
      loadReviews(product.id);
    } catch (err) {
      if (err.message === 'DUPLICATE_REVIEW') {
        showToast('You have already reviewed this product.', 'error');
      } else {
        showToast('Failed to save review. Please try again.', 'error');
      }
    } finally {
      setReviewLoading(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeleteReview = (review) => {
    try {
      deleteReview(review.id, currentUser.id);
      showToast('Review deleted.');
      loadReviews(product.id);
    } catch {
      showToast('Could not delete review.', 'error');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingReview(null);
  };

  // Loading state (Realistic PDP Skeleton)
  if (loading) {
    return (
      <div className="pdp-container" aria-busy="true" aria-label="Loading product details">
        {/* Breadcrumb Skeleton */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <SkeletonLoader width="60px" height="28px" borderRadius="6px" />
          <SkeletonLoader width="180px" height="18px" />
        </div>

        {/* Main Grid Skeleton */}
        <div className="pdp-main-grid">
          {/* Image & Thumbnails */}
          <div className="pdp-gallery-wrap">
            <SkeletonLoader height="380px" borderRadius="16px" className="pdp-main-image-card" />
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <SkeletonLoader width="64px" height="64px" borderRadius="8px" />
              <SkeletonLoader width="64px" height="64px" borderRadius="8px" />
              <SkeletonLoader width="64px" height="64px" borderRadius="8px" />
            </div>
          </div>

          {/* Info Column */}
          <div className="pdp-info-col" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <SkeletonLoader width="90px" height="22px" borderRadius="12px" />
            <SkeletonLoader width="85%" height="34px" borderRadius="6px" />
            <SkeletonLoader width="70px" height="18px" borderRadius="4px" />
            <SkeletonLoader width="120px" height="26px" borderRadius="14px" />
            <div style={{ height: '1px', background: '#f1f5f9', margin: '6px 0' }} />
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <SkeletonLoader width="110px" height="36px" borderRadius="8px" />
              <SkeletonLoader width="70px" height="22px" borderRadius="6px" />
            </div>
            <SkeletonLoader width="240px" height="36px" borderRadius="8px" />
            <div style={{ height: '1px', background: '#f1f5f9', margin: '6px 0' }} />
            <SkeletonLoader width="100%" height="52px" borderRadius="10px" />
            <SkeletonLoader width="100%" height="96px" borderRadius="14px" />
          </div>
        </div>

        {/* Description / Spec Tabs Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2.5rem' }}>
          <SkeletonLoader height="160px" borderRadius="14px" />
          <SkeletonLoader height="160px" borderRadius="14px" />
        </div>
      </div>
    );
  }

  // Error / Not Found state
  if (error || !product) {
    const errorDetails = error ? getFriendlyErrorMessage(error) : { message: 'The product you are looking for does not exist or may have been removed.', canRetry: false };
    const isNotFound = !product || error?.message?.toLowerCase().includes('not found') || errorDetails.type === 'not_found';

    return (
      <div className="pdp-container">
        <EmptyState
          icon={isNotFound ? ShoppingBag : AlertCircle}
          title={isNotFound ? "Product Not Found" : "Unable to Load Product"}
          description={isNotFound ? "The product you are looking for does not exist or may have been removed." : errorDetails.message}
          actionLabel={errorDetails.canRetry && !isNotFound ? "Try Again" : "Back to Products"}
          onAction={errorDetails.canRetry && !isNotFound ? loadProductData : () => navigate('/products')}
          secondaryActionLabel={errorDetails.canRetry && !isNotFound ? "Back to Products" : undefined}
          onSecondaryAction={errorDetails.canRetry && !isNotFound ? () => navigate('/products') : undefined}
        />
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const isAvailable = product.isAvailable !== false && (product.stock === undefined || product.stock > 0);

  return (
    <div className="pdp-container animate-fade-in">
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* ── 1. Breadcrumb Navigation ── */}
      <div className="pdp-breadcrumb-bar">
        <button
          onClick={() => navigate(-1)}
          className="pl-back-btn"
          style={{ marginRight: '8px' }}
          aria-label="Go back"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span className="pdp-breadcrumb-sep">/</span>
        <Link to="/" className="pdp-breadcrumb-link">Home</Link>
        <span className="pdp-breadcrumb-sep">/</span>
        <Link to="/products" className="pdp-breadcrumb-link">Shops</Link>
        {shop && (
          <>
            <span className="pdp-breadcrumb-sep">/</span>
            <Link to={`/shop/${shop.id}/products`} className="pdp-breadcrumb-link">
              {shop.name}
            </Link>
          </>
        )}
        {product.category && (
          <>
            <span className="pdp-breadcrumb-sep">/</span>
            <span className="pdp-breadcrumb-link">{product.category}</span>
          </>
        )}
        <span className="pdp-breadcrumb-sep">/</span>
        <span className="pdp-breadcrumb-current">{product.name}</span>
      </div>

      {/* ── 2. Main Product Grid ── */}
      <div className="pdp-main-grid">

        {/* Left Column: Product Image Gallery */}
        <div className="pdp-gallery-wrap">
          <div className="pdp-main-image-card">
            <img
              src={normalizeImageUrl(images[activeImageIndex] || product.image, 'product')}
              alt={product.name}
              onError={(e) => handleImageError(e, 'product')}
              className="pdp-main-img"
            />

            {/* Discount Badge */}
            {product.discount > 0 && (
              <span className="pdp-badge-discount">
                {product.discount}% OFF
              </span>
            )}

            {/* Out of Stock Overlay */}
            {!isAvailable && (
              <div className="pdp-out-of-stock-overlay">
                <span className="pdp-out-badge">Out of Stock</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="pdp-thumbnails-row">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`pdp-thumb-btn ${activeImageIndex === idx ? 'pdp-thumb-btn--active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View product image ${idx + 1}`}
                >
                  <img
                    src={normalizeImageUrl(img, 'product')}
                    alt={`Thumbnail ${idx + 1}`}
                    onError={(e) => handleImageError(e, 'product')}
                    className="pdp-thumb-img"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="pdp-info-col">
          {product.category && (
            <span className="pdp-category-tag">{product.category}</span>
          )}

          <h1 className="pdp-product-title">{product.name}</h1>

          {product.unit && (
            <span className="pdp-unit-text">{product.unit}</span>
          )}

          {/* Rating */}
          {product.rating && (
            <div className="pdp-rating-row">
              <span className="pdp-rating-badge">
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                {formatRating(product.rating)}
              </span>
              {product.reviewCount && (
                <span className="pdp-review-count">({product.reviewCount} customer reviews)</span>
              )}
            </div>
          )}

          <div className="pdp-divider" />

          {/* Price */}
          <div className="pdp-price-row">
            <span className="pdp-price-current">{formatPrice(product.price)}</span>
            {product.originalPrice > product.price && (
              <span className="pdp-price-mrp">{formatPrice(product.originalPrice)}</span>
            )}
            {product.discount > 0 && (
              <span className="pdp-discount-pill">{product.discount}% OFF</span>
            )}
          </div>

          {/* Availability Status */}
          <div className={`pdp-stock-status ${isAvailable ? 'pdp-stock-status--in' : 'pdp-stock-status--out'}`}>
            <Check size={16} />
            <span>{isAvailable ? 'In Stock — Fresh & Ready for Fast Delivery' : 'Currently Out of Stock'}</span>
          </div>

          <div className="pdp-divider" />

          {/* Quantity Selector & Add to Cart */}
          <div className="pdp-action-area">
            {isAvailable ? (
              <>
                <div className="pdp-qty-row">
                  <span className="pdp-qty-label">Quantity:</span>
                  <div className="pdp-stepper-box">
                    <button
                      className="pdp-stepper-btn"
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="pdp-stepper-value">{quantity}</span>
                    <button
                      className="pdp-stepper-btn"
                      onClick={handleIncrement}
                      disabled={quantity >= stockLimit}
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <button
                  className={`pdp-add-btn ${isAdded ? 'pdp-added-badge' : ''}`}
                  onClick={handleAddToCart}
                  disabled={!isAvailable}
                >
                  {isAdded ? (
                    <><Check size={20} /> Added to Cart</>
                  ) : (
                    <><ShoppingBag size={20} /> Add to Cart</>
                  )}
                </button>
              </>
            ) : (
              <button className="pdp-add-btn" disabled>
                Out of Stock
              </button>
            )}
          </div>

          {/* Shop Information Box */}
          {shop && (
            <div className="pdp-shop-card">
              <div className="pdp-shop-card-header">
                <span className="pdp-shop-card-label">Sold By</span>
                <Link to={`/shop/${shop.id}`} className="pdp-view-shop-link">
                  View Shop &rarr;
                </Link>
              </div>

              <div className="pdp-shop-body">
                {shop.image && (
                  <img
                    src={normalizeImageUrl(shop.image, 'shop')}
                    alt={shop.name}
                    onError={(e) => handleImageError(e, 'shop')}
                    className="pdp-shop-avatar"
                  />
                )}
                <div>
                  <h3 className="pdp-shop-name">{shop.name}</h3>
                  <div className="pdp-shop-meta-line">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600, color: '#0f172a' }}>
                      <Star size={12} fill="#f59e0b" color="#f59e0b" /> {formatRating(shop.rating)}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <MapPin size={12} /> {shop.distance} km
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Clock size={12} /> {shop.deliveryTime || '15–25 mins'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fast Delivery Promise */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.875rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', fontSize: '13.5px', color: '#166534' }}>
            <ShieldCheck size={20} style={{ color: '#0c831f', flexShrink: 0 }} />
            <span>Guaranteed fresh local delivery in 15–25 minutes directly to your doorstep.</span>
          </div>

        </div>

      </div>

      {/* ── 3. Description & Specifications ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Description Card */}
        <div className="pdp-section-card" style={{ marginBottom: 0 }}>
          <h2 className="pdp-section-heading">About this product</h2>
          <p className="pdp-description-text">
            {product.description || 'Freshly sourced high-quality grocery item from your trusted neighborhood local store.'}
          </p>
        </div>

        {/* Specifications Card */}
        <div className="pdp-section-card" style={{ marginBottom: 0 }}>
          <h2 className="pdp-section-heading">Product Specifications</h2>
          <div className="pdp-specs-grid">
            <div className="pdp-spec-item">
              <span className="pdp-spec-label">Category</span>
              <span className="pdp-spec-value">{product.category || 'General'}</span>
            </div>
            <div className="pdp-spec-item">
              <span className="pdp-spec-label">Quantity / Unit</span>
              <span className="pdp-spec-value">{product.unit || 'Standard'}</span>
            </div>
            <div className="pdp-spec-item">
              <span className="pdp-spec-label">Product ID</span>
              <span className="pdp-spec-value">#{product.id}</span>
            </div>
            <div className="pdp-spec-item">
              <span className="pdp-spec-label">Seller</span>
              <span className="pdp-spec-value">{shop ? shop.name : 'Locvia Merchant'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── 4. Reviews & Ratings Section ── */}
      <div
        id="reviews-section"
        className="pdp-section-card"
        style={{ marginBottom: '2rem' }}
      >
        {/* Section header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <h2 className="pdp-section-heading" style={{ margin: 0 }}>
              Customer Reviews
            </h2>
            {reviewSummary.total > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <StarRating rating={reviewSummary.average} size={16} />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {reviewSummary.average.toFixed(1)} · {reviewSummary.total} {reviewSummary.total === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}
          </div>

          {/* Write a Review button — only for eligible customers who haven't reviewed yet */}
          {isCustomer && canReview && !userReview && !showForm && (
            <button
              onClick={() => { setShowForm(true); setEditingReview(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 18px', borderRadius: '8px',
                border: 'none', background: '#0c831f',
                color: '#fff', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer',
              }}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #f59e0b'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
              aria-label="Write a review for this product"
            >
              <MessageSquare size={15} /> Write a Review
            </button>
          )}

          {/* Edit own review */}
          {isCustomer && userReview && !showForm && (
            <button
              onClick={() => handleEditReview(userReview)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 18px', borderRadius: '8px',
                border: '1px solid #d1d5db', background: '#f9fafb',
                color: '#374151', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer',
              }}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #0c831f'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
            >
              <Pencil size={14} /> Edit My Review
            </button>
          )}

          {/* Not-eligible message (customer who hasn't purchased) */}
          {isCustomer && !canReview && !userReview && (
            <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
              Purchase this product to write a review
            </span>
          )}

          {/* Not logged in prompt */}
          {!currentUser && (
            <Link
              to="/login"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 18px', borderRadius: '8px',
                border: '1px solid #d1d5db', background: '#f9fafb',
                color: '#374151', fontSize: '13px', fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <LogIn size={14} /> Log in to write a review
            </Link>
          )}
        </div>

        {/* Rating distribution */}
        {reviewSummary.total > 0 && (
          <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <RatingDistribution summary={reviewSummary} />
          </div>
        )}

        {/* Write / Edit form */}
        {isCustomer && showForm && (
          <ReviewForm
            existingReview={editingReview}
            productName={product?.name}
            onSubmit={handleSubmitReview}
            onCancel={handleCancelForm}
            loading={reviewLoading}
          />
        )}

        {/* Review list */}
        <ReviewList
          reviews={reviews}
          currentUserId={currentUser?.id}
          isAdmin={false}
          onEdit={isCustomer ? handleEditReview : undefined}
          onDelete={isCustomer ? handleDeleteReview : undefined}
          onUpdated={() => loadReviews(product.id)}
        />
      </div>


      {/* ── 5. Similar Products Section ── */}
      {relatedProducts.length > 0 && (
        <div className="pdp-similar-section">
          <h2 className="pdp-section-heading" style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>
            Similar Products
          </h2>
          <div className="pdp-similar-grid">
            {relatedProducts.map(rp => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetailsPage;
