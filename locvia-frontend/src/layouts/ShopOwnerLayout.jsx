// src/layouts/ShopOwnerLayout.jsx
// Dedicated dashboard layout wrapper for Shop Owners in Locvia (Module 19)

import DashboardLayout from './DashboardLayout';
import { ShopOwnerAuthProvider } from '../modules/shop-owner/auth/ShopOwnerAuthContext';
import { Store, Package, LayoutGrid, ShoppingBag, Store as ShopIcon, User, MessageSquare } from 'lucide-react';

const SHOP_LINKS = [
  { to: '/shop-owner/dashboard', label: 'Dashboard', icon: Store },
  { to: '/shop-owner/products', label: 'Products', icon: Package },
  { to: '/shop-owner/inventory', label: 'Inventory', icon: LayoutGrid },
  { to: '/shop-owner/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/shop-owner/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/shop-owner/shop-profile', label: 'Shop Profile', icon: ShopIcon },
  { to: '/shop-owner/profile', label: 'My Profile', icon: User },
];

const ShopOwnerLayoutContent = ({ children }) => {
  return (
    <DashboardLayout links={SHOP_LINKS} roleName="Shop Owner">
      {children}
    </DashboardLayout>
  );
};

const ShopOwnerLayout = ({ children }) => {
  return (
    <ShopOwnerAuthProvider>
      <ShopOwnerLayoutContent>{children}</ShopOwnerLayoutContent>
    </ShopOwnerAuthProvider>
  );
};

export default ShopOwnerLayout;
