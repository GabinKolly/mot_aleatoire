import { describe, it, expect } from 'vitest';
import { getStatValueSizingStyle } from './statValueSizing';

describe('getStatValueSizingStyle', () => {
  it('returns the character count for a string value', () => {
    expect(getStatValueSizingStyle('hello')).toEqual({ '--mm-stat-char-count': 5 });
  });

  it('converts numeric values to their string representation length', () => {
    expect(getStatValueSizingStyle(123)).toEqual({ '--mm-stat-char-count': 3 });
  });

  it('returns a minimum count of 1 for empty string', () => {
    expect(getStatValueSizingStyle('')).toEqual({ '--mm-stat-char-count': 1 });
  });

  it('returns a minimum count of 1 for undefined', () => {
    expect(getStatValueSizingStyle(undefined)).toEqual({ '--mm-stat-char-count': 1 });
  });

  it('returns a minimum count of 1 for null', () => {
    expect(getStatValueSizingStyle(null)).toEqual({ '--mm-stat-char-count': 1 });
  });
});
