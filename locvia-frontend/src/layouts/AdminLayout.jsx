// src/layouts/AdminLayout.jsx
// Specific dashboard wrapper for System Administrators

import DashboardLayout from './DashboardLayout';
import { ShieldAlert, Users, Store, Package, Layers, ShoppingBag, Navigation, MessageSquare } from 'lucide-react';

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: ShieldAlert },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/shops', label: 'Shops', icon: Store },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Layers },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/delivery', label: 'Delivery', icon: Navigation },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
];

const AdminLayout = ({ children }) => {
  return (
    <DashboardLayout links={ADMIN_LINKS} roleName="Administrator">
      {children}
    </DashboardLayout>
  );
};

export default AdminLayout;
