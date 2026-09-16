// src/modules/shop-owner/dashboard/components/ShopPerformance.jsx
// Shop Performance Metrics card for Module 19

import { ShieldCheck, Clock, Award } from 'lucide-react';
import { useShopOwnerAuth } from '../../auth/ShopOwnerAuthContext';

export default function ShopPerformance() {
  const { shopOwner } = useShopOwnerAuth();

  const acceptance = shopOwner?.acceptanceRate || 96;
  const prepRate = shopOwner?.onTimePrepRate || 92;
  const rating = shopOwner?.rating || 4.7;

  return (
    <div className="dash-section-card">
      <div className="dash-section-header" style={{ marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={18} className="text-primary" />
            <h3 className="dash-section-title" style={{ margin: 0 }}>Shop Performance</h3>
          </div>
          <p className="dash-section-sub">Quality scores and customer satisfaction</p>
        </div>
      </div>

      <div className="performance-card-inner">
        {/* Rating Hero Box */}
        <div className="performance-rating-box">
          <div className="rating-score-row">
            <span className="rating-score-num">{rating}</span>
            <div className="rating-stars">
              {'★'.repeat(Math.floor(rating))}
              {rating % 1 !== 0 && '★'}
            </div>
          </div>
          <span className="rating-verdict">★ ★ ★ ★ ★ Excellent Performance</span>
        </div>

        <div className="performance-metrics-grid">
          <div className="perf-metric-item">
            <ShieldCheck size={18} style={{ color: '#16a34a' }} />
            <div>
              <span className="perf-metric-val">{acceptance}%</span>
              <span className="perf-metric-lbl">Order Acceptance</span>
            </div>
          </div>

          <div className="perf-metric-item">
            <Clock size={18} style={{ color: '#2563eb' }} />
            <div>
              <span className="perf-metric-val">{prepRate}%</span>
              <span className="perf-metric-lbl">On-time Preparation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
