import { describe, it, expect } from 'vitest';
import { formatClock } from './time';

describe('formatClock', () => {
  it('formats zero as 0:00', () => {
    expect(formatClock(0)).toBe('0:00');
  });

  it('pads single-digit seconds with a leading zero', () => {
    expect(formatClock(9)).toBe('0:09');
  });

  it('formats minutes and seconds correctly', () => {
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(90)).toBe('1:30');
    expect(formatClock(120)).toBe('2:00');
  });

  it('handles large values without a minutes cap', () => {
    expect(formatClock(3600)).toBe('60:00');
  });

  it('clamps negative values to 0:00', () => {
    expect(formatClock(-1)).toBe('0:00');
    expect(formatClock(-100)).toBe('0:00');
  });
});
