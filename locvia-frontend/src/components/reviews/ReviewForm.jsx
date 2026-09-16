// src/components/reviews/ReviewForm.jsx
// Module 36 — Write / Edit review inline form

import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import StarPicker from './StarPicker';

const MAX_COMMENT = 500;

const ReviewForm = ({
  existingReview = null,
  productName = '',
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    } else {
      setRating(0);
      setComment('');
    }
    setErrors({});
  }, [existingReview]);

  const validate = () => {
    const errs = {};
    if (!rating || rating < 1 || rating > 5) errs.rating = 'Please select a star rating (1–5).';
    if (!comment.trim()) errs.comment = 'Please write a review comment.';
    else if (comment.trim().length > MAX_COMMENT)
      errs.comment = `Comment must be at most ${MAX_COMMENT} characters.`;
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSubmit({ rating, comment: comment.trim() });
  };

  const isEdit = !!existingReview;

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            {isEdit ? 'Edit Your Review' : 'Write a Review'}
          </h3>
          {productName && (
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
              for <strong>{productName}</strong>
            </p>
          )}
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close review form"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '6px' }}
            onFocus={(e) => { e.currentTarget.style.outline = '2px solid #0c831f'; }}
            onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Star rating picker */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Your Rating <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <StarPicker
            value={rating}
            onChange={(v) => { setRating(v); setErrors((e) => ({ ...e, rating: undefined })); }}
            size={28}
            disabled={loading}
          />
          {errors.rating && (
            <p style={{ color: '#dc2626', fontSize: '12px', margin: '4px 0 0' }}>{errors.rating}</p>
          )}
        </div>

        {/* Comment */}
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="review-comment"
            style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}
          >
            Your Review <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => { setComment(e.target.value); setErrors((er) => ({ ...er, comment: undefined })); }}
            placeholder="Share your experience with this product…"
            rows={4}
            maxLength={MAX_COMMENT}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${errors.comment ? '#fca5a5' : '#d1d5db'}`,
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
              fontFamily: 'inherit',
              color: '#0f172a',
              background: loading ? '#f3f4f6' : '#ffffff',
              boxSizing: 'border-box',
              outline: 'none',
              minHeight: '96px',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#0c831f'; e.target.style.boxShadow = '0 0 0 3px rgba(12,131,31,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = errors.comment ? '#fca5a5' : '#d1d5db'; e.target.style.boxShadow = 'none'; }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            {errors.comment ? (
              <p style={{ color: '#dc2626', fontSize: '12px', margin: 0 }}>{errors.comment}</p>
            ) : <span />}
            <span style={{ fontSize: '11px', color: comment.length > MAX_COMMENT * 0.9 ? '#f59e0b' : '#9ca3af' }}>
              {comment.length}/{MAX_COMMENT}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '9px 18px', borderRadius: '8px',
                border: '1px solid #d1d5db', background: '#ffffff',
                fontSize: '14px', color: '#374151', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 20px', borderRadius: '8px',
              border: 'none', background: '#0c831f',
              color: '#ffffff', fontSize: '14px', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            <Send size={14} />
            {loading ? 'Submitting…' : isEdit ? 'Update Review' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
