import { useEffect, useMemo, useRef, useReducer, useCallback } from 'react';
import { WORD_LISTS } from '../constants/wordLists';
import { loadPersistedConfig, savePersistedConfig } from '../constants/persistence';
import { buildShuffledTiles, pickWordFromList } from '../utils/wordPicking';

const DEFAULT_TIME_SETTINGS = {
  startTime: 45,
  bonusTime: 10,
  alternativeWordBonusTime: 5,
};

const buildListScoreKey = ({ selectedPreset, selectedAddedListId }) =>
  selectedAddedListId ? `added:${selectedAddedListId}` : `preset:${selectedPreset}`;

const getStandardWordLengthForSelection = ({
  selectedPreset,
  selectedAddedListId,
}) => {
  if (selectedAddedListId) {
    return { minWordLength: 3, maxWordLength: 30 };
  }

  if (selectedPreset === 'default' || selectedPreset === 'hard') {
    return { minWordLength: 4, maxWordLength: 7 };
  }

  if (selectedPreset === 'motsAvecW') {
    return { minWordLength: 3, maxWordLength: 7 };
  }

  return { minWordLength: 3, maxWordLength: 30 };
};

const getStandardSettingsForSelection = (selection) => ({
  ...DEFAULT_TIME_SETTINGS,
  ...getStandardWordLengthForSelection(selection),
});

const createListNameResolver = (existingNames) => {
  const used = new Set(existingNames);

  return (rawName) => {
    const baseName =
      typeof rawName === 'string' && rawName.trim().length > 0
        ? rawName.trim()
        : 'Liste ajoutee';

    if (!used.has(baseName)) {
      used.add(baseName);
      return baseName;
    }

    let suffix = 2;
    let candidate = `${baseName} (${suffix})`;
    while (used.has(candidate)) {
      suffix += 1;
      candidate = `${baseName} (${suffix})`;
    }
    used.add(candidate);
    return candidate;
  };
};

const generateAddedListId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `added-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const resolveActiveList = ({ selectedPreset, selectedAddedListId, addedWordLists }) => {
  const selectedAddedList = addedWordLists.find((list) => list.id === selectedAddedListId);
  if (selectedAddedList) {
    return {
      allWords: selectedAddedList.words,
      bonusCheckWords: selectedAddedList.words,
      wordListName: selectedAddedList.name,
      selectedPreset: WORD_LISTS[selectedPreset] ? selectedPreset : 'default',
      selectedAddedListId: selectedAddedList.id,
    };
  }

  const resolvedPreset = WORD_LISTS[selectedPreset] ? selectedPreset : 'default';
  const preset = WORD_LISTS[resolvedPreset];
  return {
    allWords: preset.words,
    bonusCheckWords: preset.bonusCheckWords,
    wordListName: preset.name,
    selectedPreset: resolvedPreset,
    selectedAddedListId: null,
  };
};

const getInitialState = (initialPresetKey) => {
  const fallbackPreset = WORD_LISTS[initialPresetKey] ? initialPresetKey : 'default';
  const persisted = loadPersistedConfig({ presetKeys: Object.keys(WORD_LISTS) });

  const selectedPreset = persisted?.list?.selectedPreset ?? fallbackPreset;
  const selectedAddedListId = persisted?.list?.selectedAddedListId ?? null;
  const addedWordLists = persisted?.list?.added ?? [];
  const resolvedList = resolveActiveList({
    selectedPreset,
    selectedAddedListId,
    addedWordLists,
  });
  const persistedSettings = persisted?.settings;

  return {
    allWords: resolvedList.allWords,
    bonusCheckWords: resolvedList.bonusCheckWords,
    currentWord: '',
    tiles: [],
    usedWords: [],
    isCorrect: false,
    isBonusWord: false,
    timeLeft: 0,
    score: 0,
    wordsFound: 0,
    completionTimeBonus: 0,
    lastGameWasNewRecord: false,
    lastGameWasScoreEligible: false,
    isPlaying: false,
    gameOver: false,
    allWordsCompleted: false,
    showSettings: false,
    wordListName: resolvedList.wordListName,
    selectedPreset: resolvedList.selectedPreset,
    selectedAddedListId: resolvedList.selectedAddedListId,
    addedWordLists,
    highScores: persisted?.highScores ?? {},
    startTime: persistedSettings?.startTime ?? 45,
    bonusTime: persistedSettings?.bonusTime ?? 10,
    alternativeWordBonusTime: persistedSettings?.alternativeWordBonusTime ?? 5,
    minWordLength: persistedSettings?.minWordLength ?? 4,
    maxWordLength: persistedSettings?.maxWordLength ?? 7,
  };
};

const buildRoundResetState = (state, overrides = {}) => ({
  ...state,
  isPlaying: false,
  gameOver: false,
  allWordsCompleted: false,
  usedWords: [],
  score: 0,
  wordsFound: 0,
  completionTimeBonus: 0,
  lastGameWasNewRecord: false,
  lastGameWasScoreEligible: false,
  timeLeft: 0,
  currentWord: '',
  tiles: [],
  isCorrect: false,
  isBonusWord: false,
  ...overrides,
});

const buildListSelectionState = (state, selection) => {
  const resolved = resolveActiveList(selection);
  return buildRoundResetState(state, {
    allWords: resolved.allWords,
    bonusCheckWords: resolved.bonusCheckWords,
    wordListName: resolved.wordListName,
    selectedPreset: resolved.selectedPreset,
    selectedAddedListId: resolved.selectedAddedListId,
    addedWordLists: selection.addedWordLists,
  });
};

function reducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings };
    case 'SET_START_TIME':
      return { ...state, startTime: action.payload };
    case 'SET_BONUS_TIME':
      return { ...state, bonusTime: action.payload };
    case 'SET_ALT_BONUS_TIME':
      return { ...state, alternativeWordBonusTime: action.payload };
    case 'CLEAR_HIGH_SCORE_FOR_CURRENT_LIST': {
      const listKey = buildListScoreKey({
        selectedPreset: state.selectedPreset,
        selectedAddedListId: state.selectedAddedListId,
      });
      const { [listKey]: _removedHighScore, ...nextHighScores } = state.highScores;
      return {
        ...state,
        highScores: nextHighScores,
      };
    }
    case 'RESET_SETTINGS_TO_STANDARD': {
      const standardSettings = getStandardSettingsForSelection({
        selectedPreset: state.selectedPreset,
        selectedAddedListId: state.selectedAddedListId,
      });
      return buildRoundResetState(state, standardSettings);
    }
    case 'SET_MIN_WORD_LENGTH': {
      const nextMin = action.payload;
      const nextMax = Math.max(state.maxWordLength, nextMin);
      return buildRoundResetState(state, {
        minWordLength: nextMin,
        maxWordLength: nextMax,
      });
    }
    case 'SET_MAX_WORD_LENGTH':
      return buildRoundResetState(state, {
        maxWordLength: action.payload,
      });
    case 'CHANGE_PRESET':
      return buildListSelectionState(state, {
        selectedPreset: action.payload,
        selectedAddedListId: null,
        addedWordLists: state.addedWordLists,
      });
    case 'SELECT_ADDED_LIST':
      return buildListSelectionState(state, {
        selectedPreset: state.selectedPreset,
        selectedAddedListId: action.payload,
        addedWordLists: state.addedWordLists,
      });
    case 'ADD_ADDED_LIST': {
      const nextAddedWordLists = [...state.addedWordLists, action.payload];
      return buildListSelectionState(state, {
        selectedPreset: state.selectedPreset,
        selectedAddedListId: action.payload.id,
        addedWordLists: nextAddedWordLists,
      });
    }
    case 'RENAME_ADDED_LIST': {
      const { id, name } = action.payload;
      const nextAddedWordLists = state.addedWordLists.map((list) =>
        list.id === id ? { ...list, name } : list
      );
      if (state.selectedAddedListId === id) {
        return {
          ...state,
          addedWordLists: nextAddedWordLists,
          wordListName: name,
        };
      }
      return {
        ...state,
        addedWordLists: nextAddedWordLists,
      };
    }
    case 'REMOVE_ADDED_LIST': {
      const removedId = action.payload;
      const nextAddedWordLists = state.addedWordLists.filter(
        (list) => list.id !== removedId
      );
      const { [`added:${removedId}`]: _removedHighScore, ...nextHighScores } =
        state.highScores;

      if (state.selectedAddedListId === removedId) {
        return buildListSelectionState(
          {
            ...state,
            highScores: nextHighScores,
          },
          {
            selectedPreset: 'default',
            selectedAddedListId: null,
            addedWordLists: nextAddedWordLists,
          }
        );
      }

      return {
        ...state,
        addedWordLists: nextAddedWordLists,
        highScores: nextHighScores,
      };
    }
    case 'START_GAME':
      return buildRoundResetState(state, {
        timeLeft: state.startTime,
        isPlaying: true,
        lastGameWasScoreEligible: action.payload?.isScoreEligible === true,
      });
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
        score: state.score + Math.max(0, state.timeLeft),
        completionTimeBonus: Math.max(0, state.timeLeft),
      };
    case 'CORRECT_WORD':
      // Force solved visual order during the success animation.
      return {
        ...state,
        isCorrect: true,
        isBonusWord: false,
        tiles: state.currentWord
          .split('')
          .map((letter, index) => ({ letter, id: index })),
        wordsFound: state.wordsFound + 1,
        score: state.score + state.currentWord.length,
        timeLeft: state.timeLeft + state.bonusTime,
      };
    case 'AWARD_ALT_BONUS':
      return {
        ...state,
        isBonusWord: true,
        timeLeft: state.timeLeft + state.alternativeWordBonusTime,
      };
    case 'CLEAR_ALT_BONUS':
      return { ...state, isBonusWord: false };
    case 'TICK':
      return { ...state, timeLeft: state.timeLeft - 1 };
    case 'TIME_UP':
      return { ...state, isPlaying: false, gameOver: true };
    case 'SET_HIGH_SCORE_FOR_LIST': {
      const { listKey, score } = action.payload;
      const previous = state.highScores[listKey] ?? 0;
      if (score <= previous) {
        return state;
      }

      return {
        ...state,
        highScores: {
          ...state.highScores,
          [listKey]: score,
        },
        lastGameWasNewRecord: true,
      };
    }
    default:
      return state;
  }
}

export function useGameState({ initialPresetKey = 'default' } = {}) {
  const [state, dispatch] = useReducer(reducer, initialPresetKey, getInitialState);
  const bonusAwardedWordsRef = useRef(new Set());
  const currentWordScoredRef = useRef(false);
  const activeRunSnapshotRef = useRef({
    isActive: false,
    isEligible: false,
    listKey: null,
    finalized: false,
  });

  const currentListKey = useMemo(
    () =>
      buildListScoreKey({
        selectedPreset: state.selectedPreset,
        selectedAddedListId: state.selectedAddedListId,
      }),
    [state.selectedPreset, state.selectedAddedListId]
  );

  const currentListStandardSettings = useMemo(
    () =>
      getStandardSettingsForSelection({
        selectedPreset: state.selectedPreset,
        selectedAddedListId: state.selectedAddedListId,
      }),
    [state.selectedPreset, state.selectedAddedListId]
  );

  const isUsingStandardSettings =
    state.startTime === currentListStandardSettings.startTime &&
    state.bonusTime === currentListStandardSettings.bonusTime &&
    state.alternativeWordBonusTime ===
      currentListStandardSettings.alternativeWordBonusTime &&
    state.minWordLength === currentListStandardSettings.minWordLength &&
    state.maxWordLength === currentListStandardSettings.maxWordLength;

  const currentListHighScore = state.highScores[currentListKey] ?? null;

  const words = useMemo(
    () =>
      state.allWords.filter(
        (word) =>
          word.length >= state.minWordLength && word.length <= state.maxWordLength
      ),
    [state.allWords, state.minWordLength, state.maxWordLength]
  );
  const wordsSet = useMemo(() => new Set(words), [words]);
  const bonusCheckWordsSet = useMemo(
    () => new Set(state.bonusCheckWords),
    [state.bonusCheckWords]
  );

  const pickNewWord = useCallback(() => {
    const availableWords = words.filter((word) => !state.usedWords.includes(word));

    if (availableWords.length === 0) {
      dispatch({ type: 'NO_MORE_WORDS' });
      return;
    }

    const word = pickWordFromList(availableWords, words);

    bonusAwardedWordsRef.current = new Set();
    currentWordScoredRef.current = false;
    const nextTiles = buildShuffledTiles(word);

    dispatch({ type: 'SET_NEXT_WORD', payload: { word, tiles: nextTiles } });
  }, [state.usedWords, words]);

  const checkWord = useCallback(() => {
    if (currentWordScoredRef.current) {
      return;
    }

    const currentTileWord = state.tiles.map((tile) => tile.letter).join('');

    if (currentTileWord === state.currentWord && state.currentWord.length > 0) {
      currentWordScoredRef.current = true;
      dispatch({ type: 'CORRECT_WORD' });
      setTimeout(() => pickNewWord(), 800);
      return;
    }

    if (
      state.currentWord.length > 0 &&
      currentTileWord !== state.currentWord &&
      (bonusCheckWordsSet.has(currentTileWord) || wordsSet.has(currentTileWord)) &&
      !bonusAwardedWordsRef.current.has(currentTileWord)
    ) {
      dispatch({ type: 'AWARD_ALT_BONUS' });
      bonusAwardedWordsRef.current.add(currentTileWord);
      setTimeout(() => dispatch({ type: 'CLEAR_ALT_BONUS' }), 450);
    }
  }, [
    state.tiles,
    state.currentWord,
    bonusCheckWordsSet,
    wordsSet,
    pickNewWord,
  ]);

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
    if (state.isPlaying && state.usedWords.length === 0 && state.currentWord === '') {
      pickNewWord();
    }
  }, [state.isPlaying, state.usedWords.length, state.currentWord, pickNewWord]);

  useEffect(() => {
    savePersistedConfig({
      version: 3,
      settings: {
        startTime: state.startTime,
        bonusTime: state.bonusTime,
        alternativeWordBonusTime: state.alternativeWordBonusTime,
        minWordLength: state.minWordLength,
        maxWordLength: state.maxWordLength,
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
    state.selectedPreset,
    state.selectedAddedListId,
    state.addedWordLists,
    state.highScores,
  ]);

  useEffect(() => {
    const run = activeRunSnapshotRef.current;

    if (!run.isActive || run.finalized || state.isPlaying) {
      return;
    }

    if (!state.gameOver && !state.allWordsCompleted) {
      return;
    }

    run.finalized = true;
    run.isActive = false;

    if (!run.isEligible || typeof run.listKey !== 'string') {
      return;
    }

    const previousBest = state.highScores[run.listKey] ?? 0;
    if (state.score <= previousBest) {
      return;
    }

    dispatch({
      type: 'SET_HIGH_SCORE_FOR_LIST',
      payload: {
        listKey: run.listKey,
        score: state.score,
      },
    });
  }, [
    state.isPlaying,
    state.gameOver,
    state.allWordsCompleted,
    state.score,
    state.highScores,
  ]);

  const resetBonusRef = useCallback(() => {
    bonusAwardedWordsRef.current = new Set();
    currentWordScoredRef.current = false;
  }, []);

  const startGame = useCallback(() => {
    resetBonusRef();
    activeRunSnapshotRef.current = {
      isActive: true,
      isEligible: isUsingStandardSettings,
      listKey: currentListKey,
      finalized: false,
    };
    dispatch({
      type: 'START_GAME',
      payload: { isScoreEligible: isUsingStandardSettings },
    });
  }, [resetBonusRef, isUsingStandardSettings, currentListKey]);

  const giveUp = useCallback(() => dispatch({ type: 'GIVE_UP' }), []);
  const toggleSettings = useCallback(
    () => dispatch({ type: 'TOGGLE_SETTINGS' }),
    []
  );

  const changePreset = useCallback(
    (presetKey) => {
      if (!WORD_LISTS[presetKey]) {
        return;
      }

      resetBonusRef();
      dispatch({ type: 'CHANGE_PRESET', payload: presetKey });
    },
    [resetBonusRef]
  );

  const addAddedWordList = useCallback(
    (wordList, name) => {
      if (!Array.isArray(wordList) || wordList.length === 0) {
        return;
      }

      const resolveName = createListNameResolver(
        state.addedWordLists.map((list) => list.name)
      );
      const nextName = resolveName(name);

      resetBonusRef();
      dispatch({
        type: 'ADD_ADDED_LIST',
        payload: {
          id: generateAddedListId(),
          name: nextName,
          words: wordList,
        },
      });
    },
    [resetBonusRef, state.addedWordLists]
  );

  const selectAddedWordList = useCallback(
    (id) => {
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
    (id, rawName) => {
      const target = state.addedWordLists.find((list) => list.id === id);
      if (!target) {
        return;
      }

      const trimmedName = typeof rawName === 'string' ? rawName.trim() : '';
      if (trimmedName.length === 0) {
        return;
      }

      const resolveName = createListNameResolver(
        state.addedWordLists
          .filter((list) => list.id !== id)
          .map((list) => list.name)
      );
      const nextName = resolveName(trimmedName);

      dispatch({
        type: 'RENAME_ADDED_LIST',
        payload: { id, name: nextName },
      });
    },
    [state.addedWordLists]
  );

  const removeAddedWordList = useCallback(
    (id) => {
      if (!state.addedWordLists.some((list) => list.id === id)) {
        return;
      }

      resetBonusRef();
      dispatch({ type: 'REMOVE_ADDED_LIST', payload: id });
    },
    [resetBonusRef, state.addedWordLists]
  );

  const setStartTime = useCallback(
    (value) => dispatch({ type: 'SET_START_TIME', payload: value }),
    []
  );
  const setBonusTime = useCallback(
    (value) => dispatch({ type: 'SET_BONUS_TIME', payload: value }),
    []
  );
  const setAlternativeWordBonusTime = useCallback(
    (value) => dispatch({ type: 'SET_ALT_BONUS_TIME', payload: value }),
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
    (value) => {
      resetBonusRef();
      dispatch({ type: 'SET_MIN_WORD_LENGTH', payload: Math.max(2, value) });
    },
    [resetBonusRef]
  );

  const setMaxWordLength = useCallback(
    (value) => {
      const nextMax = Math.max(2, value, state.minWordLength);
      resetBonusRef();
      dispatch({ type: 'SET_MAX_WORD_LENGTH', payload: nextMax });
    },
    [resetBonusRef, state.minWordLength]
  );

  const setTiles = useCallback(
    (value) => dispatch({ type: 'SET_TILES', payload: value }),
    []
  );

  const reshuffleCurrentWord = useCallback(() => {
    if (!state.isPlaying || state.isCorrect || state.currentWord.length < 2) {
      return;
    }

    dispatch({
      type: 'SET_TILES',
      payload: buildShuffledTiles(state.currentWord),
    });
  }, [state.currentWord, state.isCorrect, state.isPlaying]);

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
