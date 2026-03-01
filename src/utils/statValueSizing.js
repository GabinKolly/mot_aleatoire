export function getStatValueSizingStyle(value) {
  const text = `${value ?? ''}`.trim();
  return { '--mm-stat-char-count': Math.max(1, text.length) };
}
