/** Initial countdown in seconds when a competition game (or tier) starts. */
export const COMPETITION_START_TIME = 45;

/** Seconds added to the timer for each correct word. */
export const COMPETITION_WORD_BONUS = 15;

/** Seconds added to the timer for finding an alternative (anagram) word. */
export const COMPETITION_ALT_BONUS = 5;

/** Number of words to find before advancing to the next tier. */
export const COMPETITION_WORDS_PER_TIER = 10;

/** Word length for the first tier. */
export const COMPETITION_STARTING_WORD_LENGTH = 4;

/** Maximum word length — the final tier stays at this length indefinitely. */
export const COMPETITION_MAX_WORD_LENGTH = 8;

/** In the final tier, the word bonus decreases per word but never drops below this. */
export const COMPETITION_MIN_WORD_BONUS = 5;

/** How much the word bonus decreases per word in the final tier. */
export const COMPETITION_WORD_BONUS_DECAY = 1;

/** Preset key for the word list used in competition mode. */
export const COMPETITION_WORD_LIST_PRESET = 'default';
