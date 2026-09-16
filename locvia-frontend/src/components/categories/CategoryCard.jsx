// src/components/categories/CategoryCard.jsx
// Reusable category card for the category grid

import { Link } from 'react-router-dom';

/**
 * Props:
 *  category  - category object from data/categories.js
 */

const CategoryCard = ({ category }) => {
  const { id, name, icon, image, color } = category;

  return (
    <Link
      to={`/customer/products?categoryId=${id}`}
      className="block"
      style={{ textDecoration: 'none' }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 0.5rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border-light)',
          backgroundColor: 'var(--color-white)',
          cursor: 'pointer',
          transition: 'all var(--transition-base)',
          textAlign: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(34,197,94,0.15)';
          e.currentTarget.style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-light)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Icon container */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: color || 'var(--color-primary-lighter)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {image ? (
            <img
              src={image}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{icon}</span>
          )}
        </div>

        {/* Category name */}
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-gray-800)',
            lineHeight: '1.2',
            wordBreak: 'break-word',
          }}
        >
          {name}
        </span>
      </div>
    </Link>
  );
};

export default CategoryCard;
