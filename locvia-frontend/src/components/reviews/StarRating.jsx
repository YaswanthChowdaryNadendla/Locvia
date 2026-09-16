// src/components/reviews/StarRating.jsx
// Module 36 — Display-only star row (no interaction)

const StarRating = ({ rating = 0, size = 16, showValue = false, className = '' }) => {
  const filled = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}
      aria-label={`${rating} out of 5 stars`}
      role="img"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={star <= filled ? '#f59e0b' : 'none'}
          stroke={star <= filled ? '#f59e0b' : '#d1d5db'}
          strokeWidth={1.8}
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      {showValue && (
        <span
          style={{
            fontSize: size * 0.85,
            marginLeft: 4,
            color: '#374151',
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {Number(rating).toFixed(1)}
        </span>
      )}
    </span>
  );
};

export default StarRating;
