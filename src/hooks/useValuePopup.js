import { useEffect, useRef, useState } from 'react';

/**
 * Tracks a numeric value and returns the positive delta when it increases.
 * Returns null when idle, or the delta number during the animation window.
 */
export function useValuePopup(value) {
  const prevRef = useRef(value);
  const [delta, setDelta] = useState(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    if (typeof prev === 'number' && value > prev) {
      setDelta(value - prev);
      const timer = setTimeout(() => setDelta(null), 900);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return delta;
}
