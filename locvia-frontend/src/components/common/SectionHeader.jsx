// src/components/common/SectionHeader.jsx
// Section title row with optional "See All" link

import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Props:
 *  title    - string (required)
 *  subtitle - string (optional)
 *  seeAllTo - string route path (shows "See all" link)
 *  seeAllLabel - string (defaults to 'See all')
 *  action   - JSX (custom right-side action)
 */

const SectionHeader = ({
  title,
  subtitle,
  seeAllTo,
  seeAllLabel = 'See all',
  action,
}) => {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle && (
          <p
            className="text-body-sm"
            style={{ color: 'var(--color-gray-500)', marginTop: '2px' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {action && action}

      {!action && seeAllTo && (
        <Link
          to={seeAllTo}
          style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
        >
          {seeAllLabel}
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
