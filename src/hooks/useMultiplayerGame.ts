import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import PartySocket from 'partysocket';
import { WORD_LISTS } from '../constants/wordLists';
import { createSeededRandom } from '../utils/seededRandom';
import { generateWordSequence, buildShuffledTiles } from '../utils/wordPicking';
import { BONUS_ANIMATION_MS, GAME_OVER_REVEAL_MS } from '../constants/timings';
import {
  DEFAULT_MP_GAME_TIME,
  DEFAULT_MP_WORD_TIME,
  DEFAULT_MP_MIN_WORD_LENGTH,
  DEFAULT_MP_MAX_WORD_LENGTH,
  MAX_WORD_SEQUENCE,
} from '../constants/gameConfig';
import type { MultiplayerAction, MultiplayerConfig, MultiplayerState, WordHistoryEntry } from '../types/multiplayer';
import type { Tile } from '../types/game';

const PARTYKIT_HOST =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_PARTYKIT_HOST
    ? import.meta.env.VITE_PARTYKIT_HOST
    : `${
        typeof window !== 'undefined' ? window.location.hostname : 'localhost'
      }:1999`;

const STORAGE_KEY_PLAYER_NAME = 'mot-melange-player-name';
const STORAGE_KEY_PLAYER_ID = 'mot-melange-player-id';

type TileUpdater = Tile[] | ((tiles: Tile[]) => Tile[]);
type ScoresPayload = Record<number, { score: number; wordsFound: number }>;
type WelcomePayload = Extract<MultiplayerAction, { type: 'WELCOME' }>['payload'];
type RoomStatePayload = Extract<MultiplayerAction, { type: 'ROOM_STATE' }>['payload'];
type GameStartedPayload = Extract<MultiplayerAction, { type: 'GAME_STARTED' }>['payload'];
type WordClaimedPayload = Extract<MultiplayerAction, { type: 'WORD_CLAIMED' }>['payload'];
type WordSkippedPayload = Extract<MultiplayerAction, { type: 'WORD_SKIPPED' }>['payload'];
type NextWordPayload = Extract<MultiplayerAction, { type: 'NEXT_WORD' }>['payload'];
type TimerSyncPayload = Extract<MultiplayerAction, { type: 'TIMER_SYNC' }>['payload'];
type GameOverPayload = Extract<MultiplayerAction, { type: 'GAME_OVER' }>['payload'];
type PlayerDisconnectedPayload = Extract<
  MultiplayerAction,
  { type: 'PLAYER_DISCONNECTED' }
>['payload'];

type ClientMessage =
  | { type: 'JOIN'; playerId: string; playerName: string }
  | { type: 'UPDATE_CONFIG'; config: MultiplayerConfig; wordListKey: string }
  | { type: 'START_GAME' }
  | { type: 'WORD_FOUND'; wordIndex: number; wordLength: number }
  | { type: 'NO_MORE_WORDS' }
  | { type: 'FORFEIT' }
  | { type: 'PLAY_AGAIN' };

function generatePlayerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join(''),
    ].join('-');
  }

  return `player-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreatePlayerId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY_PLAYER_ID);
    if (!id) {
      id = generatePlayerId();
      localStorage.setItem(STORAGE_KEY_PLAYER_ID, id);
    }
    return id;
  } catch {
    return generatePlayerId();
  }
}

export function getSavedPlayerName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_PLAYER_NAME) || '';
  } catch {
    return '';
  }
}

function savePlayerName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_PLAYER_NAME, name);
  } catch {
    // localStorage might be unavailable
  }
}

const DEFAULT_CONFIG: MultiplayerConfig = {
  gameTime: DEFAULT_MP_GAME_TIME,
  wordTime: DEFAULT_MP_WORD_TIME,
  minWordLength: DEFAULT_MP_MIN_WORD_LENGTH,
  maxWordLength: DEFAULT_MP_MAX_WORD_LENGTH,
};

const initialState: MultiplayerState = {
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

function toScoreMaps(scoresPayload: ScoresPayload): {
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

function appendWordHistoryEntry(
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

function reducer(state: MultiplayerState, action: MultiplayerAction): MultiplayerState {
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
      return {
        ...state,
        isBonusWord: true,
      };

    case 'CLEAR_ALT_BONUS':
      return {
        ...state,
        isBonusWord: false,
      };

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

export function useMultiplayerGame() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef<PartySocket | null>(null);
  const playerIdRef = useRef(getOrCreatePlayerId());
  const playerNameRef = useRef('');
  const wordFoundSentRef = useRef<Set<number>>(new Set());
  const bonusAwardedWordsRef = useRef<Set<string>>(new Set());
  const noMoreWordsSentRef = useRef(false);

  const cleanup = useCallback((): void => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    wordFoundSentRef.current = new Set();
    bonusAwardedWordsRef.current = new Set();
    noMoreWordsSentRef.current = false;
  }, []);

  const activeWordList = useMemo(
    () => WORD_LISTS[state.wordListKey] || WORD_LISTS.default,
    [state.wordListKey]
  );
  const filteredWords = useMemo(() => {
    const minLength = state.config.minWordLength ?? DEFAULT_CONFIG.minWordLength;
    const maxLength = Math.max(
      state.config.maxWordLength ?? DEFAULT_CONFIG.maxWordLength,
      minLength
    );
    return activeWordList.words.filter(
      (word) => word.length >= minLength && word.length <= maxLength
    );
  }, [activeWordList.words, state.config.maxWordLength, state.config.minWordLength]);
  const filteredWordsSet = useMemo(() => new Set(filteredWords), [filteredWords]);
  const bonusCheckWordsSet = useMemo(
    () => new Set(activeWordList.bonusCheckWords || activeWordList.words),
    [activeWordList.bonusCheckWords, activeWordList.words]
  );

  useEffect(() => cleanup, [cleanup]);

  const setupSocket = useCallback(
    (roomId: string, playerName: string): void => {
      cleanup();
      playerNameRef.current = playerName;
      savePlayerName(playerName);

      const socket = new PartySocket({
        host: PARTYKIT_HOST,
        room: roomId,
      });

      // Send JOIN on every open — including auto-reconnections
      socket.addEventListener('open', () => {
        const joinMessage: ClientMessage = {
          type: 'JOIN',
          playerId: playerIdRef.current,
          playerName: playerNameRef.current,
        };
        socket.send(JSON.stringify(joinMessage));
      });

      socket.addEventListener('message', (event) => {
        if (typeof event.data !== 'string') {
          return;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(event.data);
        } catch {
          return;
        }

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return;
        }

        const data = parsed as { type?: unknown } & Record<string, unknown>;
        if (typeof data.type !== 'string') {
          return;
        }

        switch (data.type) {
          case 'WELCOME':
            dispatch({ type: 'WELCOME', payload: data as unknown as WelcomePayload });
            break;

          case 'ROOM_STATE':
            dispatch({
              type: 'ROOM_STATE',
              payload: {
                ...(data as unknown as Omit<RoomStatePayload, 'myPlayerId'>),
                myPlayerId: playerIdRef.current,
              },
            });
            break;

          case 'GAME_STARTED':
            wordFoundSentRef.current = new Set();
            bonusAwardedWordsRef.current = new Set();
            noMoreWordsSentRef.current = false;
            dispatch({
              type: 'GAME_STARTED',
              payload: data as unknown as GameStartedPayload,
            });
            break;

          case 'WORD_CLAIMED':
            dispatch({
              type: 'WORD_CLAIMED',
              payload: data as unknown as WordClaimedPayload,
            });
            break;

          case 'WORD_SKIPPED':
            dispatch({
              type: 'WORD_SKIPPED',
              payload: data as unknown as WordSkippedPayload,
            });
            break;

          case 'NEXT_WORD':
            bonusAwardedWordsRef.current = new Set();
            dispatch({
              type: 'NEXT_WORD',
              payload: data as unknown as NextWordPayload,
            });
            break;

          case 'TIMER_SYNC':
            dispatch({
              type: 'TIMER_SYNC',
              payload: data as unknown as TimerSyncPayload,
            });
            break;

          case 'GAME_OVER':
            dispatch({ type: 'REVEAL_FINAL_WORD' });
            setTimeout(() => {
              dispatch({
                type: 'GAME_OVER',
                payload: data as unknown as GameOverPayload,
              });
            }, GAME_OVER_REVEAL_MS);
            break;

          case 'PLAYER_DISCONNECTED':
            dispatch({
              type: 'PLAYER_DISCONNECTED',
              payload: data as unknown as PlayerDisconnectedPayload,
            });
            break;

          case 'ROOM_FULL':
            dispatch({ type: 'ROOM_FULL' });
            break;
        }
      });

      socket.addEventListener('error', () => {
        dispatch({
          type: 'CONNECTION_ERROR',
          payload: 'Erreur de connexion au serveur.',
        });
      });

      socketRef.current = socket;
    },
    [cleanup]
  );

  const send = useCallback((data: ClientMessage): void => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  const createRoom = useCallback(
    (playerName: string): void => {
      const roomId = generateRoomCode();
      dispatch({ type: 'SET_ROOM_CODE', payload: roomId });
      setupSocket(roomId, playerName);
      dispatch({ type: 'ENTER_WAITING' });
    },
    [setupSocket]
  );

  const joinRoom = useCallback(
    (roomId: string, playerName: string): void => {
      dispatch({ type: 'SET_ROOM_CODE', payload: roomId.toUpperCase() });
      setupSocket(roomId.toUpperCase(), playerName);
      dispatch({ type: 'ENTER_WAITING' });
    },
    [setupSocket]
  );

  const updateConfig = useCallback(
    (config: MultiplayerConfig, wordListKey: string): void => {
      send({ type: 'UPDATE_CONFIG', config, wordListKey });
    },
    [send]
  );

  const startGame = useCallback((): void => {
    send({ type: 'START_GAME' });
  }, [send]);

  const setTiles = useCallback((value: TileUpdater): void => {
    dispatch({ type: 'SET_TILES', payload: value });
  }, []);

  const checkWord = useCallback((): void => {
    if (!state.isPlaying || state.isCorrect) return;
    if (wordFoundSentRef.current.has(state.currentWordIndex)) return;

    const currentTileWord = state.tiles.map((t) => t.letter).join('');
    if (currentTileWord === state.currentWord && state.currentWord.length > 0) {
      wordFoundSentRef.current.add(state.currentWordIndex);
      dispatch({ type: 'LOCAL_CORRECT' });
      send({
        type: 'WORD_FOUND',
        wordIndex: state.currentWordIndex,
        wordLength: state.currentWord.length,
      });
      return;
    }

    if (
      state.currentWord.length > 0 &&
      currentTileWord !== state.currentWord &&
      (bonusCheckWordsSet.has(currentTileWord) || filteredWordsSet.has(currentTileWord)) &&
      !bonusAwardedWordsRef.current.has(currentTileWord)
    ) {
      bonusAwardedWordsRef.current.add(currentTileWord);
      dispatch({ type: 'AWARD_ALT_BONUS' });
      setTimeout(() => dispatch({ type: 'CLEAR_ALT_BONUS' }), BONUS_ANIMATION_MS);
    }
  }, [
    state.isPlaying,
    state.isCorrect,
    state.tiles,
    state.currentWord,
    state.currentWordIndex,
    bonusCheckWordsSet,
    filteredWordsSet,
    send,
  ]);

  const reshuffleCurrentWord = useCallback((): void => {
    if (!state.isPlaying || state.isCorrect || state.currentWord.length < 2) return;
    dispatch({
      type: 'SET_TILES',
      payload: buildShuffledTiles(state.currentWord),
    });
  }, [state.currentWord, state.isCorrect, state.isPlaying]);

  useEffect(() => {
    if (!state.isPlaying) {
      return;
    }

    if (state.currentWordIndex < state.wordSequence.length) {
      return;
    }

    if (noMoreWordsSentRef.current) {
      return;
    }

    noMoreWordsSentRef.current = true;
    send({ type: 'NO_MORE_WORDS' });
  }, [state.isPlaying, state.currentWordIndex, state.wordSequence.length, send]);

  const forfeit = useCallback((): void => {
    send({ type: 'FORFEIT' });
  }, [send]);

  const goBackToLobby = useCallback((): void => {
    cleanup();
    dispatch({ type: 'RESET' });
  }, [cleanup]);

  const playAgain = useCallback((): void => {
    send({ type: 'PLAY_AGAIN' });
  }, [send]);

  const actions = useMemo(
    () => ({
      createRoom,
      joinRoom,
      updateConfig,
      startGame,
      setTiles,
      checkWord,
      reshuffleCurrentWord,
      forfeit,
      goBackToLobby,
      playAgain,
    }),
    [
      createRoom,
      joinRoom,
      updateConfig,
      startGame,
      setTiles,
      checkWord,
      reshuffleCurrentWord,
      forfeit,
      goBackToLobby,
      playAgain,
    ]
  );

  return { state, actions };
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export type MultiplayerActions = ReturnType<typeof useMultiplayerGame>['actions'];
