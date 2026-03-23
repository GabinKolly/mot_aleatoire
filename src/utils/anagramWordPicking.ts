import type { Tile } from '../types/game';
import { buildShuffledTiles, pickWordFromList, type Rng } from './wordPicking';

export type WordCheckResult = 'correct' | 'bonus' | 'none';

export interface AnagramWordSelection {
  word: string;
  acceptedWords: string[];
  tiles: Tile[];
}

export type AnagramGroupIndex = Map<string, string[]>;

export const getWordSignature = (word: string): string =>
  word.split('').sort().join('');

export const buildAnagramGroupIndex = (words: string[]): AnagramGroupIndex => {
  const groups = new Map<string, string[]>();

  words.forEach((word) => {
    const signature = getWordSignature(word);
    const existing = groups.get(signature);

    if (existing) {
      existing.push(word);
      return;
    }

    groups.set(signature, [word]);
  });

  return groups;
};

export const getAcceptedAnagramWords = (
  word: string,
  anagramGroups: AnagramGroupIndex
): string[] => anagramGroups.get(getWordSignature(word)) ?? [word];

export const mergeUsedWords = (
  usedWords: string[],
  acceptedWords: string[]
): string[] => [...new Set([...usedWords, ...acceptedWords])];

export const pickWordWithAcceptedAnagrams = (
  availableWords: string[],
  allFilteredWords: string[],
  anagramGroups: AnagramGroupIndex,
  rng: Rng = Math.random
): AnagramWordSelection | null => {
  const word = pickWordFromList(availableWords, allFilteredWords, rng);
  if (!word) {
    return null;
  }

  const acceptedWords = getAcceptedAnagramWords(word, anagramGroups);

  return {
    word,
    acceptedWords,
    tiles: buildShuffledTiles(word, rng, { forbiddenWords: acceptedWords }),
  };
};

export const getWordCheckResult = ({
  currentTileWord,
  currentWord,
  acceptedWordsSet,
  bonusCheckWordsSet,
  filteredWordsSet,
  bonusAwardedWords,
}: {
  currentTileWord: string;
  currentWord: string;
  acceptedWordsSet: ReadonlySet<string>;
  bonusCheckWordsSet: ReadonlySet<string>;
  filteredWordsSet: ReadonlySet<string>;
  bonusAwardedWords: ReadonlySet<string>;
}): WordCheckResult => {
  if (currentWord.length === 0) {
    return 'none';
  }

  if (acceptedWordsSet.has(currentTileWord)) {
    return 'correct';
  }

  if (
    currentTileWord !== currentWord &&
    (bonusCheckWordsSet.has(currentTileWord) || filteredWordsSet.has(currentTileWord)) &&
    !bonusAwardedWords.has(currentTileWord)
  ) {
    return 'bonus';
  }

  return 'none';
};
