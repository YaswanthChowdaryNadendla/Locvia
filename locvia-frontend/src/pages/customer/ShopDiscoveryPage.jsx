// src/pages/customer/ShopDiscoveryPage.jsx
// Module 5 — Shop Discovery (complete redesign)

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, X, MapPin, SlidersHorizontal, Check,
  Star, Clock, Bike, ArrowRight, TrendingUp, RefreshCw,
  Store, AlertCircle,
} from 'lucide-react';
import Container from '../../components/common/Container';
import { useDeliveryLocation } from '../../context/LocationContext';
import { categories } from '../../data/categories';
import { getShops } from '../../services/shopService';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';

import ShopCardSkeleton from '../../components/common/loaders/ShopCardSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { getFriendlyErrorMessage } from '../../utils/errorHandler';

// ─── Sort options ────────────────────────────────────────────────────────────
const SORTS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'rating',      label: 'Top Rated' },
  { id: 'distance',    label: 'Nearest First' },
  { id: 'time',        label: 'Fastest Delivery' },
];

const RatingBadge = ({ rating }) => (
  <span className="sd-rating-badge">
    <Star size={11} fill="#f59e0b" color="#f59e0b" strokeWidth={1.5} />
    {rating?.toFixed(1)}
  </span>
);

// ─── Shop Card ────────────────────────────────────────────────────────────────
const DiscoveryShopCard = ({ shop }) => {
  const {
    id, name, description, image, category, distance,
    rating, deliveryTime, deliveryFee, isOpen, tags,
  } = shop;

  return (
    <Link to={`/shops/${id}`} className="sd-shop-card" aria-label={`Open ${name}`}>
      {/* Image */}
      <div className="sd-card-img-wrap">
        <img
          src={normalizeImageUrl(image, 'shop')}
          alt={name}
          onError={(e) => handleImageError(e, 'shop')}
          loading="lazy"
          className="sd-card-img"
        />

        {/* Category pill */}
        <span className="sd-card-cat-pill">{category}</span>

        {/* Closed overlay */}
        {!isOpen && (
          <div className="sd-card-closed-overlay">
            <span className="sd-closed-badge">Closed Now</span>
          </div>
        )}

        {/* Free delivery badge */}
        {deliveryFee === 0 && isOpen && (
          <span className="sd-card-free-pill">Free Delivery</span>
        )}
      </div>

      {/* Body */}
      <div className="sd-card-body">
        {/* Name + Rating */}
        <div className="sd-card-name-row">
          <h3 className="sd-card-name">{name}</h3>
          {rating && <RatingBadge rating={rating} />}
        </div>

        {/* Description */}
        <p className="sd-card-desc">{description}</p>

        {/* Meta chips */}
        <div className="sd-card-meta">
          <span className="sd-meta-chip">
            <Clock size={12} className="sd-meta-icon" />
            {deliveryTime}
          </span>
          <span className="sd-meta-chip">
            <MapPin size={12} className="sd-meta-icon" />
            {distance} km
          </span>
          <span className={`sd-meta-chip ${deliveryFee === 0 ? 'sd-meta-chip--free' : ''}`}>
            <Bike size={12} className="sd-meta-icon" />
            {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
          </span>
        </div>

        {/* Tags */}
        {tags?.length > 0 && (
          <div className="sd-card-tags">
            {tags.slice(0, 2).map(tag => (
              <span key={tag} className="sd-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};



// ─── Popular Shop Pill Card ───────────────────────────────────────────────────
const PopularPillCard = ({ shop }) => (
  <Link to={`/shops/${shop.id}`} className="sd-popular-card">
    <div className="sd-popular-img-wrap">
      <img
        src={normalizeImageUrl(shop.image, 'shop')}
        alt={shop.name}
        onError={(e) => handleImageError(e, 'shop')}
        loading="lazy"
        className="sd-popular-img"
      />
    </div>
    <div className="sd-popular-info">
      <p className="sd-popular-name">{shop.name}</p>
      <div className="sd-popular-meta">
        <Star size={11} fill="#f59e0b" color="#f59e0b" strokeWidth={1.5} />
        <span>{shop.rating?.toFixed(1)}</span>
        <span className="sd-popular-dot" />
        <Clock size={11} />
        <span>{shop.deliveryTime}</span>
      </div>
    </div>
    <ArrowRight size={16} className="sd-popular-arrow" />
  </Link>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const ShopDiscoveryPage = () => {
  const { locationDisplayText } = useDeliveryLocation();
  const [shops, setShops]         = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);

  // Filter state
  const [query, setQuery]           = useState('');
  const [category, setCategory]     = useState('All');
  const [sort, setSort]             = useState('recommended');
  const [openOnly, setOpenOnly]     = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortMenuRef  = useRef(null);
  const catScrollRef = useRef(null);

  // ── Fetch ──
  const fetchShops = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getShops({ query, category, sort, openOnly });
      setShops(data);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Unable to load shops. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [query, category, sort, openOnly]);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClearFilters = () => {
    setQuery('');
    setCategory('All');
    setSort('recommended');
    setOpenOnly(false);
  };

  const hasActiveFilters = query || category !== 'All' || openOnly || sort !== 'recommended';
  const activeSortLabel  = SORTS.find(s => s.id === sort)?.label ?? 'Recommended';

  return (
    <div className="sd-page">

      {/* ── Hero header ─────────────────────────────────────────── */}
      <div className="sd-header">
        <Container>
          <div className="sd-header-inner">
            {/* Location pill */}
            <div className="sd-location-pill">
              <MapPin size={14} className="sd-location-icon" />
              <span className="sd-location-label">Delivering to</span>
              <span className="sd-location-value">{locationDisplayText}</span>
            </div>

            <h1 className="sd-page-title">Discover Local Shops</h1>
            <p className="sd-page-subtitle">
              Shop from trusted stores near you and get your essentials delivered fast.
            </p>

            {/* Search */}
            <div className="sd-search-wrap">
              <Search size={18} className="sd-search-icon" />
              <input
                type="search"
                className="sd-search-input"
                placeholder="Search shops near you..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search shops"
              />
              {query && (
                <button className="sd-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* ── Sticky filter bar ───────────────────────────────────── */}
      <div className="sd-filter-bar">
        <Container>
          {/* Category pills — horizontally scrollable */}
          <div className="sd-cat-scroll" ref={catScrollRef} role="tablist" aria-label="Shop categories">
            {['All', ...categories.map(c => c.name)].map(cat => (
              <button
                key={cat}
                role="tab"
                aria-selected={category === cat}
                onClick={() => setCategory(cat)}
                className={`sd-cat-pill ${category === cat ? 'sd-cat-pill--active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Row 2: quick filters + sort */}
          <div className="sd-filter-row">
            <div className="sd-quick-filters">
              {/* Open Now toggle */}
              <button
                className={`sd-quick-btn ${openOnly ? 'sd-quick-btn--on' : ''}`}
                onClick={() => setOpenOnly(v => !v)}
                aria-pressed={openOnly}
              >
                {openOnly && <Check size={13} />}
                Open Now
              </button>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button className="sd-quick-btn sd-quick-btn--clear" onClick={handleClearFilters}>
                  <RefreshCw size={13} />
                  Clear
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="sd-sort-wrap" ref={sortMenuRef}>
              <button
                className="sd-sort-btn"
                onClick={() => setShowSortMenu(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={showSortMenu}
              >
                <SlidersHorizontal size={14} />
                {activeSortLabel}
              </button>

              {showSortMenu && (
                <div className="sd-sort-menu" role="listbox">
                  {SORTS.map(s => (
                    <button
                      key={s.id}
                      role="option"
                      aria-selected={sort === s.id}
                      className={`sd-sort-option ${sort === s.id ? 'sd-sort-option--active' : ''}`}
                      onClick={() => { setSort(s.id); setShowSortMenu(false); }}
                    >
                      {s.label}
                      {sort === s.id && <Check size={15} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* ── Main content ────────────────────────────────────────── */}
      <Container className="sd-main">

        {/* Error */}
        {error && (
          <EmptyState
            icon={AlertCircle}
            title="Unable to load shops"
            message={error}
            actionLabel="Try Again"
            onAction={fetchShops}
          />
        )}

        {/* Loading skeletons */}
        {!error && isLoading && (
          <div className="sd-grid" role="status" aria-busy="true" aria-label="Loading shops">
            {Array.from({ length: 8 }).map((_, i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!error && !isLoading && shops.length === 0 && (
          <EmptyState
            icon={Store}
            title="No shops found"
            message={
              query.trim()
                ? `No shops matched "${query}". Try searching for another shop name or category.`
                : 'No shops available matching your selected filters. Try clearing your filters.'
            }
            actionLabel="Clear Filters"
            onAction={handleClearFilters}
          />
        )}

        {/* Shop Grid */}
        {!error && !isLoading && shops.length > 0 && (
          <>
            <div className="sd-results-header">
              <h2 className="sd-section-title">
                {category === 'All' ? 'Shops Near You' : category + ' Shops'}
              </h2>
              <span className="sd-results-count">{shops.length} shops</span>
            </div>
            <p className="sd-section-sub">Fast delivery from local stores</p>

            <div className="sd-grid">
              {shops.map(shop => (
                <DiscoveryShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          </>
        )}

        {/* ── Popular Near You ─────────────────────────────────── */}
        {!isLoading && !error && shops.length > 0 && (() => {
          const popularShops = [...shops]
            .filter(s => s.rating)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 4);
          if (popularShops.length === 0) return null;
          return (
            <section className="sd-popular-section">
              <div className="sd-popular-header">
                <TrendingUp size={20} className="sd-popular-icon" />
                <div>
                  <h2 className="sd-section-title">Popular Near You</h2>
                  <p className="sd-section-sub">High-rated shops with fast delivery</p>
                </div>
              </div>

              <div className="sd-popular-list">
                {popularShops.map(shop => (
                  <PopularPillCard key={shop.id} shop={shop} />
                ))}
              </div>
            </section>
          );
        })()}

      </Container>
    </div>
  );
};

export default ShopDiscoveryPage;
