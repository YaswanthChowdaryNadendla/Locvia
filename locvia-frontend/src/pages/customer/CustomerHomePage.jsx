// src/pages/customer/CustomerHomePage.jsx
// Module 7 — Customer Home Page
// Real data: categories from data/categories.js (UI assets), shops from backend API.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useDeliveryLocation } from '../../context/LocationContext';
import Container from '../../components/common/Container';
import ShopCard from '../../components/shops/ShopCard';
import { categories } from '../../data/categories';
import { getShops } from '../../services/api/shopApi';
import heroImage from '../../assets/hero1.png';

const CustomerHomePage = () => {
  const { locationDisplayText } = useDeliveryLocation();
  const [nearbyShops, setNearbyShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(true);

  useEffect(() => {
    const loadShops = async () => {
      try {
        const response = await getShops({ size: 8 });
        const shopList = Array.isArray(response) ? response
          : (response?.content ? response.content : []);
        setNearbyShops(shopList);
      } catch (err) {
        console.error('Failed to load shops:', err);
        setNearbyShops([]);
      } finally {
        setShopsLoading(false);
      }
    };
    loadShops();
  }, []);

  return (
    <div className="customer-home-page animate-fade-in">

      {/* ── 1. Hero / Promotional Section ── */}
      <div className="hero-outer">
        <div className="hero-banner">

          {/* LEFT: Hero Content */}
          <div className="hero-left">

            {/* Badge */}
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Delivering to {locationDisplayText}
            </div>

            {/* Headline */}
            <h1 className="hero-headline">
              Everything <span className="hero-headline-accent">Local.</span><br />
              Delivered Fast.
            </h1>

            {/* Description */}
            <p className="hero-desc">
              Shop fresh groceries and daily essentials from trusted local shops near you.
            </p>

            {/* CTA Row */}
            <div className="hero-cta-row">
              <Link to="/shops" className="hero-btn-primary">
                Shop Nearby <ArrowRight size={18} />
              </Link>
              <Link to="/shops" className="hero-btn-secondary">
                Explore Shops
              </Link>
            </div>

          </div>{/* /hero-left */}

          {/* RIGHT: Hero Visual */}
          <div className="hero-visual">
            <img
              src={heroImage}
              alt="Fresh local groceries — vegetables, fruits and essentials in a Locvia bag"
              className="hero-visual-img"
              loading="eager"
            />
          </div>{/* /hero-visual */}

        </div>{/* /hero-banner */}
      </div>{/* /hero-outer */}


      {/* ── 2. Shop by Category ── */}
      <section className="lv-cat-section section-padding">
        <Container>
          <div className="section-header" style={{ marginBottom: '1.25rem' }}>
            <h2 className="lv-cat-title" style={{ margin: 0 }}>Shop by Category</h2>
          </div>
          <div className="lv-cat-grid">
            {categories.map((cat) => (
              <Link
                to={`/customer/products?category=${encodeURIComponent(cat.name)}`}
                key={cat.id}
                className="lv-cat-item"
              >
                <div className={`lv-cat-img-wrap lv-cat-crop-${cat.crop}`}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="lv-cat-name">{cat.name}</div>
              </Link>
            ))}
          </div>
        </Container>
      </section>


      {/* ── 3. Nearby Shops ── */}
      <section className="lv-nearby-section">
        <Container>
          <div className="lv-nearby-header">
            <div>
              <h2 className="lv-nearby-title">Nearby Shops</h2>
              <p className="lv-nearby-subtitle">Local stores delivering near you</p>
            </div>
            <Link to="/shops" className="lv-nearby-view-all">
              <span>View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {shopsLoading ? (
            <div className="lv-nearby-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="shop-card-skeleton" style={{
                  height: '200px',
                  background: '#f3f4f6',
                  borderRadius: '12px',
                  animation: 'pulse 2s infinite'
                }} />
              ))}
            </div>
          ) : nearbyShops.length > 0 ? (
            <div className="lv-nearby-grid">
              {nearbyShops.map(shop => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                No shops are available in your area yet. Check back soon!
              </p>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Shop owners can register their shops from the shop owner portal.
              </p>
            </div>
          )}
        </Container>
      </section>

    </div>
  );
};

export default CustomerHomePage;
