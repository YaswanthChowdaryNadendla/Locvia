// src/components/common/Button.jsx
// Reusable Button component using Locvia design system classes

import { Loader2 } from 'lucide-react';

/**
 * Props:
 *  variant     - 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
 *  size        - 'sm' | 'md' | 'lg' | 'icon'
 *  fullWidth   - boolean
 *  isLoading   - boolean (shows spinner and disables interactions)
 *  loadingText - string (optional text shown while loading, e.g. 'Adding...', 'Saving...')
 *  leftIcon    - Lucide icon component
 *  rightIcon   - Lucide icon component
 *  disabled    - boolean
 *  className   - extra CSS classes
 *  ...rest     - all native button props
 */

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  loadingText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}) => {
  const variantClass = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    ghost:     'btn-ghost',
    danger:    'btn-danger',
    outline:   'btn-outline',
  }[variant] ?? 'btn-primary';

  const sizeClass = {
    sm:   'btn-sm',
    md:   '',
    lg:   'btn-lg',
    icon: 'btn-icon',
  }[size] ?? '';

  const isButtonDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isButtonDisabled}
      aria-busy={isLoading}
      className={`btn ${variantClass} ${sizeClass} ${fullWidth ? 'btn-full' : ''} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" aria-hidden="true" />
      ) : (
        LeftIcon && <LeftIcon size={size === 'sm' ? 14 : 16} aria-hidden="true" />
      )}

      <span>
        {isLoading && loadingText ? loadingText : children}
      </span>

      {!isLoading && RightIcon && (
        <RightIcon size={size === 'sm' ? 14 : 16} aria-hidden="true" />
      )}
    </button>
  );
};

export default Button;
