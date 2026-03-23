import {
  SHUFFLE_MAX_ATTEMPTS,
  LARGE_LIST_THRESHOLD,
} from '../constants/gameConfig';
import type { Tile } from '../types/game';

export type Rng = () => number;

export interface ShuffleWordOptions {
  forbiddenWords?: Iterable<string>;
}

interface WordEntry {
  word: string;
  tiles: Tile[];
}

const canBeSolvedWithOneMove = (shuffled: string, original: string): boolean => {
  const shuffledArray = shuffled.split('');

  for (let i = 0; i < shuffledArray.length; i += 1) {
    const letter = shuffledArray[i];
    const withoutLetter = [
      ...shuffledArray.slice(0, i),
      ...shuffledArray.slice(i + 1),
    ];

    for (let j = 0; j <= withoutLetter.length; j += 1) {
      const newArrangement = [
        ...withoutLetter.slice(0, j),
        letter,
        ...withoutLetter.slice(j),
      ];
      if (newArrangement.join('') === original) {
        return true;
      }
    }
  }

  return false;
};

const isValidShuffledWord = (
  shuffledWord: string,
  original: string,
  forbiddenWordsSet: ReadonlySet<string>
): boolean => {
  if (shuffledWord === original || forbiddenWordsSet.has(shuffledWord)) {
    return false;
  }

  if (original.length >= 5 && canBeSolvedWithOneMove(shuffledWord, original)) {
    return false;
  }

  return true;
};

const findDeterministicShuffleFallback = (
  word: string,
  forbiddenWordsSet: ReadonlySet<string>
): string | null => {
  if (word.length > 8) {
    return null;
  }

  const letterCounts = new Map<string, number>();
  word.split('').forEach((letter) => {
    letterCounts.set(letter, (letterCounts.get(letter) ?? 0) + 1);
  });

  const uniqueLetters = [...letterCounts.keys()].sort();
  const candidate = new Array<string>(word.length);

  const search = (index: number): string | null => {
    if (index === word.length) {
      const shuffledWord = candidate.join('');
      return isValidShuffledWord(shuffledWord, word, forbiddenWordsSet)
        ? shuffledWord
        : null;
    }

    for (const letter of uniqueLetters) {
      const remaining = letterCounts.get(letter) ?? 0;
      if (remaining === 0) {
        continue;
      }

      letterCounts.set(letter, remaining - 1);
      candidate[index] = letter;
      const result = search(index + 1);
      letterCounts.set(letter, remaining);

      if (result) {
        return result;
      }
    }

    return null;
  };

  return search(0);
};

/**
 * Shuffle a word's letters using Fisher-Yates, ensuring the result is not
 * trivially solvable. Accepts an optional `rng` function (defaults to Math.random).
 */
export const shuffleWord = (
  word: string,
  rng: Rng = Math.random,
  options: ShuffleWordOptions = {}
): string[] => {
  const letters = word.split('');
  let shuffled = [...letters];
  let attempts = 0;
  const forbiddenWordsSet = new Set(options.forbiddenWords ?? []);

  do {
    shuffled = [...letters];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
    }

    attempts += 1;
    const shuffledWord = shuffled.join('');

    if (isValidShuffledWord(shuffledWord, word, forbiddenWordsSet)) {
      return shuffled;
    }
  } while (attempts < SHUFFLE_MAX_ATTEMPTS);

  const fallback = findDeterministicShuffleFallback(word, forbiddenWordsSet);
  if (fallback) {
    return fallback.split('');
  }

  return shuffled;
};

/**
 * Build tile objects from a shuffled word.
 * Accepts an optional `rng` function (defaults to Math.random).
 */
export const buildShuffledTiles = (
  word: string,
  rng: Rng = Math.random,
  options: ShuffleWordOptions = {}
): Tile[] => {
  const shuffled = shuffleWord(word, rng, options);
  return shuffled.map((letter, index) => ({ letter, id: index }));
};

/**
 * Pick a word from a filtered list, using the large-list bucket strategy
 * when the full list is >= 500 words. Accepts an `rng` function.
 */
export const pickWordFromList = (
  availableWords: string[],
  allFilteredWords: string[],
  rng: Rng = Math.random
): string | null => {
  if (availableWords.length === 0) {
    return null;
  }

  if (allFilteredWords.length >= LARGE_LIST_THRESHOLD) {
    const wordsByLength = availableWords.reduce<Record<number, string[]>>((acc, word) => {
      const len = word.length;
      if (!acc[len]) acc[len] = [];
      acc[len].push(word);
      return acc;
    }, {});

    const availableLengths = Object.keys(wordsByLength).map(Number);
    const chosenLength =
      availableLengths[Math.floor(rng() * availableLengths.length)];
    const bucket = wordsByLength[chosenLength];
    if (!bucket || bucket.length === 0) {
      return null;
    }
    return bucket[Math.floor(rng() * bucket.length)];
  }

  return availableWords[Math.floor(rng() * availableWords.length)];
};

export const countWordsMatchingLength = (
  words: string[],
  minLength: number,
  maxLength: number
): number => {
  if (!Array.isArray(words) || words.length === 0) {
    return 0;
  }

  return words.reduce((count, word) => {
    const length = word.length;
    if (length >= minLength && length <= maxLength) {
      return count + 1;
    }
    return count;
  }, 0);
};

/**
 * Generate a deterministic word sequence from a seed and word list.
 * Returns an array of { word, tiles } entries.
 */
export const generateWordSequence = (
  words: string[],
  minLength: number,
  maxLength: number,
  rng: Rng,
  maxCount = 200
): WordEntry[] => {
  const filtered = words.filter((w) => w.length >= minLength && w.length <= maxLength);
  const sequence: WordEntry[] = [];
  const used = new Set<string>();

  for (let i = 0; i < maxCount && used.size < filtered.length; i++) {
    const available = filtered.filter((w) => !used.has(w));
    const word = pickWordFromList(available, filtered, rng);
    if (!word) break;
    used.add(word);
    const tiles = buildShuffledTiles(word, rng);
    sequence.push({ word, tiles });
  }

  return sequence;
};
