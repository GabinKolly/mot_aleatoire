import { useEffect, useCallback, useMemo, useReducer } from 'react';
import { WORD_LISTS } from '../constants/wordLists';
import { savePersistedConfig } from '../constants/persistence';
import { buildShuffledTiles } from '../utils/wordPicking';
import { MIN_WORD_LENGTH_ABSOLUTE } from '../constants/gameConfig';
import {
  reducer,
  getInitialState,
  createListNameResolver,
  generateAddedListId,
  type TileUpdater,
} from './gameStateReducer';
import { useWordPicking } from './useWordPicking';
import { useHighScores } from './useHighScores';

export function useGameState({
  initialPresetKey = 'default',
}: {
  initialPresetKey?: string;
} = {}) {
  const [state, dispatch] = useReducer(reducer, initialPresetKey, getInitialState);

  const { words, wordsSet, bonusCheckWordsSet, checkWord, resetBonusRef } = useWordPicking(
    state,
    dispatch
  );
  const { currentListKey, currentListStandardSettings, currentListHighScore, startRun } =
    useHighScores(state, dispatch);

  const isUsingStandardSettings =
    state.startTime === currentListStandardSettings.startTime &&
    state.bonusTime === currentListStandardSettings.bonusTime &&
    state.alternativeWordBonusTime === currentListStandardSettings.alternativeWordBonusTime &&
    state.minWordLength === currentListStandardSettings.minWordLength &&
    state.maxWordLength === currentListStandardSettings.maxWordLength &&
    state.answerValidationMode === currentListStandardSettings.answerValidationMode;

  useEffect(() => {
    if (!state.isPlaying) {
      return;
    }

    if (state.timeLeft <= 0) {
      dispatch({ type: 'TIME_UP' });
      return;
    }

    const timer = setTimeout(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearTimeout(timer);
  }, [state.isPlaying, state.timeLeft]);

  useEffect(() => {
    savePersistedConfig({
      version: 3,
      settings: {
        startTime: state.startTime,
        bonusTime: state.bonusTime,
        alternativeWordBonusTime: state.alternativeWordBonusTime,
        minWordLength: state.minWordLength,
        maxWordLength: state.maxWordLength,
        answerValidationMode: state.answerValidationMode,
      },
      list: {
        selectedPreset: state.selectedPreset,
        selectedAddedListId: state.selectedAddedListId,
        added: state.addedWordLists,
      },
      highScores: state.highScores,
    });
  }, [
    state.startTime,
    state.bonusTime,
    state.alternativeWordBonusTime,
    state.minWordLength,
    state.maxWordLength,
    state.answerValidationMode,
    state.selectedPreset,
    state.selectedAddedListId,
    state.addedWordLists,
    state.highScores,
  ]);

  const startGame = useCallback(() => {
    resetBonusRef();
    startRun(isUsingStandardSettings, currentListKey);
    dispatch({
      type: 'START_GAME',
      payload: { isScoreEligible: isUsingStandardSettings },
    });
  }, [resetBonusRef, startRun, isUsingStandardSettings, currentListKey]);

  const giveUp = useCallback(() => dispatch({ type: 'GIVE_UP' }), []);

  const toggleSettings = useCallback(() => dispatch({ type: 'TOGGLE_SETTINGS' }), []);

  const changePreset = useCallback(
    (presetKey: string) => {
      if (!WORD_LISTS[presetKey]) {
        return;
      }
      resetBonusRef();
      dispatch({ type: 'CHANGE_PRESET', payload: presetKey });
    },
    [resetBonusRef]
  );

  const addAddedWordList = useCallback(
    (wordList: string[], name: string) => {
      if (!Array.isArray(wordList) || wordList.length === 0) {
        return;
      }
      const resolveName = createListNameResolver(state.addedWordLists.map((list) => list.name));
      const nextName = resolveName(name);
      resetBonusRef();
      dispatch({
        type: 'ADD_ADDED_LIST',
        payload: { id: generateAddedListId(), name: nextName, words: wordList },
      });
    },
    [resetBonusRef, state.addedWordLists]
  );

  const selectAddedWordList = useCallback(
    (id: string) => {
      if (typeof id !== 'string' || id.length === 0) {
        return;
      }
      if (!state.addedWordLists.some((list) => list.id === id)) {
        return;
      }
      resetBonusRef();
      dispatch({ type: 'SELECT_ADDED_LIST', payload: id });
    },
    [resetBonusRef, state.addedWordLists]
  );

  const renameAddedWordList = useCallback(
    (id: string, rawName: string) => {
      const target = state.addedWordLists.find((list) => list.id === id);
      if (!target) {
        return;
      }
      const trimmedName = typeof rawName === 'string' ? rawName.trim() : '';
      if (trimmedName.length === 0) {
        return;
      }
      const resolveName = createListNameResolver(
        state.addedWordLists.filter((list) => list.id !== id).map((list) => list.name)
      );
      const nextName = resolveName(trimmedName);
      dispatch({ type: 'RENAME_ADDED_LIST', payload: { id, name: nextName } });
    },
    [state.addedWordLists]
  );

  const removeAddedWordList = useCallback(
    (id: string) => {
      if (!state.addedWordLists.some((list) => list.id === id)) {
        return;
      }
      resetBonusRef();
      dispatch({ type: 'REMOVE_ADDED_LIST', payload: id });
    },
    [resetBonusRef, state.addedWordLists]
  );

  const setStartTime = useCallback(
    (value: number) => dispatch({ type: 'SET_START_TIME', payload: value }),
    []
  );
  const setBonusTime = useCallback(
    (value: number) => dispatch({ type: 'SET_BONUS_TIME', payload: value }),
    []
  );
  const setAlternativeWordBonusTime = useCallback(
    (value: number) => dispatch({ type: 'SET_ALT_BONUS_TIME', payload: value }),
    []
  );
  const setAnswerValidationMode = useCallback(
    (value: 'loose' | 'strict') =>
      dispatch({ type: 'SET_ANSWER_VALIDATION_MODE', payload: value }),
    []
  );

  const resetSettingsToStandardForCurrentList = useCallback(() => {
    resetBonusRef();
    dispatch({ type: 'RESET_SETTINGS_TO_STANDARD' });
  }, [resetBonusRef]);

  const clearHighScoreForCurrentList = useCallback(() => {
    dispatch({ type: 'CLEAR_HIGH_SCORE_FOR_CURRENT_LIST' });
  }, []);

  const setMinWordLength = useCallback(
    (value: number) => {
      resetBonusRef();
      dispatch({ type: 'SET_MIN_WORD_LENGTH', payload: Math.max(MIN_WORD_LENGTH_ABSOLUTE, value) });
    },
    [resetBonusRef]
  );

  const setMaxWordLength = useCallback(
    (value: number) => {
      const nextMax = Math.max(MIN_WORD_LENGTH_ABSOLUTE, value, state.minWordLength);
      resetBonusRef();
      dispatch({ type: 'SET_MAX_WORD_LENGTH', payload: nextMax });
    },
    [resetBonusRef, state.minWordLength]
  );

  const setTiles = useCallback(
    (value: TileUpdater) => dispatch({ type: 'SET_TILES', payload: value }),
    []
  );

  const reshuffleCurrentWord = useCallback(() => {
    if (!state.isPlaying || state.isCorrect || state.currentWord.length < 2) {
      return;
    }
    dispatch({
      type: 'SET_TILES',
      payload: buildShuffledTiles(state.currentWord, Math.random, {
        forbiddenWords:
          state.answerValidationMode === 'loose' ? state.currentAcceptedWords : undefined,
      }),
    });
  }, [
    state.currentWord,
    state.currentAcceptedWords,
    state.answerValidationMode,
    state.isCorrect,
    state.isPlaying,
  ]);

  const actions = useMemo(
    () => ({
      startGame,
      giveUp,
      toggleSettings,
      changePreset,
      addAddedWordList,
      selectAddedWordList,
      renameAddedWordList,
      removeAddedWordList,
      setStartTime,
      setBonusTime,
      setAlternativeWordBonusTime,
      setAnswerValidationMode,
      resetSettingsToStandardForCurrentList,
      clearHighScoreForCurrentList,
      setMinWordLength,
      setMaxWordLength,
      setTiles,
      reshuffleCurrentWord,
      checkWord,
    }),
    [
      startGame,
      giveUp,
      toggleSettings,
      changePreset,
      addAddedWordList,
      selectAddedWordList,
      renameAddedWordList,
      removeAddedWordList,
      setStartTime,
      setBonusTime,
      setAlternativeWordBonusTime,
      setAnswerValidationMode,
      resetSettingsToStandardForCurrentList,
      clearHighScoreForCurrentList,
      setMinWordLength,
      setMaxWordLength,
      setTiles,
      reshuffleCurrentWord,
      checkWord,
    ]
  );

  return {
    state: {
      ...state,
      words,
      wordsSet,
      bonusCheckWordsSet,
      currentListKey,
      currentListStandardSettings,
      isUsingStandardSettings,
      currentListHighScore,
    },
    actions,
  };
}

export type GameActions = ReturnType<typeof useGameState>['actions'];
export type GameStateView = ReturnType<typeof useGameState>['state'];
