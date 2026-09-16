// src/components/common/loaders/ButtonLoader.jsx
// Compact spinner for button loading states

import { Loader2 } from 'lucide-react';

const ButtonLoader = ({ size = 16, className = '', color = 'currentColor' }) => {
  return (
    <Loader2
      size={size}
      style={{
        color,
        animation: 'spin 0.8s linear infinite',
      }}
      className={`btn-spinner ${className}`}
      aria-hidden="true"
    />
  );
};

export default ButtonLoader;
