import type { CSSProperties } from 'react';

export function getStatValueSizingStyle(value: unknown): CSSProperties {
  const text = `${value ?? ''}`.trim();
  // CSS custom property consumed by the stat card's font-size scaling rule.
  return { '--mm-stat-char-count': Math.max(1, text.length) } as CSSProperties;
}
