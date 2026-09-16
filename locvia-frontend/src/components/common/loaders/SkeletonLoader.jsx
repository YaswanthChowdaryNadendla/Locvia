// src/components/common/loaders/SkeletonLoader.jsx
// Base polymorphic skeleton loader with responsive dimensions and reduced-motion handling

const SkeletonLoader = ({
  width = '100%',
  height = '1rem',
  borderRadius = '8px',
  variant = 'rect', // 'rect' | 'circle' | 'text'
  className = '',
  style = {},
  ...rest
}) => {
  const isCircle = variant === 'circle';
  const isText = variant === 'text';

  const computedWidth = isCircle ? (typeof width === 'number' ? `${width}px` : width) : width;
  const computedHeight = isCircle
    ? (typeof width === 'number' ? `${width}px` : width)
    : (isText && height === '1rem' ? '0.875rem' : height);
  const computedRadius = isCircle ? '50%' : (isText ? '4px' : borderRadius);

  return (
    <div
      className={`locvia-skeleton ${className}`}
      aria-hidden="true"
      style={{
        width: computedWidth,
        height: computedHeight,
        borderRadius: computedRadius,
        backgroundColor: '#e2e8f0',
        ...style,
      }}
      {...rest}
    />
  );
};

export default SkeletonLoader;
