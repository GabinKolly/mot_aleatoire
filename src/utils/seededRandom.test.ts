import { describe, it, expect } from 'vitest';
import { createSeededRandom } from './seededRandom';

describe('createSeededRandom', () => {
  it('produces values in [0, 1)', () => {
    const rng = createSeededRandom(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic: same seed produces the same sequence', () => {
    const rng1 = createSeededRandom(12345);
    const rng2 = createSeededRandom(12345);
    for (let i = 0; i < 30; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('produces different sequences for different seeds', () => {
    const seq1 = Array.from({ length: 10 }, createSeededRandom(1));
    const seq2 = Array.from({ length: 10 }, createSeededRandom(2));
    expect(seq1).not.toEqual(seq2);
  });

  it('advances state on each call (not reset per call)', () => {
    const rng = createSeededRandom(99);
    const first = rng();
    const second = rng();
    expect(first).not.toBe(second);
  });
});
