import { WORD_LISTS } from '../constants/wordLists';
import { createSeededRandom } from '../utils/seededRandom';
import { generateWordSequence } from '../utils/wordPicking';
import {
  DEFAULT_MP_GAME_TIME,
  DEFAULT_MP_WORD_TIME,
  DEFAULT_MP_MIN_WORD_LENGTH,
  DEFAULT_MP_MAX_WORD_LENGTH,
  MAX_WORD_SEQUENCE,
} from '../constants/gameConfig';
import type {
  MultiplayerAction,
  MultiplayerConfig,
  MultiplayerState,
  WordHistoryEntry,
} from '../types/multiplayer';

// Payload type aliases used for socket message casts
export type ScoresPayload = Record<number, { score: number; wordsFound: number }>;
export type WelcomePayload = Extract<MultiplayerAction, { type: 'WELCOME' }>['payload'];
export type RoomStatePayload = Extract<MultiplayerAction, { type: 'ROOM_STATE' }>['payload'];
export type GameStartedPayload = Extract<MultiplayerAction, { type: 'GAME_STARTED' }>['payload'];
export type WordClaimedPayload = Extract<MultiplayerAction, { type: 'WORD_CLAIMED' }>['payload'];
export type WordSkippedPayload = Extract<MultiplayerAction, { type: 'WORD_SKIPPED' }>['payload'];
export type NextWordPayload = Extract<MultiplayerAction, { type: 'NEXT_WORD' }>['payload'];
export type TimerSyncPayload = Extract<MultiplayerAction, { type: 'TIMER_SYNC' }>['payload'];
export type GameOverPayload = Extract<MultiplayerAction, { type: 'GAME_OVER' }>['payload'];
export type PlayerDisconnectedPayload = Extract<
  MultiplayerAction,
  { type: 'PLAYER_DISCONNECTED' }
>['payload'];

export const DEFAULT_CONFIG: MultiplayerConfig = {
  gameTime: DEFAULT_MP_GAME_TIME,
  wordTime: DEFAULT_MP_WORD_TIME,
  minWordLength: DEFAULT_MP_MIN_WORD_LENGTH,
  maxWordLength: DEFAULT_MP_MAX_WORD_LENGTH,
};

export const initialState: MultiplayerState = {
  phase: 'lobby',
  roomCode: '',
  playerNumber: null,
  players: [],
  hostId: null,
  isHost: false,
  config: { ...DEFAULT_CONFIG },
  wordListKey: 'default',
  connectionError: null,

  isPlaying: false,
  seed: null,
  wordSequence: [],
  currentWordIndex: 0,
  currentWord: '',
  tiles: [],
  isCorrect: false,
  isBonusWord: false,
  gameTimeLeft: 0,
  wordTimeLeft: 0,
  scores: {},
  wordsFound: { 1: 0, 2: 0 },
  gameOver: false,
  winner: null,
  gameOverReason: null,
  forfeitedBy: null,
  lastClaimedBy: null,
  wordSkipped: false,
  wordHistory: [],
};

export function toScoreMaps(scoresPayload: ScoresPayload): {
  scores: Record<number, number>;
  wordsFound: Record<number, number>;
} {
  const scores: Record<number, number> = {};
  const wordsFound: Record<number, number> = {};

  Object.entries(scoresPayload).forEach(([num, data]) => {
    const key = Number.parseInt(num, 10);
    if (!Number.isNaN(key)) {
      scores[key] = data.score;
      wordsFound[key] = data.wordsFound;
    }
  });

  return { scores, wordsFound };
}

export function appendWordHistoryEntry(
  state: MultiplayerState,
  { wordIndex, claimedBy }: { wordIndex: number; claimedBy: number | null }
): WordHistoryEntry[] {
  if (typeof wordIndex !== 'number' || Number.isNaN(wordIndex)) {
    return state.wordHistory;
  }

  if (state.wordHistory.some((entry) => entry.wordIndex === wordIndex)) {
    return state.wordHistory;
  }

  const wordEntry = state.wordSequence[wordIndex];
  if (!wordEntry?.word) {
    return state.wordHistory;
  }

  return [
    ...state.wordHistory,
    {
      wordIndex,
      word: wordEntry.word,
      claimedBy: claimedBy ?? null,
    },
  ];
}

export function reducer(state: MultiplayerState, action: MultiplayerAction): MultiplayerState {
  switch (action.type) {
    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.payload };

    case 'WELCOME':
      return {
        ...state,
        playerNumber: action.payload.playerNumber,
        roomCode: action.payload.roomId,
      };

    case 'ROOM_STATE': {
      let nextPhase = state.phase;
      if (action.payload.status === 'waiting') {
        if (state.phase === 'lobby' || state.phase === 'gameOver') {
          nextPhase = 'waiting';
        }
      }
      return {
        ...state,
        players: action.payload.players,
        hostId: action.payload.hostId,
        isHost: action.payload.hostId === action.payload.myPlayerId,
        config: action.payload.config,
        wordListKey: action.payload.wordListKey,
        phase: nextPhase,
        isPlaying: false,
        gameOver: nextPhase === 'waiting' ? false : state.gameOver,
        isCorrect: nextPhase === 'waiting' ? false : state.isCorrect,
        isBonusWord: false,
        tiles: nextPhase === 'waiting' ? [] : state.tiles,
        wordSkipped: false,
        wordHistory: nextPhase === 'waiting' ? [] : state.wordHistory,
      };
    }

    case 'ENTER_WAITING':
      return { ...state, phase: 'waiting' };

    case 'GAME_STARTED': {
      const { seed, config, wordListKey } = action.payload;
      const preset = WORD_LISTS[wordListKey] || WORD_LISTS.default;
      const rng = createSeededRandom(seed);
      const wordSequence = generateWordSequence(
        preset.words,
        config.minWordLength,
        config.maxWordLength,
        rng,
        MAX_WORD_SEQUENCE
      );
      const first = wordSequence[0];
      return {
        ...state,
        phase: 'playing',
        isPlaying: true,
        seed,
        wordSequence,
        currentWordIndex: 0,
        currentWord: first ? first.word : '',
        tiles: first ? first.tiles : [],
        isCorrect: false,
        isBonusWord: false,
        gameTimeLeft: config.gameTime,
        wordTimeLeft: config.wordTime,
        config,
        wordListKey,
        scores: { 1: 0, 2: 0 },
        wordsFound: { 1: 0, 2: 0 },
        gameOver: false,
        winner: null,
        gameOverReason: null,
        forfeitedBy: null,
        lastClaimedBy: null,
        wordSkipped: false,
        wordHistory: [],
      };
    }

    case 'SET_TILES': {
      const nextTiles =
        typeof action.payload === 'function'
          ? action.payload(state.tiles)
          : action.payload;
      return { ...state, tiles: nextTiles };
    }

    case 'LOCAL_CORRECT':
      return {
        ...state,
        isCorrect: true,
        isBonusWord: false,
        lastClaimedBy: state.playerNumber,
        wordSkipped: false,
        tiles: state.currentWord
          .split('')
          .map((letter, index) => ({ letter, id: index })),
      };

    case 'WORD_CLAIMED': {
      const { scores, playerNumber } = action.payload;
      const nextWordHistory = appendWordHistoryEntry(state, {
        wordIndex: action.payload.wordIndex,
        claimedBy: playerNumber,
      });
      const { scores: nextScores, wordsFound: nextWordsFound } = toScoreMaps(scores);
      return {
        ...state,
        isCorrect: true,
        isBonusWord: false,
        scores: nextScores,
        wordsFound: nextWordsFound,
        lastClaimedBy: playerNumber,
        wordSkipped: false,
        wordHistory: nextWordHistory,
        tiles: state.currentWord
          .split('')
          .map((letter, index) => ({ letter, id: index })),
      };
    }

    case 'WORD_SKIPPED': {
      const current = state.wordSequence[action.payload.wordIndex];
      if (!current) return state;
      const nextWordHistory = appendWordHistoryEntry(state, {
        wordIndex: action.payload.wordIndex,
        claimedBy: null,
      });
      return {
        ...state,
        isCorrect: true,
        isBonusWord: false,
        wordSkipped: true,
        wordHistory: nextWordHistory,
        tiles: current.word
          .split('')
          .map((letter, index) => ({ letter, id: index })),
      };
    }

    case 'NEXT_WORD': {
      const { wordIndex, gameTimeLeft, wordTimeLeft } = action.payload;
      const next = state.wordSequence[wordIndex];
      if (!next) {
        return {
          ...state,
          isCorrect: false,
          currentWordIndex: wordIndex,
          currentWord: '',
          tiles: [],
          gameTimeLeft,
          wordTimeLeft,
          lastClaimedBy: null,
          wordSkipped: false,
        };
      }
      return {
        ...state,
        isCorrect: false,
        isBonusWord: false,
        currentWordIndex: wordIndex,
        currentWord: next.word,
        tiles: next.tiles,
        gameTimeLeft,
        wordTimeLeft,
        lastClaimedBy: null,
        wordSkipped: false,
      };
    }

    case 'TIMER_SYNC':
      return {
        ...state,
        gameTimeLeft: action.payload.gameTimeLeft,
        wordTimeLeft: action.payload.wordTimeLeft,
      };

    case 'AWARD_ALT_BONUS':
      return { ...state, isBonusWord: true };

    case 'CLEAR_ALT_BONUS':
      return { ...state, isBonusWord: false };

    case 'REVEAL_FINAL_WORD': {
      const current = state.wordSequence[state.currentWordIndex];
      if (!current || state.isCorrect) return state;
      return {
        ...state,
        isCorrect: true,
        isBonusWord: false,
        wordSkipped: true,
        tiles: current.word
          .split('')
          .map((letter, index) => ({ letter, id: index })),
      };
    }

    case 'GAME_OVER': {
      const nextWordHistory = state.currentWord
        ? appendWordHistoryEntry(state, {
            wordIndex: state.currentWordIndex,
            claimedBy: null,
          })
        : state.wordHistory;
      const { scores, wordsFound } = toScoreMaps(action.payload.scores);
      return {
        ...state,
        phase: 'gameOver',
        isPlaying: false,
        gameOver: true,
        isBonusWord: false,
        winner: action.payload.winner,
        gameOverReason: action.payload.endReason ?? 'score',
        forfeitedBy: action.payload.forfeitedBy ?? null,
        scores,
        wordsFound,
        wordHistory: nextWordHistory,
      };
    }

    case 'PLAYER_DISCONNECTED':
      return state;

    case 'ROOM_FULL':
      return { ...state, connectionError: 'La salle est pleine.' };

    case 'CONNECTION_ERROR':
      return { ...state, connectionError: action.payload };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}
