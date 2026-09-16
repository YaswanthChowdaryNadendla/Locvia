// src/components/common/loaders/ProductCardSkeleton.jsx
// Matches the exact dimensions and styling of ProductCard to eliminate Cumulative Layout Shift (CLS)

import SkeletonLoader from './SkeletonLoader';

const ProductCardSkeleton = () => {
  return (
    <div
      className="locvia-card"
      aria-hidden="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Product Image Area Placeholder */}
      <div
        style={{
          width: '100%',
          height: '150px',
          backgroundColor: '#f8fafc',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SkeletonLoader width="80%" height="80%" borderRadius="8px" />
      </div>

      {/* Card Content Area */}
      <div
        style={{
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.375rem',
          flex: 1,
        }}
      >
        {/* Unit / Qty */}
        <SkeletonLoader width="35%" height="12px" />

        {/* Product Name (2 lines) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '38px' }}>
          <SkeletonLoader width="90%" height="14px" />
          <SkeletonLoader width="65%" height="14px" />
        </div>

        {/* Shop Name Tag */}
        <SkeletonLoader width="45%" height="12px" style={{ marginTop: '2px' }} />

        {/* Rating line */}
        <SkeletonLoader width="30%" height="14px" borderRadius="4px" />

        {/* Price & Add Action Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            marginTop: 'auto',
            paddingTop: '0.5rem',
          }}
        >
          {/* Price */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <SkeletonLoader width="55px" height="18px" />
            <SkeletonLoader width="40px" height="11px" />
          </div>

          {/* Add Button */}
          <SkeletonLoader width="68px" height="32px" borderRadius="8px" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
