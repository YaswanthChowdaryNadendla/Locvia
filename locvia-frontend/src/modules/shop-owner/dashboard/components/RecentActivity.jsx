// src/modules/shop-owner/dashboard/components/RecentActivity.jsx
// Recent Activity Timeline Feed for Module 19 — wired to real API

import { useState, useEffect } from 'react';
import { Activity, ShoppingBag } from 'lucide-react';
import { getOwnerShop, getOwnerOrders } from '../../../../services/shopOwnerService';

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getOwnerShop()
      .then(async (shop) => {
        if (!isMounted) return;
        if (shop?.id) {
          try {
            const orders = await getOwnerOrders(shop.id);
            if (isMounted && Array.isArray(orders)) {
              const logs = orders.slice(0, 5).map((o) => ({
                id: o.orderId || o.id,
                type: 'order',
                title: `Order #${o.orderId || o.id} (${(o.orderStatus || o.status || 'PLACED').replace(/_/g, ' ')})`,
                time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
              }));
              setActivities(logs);
            }
          } catch (err) {
            console.error('Error fetching activities:', err);
          }
        }
      })
      .catch((err) => console.error('Error fetching shop for activity:', err))
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
            <Activity size={18} className="text-primary" />
            <h3 className="dash-section-title" style={{ margin: 0 }}>Recent Activity</h3>
          </div>
          <p className="dash-section-sub">Live events and updates from your store</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
          Loading activities...
        </div>
      ) : activities.length === 0 ? (
        <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
          No recent activity. Real-time shop updates and order events will appear here.
        </div>
      ) : (
        <div className="activity-timeline-list">
          {activities.map((item) => (
            <div key={item.id} className="activity-timeline-item">
              <div className="timeline-icon-dot">
                <ShoppingBag size={14} style={{ color: '#4f46e5' }} />
              </div>
              <div className="timeline-content">
                <span className="activity-title">{item.title}</span>
                <span className="activity-time">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
