// src/modules/shop-owner/dashboard/components/OrderStatusSummary.jsx
// Visual Order Status Breakdown Summary for Module 19 — wired to real API

import { useState, useEffect } from 'react';
import { getOwnerShop, getOwnerOrders } from '../../../../services/shopOwnerService';

const STATUS_CONFIG = [
  { key: 'PLACED', label: 'New', color: '#3b82f6' },
  { key: 'CONFIRMED', label: 'Confirmed', color: '#8b5cf6' },
  { key: 'PREPARING', label: 'Preparing', color: '#ea580c' },
  { key: 'READY_FOR_PICKUP', label: 'Ready', color: '#0284c7' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: '#16a34a' },
  { key: 'DELIVERED', label: 'Delivered', color: '#2563eb' },
];

export default function OrderStatusSummary() {
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
            console.error('Error fetching orders for summary:', err);
          }
        }
      })
      .catch((err) => console.error('Error fetching shop for summary:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalCount = orders.length;

  return (
    <div className="dash-section-card">
      <div className="dash-section-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h3 className="dash-section-title">Order Status Overview</h3>
          <p className="dash-section-sub">
            {totalCount > 0 ? `Total ${totalCount} active/past orders` : 'No orders received yet'}
          </p>
        </div>
      </div>

      <div className="status-summary-grid">
        {STATUS_CONFIG.map((item) => {
          const count = orders.filter((o) => {
            const st = (o.orderStatus || o.status || '').toUpperCase();
            return st === item.key || (item.key === 'PLACED' && st === 'NEW');
          }).length;

          return (
            <div key={item.key} className="status-summary-box" style={{ borderColor: `${item.color}30` }}>
              <div className="status-summary-left">
                <span className="status-dot-indicator" style={{ backgroundColor: item.color }} />
                <span className="status-summary-name">{item.label}</span>
              </div>
              <span className="status-summary-count" style={{ color: item.color }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
