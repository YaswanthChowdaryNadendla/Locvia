// src/components/common/Modal.jsx
// Reusable Modal with backdrop, header, body, and footer slots

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * Props:
 *  isOpen    - boolean
 *  onClose   - function
 *  title     - string
 *  children  - modal body content
 *  footer    - JSX (optional footer)
 *  maxWidth  - CSS value e.g. '480px' | '600px'
 */

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '480px',
}) => {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal box */}
      <div
        className="modal-box"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--color-border-light)',
            }}
          >
            <h2
              id="modal-title"
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-gray-900)',
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--color-border-light)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default Modal;
