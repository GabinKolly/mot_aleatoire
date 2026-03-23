import { describe, expect, it } from 'vitest';
import { createSeededRandom } from './seededRandom';
import {
  buildAnagramGroupIndex,
  getAcceptedAnagramWords,
  getWordCheckResult,
  mergeUsedWords,
  pickWordWithAcceptedAnagrams,
} from './anagramWordPicking';

describe('anagramWordPicking', () => {
  it('returns all same-list anagrams for an accepted family', () => {
    const groups = buildAnagramGroupIndex(['ARBITRE', 'ABRITER', 'HECTARE']);
    expect(getAcceptedAnagramWords('ARBITRE', groups)).toEqual([
      'ARBITRE',
      'ABRITER',
    ]);
  });

  it('consumes the whole anagram family after selecting one member', () => {
    const filteredWords = ['ARBITRE', 'ABRITER', 'HECTARE'];
    const groups = buildAnagramGroupIndex(filteredWords);
    const selection = pickWordWithAcceptedAnagrams(
      filteredWords,
      filteredWords,
      groups,
      createSeededRandom(1)
    );

    expect(selection).not.toBeNull();
    const usedWords = mergeUsedWords([], selection?.acceptedWords ?? []);
    const availableWords = filteredWords.filter((word) => !usedWords.includes(word));
    expect(availableWords).toEqual(['HECTARE']);
  });

  it('treats a same-list anagram as a full solve', () => {
    const result = getWordCheckResult({
      currentTileWord: 'ABRITER',
      currentWord: 'ARBITRE',
      acceptedWordsSet: new Set(['ARBITRE', 'ABRITER']),
      bonusCheckWordsSet: new Set(['ARBITRE', 'ABRITER']),
      filteredWordsSet: new Set(['ARBITRE', 'ABRITER']),
      bonusAwardedWords: new Set(),
    });

    expect(result).toBe('correct');
  });

  it('keeps big-list-only anagrams as bonus-only words', () => {
    const result = getWordCheckResult({
      currentTileWord: 'RAT',
      currentWord: 'ART',
      acceptedWordsSet: new Set(['ART']),
      bonusCheckWordsSet: new Set(['ART', 'RAT']),
      filteredWordsSet: new Set(['ART']),
      bonusAwardedWords: new Set(),
    });

    expect(result).toBe('bonus');
  });

  it('does not award the same bonus word twice', () => {
    const result = getWordCheckResult({
      currentTileWord: 'RAT',
      currentWord: 'ART',
      acceptedWordsSet: new Set(['ART']),
      bonusCheckWordsSet: new Set(['ART', 'RAT']),
      filteredWordsSet: new Set(['ART']),
      bonusAwardedWords: new Set(['RAT']),
    });

    expect(result).toBe('none');
  });
});
