// src/modules/shop-owner/dashboard/components/LowStockCard.jsx
// Low Stock inventory alert card for Module 19 — wired to real API

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Edit3 } from 'lucide-react';
import { getOwnerShop, getOwnerProducts } from '../../../../services/shopOwnerService';

export default function LowStockCard() {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getOwnerShop()
      .then(async (shop) => {
        if (!isMounted) return;
        if (shop?.id) {
          try {
            const products = await getOwnerProducts(shop.id);
            if (isMounted) {
              const low = (products || []).filter((p) => Number(p.stock) <= 10);
              setLowStockItems(low.slice(0, 4));
            }
          } catch (err) {
            console.error('Error fetching low stock products:', err);
          }
        }
      })
      .catch((err) => console.error('Error fetching shop for low stock:', err))
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
            <AlertTriangle size={18} className="text-warning" />
            <h3 className="dash-section-title" style={{ margin: 0 }}>Low Stock Alerts</h3>
          </div>
          <p className="dash-section-sub">Restock items to prevent lost customer orders</p>
        </div>
        <Link to="/shop/inventory" className="dash-section-link">
          View Inventory <ChevronRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
          Checking inventory...
        </div>
      ) : lowStockItems.length === 0 ? (
        <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
          No low stock alerts. All active inventory levels are healthy!
        </div>
      ) : (
        <div className="low-stock-list">
          {lowStockItems.map((item) => (
            <div key={item.id} className="low-stock-item">
              <div className="low-stock-info">
                <span className="low-stock-name">{item.name}</span>
                <span className="low-stock-count-badge">Only {item.stock} left</span>
              </div>
              <Link to="/shop/inventory" className="stock-update-btn">
                <Edit3 size={14} /> Update
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
