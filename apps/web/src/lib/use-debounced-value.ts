import { useEffect, useState } from 'react';

/** Devuelve el valor solo cuando deja de cambiar durante `delayMs` (búsquedas mientras se escribe). */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
