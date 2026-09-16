// src/components/reviews/RatingDistribution.jsx
// Module 36 — Rating distribution bar chart (5★ → 1★)

import StarRating from './StarRating';

const RatingDistribution = ({ summary }) => {
  const { average, total, distribution } = summary;

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Left: big average */}
      <div style={{ textAlign: 'center', minWidth: '80px', flexShrink: 0 }}>
        <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
          {total > 0 ? average.toFixed(1) : '—'}
        </div>
        <div style={{ marginTop: '4px' }}>
          <StarRating rating={average} size={16} />
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          {total} {total === 1 ? 'review' : 'reviews'}
        </div>
      </div>

      {/* Right: bar chart */}
      <div style={{ flex: 1, minWidth: '160px' }}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const barColor = star >= 4 ? '#22c55e' : star === 3 ? '#f59e0b' : '#ef4444';
          return (
            <div
              key={star}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}
            >
              <span style={{ fontSize: '12px', color: '#374151', width: '22px', textAlign: 'right', flexShrink: 0 }}>
                {star}★
              </span>
              <div
                style={{ flex: 1, height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: barColor,
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: '#9ca3af', width: '24px', flexShrink: 0, textAlign: 'right' }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatingDistribution;
