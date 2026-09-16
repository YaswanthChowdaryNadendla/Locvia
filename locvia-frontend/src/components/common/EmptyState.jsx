// src/components/common/EmptyState.jsx
// Reusable, accessible empty state component for Locvia

import { SearchX } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = SearchX,
  title = 'No results found',
  message = 'Try adjusting your search or filters to find what you are looking for.',
  description, // alias for message
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
  style = {},
}) => {
  const displayMessage = description || message;

  return (
    <div
      role="status"
      className={`locvia-empty-state ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        backgroundColor: 'var(--color-white, #ffffff)',
        borderRadius: 'var(--radius-xl, 16px)',
        border: '1px solid var(--color-gray-100, #f1f5f9)',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-gray-400, #94a3b8)',
          marginBottom: '1rem',
          border: '1px solid #f1f5f9',
        }}
        aria-hidden="true"
      >
        <Icon size={32} strokeWidth={1.75} />
      </div>

      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-gray-900, #0f172a)',
          marginBottom: '0.5rem',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>

      {displayMessage && (
        <p
          style={{
            color: 'var(--color-gray-500, #64748b)',
            fontSize: '0.9375rem',
            maxWidth: '420px',
            marginBottom: (onAction || onSecondaryAction) ? '1.5rem' : 0,
            lineHeight: 1.6,
          }}
        >
          {displayMessage}
        </p>
      )}

      {(onAction || onSecondaryAction) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {onAction && actionLabel && (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}

          {onSecondaryAction && secondaryActionLabel && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
