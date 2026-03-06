/** Seconds added to the timer for finding an alternative (anagram) word. */
export const COMPETITION_ALT_BONUS = 5;

/** Number of words to find before advancing to the next tier. */
export const COMPETITION_WORDS_PER_TIER = 10;

/** Preset key for the word list used in competition mode. */
export const COMPETITION_WORD_LIST_PRESET = 'default';

export interface CompetitionTierConfig {
  startTime: number;
  wordBonus: number;
  minWordLength: number;
  maxWordLength: number;
  isInfinite?: boolean;
}

/**
 * Competition tiers.
 *
 * Tier 8 is the only infinite tier.
 */
export const COMPETITION_TIERS: CompetitionTierConfig[] = [
  { startTime: 45, wordBonus: 15, minWordLength: 4, maxWordLength: 4 },
  { startTime: 45, wordBonus: 15, minWordLength: 5, maxWordLength: 5 },
  { startTime: 45, wordBonus: 15, minWordLength: 6, maxWordLength: 6 },
  { startTime: 45, wordBonus: 15, minWordLength: 7, maxWordLength: 7 },
  { startTime: 45, wordBonus: 15, minWordLength: 8, maxWordLength: 8 },
  { startTime: 30, wordBonus: 10, minWordLength: 6, maxWordLength: 8 },
  { startTime: 15, wordBonus: 7, minWordLength: 6, maxWordLength: 8 },
  { startTime: 10, wordBonus: 5, minWordLength: 6, maxWordLength: 8, isInfinite: true },
];
