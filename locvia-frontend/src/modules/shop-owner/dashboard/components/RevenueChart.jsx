// src/modules/shop-owner/dashboard/components/RevenueChart.jsx
// Lightweight SVG/CSS Revenue Analytics Chart for Module 19 — wired to real API

import { useState, useEffect } from 'react';
import { IndianRupee } from 'lucide-react';
import { getOwnerShop, getOwnerOrders } from '../../../../services/shopOwnerService';

export default function RevenueChart() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getOwnerShop()
      .then(async (shop) => {
        if (!isMounted) return;
        if (shop?.id) {
          try {
            const list = await getOwnerOrders(shop.id);
            if (isMounted) {
              setOrders(Array.isArray(list) ? list : []);
            }
          } catch (err) {
            console.error('Error fetching orders for revenue:', err);
          }
        }
      })
      .catch((err) => console.error('Error fetching shop for revenue:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalPeriodRevenue = orders.reduce((acc, o) => {
    return acc + (o.shopSubtotal || o.totalAmount || o.pricing?.finalTotal || 0);
  }, 0);

  return (
    <div className="dash-section-card">
      <div className="dash-section-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="dash-section-title">Revenue Overview</h3>
            <span className="revenue-total-pill">
              <IndianRupee size={12} />
              ₹{totalPeriodRevenue.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="dash-section-sub">Sales performance from completed customer orders</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          Loading revenue data...
        </div>
      ) : orders.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
          No completed sales yet. As orders are fulfilled, your revenue timeline will appear here.
        </div>
      ) : (
        <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>
            ₹{totalPeriodRevenue.toLocaleString('en-IN')}
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '4px' }}>
            Total revenue generated across {orders.length} order{orders.length === 1 ? '' : 's'}.
          </p>
        </div>
      )}
    </div>
  );
}
