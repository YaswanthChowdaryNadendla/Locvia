// src/components/reviews/ReviewCard.jsx
// Module 36 — Single review display card

import { useState } from 'react';
import { ThumbsUp, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import StarRating from './StarRating';
import { voteHelpful, formatReviewDate } from '../../services/reviewService';

const ReviewCard = ({
  review,
  currentUserId,
  isAdmin = false,
  onEdit,
  onDeleteRequest,
  onUpdated,
}) => {
  const isOwn = currentUserId && review.userId === currentUserId;
  const [helpfulCount, setHelpfulCount] = useState(review.helpful || 0);
  const [hasVoted, setHasVoted] = useState(
    currentUserId ? (review.helpfulVotedBy || []).includes(currentUserId) : false
  );

  const handleHelpful = () => {
    if (!currentUserId || isOwn) return;
    const newCount = voteHelpful(review.id, currentUserId);
    if (newCount !== null) {
      setHelpfulCount(newCount);
      setHasVoted(!hasVoted);
      onUpdated && onUpdated();
    }
  };

  // Safe display name (never expose email/phone)
  const displayName = review.userName || 'Customer';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        {/* Avatar + name + date */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div
            aria-hidden="true"
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0c831f, #16a34a)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '14px', flexShrink: 0,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                {displayName}
              </span>
              {isOwn && (
                <span style={{ fontSize: '10px', background: '#f0fdf4', color: '#15803d', padding: '1px 6px', borderRadius: '20px', border: '1px solid #bbf7d0', fontWeight: 600 }}>
                  You
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              {formatReviewDate(review.updatedAt || review.createdAt)}
              {review.updatedAt && ' (edited)'}
            </div>
          </div>
        </div>

        {/* Edit / Delete actions */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {isOwn && onEdit && (
            <button
              onClick={() => onEdit(review)}
              aria-label="Edit your review"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '6px',
                border: '1px solid #d1d5db', background: '#f9fafb',
                cursor: 'pointer', fontSize: '12px', color: '#374151', fontWeight: 500,
              }}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #0c831f'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
            >
              <Pencil size={12} /> Edit
            </button>
          )}
          {(isOwn || isAdmin) && onDeleteRequest && (
            <button
              onClick={() => onDeleteRequest(review)}
              aria-label="Delete review"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '6px',
                border: '1px solid #fca5a5', background: '#fff5f5',
                cursor: 'pointer', fontSize: '12px', color: '#dc2626', fontWeight: 500,
              }}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #dc2626'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Star rating */}
      <div style={{ marginTop: '10px' }}>
        <StarRating rating={review.rating} size={15} />
      </div>

      {/* Verified Purchase badge */}
      {review.verifiedPurchase && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
          <ShieldCheck size={12} style={{ color: '#0c831f' }} />
          <span style={{ fontSize: '11px', color: '#0c831f', fontWeight: 600 }}>
            Verified Purchase
          </span>
        </div>
      )}

      {/* Comment */}
      <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#374151', lineHeight: 1.65, wordBreak: 'break-word' }}>
        {review.comment}
      </p>

      {/* Helpful vote */}
      {currentUserId && (
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={handleHelpful}
            disabled={isOwn || !currentUserId}
            aria-label={hasVoted ? 'Remove helpful vote' : 'Mark as helpful'}
            aria-pressed={hasVoted}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', borderRadius: '20px',
              border: `1px solid ${hasVoted ? '#bbf7d0' : '#e5e7eb'}`,
              background: hasVoted ? '#f0fdf4' : '#f9fafb',
              cursor: isOwn ? 'not-allowed' : 'pointer',
              fontSize: '12px', color: hasVoted ? '#15803d' : '#6b7280',
              opacity: isOwn ? 0.5 : 1,
              transition: 'all 0.15s',
              fontWeight: 500,
            }}
            onFocus={(e) => { if (!isOwn) e.currentTarget.style.outline = '2px solid #0c831f'; }}
            onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
          >
            <ThumbsUp size={12} />
            Helpful ({helpfulCount})
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
