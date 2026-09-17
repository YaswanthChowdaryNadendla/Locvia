// src/layouts/ShopOwnerLayout.jsx
// Dedicated dashboard layout wrapper for Shop Owners in Locvia (Module 19)
// Includes a pending-approval banner for accounts awaiting admin review.

import DashboardLayout from './DashboardLayout';
import { ShopOwnerAuthProvider } from '../modules/shop-owner/auth/ShopOwnerAuthContext';
import { Store, Package, LayoutGrid, ShoppingBag, Store as ShopIcon, User, MessageSquare, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SHOP_LINKS = [
  { to: '/shop-owner/dashboard', label: 'Dashboard', icon: Store },
  { to: '/shop-owner/products', label: 'Products', icon: Package },
  { to: '/shop-owner/inventory', label: 'Inventory', icon: LayoutGrid },
  { to: '/shop-owner/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/shop-owner/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/shop-owner/shop-profile', label: 'Shop Profile', icon: ShopIcon },
  { to: '/shop-owner/profile', label: 'My Profile', icon: User },
];

/**
 * Renders a full-page banner when the shop owner's account is PENDING or REJECTED.
 * Operational content is hidden until Admin approves the account.
 */
const ApprovalGuard = ({ children }) => {
  const { user } = useAuth();
  const status = user?.accountStatus;

  if (status === 'PENDING') {
    return (
      <>
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '1px solid #FDE68A',
            borderRadius: '16px',
            padding: '32px 28px',
            margin: '24px auto',
            maxWidth: '640px',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(245,158,11,0.12)',
          }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF3C7', border: '2px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <Clock size={32} color="#D97706" />
          </div>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: 700, color: '#78350F' }}>
            Account Pending Approval
          </h2>
          <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#92400E', lineHeight: 1.6 }}>
            Your Shop Owner account is currently under review by the Locvia Admin team.
            You will be notified once your account is approved, after which you can start
            managing your shop and receiving orders.
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#B45309' }}>
            If you have any questions, please contact{' '}
            <a href="mailto:support@locvia.com" style={{ color: '#D97706', fontWeight: 600 }}>support@locvia.com</a>
          </p>
        </div>
        {/* Show limited navigation (dashboard/profile only) but no operational content */}
        <div style={{ display: 'none' }}>{children}</div>
      </>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
          border: '1px solid #FECDD3',
          borderRadius: '16px',
          padding: '32px 28px',
          margin: '24px auto',
          maxWidth: '640px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(220,38,38,0.1)',
        }}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FFE4E6', border: '2px solid #F87171', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <XCircle size={32} color="#DC2626" />
        </div>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: 700, color: '#7F1D1D' }}>
          Account Not Approved
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#991B1B', lineHeight: 1.6 }}>
          Your Shop Owner account application was not approved at this time.
          Please contact the Locvia support team for more information or to appeal this decision.
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: '#B91C1C' }}>
          Contact:{' '}
          <a href="mailto:support@locvia.com" style={{ color: '#DC2626', fontWeight: 600 }}>support@locvia.com</a>
        </p>
      </div>
    );
  }

  return children;
};

const ShopOwnerLayoutContent = ({ children }) => {
  return (
    <DashboardLayout links={SHOP_LINKS} roleName="Shop Owner">
      <ApprovalGuard>{children}</ApprovalGuard>
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
