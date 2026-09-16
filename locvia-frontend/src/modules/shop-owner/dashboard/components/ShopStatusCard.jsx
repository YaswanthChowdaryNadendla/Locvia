// src/modules/shop-owner/dashboard/components/ShopStatusCard.jsx
// Prominent Shop Status Open/Closed toggle card for Module 19

import { Store, Power } from 'lucide-react';
import { useShopOwnerAuth } from '../../auth/ShopOwnerAuthContext';

export default function ShopStatusCard() {
  const { isShopOpen, toggleShopStatus } = useShopOwnerAuth();

  return (
    <div className={`shop-status-card ${isShopOpen ? 'open' : 'closed'}`}>
      <div className="shop-status-left">
        <div className="status-indicator-icon">
          <span className={`status-dot ${isShopOpen ? 'dot-open' : 'dot-closed'}`} />
          <Store size={22} />
        </div>
        <div className="status-text-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="status-heading">
              {isShopOpen ? 'Shop is Open' : 'Shop is Closed'}
            </h2>
            <span className={`status-pill ${isShopOpen ? 'pill-open' : 'pill-closed'}`}>
              {isShopOpen ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <p className="status-subtext">
            {isShopOpen
              ? 'Customers can currently discover your shop and place fresh grocery orders.'
              : 'Your shop is currently offline. Customers cannot place new orders.'}
          </p>
        </div>
      </div>

      <button
        onClick={toggleShopStatus}
        className={`shop-toggle-btn ${isShopOpen ? 'btn-close-shop' : 'btn-open-shop'}`}
      >
        <Power size={18} />
        <span>{isShopOpen ? 'Close Shop' : 'Open Shop'}</span>
      </button>
    </div>
  );
}
