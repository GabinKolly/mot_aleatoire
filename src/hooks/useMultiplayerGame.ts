import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { WORD_LISTS } from '../constants/wordLists';
import { buildShuffledTiles } from '../utils/wordPicking';
import { BONUS_ANIMATION_MS } from '../constants/timings';
import { DEFAULT_MP_MIN_WORD_LENGTH, DEFAULT_MP_MAX_WORD_LENGTH } from '../constants/gameConfig';
import type { MultiplayerConfig } from '../types/multiplayer';
import type { TileUpdater } from './gameStateReducer';
import { reducer, initialState } from './multiplayerReducer';
import { usePartySocket } from './usePartySocket';
import type { ClientMessage } from './usePartySocket';
import { generateRoomCode } from '../utils/playerIdentity';

export function useMultiplayerGame() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const { send, setupSocket, cleanup, wordFoundSentRef, bonusAwardedWordsRef, noMoreWordsSentRef } =
    usePartySocket(dispatch);

  const activeWordList = useMemo(
    () => WORD_LISTS[state.wordListKey] || WORD_LISTS.default,
    [state.wordListKey]
  );

  const filteredWords = useMemo(() => {
    const minLength = state.config.minWordLength ?? DEFAULT_MP_MIN_WORD_LENGTH;
    const maxLength = Math.max(
      state.config.maxWordLength ?? DEFAULT_MP_MAX_WORD_LENGTH,
      minLength
    );
    return activeWordList.words.filter(
      (word) => word.length >= minLength && word.length <= maxLength
    );
  }, [activeWordList.words, state.config.minWordLength, state.config.maxWordLength]);

  const filteredWordsSet = useMemo(() => new Set(filteredWords), [filteredWords]);

  const bonusCheckWordsSet = useMemo(
    () => new Set(activeWordList.bonusCheckWords || activeWordList.words),
    [activeWordList.bonusCheckWords, activeWordList.words]
  );

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
  }, [state.isPlaying, state.currentWordIndex, state.wordSequence.length, send, noMoreWordsSentRef]);

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
      const msg: ClientMessage = {
        type: 'WORD_FOUND',
        wordIndex: state.currentWordIndex,
        wordLength: state.currentWord.length,
      };
      send(msg);
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
    wordFoundSentRef,
    bonusAwardedWordsRef,
    send,
  ]);

  const reshuffleCurrentWord = useCallback((): void => {
    if (!state.isPlaying || state.isCorrect || state.currentWord.length < 2) return;
    dispatch({
      type: 'SET_TILES',
      payload: buildShuffledTiles(state.currentWord),
    });
  }, [state.currentWord, state.isCorrect, state.isPlaying]);

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

export type MultiplayerActions = ReturnType<typeof useMultiplayerGame>['actions'];

// Re-export DEFAULT_CONFIG for consumers that need it
export { DEFAULT_CONFIG } from './multiplayerReducer';
