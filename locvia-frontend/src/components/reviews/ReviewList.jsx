// src/components/reviews/ReviewList.jsx
// Module 36 — Review list with sort/filter, load-more, and delete confirmation

import { useState, useMemo } from 'react';
import { SortAsc, Filter } from 'lucide-react';
import ReviewCard from './ReviewCard';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Rating' },
  { value: 'lowest', label: 'Lowest Rating' },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: '5', label: '5 ★' },
  { value: '4', label: '4 ★' },
  { value: '3', label: '3 ★' },
  { value: '2', label: '2 ★' },
  { value: '1', label: '1 ★' },
];

const PAGE_SIZE = 8;

const ConfirmDeleteModal = ({ review, onCancel, onConfirm }) => (
  <div
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1200, padding: '16px',
    }}
    role="dialog"
    aria-modal="true"
    aria-label="Delete review confirmation"
    onClick={onCancel}
  >
    <div
      style={{
        background: '#fff', borderRadius: '16px', padding: '28px 24px',
        maxWidth: '360px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '12px' }}>🗑️</div>
      <h3 style={{ margin: '0 0 8px', textAlign: 'center', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
        Delete Review?
      </h3>
      <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', margin: '0 0 24px' }}>
        This cannot be undone. The review will be permanently removed.
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onCancel}
          autoFocus
          style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            border: '1px solid #d1d5db', background: '#f9fafb',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#374151',
          }}
          onFocus={(e) => { e.currentTarget.style.outline = '2px solid #0c831f'; }}
          onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            border: 'none', background: '#dc2626',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: '#fff',
          }}
          onFocus={(e) => { e.currentTarget.style.outline = '2px solid #dc2626'; }}
          onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const ReviewList = ({
  reviews = [],
  currentUserId,
  isAdmin = false,
  onEdit,
  onDelete,
  onUpdated,
}) => {
  const [sort, setSort] = useState('newest');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);

  const sorted = useMemo(() => {
    let list = filter === 'all' ? [...reviews] : reviews.filter((r) => String(r.rating) === filter);
    switch (sort) {
      case 'oldest': list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'highest': list.sort((a, b) => b.rating - a.rating); break;
      case 'lowest': list.sort((a, b) => a.rating - b.rating); break;
      default: list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [reviews, sort, filter]);

  const visible = sorted.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < sorted.length;

  const handleDeleteRequest = (review) => setPendingDelete(review);
  const handleDeleteConfirm = () => {
    if (pendingDelete && onDelete) onDelete(pendingDelete);
    setPendingDelete(null);
  };

  if (reviews.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💬</div>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: 0 }}>No reviews yet</p>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px', margin: '4px 0 0' }}>
          Be the first to review this product.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SortAsc size={13} style={{ color: '#9ca3af' }} />
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            aria-label="Sort reviews"
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', color: '#374151', background: '#fff', cursor: 'pointer' }}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={13} style={{ color: '#9ca3af' }} />
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            aria-label="Filter by star rating"
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', color: '#374151', background: '#fff', cursor: 'pointer' }}
          >
            {FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>
          {sorted.length} of {reviews.length}
        </span>
      </div>

      {/* Review cards */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '14px' }}>
          No reviews match this filter.
        </div>
      ) : (
        <>
          {visible.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDeleteRequest={handleDeleteRequest}
              onUpdated={onUpdated}
            />
          ))}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <button
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: '8px 20px', borderRadius: '8px',
                  border: '1px solid #d1d5db', background: '#f9fafb',
                  fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: 600,
                }}
                onFocus={(e) => { e.currentTarget.style.outline = '2px solid #0c831f'; }}
                onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
              >
                Load More ({sorted.length - visible.length} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      {pendingDelete && (
        <ConfirmDeleteModal
          review={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
};

export default ReviewList;
