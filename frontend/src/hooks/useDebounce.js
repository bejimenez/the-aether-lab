// This is a reusable hook that can be used to debounce a value, such as a search query.

import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Alternative implementation that returns both the debounced value and a cancel function:
export function useDebounceWithCancel(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [timeoutId, setTimeoutId] = useState(null);

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  useEffect(() => {
    cancel(); // Cancel previous timeout
    
    const newTimeoutId = setTimeout(() => {
      setDebouncedValue(value);
      setTimeoutId(null);
    }, delay);
    
    setTimeoutId(newTimeoutId);

    return cancel;
  }, [value, delay, cancel]);

  return [debouncedValue, cancel];
}

// Example usage in SearchTab (alternative implementation):
/*
import { useDebounce } from '../hooks/useDebounce';

const SearchTab = ({ onSearch, searchResults, loading, onAddCard }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      onSearch(debouncedSearchQuery);
    } else {
      onSearch('');
    }
  }, [debouncedSearchQuery, onSearch]);
  
  // ... rest of component
};
*/