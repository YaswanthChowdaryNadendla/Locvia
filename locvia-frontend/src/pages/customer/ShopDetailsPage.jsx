import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, MapPin, Clock, Phone, Share2, Search,
  ShoppingBag, Check, AlertCircle, Store, Truck, ShieldCheck
} from 'lucide-react';
import Container from '../../components/common/Container';
import ProductCard from '../../components/products/ProductCard';
import SkeletonLoader from '../../components/common/loaders/SkeletonLoader';
import ProductCardSkeleton from '../../components/common/loaders/ProductCardSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { getFriendlyErrorMessage } from '../../utils/errorHandler';
import { getShopById } from '../../services/shopService';
import { getProductsByShop } from '../../services/api/productApi';
import { formatRating } from '../../utils/formatters';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';

const ShopDetailsPage = () => {
  const { id, shopId } = useParams();
  const targetId = id || shopId;
  const navigate = useNavigate();
  const productsRef = useRef(null);

  const [shop, setShop]               = useState(null);
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [copied, setCopied]           = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availableCategories, setAvailableCategories] = useState(['All']);

  const fetchShopData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Retrieve shop by ID
      const shopData = await getShopById(targetId);
      if (!shopData) {
        setError('Shop not found');
        return;
      }
      setShop(shopData);

      // Retrieve products for this shop from backend API
      const productResponse = await getProductsByShop(targetId);
      const shopProducts = Array.isArray(productResponse) ? productResponse
        : (productResponse?.content ? productResponse.content : []);
      setProducts(shopProducts);

      // Extract categories from actual shop products
      const cats = new Set(['All']);
      shopProducts.forEach((p) => {
        if (p.category) cats.add(p.category);
      });

      setAvailableCategories(Array.from(cats));
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('not found')) {
        setError('Shop not found');
      } else {
        setError(getFriendlyErrorMessage(err, 'Unable to load shop details.'));
      }
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  // Derived filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' ? true : p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading state with realistic skeletons matching shop header & products grid
  if (loading) {
    return (
      <div className="sdp-page animate-fade-in" role="status" aria-busy="true" aria-label="Loading shop details">
        <Container>
          {/* Breadcrumb skeleton */}
          <div style={{ padding: '1rem 0' }}>
            <SkeletonLoader width="140px" height="18px" />
          </div>

          {/* Banner + Hero skeleton */}
          <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '2rem', backgroundColor: '#ffffff' }}>
            <SkeletonLoader width="100%" height="220px" borderRadius="0px" />
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SkeletonLoader width="40%" height="28px" />
              <SkeletonLoader width="65%" height="16px" />
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <SkeletonLoader width="80px" height="20px" />
                <SkeletonLoader width="90px" height="20px" />
                <SkeletonLoader width="100px" height="20px" />
              </div>
            </div>
          </div>

          {/* Categories bar skeleton */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLoader key={i} width="90px" height="36px" borderRadius="20px" />
            ))}
          </div>

          {/* Product grid skeleton */}
          <div className="sdp-product-grid">
            {Array.from({ length: 8 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        </Container>
      </div>
    );
  }

  // General network / server error with working Try Again retry action
  if (error && error !== 'Shop not found') {
    return (
      <div className="sdp-error-page">
        <Container style={{ padding: '3rem 1rem' }}>
          <EmptyState
            icon={AlertCircle}
            title="Unable to load shop"
            message={error}
            actionLabel="Try Again"
            onAction={fetchShopData}
            secondaryActionLabel="Back to Shops"
            onSecondaryAction={() => navigate('/shops')}
          />
        </Container>
      </div>
    );
  }

  // Shop Not Found state
  if (!shop || error === 'Shop not found') {
    return (
      <div className="sdp-error-page">
        <Container>
          <div className="sdp-error-card">
            <Store size={56} className="sdp-error-icon" />
            <h2>Shop Not Found</h2>
            <p>The shop you are looking for does not exist or may have closed temporarily.</p>
            <Link to="/shops" className="sdp-btn-primary">
              <ArrowLeft size={16} /> Back to Shops
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="sdp-page animate-fade-in">
      <Container>

        {/* ── 1. Breadcrumb / Back ── */}
        <div className="sdp-breadcrumb-row">
          <button onClick={() => navigate(-1)} className="sdp-back-btn" aria-label="Go back">
            <ArrowLeft size={18} />
            <span>Back to shops</span>
          </button>

          <nav className="sdp-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="sdp-sep">/</span>
            <Link to="/shops">Shops</Link>
            <span className="sdp-sep">/</span>
            <span className="sdp-current">{shop.name}</span>
          </nav>
        </div>

        {/* ── 2. Shop Header ── */}
        <div className="sdp-header-card">
          {/* Left: Shop Image */}
          <div className="sdp-header-img-wrap">
            <img
              src={normalizeImageUrl(shop.image, 'shop')}
              alt={shop.name}
              onError={(e) => handleImageError(e, 'shop')}
              className="sdp-header-img"
              loading="eager"
            />
            {!shop.isOpen && (
              <div className="sdp-closed-overlay">
                <span>Closed Now</span>
              </div>
            )}
          </div>

          {/* Right: Shop Info */}
          <div className="sdp-header-info">
            <div className="sdp-header-top">
              <span className="sdp-category-pill">{shop.category}</span>
              {shop.isOpen ? (
                <span className="sdp-status-badge sdp-status-badge--open">
                  <span className="sdp-dot" /> Open Now
                </span>
              ) : (
                <span className="sdp-status-badge sdp-status-badge--closed">
                  Closed Now
                </span>
              )}
            </div>

            <h1 className="sdp-shop-title">{shop.name}</h1>
            <p className="sdp-shop-desc">{shop.description}</p>

            {/* Meta Row */}
            <div className="sdp-meta-grid">
              {shop.rating && (
                <div className="sdp-meta-item sdp-rating-box">
                  <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  <span className="sdp-rating-val">{formatRating(shop.rating)}</span>
                  <span className="sdp-review-cnt">({shop.reviewCount || 120} reviews)</span>
                </div>
              )}

              <div className="sdp-meta-item">
                <MapPin size={15} className="sdp-meta-icon" />
                <span>{shop.address || 'Ongole'} • <strong>{shop.distance} km</strong></span>
              </div>

              <div className="sdp-meta-item">
                <Clock size={15} className="sdp-meta-icon" />
                <span>Delivery: <strong>{shop.deliveryTime}</strong></span>
              </div>

              <div className="sdp-meta-item">
                <ShoppingBag size={15} className="sdp-meta-icon" />
                <span>Min. order: <strong>₹{shop.minOrder || 100}</strong></span>
              </div>
            </div>

            {/* Actions Row */}
            <div className="sdp-actions-row">
              <Link to={`/shop/${shop.id}/products`} className="sdp-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                Browse Products
              </Link>

              <a href={`tel:${shop.phone || '+919876543210'}`} className="sdp-btn-secondary">
                <Phone size={15} />
                <span>Call Shop</span>
              </a>

              <button onClick={handleShare} className="sdp-btn-secondary">
                {copied ? <Check size={15} style={{ color: '#0c831f' }} /> : <Share2 size={15} />}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. Shop Categories ── */}
        <section className="sdp-cat-section">
          <h2 className="sdp-section-heading">Shop by Category</h2>
          <div className="sdp-cat-bar" role="tablist">
            {availableCategories.map(cat => (
              <button
                key={cat}
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={`sdp-cat-btn ${selectedCategory === cat ? 'sdp-cat-btn--active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* ── 4. Products Section ── */}
        <section className="sdp-products-section" ref={productsRef}>
          <div className="sdp-products-header">
            <div>
              <h2 className="sdp-section-heading mb-0">
                {selectedCategory === 'All' ? 'Popular Products' : selectedCategory}
              </h2>
              <p className="sdp-section-sub">
                {filteredProducts.length} items available in this store
              </p>
            </div>

            {/* Search inside shop */}
            <div className="sdp-search-box">
              <Search size={16} className="sdp-search-icon" />
              <input
                type="search"
                className="sdp-search-input"
                placeholder={`Search in ${shop.name}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div className="sdp-product-grid">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  style={{
                    opacity: shop.isOpen ? 1 : 0.65,
                    pointerEvents: shop.isOpen ? 'auto' : 'none'
                  }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="No products found"
              message={
                searchQuery
                  ? `No products match "${searchQuery}" in this category.`
                  : 'No products available in this category for this shop.'
              }
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
            />
          )}
        </section>

        {/* ── 5. About This Shop ── */}
        <section className="sdp-about-section">
          <h2 className="sdp-section-heading">About this shop</h2>
          <div className="sdp-about-card">
            <div className="sdp-about-grid">
              <div className="sdp-about-item">
                <MapPin size={20} className="sdp-about-icon" />
                <div>
                  <h4>Store Address</h4>
                  <p>{shop.address || 'Market Road, Ongole, Andhra Pradesh'}</p>
                </div>
              </div>

              <div className="sdp-about-item">
                <Clock size={20} className="sdp-about-icon" />
                <div>
                  <h4>Opening Hours</h4>
                  <p>{shop.openingHours || '07:00 AM – 09:00 PM (Everyday)'}</p>
                </div>
              </div>

              <div className="sdp-about-item">
                <Phone size={20} className="sdp-about-icon" />
                <div>
                  <h4>Contact Number</h4>
                  <p>{shop.phone || '+91 98765 43210'}</p>
                </div>
              </div>

              <div className="sdp-about-item">
                <Truck size={20} className="sdp-about-icon" />
                <div>
                  <h4>Delivery Radius</h4>
                  <p>{shop.deliveryRadius || '5 km radius around Ongole'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Delivery Information ── */}
        <div className="sdp-delivery-banner">
          <ShieldCheck size={24} className="sdp-delivery-icon" />
          <div>
            <h4>Fast Local Delivery</h4>
            <p>Delivered in 15–30 mins. Fresh products directly from {shop.name} to your doorstep.</p>
          </div>
        </div>

      </Container>
    </div>
  );
};

export default ShopDetailsPage;
