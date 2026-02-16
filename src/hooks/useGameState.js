import { useEffect, useMemo, useRef, useReducer, useCallback } from 'react';
import { WORD_LISTS } from '../constants/wordLists';

const canBeSolvedWithOneMove = (shuffled, original) => {
  const shuffledArray = shuffled.split('');

  for (let i = 0; i < shuffledArray.length; i += 1) {
    const letter = shuffledArray[i];
    const withoutLetter = [
      ...shuffledArray.slice(0, i),
      ...shuffledArray.slice(i + 1),
    ];

    for (let j = 0; j <= withoutLetter.length; j += 1) {
      const newArrangement = [
        ...withoutLetter.slice(0, j),
        letter,
        ...withoutLetter.slice(j),
      ];
      if (newArrangement.join('') === original) {
        return true;
      }
    }
  }

  return false;
};

const shuffleWord = (word) => {
  const letters = word.split('');
  let shuffled = [...letters];
  let attempts = 0;

  do {
    for (let i = 0; i < 10; i += 1) {
      shuffled.sort(() => Math.random() - 0.5);
    }

    attempts += 1;
    const shuffledWord = shuffled.join('');

    if (shuffledWord === word) {
      continue;
    }

    if (word.length >= 5 && canBeSolvedWithOneMove(shuffledWord, word)) {
      continue;
    }

    break;
  } while (attempts < 100);

  return shuffled;
};

const getInitialState = (initialPresetKey) => {
  const initialList = WORD_LISTS[initialPresetKey] ?? WORD_LISTS.default;

  return {
    allWords: initialList.words,
    bonusCheckWords: initialList.bonusCheckWords,
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
    showSettings: false,
    wordListName: initialList.name,
    selectedPreset: initialPresetKey,
    startTime: 45,
    bonusTime: 10,
    alternativeWordBonusTime: 5,
    minWordLength: 4,
    maxWordLength: 7,
  };
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
    case 'SET_MIN_WORD_LENGTH': {
      const nextMin = action.payload;
      const nextMax = Math.max(state.maxWordLength, nextMin);
      return {
        ...state,
        minWordLength: nextMin,
        maxWordLength: nextMax,
        isPlaying: false,
        gameOver: false,
        allWordsCompleted: false,
        usedWords: [],
        score: 0,
        wordsFound: 0,
        timeLeft: 0,
        currentWord: '',
        tiles: [],
        isCorrect: false,
        isBonusWord: false,
      };
    }
    case 'SET_MAX_WORD_LENGTH':
      return {
        ...state,
        maxWordLength: action.payload,
        isPlaying: false,
        gameOver: false,
        allWordsCompleted: false,
        usedWords: [],
        score: 0,
        wordsFound: 0,
        timeLeft: 0,
        currentWord: '',
        tiles: [],
        isCorrect: false,
        isBonusWord: false,
      };
    case 'CHANGE_WORD_LIST':
      return {
        ...state,
        allWords: action.payload.words,
        bonusCheckWords: action.payload.bonusCheckWords,
        wordListName: action.payload.name,
        selectedPreset: action.payload.selectedPreset,
        isPlaying: false,
        gameOver: false,
        allWordsCompleted: false,
        usedWords: [],
        score: 0,
        wordsFound: 0,
        timeLeft: 0,
        currentWord: '',
        tiles: [],
        isCorrect: false,
        isBonusWord: false,
      };
    case 'START_GAME':
      return {
        ...state,
        timeLeft: state.startTime,
        score: 0,
        wordsFound: 0,
        isPlaying: true,
        usedWords: [],
        gameOver: false,
        allWordsCompleted: false,
        currentWord: '',
        tiles: [],
        isCorrect: false,
        isBonusWord: false,
      };
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
      return { ...state, isPlaying: false, allWordsCompleted: true };
    case 'CORRECT_WORD':
      return {
        ...state,
        isCorrect: true,
        isBonusWord: false,
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
    default:
      return state;
  }
}

export function useGameState({ initialPresetKey = 'default' } = {}) {
  const [state, dispatch] = useReducer(reducer, initialPresetKey, getInitialState);
  const bonusAwardedWordsRef = useRef(new Set());

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
    const availableWords = words.filter(
      (word) => !state.usedWords.includes(word)
    );

    if (availableWords.length === 0) {
      dispatch({ type: 'NO_MORE_WORDS' });
      return;
    }

    let word;
    if (words.length >= 500) {
      const wordsByLength = availableWords.reduce((accumulator, candidate) => {
        const length = candidate.length;
        if (!accumulator[length]) {
          accumulator[length] = [];
        }
        accumulator[length].push(candidate);
        return accumulator;
      }, {});

      const availableLengths = Object.keys(wordsByLength).map(Number);
      const chosenLength =
        availableLengths[Math.floor(Math.random() * availableLengths.length)];
      const bucket = wordsByLength[chosenLength];
      word = bucket[Math.floor(Math.random() * bucket.length)];
    } else {
      word = availableWords[Math.floor(Math.random() * availableWords.length)];
    }

    bonusAwardedWordsRef.current = new Set();
    const shuffled = shuffleWord(word);
    const nextTiles = shuffled.map((letter, index) => ({ letter, id: index }));

    dispatch({ type: 'SET_NEXT_WORD', payload: { word, tiles: nextTiles } });
  }, [state.usedWords, words]);

  const checkWord = useCallback(() => {
    const currentTileWord = state.tiles.map((tile) => tile.letter).join('');

    if (currentTileWord === state.currentWord && state.currentWord.length > 0) {
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

  const resetBonusRef = useCallback(() => {
    bonusAwardedWordsRef.current = new Set();
  }, []);

  const startGame = useCallback(() => {
    resetBonusRef();
    dispatch({ type: 'START_GAME' });
  }, [resetBonusRef]);

  const giveUp = useCallback(() => dispatch({ type: 'GIVE_UP' }), []);
  const toggleSettings = useCallback(
    () => dispatch({ type: 'TOGGLE_SETTINGS' }),
    []
  );

  const changePreset = useCallback(
    (presetKey) => {
      const selected = WORD_LISTS[presetKey];
      if (!selected) {
        return;
      }

      resetBonusRef();
      dispatch({
        type: 'CHANGE_WORD_LIST',
        payload: {
          words: selected.words,
          bonusCheckWords: selected.bonusCheckWords,
          name: selected.name,
          selectedPreset: presetKey,
        },
      });
    },
    [resetBonusRef]
  );

  const changeCustomWordList = useCallback(
    (wordList, name) => {
      resetBonusRef();
      dispatch({
        type: 'CHANGE_WORD_LIST',
        payload: {
          words: wordList,
          bonusCheckWords: wordList,
          name,
          selectedPreset: 'custom',
        },
      });
    },
    [resetBonusRef]
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

  const actions = useMemo(
    () => ({
      startGame,
      giveUp,
      toggleSettings,
      changePreset,
      changeCustomWordList,
      setStartTime,
      setBonusTime,
      setAlternativeWordBonusTime,
      setMinWordLength,
      setMaxWordLength,
      setTiles,
      checkWord,
    }),
    [
      startGame,
      giveUp,
      toggleSettings,
      changePreset,
      changeCustomWordList,
      setStartTime,
      setBonusTime,
      setAlternativeWordBonusTime,
      setMinWordLength,
      setMaxWordLength,
      setTiles,
      checkWord,
    ]
  );

  return {
    state: {
      ...state,
      words,
      wordsSet,
      bonusCheckWordsSet,
    },
    actions,
  };
}
