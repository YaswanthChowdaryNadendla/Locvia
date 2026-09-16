// src/components/common/Card.jsx
// Reusable Card container

/**
 * Props:
 *  hover     - boolean (enable hover elevation)
 *  padding   - 'none' | 'sm' | 'md' | 'lg'
 *  className - extra CSS classes
 */

const paddingMap = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
};

const Card = ({
  children,
  hover = false,
  padding = 'md',
  className = '',
  onClick,
  style,
}) => {
  return (
    <div
      className={`locvia-card ${paddingMap[padding] ?? 'p-4'} ${hover ? 'cursor-pointer' : ''} ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
    >
      {children}
    </div>
  );
};

export default Card;
