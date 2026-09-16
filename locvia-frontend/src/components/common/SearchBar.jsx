// src/components/common/SearchBar.jsx
// Reusable search input with icon and clear button

import { useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Props:
 *  placeholder   - string
 *  value         - controlled value (optional)
 *  onChange      - function(value: string)
 *  onSubmit      - function(value: string) - called on Enter or search icon click
 *  autoFocus     - boolean
 *  className     - extra classes for wrapper
 */

const SearchBar = ({
  placeholder = 'Search products, shops…',
  value: controlledValue,
  onChange,
  onSubmit,
  autoFocus = false,
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState('');

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (e) => {
    const val = e.target.value;
    if (!isControlled) setInternalValue(val);
    onChange?.(val);
  };

  const handleClear = () => {
    if (!isControlled) setInternalValue('');
    onChange?.('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSubmit?.(value);
    }
  };

  return (
    <div className={`search-bar-wrap ${className}`}>
      <Search className="search-bar-icon" size={18} />
      <input
        type="search"
        className="search-bar-input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        aria-label="Search"
      />
      {value && (
        <button
          className="search-bar-clear"
          onClick={handleClear}
          aria-label="Clear search"
          type="button"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
