import { describe, it, expect } from 'vitest';
import { truncateLabel } from './strings';

describe('truncateLabel', () => {
  it('returns the text as-is when within the max length', () => {
    expect(truncateLabel('hello', 'fallback')).toBe('hello');
  });

  it('truncates and appends an ellipsis when the text exceeds max', () => {
    expect(truncateLabel('hello world', 'fallback', 8)).toBe('hello w…');
  });

  it('returns the fallback when value is undefined', () => {
    expect(truncateLabel(undefined, 'fallback')).toBe('fallback');
  });

  it('returns the fallback when value is an empty string', () => {
    expect(truncateLabel('', 'fallback')).toBe('fallback');
  });

  it('uses the default max of 10 characters', () => {
    expect(truncateLabel('1234567890', 'x')).toBe('1234567890');
    expect(truncateLabel('12345678901', 'x')).toBe('123456789…');
  });

  it('trims leading and trailing whitespace before measuring', () => {
    expect(truncateLabel('  hi  ', 'fallback')).toBe('hi');
  });
});
