import { useEffect, useState } from 'react';

/** Returns `value` after it has been stable for `delayMs`. */
export function useDebounce<T>(value: T, delayMs = 600): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
