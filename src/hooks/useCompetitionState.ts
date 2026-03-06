import { useEffect, useCallback, useMemo, useReducer } from 'react';
import { WORD_LISTS } from '../constants/wordLists';
import { buildShuffledTiles } from '../utils/wordPicking';
import {
  COMPETITION_ALT_BONUS,
  COMPETITION_WORDS_PER_TIER,
  COMPETITION_WORD_LIST_PRESET,
  COMPETITION_TIERS,
} from '../constants/competitionConfig';
import { TIER_TRANSITION_MS } from '../constants/timings';
import { useWordPicking } from './useWordPicking';
import type { Tile } from '../types/game';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CompetitionState {
  allWords: string[];
  bonusCheckWords: string[];
  currentWord: string;
  tiles: Tile[];
  usedWords: string[];
  isCorrect: boolean;
  isBonusWord: boolean;
  timeLeft: number;
  score: number;
  wordsFound: number;
  isPlaying: boolean;
  gameOver: boolean;
  allWordsCompleted: boolean;

  // Competition-specific
  tierWordsFound: number;
  tierIndex: number;
  wordBonus: number;
  tierTransitionBonus: number | null;

  // These drive useWordPicking filtering
  minWordLength: number;
  maxWordLength: number;

  // Needed by useWordPicking (reads from state)
  startTime: number;
  bonusTime: number;
  alternativeWordBonusTime: number;
}

type TileUpdater = Tile[] | ((tiles: Tile[]) => Tile[]);

type CompetitionAction =
  | { type: 'START_GAME' }
  | { type: 'GIVE_UP' }
  | { type: 'SET_TILES'; payload: TileUpdater }
  | { type: 'SET_NEXT_WORD'; payload: { word: string; tiles: Tile[] } }
  | { type: 'NO_MORE_WORDS' }
  | { type: 'CORRECT_WORD' }
  | { type: 'AWARD_ALT_BONUS' }
  | { type: 'CLEAR_ALT_BONUS' }
  | { type: 'TICK' }
  | { type: 'TIME_UP' }
  | { type: 'CLEAR_TIER_TRANSITION' };

// ── Helpers ──────────────────────────────────────────────────────────────────

const totalTiers = COMPETITION_TIERS.length;

const getTierConfig = (tierIndex: number) =>
  COMPETITION_TIERS[Math.min(tierIndex, totalTiers - 1)];

const isInfiniteTier = (tierIndex: number): boolean =>
  Boolean(getTierConfig(tierIndex).isInfinite);

// ── Initial state ────────────────────────────────────────────────────────────

const resolveWordList = () => {
  const preset = WORD_LISTS[COMPETITION_WORD_LIST_PRESET] ?? WORD_LISTS['default'];
  return {
    allWords: preset.words,
    bonusCheckWords: preset.bonusCheckWords,
  };
};

const buildInitialState = (): CompetitionState => {
  const { allWords, bonusCheckWords } = resolveWordList();
  const initialTier = getTierConfig(0);
  return {
    allWords,
    bonusCheckWords,
    currentWord: '',
    tiles: [],
    usedWords: [],
    isCorrect: false,
    isBonusWord: false,
    timeLeft: 0,
    score: 0,
    wordsFound: 0,
    isPlaying: false,
    gameOver: false,
    allWordsCompleted: false,
    tierWordsFound: 0,
    tierIndex: 0,
    wordBonus: initialTier.wordBonus,
    tierTransitionBonus: null,
    minWordLength: initialTier.minWordLength,
    maxWordLength: initialTier.maxWordLength,
    startTime: initialTier.startTime,
    bonusTime: initialTier.wordBonus,
    alternativeWordBonusTime: COMPETITION_ALT_BONUS,
  };
};

// ── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: CompetitionState, action: CompetitionAction): CompetitionState {
  switch (action.type) {
    case 'START_GAME': {
      const initialTier = getTierConfig(0);
      return {
        ...buildInitialState(),
        timeLeft: initialTier.startTime,
        isPlaying: true,
        tierTransitionBonus: 0,
        minWordLength: initialTier.minWordLength,
        maxWordLength: initialTier.maxWordLength,
      };
    }
    case 'GIVE_UP':
      return { ...state, isPlaying: false, gameOver: true };
    case 'SET_TILES': {
      const nextTiles =
        typeof action.payload === 'function'
          ? action.payload(state.tiles)
          : action.payload;
      return { ...state, tiles: nextTiles };
    }
    case 'SET_NEXT_WORD':
      return {
        ...state,
        currentWord: action.payload.word,
        usedWords: [...state.usedWords, action.payload.word],
        tiles: action.payload.tiles,
        isCorrect: false,
        isBonusWord: false,
      };
    case 'NO_MORE_WORDS':
      return {
        ...state,
        isPlaying: false,
        allWordsCompleted: true,
      };
    case 'CORRECT_WORD': {
      let nextScore = state.score + state.currentWord.length;
      let nextTimeLeft = state.timeLeft + state.wordBonus;
      let nextTierWordsFound = state.tierWordsFound + 1;
      let nextTierIndex = state.tierIndex;
      let nextWordBonus = state.wordBonus;
      let nextTierTransitionBonus: number | null = null;

      // Tier transition
      if (
        nextTierWordsFound >= COMPETITION_WORDS_PER_TIER &&
        !isInfiniteTier(state.tierIndex)
      ) {
        // Add remaining time (after word bonus) to score
        const timeBonus = nextTimeLeft;
        nextScore += timeBonus;
        // Advance tier
        nextTierIndex = Math.min(state.tierIndex + 1, totalTiers - 1);
        nextTierWordsFound = 0;
        const nextTierConfig = getTierConfig(nextTierIndex);
        // Reset timer and bonus according to the new tier
        nextTimeLeft = nextTierConfig.startTime;
        nextWordBonus = nextTierConfig.wordBonus;
        // Signal tier transition for the animation
        nextTierTransitionBonus = timeBonus;
      }

      const nextTierConfig = getTierConfig(nextTierIndex);

      return {
        ...state,
        isCorrect: true,
        isBonusWord: false,
        tiles: state.currentWord.split('').map((letter, index) => ({ letter, id: index })),
        wordsFound: state.wordsFound + 1,
        score: nextScore,
        timeLeft: nextTimeLeft,
        tierWordsFound: nextTierWordsFound,
        tierIndex: nextTierIndex,
        wordBonus: nextWordBonus,
        tierTransitionBonus: nextTierTransitionBonus,
        minWordLength: nextTierConfig.minWordLength,
        maxWordLength: nextTierConfig.maxWordLength,
      };
    }
    case 'CLEAR_TIER_TRANSITION':
      return {
        ...state,
        tierTransitionBonus: null,
      };
    case 'AWARD_ALT_BONUS':
      return {
        ...state,
        isBonusWord: true,
        timeLeft: state.timeLeft + COMPETITION_ALT_BONUS,
      };
    case 'CLEAR_ALT_BONUS':
      return { ...state, isBonusWord: false };
    case 'TICK':
      return { ...state, timeLeft: state.timeLeft - 1 };
    case 'TIME_UP':
      return { ...state, isPlaying: false, gameOver: true };
    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCompetitionState() {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

  const { words, wordsSet, bonusCheckWordsSet, checkWord, resetBonusRef } =
    useWordPicking(state, dispatch);

  // Timer — paused during tier transition animation
  useEffect(() => {
    if (!state.isPlaying || state.tierTransitionBonus !== null) return;
    if (state.timeLeft <= 0) {
      dispatch({ type: 'TIME_UP' });
      return;
    }
    const timer = setTimeout(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearTimeout(timer);
  }, [state.isPlaying, state.timeLeft, state.tierTransitionBonus]);

  // Tier transition: show message after correct-word animation, then pick new word
  useEffect(() => {
    if (state.tierTransitionBonus === null || state.isCorrect) return;
    const timer = setTimeout(
      () => dispatch({ type: 'CLEAR_TIER_TRANSITION' }),
      TIER_TRANSITION_MS
    );
    return () => clearTimeout(timer);
  }, [state.tierTransitionBonus, state.isCorrect]);

  const startGame = useCallback(() => {
    resetBonusRef();
    dispatch({ type: 'START_GAME' });
  }, [resetBonusRef]);

  const giveUp = useCallback(() => dispatch({ type: 'GIVE_UP' }), []);

  const setTiles = useCallback(
    (value: TileUpdater) => dispatch({ type: 'SET_TILES', payload: value }),
    []
  );

  const reshuffleCurrentWord = useCallback(() => {
    if (!state.isPlaying || state.isCorrect || state.currentWord.length < 2) {
      return;
    }
    dispatch({ type: 'SET_TILES', payload: buildShuffledTiles(state.currentWord) });
  }, [state.currentWord, state.isCorrect, state.isPlaying]);

  const actions = useMemo(
    () => ({
      startGame,
      giveUp,
      setTiles,
      reshuffleCurrentWord,
      checkWord,
    }),
    [startGame, giveUp, setTiles, reshuffleCurrentWord, checkWord]
  );

  // Build the words found display text
  const wordsFoundText = isInfiniteTier(state.tierIndex)
    ? `${state.tierWordsFound}`
    : `${state.tierWordsFound}/${COMPETITION_WORDS_PER_TIER}`;

  return {
    state: {
      ...state,
      words,
      wordsSet,
      bonusCheckWordsSet,
    },
    actions,
    wordsFoundText,
  };
}
