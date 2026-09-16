// src/components/common/loaders/ShopCardSkeleton.jsx
// Matches the exact dimensions and styling of ShopCard to eliminate Cumulative Layout Shift (CLS)

import SkeletonLoader from './SkeletonLoader';

const ShopCardSkeleton = () => {
  return (
    <div
      className="lv-shop-card"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    >
      {/* Media Banner */}
      <div className="lv-shop-card-media" style={{ background: '#f8fafc' }}>
        <SkeletonLoader width="100%" height="100%" borderRadius="0px" />
      </div>

      {/* Card Body */}
      <div className="lv-shop-card-body">
        {/* Name + Rating */}
        <div className="lv-shop-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonLoader width="60%" height="20px" />
          <SkeletonLoader width="48px" height="20px" borderRadius="12px" />
        </div>

        {/* Description (2 lines) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '0.5rem 0' }}>
          <SkeletonLoader width="95%" height="13px" />
          <SkeletonLoader width="75%" height="13px" />
        </div>

        {/* Metadata items row */}
        <div className="lv-shop-meta-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <SkeletonLoader width="70px" height="14px" />
          <SkeletonLoader width="50px" height="14px" />
          <SkeletonLoader width="45px" height="14px" />
        </div>

        {/* Tags */}
        <div className="lv-shop-tags-row" style={{ display: 'flex', gap: '6px', marginTop: '0.5rem' }}>
          <SkeletonLoader width="55px" height="18px" borderRadius="4px" />
          <SkeletonLoader width="65px" height="18px" borderRadius="4px" />
        </div>
      </div>
    </div>
  );
};

export default ShopCardSkeleton;
