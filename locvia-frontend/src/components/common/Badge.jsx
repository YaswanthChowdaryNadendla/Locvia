// src/components/common/Badge.jsx
// Reusable Badge / Pill component

/**
 * Props:
 *  variant  - 'green' | 'gray' | 'warning' | 'error' | 'info'
 *  size     - 'sm' | 'md'
 *  icon     - Lucide icon component
 *  dot      - boolean (show status dot)
 */

const Badge = ({
  children,
  variant = 'green',
  size = 'md',
  icon: Icon,
  dot = false,
  className = '',
}) => {
  const variantClass = {
    green:   'badge-green',
    gray:    'badge-gray',
    warning: 'badge-warning',
    error:   'badge-error',
    info:    'badge-info',
  }[variant] ?? 'badge-gray';

  const dotColors = {
    green:   'var(--color-success)',
    gray:    'var(--color-gray-400)',
    warning: 'var(--color-warning)',
    error:   'var(--color-error)',
    info:    'var(--color-info)',
  };

  return (
    <span
      className={`badge ${variantClass} ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : ''} ${className}`}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: dotColors[variant],
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
};

export default Badge;
