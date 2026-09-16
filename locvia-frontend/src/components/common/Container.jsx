// src/components/common/Container.jsx
// Responsive page container

/**
 * Props:
 *  as        - HTML element or component (default 'div')
 *  className - extra CSS classes
 *  narrow    - boolean (narrow readable width ~768px)
 */

const Container = ({
  children,
  as: Tag = 'div',
  className = '',
  narrow = false,
  style,
}) => {
  return (
    <Tag
      className={`locvia-container ${className}`}
      style={{
        maxWidth: narrow ? '768px' : undefined,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};

export default Container;
