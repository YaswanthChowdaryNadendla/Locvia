// src/components/common/Input.jsx
// Reusable Input component with label, error, and icon support

/**
 * Props:
 *  label       - string
 *  error       - string (error message)
 *  hint        - string (helper text)
 *  leftIcon    - Lucide icon component
 *  rightIcon   - Lucide icon component
 *  className   - extra CSS classes
 *  ...rest     - all native input props
 */

const Input = ({
  label,
  error,
  hint,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  id,
  ...rest
}) => {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-label"
          style={{ color: 'var(--color-gray-700)' }}
        >
          {label}
          {rest.required && (
            <span style={{ color: 'var(--color-error)', marginLeft: '2px' }}>*</span>
          )}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {LeftIcon && (
          <span
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-gray-400)',
              pointerEvents: 'none',
              display: 'flex',
            }}
          >
            <LeftIcon size={16} />
          </span>
        )}

        <input
          id={inputId}
          className={`input-base ${error ? 'input-error' : ''}`}
          style={{
            paddingLeft: LeftIcon ? '2.5rem' : undefined,
            paddingRight: RightIcon ? '2.5rem' : undefined,
          }}
          {...rest}
        />

        {RightIcon && (
          <span
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-gray-400)',
              display: 'flex',
            }}
          >
            <RightIcon size={16} />
          </span>
        )}
      </div>

      {error && (
        <p className="text-caption" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-caption">{hint}</p>
      )}
    </div>
  );
};

export default Input;
