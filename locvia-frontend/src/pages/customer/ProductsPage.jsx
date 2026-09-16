// src/pages/customer/ProductsPage.jsx
// MODULE 9 — Product Listing Page

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Search, X, ShoppingBag, AlertCircle } from 'lucide-react';
import ProductCard from '../../components/products/ProductCard';
import ProductCardSkeleton from '../../components/common/loaders/ProductCardSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { getFriendlyErrorMessage } from '../../utils/errorHandler';
import { getProducts } from '../../services/productService';
import { getShopById } from '../../services/shopService';
import { categories as categoryAssets } from '../../data/categories';
import { formatRating } from '../../utils/formatters';

// Category pills derived from UI category assets
const CATEGORY_NAMES = ['All', ...categoryAssets.map(c => c.name)];

const ProductsPage = () => {
  const { shopId: routeShopId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Shop identification
  const activeShopId = routeShopId || searchParams.get('shop') || '';
  const [shop, setShop] = useState(null);

  // Filter & Search states
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [sort, setSort] = useState('Recommended');

  // Data states
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load shop details if shopId is present
  useEffect(() => {
    if (activeShopId) {
      getShopById(activeShopId).then(s => setShop(s)).catch(() => setShop(null));
    }
  }, [activeShopId]);

  // Sync filters to URL query string
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (query) params.set('q', query);
    if (activeShopId && !routeShopId) params.set('shop', activeShopId);
    setSearchParams(params, { replace: true });
  }, [selectedCategory, query, activeShopId, routeShopId, setSearchParams]);

  // Fetch products
  const fetchProductList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await getProducts({
        query,
        category: selectedCategory,
        shopId: activeShopId || null,
        sort,
      });
      setProducts(results);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Unable to load products right now.'));
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, activeShopId, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductList();
    }, 150);

    return () => clearTimeout(timer);
  }, [fetchProductList]);

  const clearFilters = () => {
    setQuery('');
    setSelectedCategory('All');
    setSort('Recommended');
  };


  return (
    <div className="pl-page-container animate-fade-in">

      {/* ── 1. Breadcrumb / Back ── */}
      <div className="pl-breadcrumb-bar">
        <button
          onClick={() => {
            if (activeShopId) {
              navigate(`/shops/${activeShopId}`);
            } else {
              navigate('/shops');
            }
          }}
          className="pl-back-btn"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
          <span>Back to {shop ? shop.name : 'Shops'}</span>
        </button>
      </div>

      {/* ── 2. Compact Shop Information Summary ── */}
      {shop && (
        <div className="pl-shop-summary-card">
          <h1 className="pl-shop-summary-title">{shop.name}</h1>
          <div className="pl-shop-summary-meta">
            <span className="pl-meta-badge">
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
              {formatRating(shop.rating)}
              <span style={{ fontWeight: 400, color: '#64748b' }}>({shop.reviewCount || 128})</span>
            </span>
            <span className="pl-meta-dot">•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} /> {shop.address || 'Ongole'}
            </span>
            <span className="pl-meta-dot">•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} /> Delivery in {shop.deliveryTime || '15–25 mins'}
            </span>
          </div>
        </div>
      )}

      {/* ── 3. Search Products Field ── */}
      <div className="pl-search-box">
        <Search size={18} className="pl-search-icon" />
        <input
          type="text"
          className="pl-search-input"
          placeholder={shop ? `Search products in ${shop.name}...` : 'Search products in this shop...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            className="pl-search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── 4. Category Filter Navigation (Horizontal Scrollable Pills) ── */}
      <div className="pl-category-nav-container">
        <div className="pl-category-nav-list" role="tablist">
          {CATEGORY_NAMES.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat}
              className={`pl-cat-pill ${selectedCategory === cat ? 'pl-cat-pill--active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── 5. Product Header & Controls ── */}
      <div className="pl-controls-row">
        <div>
          <h2 className="pl-section-title">
            {selectedCategory === 'All' ? 'Products' : selectedCategory}
          </h2>
          <span className="pl-product-count">
            {!loading && `${products.length} ${products.length === 1 ? 'product available' : 'products available'}`}
          </span>
        </div>

        {/* Sort Selector */}
        <select
          className="pl-sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort products"
        >
          <option value="Recommended">Sort: Recommended</option>
          <option value="Price: Low to High">Price: Low to High</option>
          <option value="Price: High to Low">Price: High to Low</option>
          <option value="Rating: High to Low">Rating: High to Low</option>
        </select>
      </div>

      {/* ── 6. Product Grid / Loading / Error / Empty States ── */}
      {loading ? (
        <div className="pl-product-grid" role="status" aria-busy="true" aria-label="Loading products">
          {Array.from({ length: 8 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Unable to load products"
          message={error}
          actionLabel="Try Again"
          onAction={fetchProductList}
        />
      ) : products.length > 0 ? (
        <div className="pl-product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="No products found"
          message={
            query
              ? `No products matched "${query}". Try another search query or clear your filters.`
              : 'No products available in this category. Try selecting another category.'
          }
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      )}

    </div>
  );
};

export default ProductsPage;
