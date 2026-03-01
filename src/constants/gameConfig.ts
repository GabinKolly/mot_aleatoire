// ── Solo game defaults ────────────────────────────────────────────────────────

export const DEFAULT_START_TIME = 45;
export const DEFAULT_BONUS_TIME = 10;
export const DEFAULT_ALT_BONUS_TIME = 5;

/** Absolute lower bound enforced when the player changes the minimum word length. */
export const MIN_WORD_LENGTH_ABSOLUTE = 2;

// ── Multiplayer game defaults ─────────────────────────────────────────────────

export const DEFAULT_MP_GAME_TIME = 180;
export const DEFAULT_MP_WORD_TIME = 30;
export const DEFAULT_MP_MIN_WORD_LENGTH = 4;
export const DEFAULT_MP_MAX_WORD_LENGTH = 7;

// ── Word picking ──────────────────────────────────────────────────────────────

/**
 * Maximum number of Fisher-Yates shuffle attempts before giving up on
 * finding a non-trivial arrangement.
 */
export const SHUFFLE_MAX_ATTEMPTS = 100;

/**
 * When a word list has at least this many words, pick by length bucket first
 * to avoid over-representing long words.
 */
export const LARGE_LIST_THRESHOLD = 500;

/** Maximum number of words generated in a deterministic multiplayer sequence. */
export const MAX_WORD_SEQUENCE = 200;
