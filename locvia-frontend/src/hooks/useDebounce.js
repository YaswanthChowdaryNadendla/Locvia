// src/hooks/useDebounce.js
// Debounce a value — useful for search input to avoid excessive API calls

import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of the value.
 * Usage: const debouncedSearch = useDebounce(searchQuery, 400);
 */
const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
