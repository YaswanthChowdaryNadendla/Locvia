// src/modules/shop-owner/dashboard/components/StatsCards.jsx
// Overview Statistics Metric Cards displaying real owner shop data for Module 19

import { useState, useEffect } from 'react';
import { ShoppingBag, IndianRupee, Package, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { getOwnerShop, getOwnerProducts, getOwnerOrders } from '../../../../services/shopOwnerService';

export default function StatsCards() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getOwnerShop()
      .then(async (shop) => {
        if (!isMounted) return;
        if (shop?.id) {
          try {
            const [prods, ords] = await Promise.all([
              getOwnerProducts(shop.id),
              getOwnerOrders(shop.id),
            ]);
            if (isMounted) {
              setProducts(Array.isArray(prods) ? prods : []);
              setOrders(Array.isArray(ords) ? ords : []);
            }
          } catch (err) {
            console.error('Error loading stats data:', err);
          }
        }
      })
      .catch((err) => console.error('Error fetching owner shop for stats:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const lowStockCount = products.filter((p) => Number(p.stock) <= 10).length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.shopSubtotal || o.totalAmount || 0), 0);

  return (
    <div className="dashboard-stats-grid">
      {/* Card 1: Products */}
      <div className="dash-stat-card">
        <div className="stat-card-top">
          <span className="stat-card-title">Products</span>
          <div className="stat-card-icon-bg" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
            <Package size={20} />
          </div>
        </div>
        <div className="stat-card-body">
          <span className="stat-card-value">{loading ? '...' : products.length}</span>
          <span className="stat-card-label-sub">Active in your catalog</span>
        </div>
      </div>

      {/* Card 2: Orders */}
      <div className="dash-stat-card">
        <div className="stat-card-top">
          <span className="stat-card-title">Shop Orders</span>
          <div className="stat-card-icon-bg" style={{ backgroundColor: '#edf7ed', color: '#2e7d32' }}>
            <ShoppingBag size={20} />
          </div>
        </div>
        <div className="stat-card-body">
          <span className="stat-card-value">{loading ? '...' : orders.length}</span>
          <span className="stat-card-label-sub">Orders containing your products</span>
        </div>
      </div>

      {/* Card 3: Low Stock */}
      <div className="dash-stat-card urgent-border">
        <div className="stat-card-top">
          <span className="stat-card-title">Low Stock</span>
          <div className="stat-card-icon-bg" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={20} />
          </div>
        </div>
        <div className="stat-card-body">
          <span className="stat-card-value" style={{ color: '#dc2626' }}>{loading ? '...' : lowStockCount}</span>
          <span className="stat-card-label-sub">Products with stock ≤ 10</span>
        </div>
      </div>

      {/* Card 4: Total Revenue */}
      <div className="dash-stat-card">
        <div className="stat-card-top">
          <span className="stat-card-title">Total Revenue</span>
          <div className="stat-card-icon-bg" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
            <IndianRupee size={20} />
          </div>
        </div>
        <div className="stat-card-body">
          <span className="stat-card-value">{loading ? '...' : `₹${totalRevenue.toLocaleString('en-IN')}`}</span>
          <span className="stat-card-label-sub">Earned from completed sales</span>
        </div>
      </div>
    </div>
  );
}
