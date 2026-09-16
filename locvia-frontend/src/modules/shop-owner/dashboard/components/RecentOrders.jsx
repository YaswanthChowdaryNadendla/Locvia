// src/modules/shop-owner/dashboard/components/RecentOrders.jsx
// Recent Orders Table for Module 19 — wired to real API

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Eye, ShoppingBag } from 'lucide-react';
import { getOwnerShop, getOwnerOrders } from '../../../../services/shopOwnerService';
import EmptyState from '../../../../components/common/EmptyState';

export default function RecentOrders() {
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
              setOrders(Array.isArray(list) ? list.slice(0, 5) : []);
            }
          } catch (err) {
            console.error('Error fetching recent orders:', err);
          }
        }
      })
      .catch((err) => console.error('Error fetching shop for recent orders:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadgeClass = (status = '') => {
    switch (status.toUpperCase()) {
      case 'NEW':
      case 'PLACED': return 'badge-new';
      case 'PREPARING': return 'badge-preparing';
      case 'READY':
      case 'READY_FOR_PICKUP': return 'badge-ready';
      case 'OUT_FOR_DELIVERY': return 'badge-out';
      case 'DELIVERED': return 'badge-delivered';
      case 'CANCELLED': return 'badge-cancelled';
      default: return 'badge-default';
    }
  };

  const formatStatus = (status = '') => {
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="dash-section-card">
      <div className="dash-section-header">
        <div>
          <h3 className="dash-section-title">Recent Orders</h3>
          <p className="dash-section-sub">Fulfill incoming grocery orders promptly</p>
        </div>
        <Link to="/shop/orders" className="dash-section-link">
          View All Orders <ChevronRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No recent orders"
          message="Incoming customer orders will appear here in real time."
        />
      ) : (
        <div className="recent-orders-table-wrapper">
          <table className="recent-orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const itemCount = Array.isArray(order.items) ? order.items.length : 0;
                const total = order.shopSubtotal || order.totalAmount || order.pricing?.finalTotal || 0;
                const customerName = order.address?.fullName || order.customerName || 'Customer';
                const timeStr = order.createdAt
                  ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Recent';

                return (
                  <tr key={order.id || order.orderId}>
                    <td>
                      <span className="order-id-code">#{order.orderId || order.id}</span>
                    </td>
                    <td>
                      <span className="customer-name-text">{customerName}</span>
                    </td>
                    <td>
                      <span className="items-count-text">{itemCount} items</span>
                    </td>
                    <td>
                      <span className="order-total-text">₹{total}</span>
                    </td>
                    <td>
                      <span className={`status-badge-pill ${getStatusBadgeClass(order.orderStatus || order.status)}`}>
                        {formatStatus(order.orderStatus || order.status || 'PLACED')}
                      </span>
                    </td>
                    <td>
                      <span className="time-elapsed-text">{timeStr}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/shop/orders/${order.orderId || order.id}`} className="order-view-btn">
                        <Eye size={14} /> View Order
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
