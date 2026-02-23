import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import PartySocket from 'partysocket';
import { WORD_LISTS } from '../constants/wordLists';
import { createSeededRandom } from '../utils/seededRandom';
import { generateWordSequence, buildShuffledTiles } from '../utils/wordPicking';

const PARTYKIT_HOST =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_PARTYKIT_HOST
    ? import.meta.env.VITE_PARTYKIT_HOST
    : `${
        typeof window !== 'undefined' ? window.location.hostname : 'localhost'
      }:1999`;

const STORAGE_KEY_PLAYER_NAME = 'mot-melange-player-name';
const STORAGE_KEY_PLAYER_ID = 'mot-melange-player-id';

function getOrCreatePlayerId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY_PLAYER_ID);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY_PLAYER_ID, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function getSavedPlayerName() {
  try {
    return localStorage.getItem(STORAGE_KEY_PLAYER_NAME) || '';
  } catch {
    return '';
  }
}

function savePlayerName(name) {
  try {
    localStorage.setItem(STORAGE_KEY_PLAYER_NAME, name);
  } catch {
    // localStorage might be unavailable
  }
}

const DEFAULT_CONFIG = {
  gameTime: 180,
  wordTime: 30,
  minWordLength: 4,
  maxWordLength: 7,
};

const initialState = {
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
};

function reducer(state, action) {
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
        tiles: nextPhase === 'waiting' ? [] : state.tiles,
        wordSkipped: false,
      };
    }

    case 'ENTER_WAITING':
      return { ...state, phase: 'waiting' };

    case 'GAME_STARTED': {
      const { seed, config, wordListKey } = action.payload;
      const preset = WORD_LISTS[wordListKey] || WORD_LISTS['default'];
      const rng = createSeededRandom(seed);
      const wordSequence = generateWordSequence(
        preset.words,
        config.minWordLength,
        config.maxWordLength,
        rng,
        200
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
        lastClaimedBy: state.playerNumber,
        wordSkipped: false,
        tiles: state.currentWord
          .split('')
          .map((letter, index) => ({ letter, id: index })),
      };

    case 'WORD_CLAIMED': {
      const { scores, playerNumber } = action.payload;
      const newScores = {};
      const newWordsFound = {};
      for (const [num, data] of Object.entries(scores)) {
        newScores[num] = data.score;
        newWordsFound[num] = data.wordsFound;
      }
      return {
        ...state,
        isCorrect: true,
        scores: newScores,
        wordsFound: newWordsFound,
        lastClaimedBy: playerNumber,
        wordSkipped: false,
        tiles: state.currentWord
          .split('')
          .map((letter, index) => ({ letter, id: index })),
      };
    }

    case 'WORD_SKIPPED': {
      const current = state.wordSequence[action.payload.wordIndex];
      if (!current) return state;
      return {
        ...state,
        isCorrect: true,
        wordSkipped: true,
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

    case 'REVEAL_FINAL_WORD': {
      const current = state.wordSequence[state.currentWordIndex];
      if (!current || state.isCorrect) return state;
      return {
        ...state,
        isCorrect: true,
        wordSkipped: true,
        tiles: current.word
          .split('')
          .map((letter, index) => ({ letter, id: index })),
      };
    }

    case 'GAME_OVER':
      return {
        ...state,
        phase: 'gameOver',
        isPlaying: false,
        gameOver: true,
        winner: action.payload.winner,
        gameOverReason: action.payload.endReason ?? 'score',
        forfeitedBy: action.payload.forfeitedBy ?? null,
        scores: Object.fromEntries(
          Object.entries(action.payload.scores).map(([num, data]) => [num, data.score])
        ),
        wordsFound: Object.fromEntries(
          Object.entries(action.payload.scores).map(([num, data]) => [num, data.wordsFound])
        ),
      };

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
  const socketRef = useRef(null);
  const playerIdRef = useRef(getOrCreatePlayerId());
  const playerNameRef = useRef('');
  const wordFoundSentRef = useRef(new Set());

  const cleanup = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    wordFoundSentRef.current = new Set();
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const setupSocket = useCallback(
    (roomId, playerName) => {
      cleanup();
      playerNameRef.current = playerName;
      savePlayerName(playerName);

      const socket = new PartySocket({
        host: PARTYKIT_HOST,
        room: roomId,
      });

      // Send JOIN on every open — including auto-reconnections
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify({
          type: 'JOIN',
          playerId: playerIdRef.current,
          playerName: playerNameRef.current,
        }));
      });

      socket.addEventListener('message', (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (data.type) {
          case 'WELCOME':
            dispatch({ type: 'WELCOME', payload: data });
            break;

          case 'ROOM_STATE':
            dispatch({
              type: 'ROOM_STATE',
              payload: { ...data, myPlayerId: playerIdRef.current },
            });
            break;

          case 'GAME_STARTED':
            wordFoundSentRef.current = new Set();
            dispatch({ type: 'GAME_STARTED', payload: data });
            break;

          case 'WORD_CLAIMED':
            dispatch({ type: 'WORD_CLAIMED', payload: data });
            break;

          case 'WORD_SKIPPED':
            dispatch({ type: 'WORD_SKIPPED', payload: data });
            break;

          case 'NEXT_WORD':
            dispatch({ type: 'NEXT_WORD', payload: data });
            break;

          case 'TIMER_SYNC':
            dispatch({ type: 'TIMER_SYNC', payload: data });
            break;

          case 'GAME_OVER':
            dispatch({ type: 'REVEAL_FINAL_WORD' });
            setTimeout(() => {
              dispatch({ type: 'GAME_OVER', payload: data });
            }, 1500);
            break;

          case 'PLAYER_DISCONNECTED':
            dispatch({ type: 'PLAYER_DISCONNECTED', payload: data });
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

  const send = useCallback((data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  const createRoom = useCallback(
    (playerName) => {
      const roomId = generateRoomCode();
      dispatch({ type: 'SET_ROOM_CODE', payload: roomId });
      setupSocket(roomId, playerName);
      dispatch({ type: 'ENTER_WAITING' });
    },
    [setupSocket]
  );

  const joinRoom = useCallback(
    (roomId, playerName) => {
      dispatch({ type: 'SET_ROOM_CODE', payload: roomId.toUpperCase() });
      setupSocket(roomId.toUpperCase(), playerName);
      dispatch({ type: 'ENTER_WAITING' });
    },
    [setupSocket]
  );

  const updateConfig = useCallback(
    (config, wordListKey) => {
      send({ type: 'UPDATE_CONFIG', config, wordListKey });
    },
    [send]
  );

  const startGame = useCallback(() => {
    send({ type: 'START_GAME' });
  }, [send]);

  const setTiles = useCallback(
    (value) => dispatch({ type: 'SET_TILES', payload: value }),
    []
  );

  const checkWord = useCallback(() => {
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
    }
  }, [state.isPlaying, state.isCorrect, state.tiles, state.currentWord, state.currentWordIndex, send]);

  const reshuffleCurrentWord = useCallback(() => {
    if (!state.isPlaying || state.isCorrect || state.currentWord.length < 2) return;
    dispatch({
      type: 'SET_TILES',
      payload: buildShuffledTiles(state.currentWord),
    });
  }, [state.currentWord, state.isCorrect, state.isPlaying]);

  const forfeit = useCallback(() => {
    send({ type: 'FORFEIT' });
  }, [send]);

  const goBackToLobby = useCallback(() => {
    cleanup();
    dispatch({ type: 'RESET' });
  }, [cleanup]);

  const playAgain = useCallback(() => {
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
    [createRoom, joinRoom, updateConfig, startGame, setTiles, checkWord, reshuffleCurrentWord, forfeit, goBackToLobby, playAgain]
  );

  return { state, actions };
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
