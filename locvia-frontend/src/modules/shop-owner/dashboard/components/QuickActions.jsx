// src/modules/shop-owner/dashboard/components/QuickActions.jsx
// Quick Action buttons for Module 19

import { Link } from 'react-router-dom';
import { PlusCircle, Package, ShoppingBag, Settings } from 'lucide-react';

export default function QuickActions() {
  return (
    <div className="quick-actions-bar">
      <h3 className="quick-actions-heading">Quick Actions</h3>
      <div className="quick-actions-grid">
        <Link to="/shop-owner/products" className="quick-btn primary">
          <PlusCircle size={18} />
          <span>+ Add Product</span>
        </Link>
        <Link to="/shop-owner/products" className="quick-btn secondary">
          <Package size={18} />
          <span>Manage Products</span>
        </Link>
        <Link to="/shop-owner/orders" className="quick-btn secondary">
          <ShoppingBag size={18} />
          <span>View Orders</span>
        </Link>
        <Link to="/shop-owner/inventory" className="quick-btn secondary">
          <Settings size={18} />
          <span>Manage Inventory</span>
        </Link>
      </div>
    </div>
  );
}
