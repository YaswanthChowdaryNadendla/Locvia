// src/components/reviews/StarPicker.jsx
// Module 36 — Interactive, keyboard-accessible star selector

import { useState } from 'react';

const LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

const StarPicker = ({ value = 0, onChange, size = 28, disabled = false }) => {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span
        role="radiogroup"
        aria-label="Select star rating"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''} — ${LABELS[star]}`}
            disabled={disabled}
            onClick={() => !disabled && onChange && onChange(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(0)}
            onKeyDown={(e) => {
              if (disabled || !onChange) return;
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                onChange(Math.min(5, value + 1));
              }
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                onChange(Math.max(1, value - 1));
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'transform 0.1s ease',
              transform: hovered === star ? 'scale(1.2)' : 'scale(1)',
              borderRadius: '4px',
            }}
            onFocus={(e) => { e.currentTarget.style.outline = '2px solid #f59e0b'; e.currentTarget.style.outlineOffset = '2px'; }}
            onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={star <= display ? '#f59e0b' : 'none'}
              stroke={star <= display ? '#f59e0b' : '#9ca3af'}
              strokeWidth={1.8}
              aria-hidden="true"
              style={{ display: 'block' }}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </span>
      {display > 0 && (
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', minWidth: '70px' }}>
          {LABELS[display]}
        </span>
      )}
    </div>
  );
};

export default StarPicker;
