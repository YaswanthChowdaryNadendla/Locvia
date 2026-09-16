// src/layouts/DeliveryPartnerLayout.jsx
// Specific dashboard wrapper for Delivery Partners (Module 24)

import DashboardLayout from './DashboardLayout';
import { LayoutDashboard, Compass, PackageCheck, DollarSign, User } from 'lucide-react';

const DELIVERY_LINKS = [
  { to: '/delivery/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/delivery/requests', label: 'Delivery Requests', icon: Compass },
  { to: '/delivery/active', label: 'Active Delivery', icon: PackageCheck },
  { to: '/delivery/earnings', label: 'Earnings', icon: DollarSign },
  { to: '/delivery/profile', label: 'Profile', icon: User },
];

const DeliveryPartnerLayout = ({ children }) => {
  return (
    <DashboardLayout links={DELIVERY_LINKS} roleName="Delivery Partner">
      {children}
    </DashboardLayout>
  );
};

export default DeliveryPartnerLayout;

