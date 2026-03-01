/** Truncates a label to at most `max` visible characters, appending "…" if cut. */
export function truncateLabel(value: string | undefined, fallback: string, max = 10): string {
  const text = (value || fallback || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
