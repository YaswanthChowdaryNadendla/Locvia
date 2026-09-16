// src/components/common/LocationSelector.jsx
// Displays a "Delivering to" block

import { MapPin, ChevronDown } from 'lucide-react';
import { useDeliveryLocation } from '../../context/LocationContext';

const LocationSelector = ({ location }) => {
  const { locationDisplayText } = useDeliveryLocation();
  const displayLocation = location || locationDisplayText;

  return (
    <div
      className="location-selector"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-100)',
      }}
    >
      <div 
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary-lighter)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary-dark)'
        }}
      >
        <MapPin size={20} />
      </div>
      
      <div style={{ flex: 1, cursor: 'pointer' }}>
        <p style={{ 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          color: 'var(--color-gray-500)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '2px'
        }}>
          Delivering to
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <h2 style={{ 
            fontSize: '1rem', 
            fontWeight: 700, 
            color: 'var(--color-gray-900)',
            margin: 0
          }}>
            {displayLocation}
          </h2>
          <ChevronDown size={16} color="var(--color-gray-500)" />
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
