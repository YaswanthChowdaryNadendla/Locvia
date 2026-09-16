// src/components/common/loaders/TableSkeleton.jsx
// Flexible, responsive table skeleton for Admin and Shop Owner data tables

import SkeletonLoader from './SkeletonLoader';

const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  const rowList = Array.from({ length: rows });
  const colList = Array.from({ length: columns });

  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          padding: '14px 18px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          gap: '12px',
        }}
      >
        {colList.map((_, i) => (
          <SkeletonLoader key={`th-${i}`} width={i === 0 ? '70%' : '50%'} height="14px" />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rowList.map((_, rIdx) => (
          <div
            key={`tr-${rIdx}`}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              padding: '16px 18px',
              borderBottom: rIdx < rows - 1 ? '1px solid #f1f5f9' : 'none',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {colList.map((_, cIdx) => (
              <SkeletonLoader
                key={`td-${rIdx}-${cIdx}`}
                width={cIdx === 0 ? '80%' : cIdx === columns - 1 ? '40%' : '60%'}
                height="14px"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;
