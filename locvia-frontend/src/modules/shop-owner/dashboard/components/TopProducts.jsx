// src/modules/shop-owner/dashboard/components/TopProducts.jsx
// Top Selling Products ranking component for Module 19 — wired to real API

import { useState, useEffect } from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getOwnerShop, getOwnerProducts } from '../../../../services/shopOwnerService';

export default function TopProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getOwnerShop()
      .then(async (shop) => {
        if (!isMounted) return;
        if (shop?.id) {
          try {
            const list = await getOwnerProducts(shop.id);
            if (isMounted) {
              setProducts(Array.isArray(list) ? list.slice(0, 3) : []);
            }
          } catch (err) {
            console.error('Error fetching top products:', err);
          }
        }
      })
      .catch((err) => console.error('Error fetching shop for top products:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="dash-section-card">
      <div className="dash-section-header" style={{ marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trophy size={18} style={{ color: '#eab308' }} />
            <h3 className="dash-section-title" style={{ margin: 0 }}>Catalog Highlights</h3>
          </div>
          <p className="dash-section-sub">Active products in your store</p>
        </div>
        <Link to="/shop/products" className="dash-section-link">
          All Products <ChevronRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
          No products in your catalog yet. Use the "Add Product" button to create your first item.
        </div>
      ) : (
        <div className="top-products-list">
          {products.map((prod, idx) => (
            <div key={prod.id} className="top-product-row">
              <div className={`rank-badge rank-${idx + 1}`}>
                #{idx + 1}
              </div>
              <div className="top-product-details">
                <span className="top-product-name">{prod.name}</span>
                <span className="top-product-stats">Price: ₹{prod.price} • Stock: {prod.stock} units</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
