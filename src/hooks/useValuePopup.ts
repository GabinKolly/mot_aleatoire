import { useEffect, useRef, useState } from 'react';
import { SCORE_POPUP_DURATION_MS } from '../constants/timings';

/**
 * Tracks a numeric value and returns the positive delta when it increases.
 * Returns null when idle, or the delta number during the animation window.
 */
export function useValuePopup(value: number): number | null {
  const prevRef = useRef(value);
  const [delta, setDelta] = useState<number | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    if (typeof prev === 'number' && value > prev) {
      setDelta(value - prev);
      const timer = setTimeout(() => setDelta(null), SCORE_POPUP_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return delta;
}
