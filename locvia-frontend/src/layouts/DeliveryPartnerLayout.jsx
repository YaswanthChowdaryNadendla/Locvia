// src/layouts/DeliveryPartnerLayout.jsx
// Specific dashboard wrapper for Delivery Partners (Module 24)
// Includes a pending-approval banner for accounts awaiting admin review.

import DashboardLayout from './DashboardLayout';
import { LayoutDashboard, Compass, PackageCheck, DollarSign, User, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DELIVERY_LINKS = [
  { to: '/delivery/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/delivery/requests', label: 'Delivery Requests', icon: Compass },
  { to: '/delivery/active', label: 'Active Delivery', icon: PackageCheck },
  { to: '/delivery/earnings', label: 'Earnings', icon: DollarSign },
  { to: '/delivery/profile', label: 'Profile', icon: User },
];

/**
 * Renders a full-page banner when the delivery partner's account is PENDING or REJECTED.
 * Operational delivery content is hidden until Admin approves the account.
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
            Your Delivery Partner account is currently under review by the Locvia Admin team.
            Once approved, you will be able to view and accept delivery requests.
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#B45309' }}>
            Questions? Contact{' '}
            <a href="mailto:support@locvia.com" style={{ color: '#D97706', fontWeight: 600 }}>support@locvia.com</a>
          </p>
        </div>
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
          Your Delivery Partner account application was not approved at this time.
          Please contact the Locvia support team for more information.
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

const DeliveryPartnerLayout = ({ children }) => {
  return (
    <DashboardLayout links={DELIVERY_LINKS} roleName="Delivery Partner">
      <ApprovalGuard>{children}</ApprovalGuard>
    </DashboardLayout>
  );
};

export default DeliveryPartnerLayout;
