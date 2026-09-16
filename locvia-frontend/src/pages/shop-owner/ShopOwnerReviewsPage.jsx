// src/pages/shop-owner/ShopOwnerReviewsPage.jsx
// Module 36 — Shop Owner reads reviews for their shop's products (read-only)

import { useState, useMemo, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getOwnerShop } from '../../services/shopOwnerService';
import { getShopReviews, calculateReviewSummary, formatReviewDate } from '../../services/reviewService';
import StarRating from '../../components/reviews/StarRating';

import EmptyState from '../../components/common/EmptyState';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
];

export default function ShopOwnerReviewsPage() {
  const { user } = useAuth();
  const [ownerShop, setOwnerShop] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [sort, setSort] = useState('newest');
  const [filterStar, setFilterStar] = useState('all');

  useEffect(() => {
    getOwnerShop().then(shop => setOwnerShop(shop)).catch(() => setOwnerShop(null));
  }, []);

  useEffect(() => {
    if (ownerShop?.id) {
      setReviews(getShopReviews(ownerShop.id));
    }
  }, [ownerShop?.id]);

  const summary = useMemo(() => calculateReviewSummary(reviews), [reviews]);

  const filtered = useMemo(() => {
    let list = filterStar === 'all' ? [...reviews] : reviews.filter((r) => String(r.rating) === filterStar);
    switch (sort) {
      case 'oldest': list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'highest': list.sort((a, b) => b.rating - a.rating); break;
      case 'lowest': list.sort((a, b) => a.rating - b.rating); break;
      default: list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [reviews, sort, filterStar]);

  return (
    <div style={{ padding: '24px', maxWidth: '860px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
          Product Reviews
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          Customer reviews for {ownerShop?.name || 'your shop'} — read-only
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Reviews', value: summary.total },
          { label: 'Average Rating', value: summary.total > 0 ? summary.average.toFixed(1) : '—' },
          { label: '5★ Reviews', value: summary.distribution[5] || 0 },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          message="Customer reviews for your products will appear here once orders are delivered and reviewed."
        />
      ) : (
        <>
          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              aria-label="Sort reviews"
              style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', color: '#374151', background: '#fff', cursor: 'pointer' }}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={filterStar} onChange={(e) => setFilterStar(e.target.value)}
              aria-label="Filter by star rating"
              style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', color: '#374151', background: '#fff', cursor: 'pointer' }}>
              <option value="all">All Ratings</option>
              {[5,4,3,2,1].map((s) => <option key={s} value={s}>{s} ★</option>)}
            </select>
            <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6b7280' }}>
              {filtered.length} review{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No matching reviews"
              message={`No reviews found with ${filterStar} star${filterStar === '1' ? '' : 's'}.`}
              actionLabel="Show All Ratings"
              onAction={() => setFilterStar('all')}
            />
          ) : (
            filtered.map((review) => (
              <div key={review.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0c831f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                    {(review.userName || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{review.userName || 'Customer'}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{formatReviewDate(review.createdAt)}</div>
                  </div>
                  <StarRating rating={review.rating} size={14} />
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{review.comment}</p>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
