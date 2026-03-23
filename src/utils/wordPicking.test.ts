import { describe, it, expect } from 'vitest';
import { createSeededRandom } from './seededRandom';
import {
  shuffleWord,
  buildShuffledTiles,
  pickWordFromList,
  countWordsMatchingLength,
  generateWordSequence,
} from './wordPicking';

// A stable 10-word list used across multiple test groups.
const WORDS = [
  'CHAT', 'CHIEN', 'LAPIN', 'OISEAU', 'CHEVAL',
  'TIGRE', 'LOURS', 'RENARD', 'SERPENT', 'MOUTON',
];

describe('shuffleWord', () => {
  it('returns an array containing the same letters as the original', () => {
    const result = shuffleWord('BONJOUR', createSeededRandom(1));
    expect(result).toHaveLength(7);
    expect([...result].sort()).toEqual([...'BONJOUR'].sort());
  });

  it('is deterministic with the same rng', () => {
    const r1 = shuffleWord('EXAMPLE', createSeededRandom(42));
    const r2 = shuffleWord('EXAMPLE', createSeededRandom(42));
    expect(r1).toEqual(r2);
  });

  it('handles a single-letter word without hanging', () => {
    const result = shuffleWord('A', createSeededRandom(1));
    expect(result).toEqual(['A']);
  });

  it('handles a two-letter word', () => {
    const result = shuffleWord('AB', createSeededRandom(1));
    expect(result).toHaveLength(2);
    expect([...result].sort()).toEqual(['A', 'B']);
  });

  it('falls back to a deterministic non-original arrangement when rng gets stuck', () => {
    const result = shuffleWord('ABC', () => 0.999999);
    expect(result).toEqual(['A', 'C', 'B']);
  });

  it('rejects forbidden accepted anagrams', () => {
    const result = shuffleWord('ABC', () => 0.999999, {
      forbiddenWords: ['ACB', 'BAC', 'BCA', 'CAB'],
    });

    expect(result).toEqual(['C', 'B', 'A']);
  });
});

describe('buildShuffledTiles', () => {
  it('returns tile objects with a letter and a positional id', () => {
    const tiles = buildShuffledTiles('CHAT', createSeededRandom(1));
    expect(tiles).toHaveLength(4);
    tiles.forEach((tile, i) => {
      expect(typeof tile.letter).toBe('string');
      expect(tile.id).toBe(i);
    });
  });

  it('contains exactly the same letters as the original word', () => {
    const word = 'BONJOUR';
    const tiles = buildShuffledTiles(word, createSeededRandom(7));
    const tileLetters = tiles.map((t) => t.letter).sort();
    expect(tileLetters).toEqual([...word].sort());
  });

  it('is deterministic with the same rng', () => {
    const t1 = buildShuffledTiles('RENARD', createSeededRandom(5));
    const t2 = buildShuffledTiles('RENARD', createSeededRandom(5));
    expect(t1).toEqual(t2);
  });

  it('avoids forbidden accepted anagrams when building tiles', () => {
    const tiles = buildShuffledTiles('ABC', () => 0.999999, {
      forbiddenWords: ['ACB', 'BAC', 'BCA', 'CAB'],
    });

    expect(tiles.map((tile) => tile.letter).join('')).toBe('CBA');
  });
});

describe('pickWordFromList', () => {
  it('returns null for an empty available list', () => {
    expect(pickWordFromList([], WORDS, createSeededRandom(1))).toBeNull();
  });

  it('returns a word contained in the available list', () => {
    const available = ['CHAT', 'CHIEN', 'LAPIN'];
    const picked = pickWordFromList(available, WORDS, createSeededRandom(1));
    expect(available).toContain(picked);
  });

  it('is deterministic with the same rng', () => {
    const p1 = pickWordFromList(WORDS, WORDS, createSeededRandom(99));
    const p2 = pickWordFromList(WORDS, WORDS, createSeededRandom(99));
    expect(p1).toBe(p2);
  });

  it('uses the bucket-by-length strategy for lists >= 500 words', () => {
    // The bucket strategy activates when allFilteredWords.length >= LARGE_LIST_THRESHOLD (500).
    const allWords = Array.from({ length: 510 }, (_, i) => `WORD${i}`);
    const available = allWords.slice(0, 50);
    const picked = pickWordFromList(available, allWords, createSeededRandom(3));
    expect(available).toContain(picked);
  });
});

describe('countWordsMatchingLength', () => {
  it('returns 0 for an empty array', () => {
    expect(countWordsMatchingLength([], 4, 7)).toBe(0);
  });

  it('counts only words whose length falls within [min, max]', () => {
    // CHAT=4, CHIEN=5, LAPIN=5, OISEAU=6, CHEVAL=6, TIGRE=5, LOURS=5, RENARD=6, SERPENT=7, MOUTON=6
    // lengths 5–6: CHIEN, LAPIN, OISEAU, CHEVAL, TIGRE, LOURS, RENARD, MOUTON → 8
    expect(countWordsMatchingLength(WORDS, 5, 6)).toBe(8);
  });

  it('includes words exactly at the boundary lengths', () => {
    const words = ['CHAT', 'CHIEN', 'OISEAU']; // 4, 5, 6
    expect(countWordsMatchingLength(words, 4, 6)).toBe(3);
    expect(countWordsMatchingLength(words, 4, 4)).toBe(1);
    expect(countWordsMatchingLength(words, 6, 6)).toBe(1);
  });

  it('returns 0 when no word matches the range', () => {
    expect(countWordsMatchingLength(WORDS, 20, 30)).toBe(0);
  });
});

describe('generateWordSequence', () => {
  it('returns only unique words', () => {
    const seq = generateWordSequence(WORDS, 4, 9, createSeededRandom(1), 20);
    const unique = new Set(seq.map((e) => e.word));
    expect(unique.size).toBe(seq.length);
  });

  it('respects the word length filter', () => {
    const seq = generateWordSequence(WORDS, 5, 6, createSeededRandom(2), 20);
    seq.forEach(({ word }) => {
      expect(word.length).toBeGreaterThanOrEqual(5);
      expect(word.length).toBeLessThanOrEqual(6);
    });
  });

  it('does not exceed maxCount', () => {
    const seq = generateWordSequence(WORDS, 4, 9, createSeededRandom(3), 3);
    expect(seq.length).toBeLessThanOrEqual(3);
  });

  it('is deterministic with the same seed', () => {
    const s1 = generateWordSequence(WORDS, 4, 9, createSeededRandom(42), 5);
    const s2 = generateWordSequence(WORDS, 4, 9, createSeededRandom(42), 5);
    expect(s1.map((e) => e.word)).toEqual(s2.map((e) => e.word));
  });

  it('each entry has a word string and a tiles array of matching length', () => {
    const seq = generateWordSequence(WORDS, 4, 9, createSeededRandom(5), 5);
    seq.forEach(({ word, tiles }) => {
      expect(typeof word).toBe('string');
      expect(tiles).toHaveLength(word.length);
    });
  });

  it('returns an empty sequence when no words match the length filter', () => {
    const seq = generateWordSequence(WORDS, 20, 30, createSeededRandom(1), 10);
    expect(seq).toHaveLength(0);
  });
});
