// src/pages/admin/AdminReviewsPage.jsx
// Module 36 — Admin: view-only review moderation (can delete flagged reviews)

import { useState, useMemo, useEffect, useCallback } from 'react';
import { MessageSquare, Trash2, Search, RefreshCw } from 'lucide-react';
import {
  getAllReviews,
  deleteReview,
  calculateReviewSummary,
  formatReviewDate,
} from '../../services/reviewService';
import StarRating from '../../components/reviews/StarRating';
import EmptyState from '../../components/common/EmptyState';
import { ButtonLoader } from '../../components/common/loaders';

const Toast = ({ msg, type }) => (
  <div style={{
    position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000,
    background: type === 'success' ? '#0c831f' : '#dc2626',
    color: '#fff', padding: '12px 20px', borderRadius: '10px',
    fontSize: '14px', fontWeight: 600,
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    animation: 'fadeInUp 0.25s ease',
  }}>
    {msg}
  </div>
);

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [sort, setSort] = useState('newest');
  const [starFilter, setStarFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(() => setReviews(getAllReviews()), []);
  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => calculateReviewSummary(reviews), [reviews]);

  const filtered = useMemo(() => {
    let list = starFilter === 'all' ? [...reviews] : reviews.filter((r) => String(r.rating) === starFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        (r.userName || '').toLowerCase().includes(q) ||
        (r.comment || '').toLowerCase().includes(q) ||
        (r.productId || '').toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case 'oldest': list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'highest': list.sort((a, b) => b.rating - a.rating); break;
      case 'lowest': list.sort((a, b) => a.rating - b.rating); break;
      default: list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [reviews, sort, starFilter, search]);

  const handleDeleteConfirm = async () => {
    if (!pendingDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      // Admin can delete any review — bypass ownership check by passing matching userId
      const all = getAllReviews();
      const rev = all.find((r) => r.id === pendingDelete.id);
      if (rev) deleteReview(rev.id, rev.userId);
      showToast('Review deleted.');
      load();
    } catch {
      showToast('Failed to delete review.', 'error');
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Reviews Moderation</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>View and moderate all product reviews on the platform</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: 600 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Reviews', value: summary.total },
          { label: 'Average Rating', value: summary.total > 0 ? summary.average.toFixed(1) : '—' },
          { label: '1★ Reviews', value: summary.distribution[1] || 0 },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews…"
            style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', color: '#374151', boxSizing: 'border-box' }} />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', color: '#374151', background: '#fff', cursor: 'pointer' }}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
        <select value={starFilter} onChange={(e) => setStarFilter(e.target.value)} aria-label="Filter by star"
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', color: '#374151', background: '#fff', cursor: 'pointer' }}>
          <option value="all">All Ratings</option>
          {[5,4,3,2,1].map((s) => <option key={s} value={s}>{s} ★</option>)}
        </select>
        <span style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div style={{ marginBottom: '24px' }}>
          <EmptyState
            icon={MessageSquare}
            title={reviews.length === 0 ? 'No reviews on the platform yet' : 'No reviews match your filters'}
            message={
              reviews.length === 0
                ? 'Product reviews submitted by customers will appear here for moderation.'
                : 'Try adjusting your search query or clearing star rating filters.'
            }
            actionLabel={reviews.length > 0 ? 'Reset Filters' : undefined}
            onAction={reviews.length > 0 ? () => { setSearch(''); setStarFilter('all'); setSort('newest'); } : undefined}
          />
        </div>
      )}

      {/* Review rows */}
      {filtered.map((review) => (
        <div key={review.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0c831f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                {(review.userName || 'C').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{review.userName || 'Customer'}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{formatReviewDate(review.createdAt)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <StarRating rating={review.rating} size={14} />
              <button onClick={() => setPendingDelete(review)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fff5f5', cursor: 'pointer', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
          <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {review.productId && <span style={{ fontSize: '11px', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '20px' }}>Product #{review.productId}</span>}
            {review.shopId && <span style={{ fontSize: '11px', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '20px' }}>Shop #{review.shopId}</span>}
            {review.verifiedPurchase && <span style={{ fontSize: '11px', color: '#0c831f', background: '#f0fdf4', padding: '2px 8px', borderRadius: '20px', border: '1px solid #bbf7d0' }}>Verified Purchase</span>}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{review.comment}</p>
        </div>
      ))}

      {/* Delete confirmation */}
      {pendingDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
          role="dialog" aria-modal="true" onClick={() => setPendingDelete(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 24px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', textAlign: 'center', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>Delete Review?</h3>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', margin: '0 0 6px' }}>
              By <strong>{pendingDelete.userName}</strong>
            </p>
            <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', margin: '0 0 24px', fontStyle: 'italic' }}>
              "{pendingDelete.comment.slice(0, 80)}{pendingDelete.comment.length > 80 ? '…' : ''}"
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setPendingDelete(null)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancel
              </button>
              <button onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: isDeleting ? '#94a3b8' : '#dc2626', fontSize: '14px', fontWeight: 700, cursor: isDeleting ? 'not-allowed' : 'pointer', color: '#fff' }}>
                {isDeleting ? <ButtonLoader size={14} color="#ffffff" text="Deleting..." /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
