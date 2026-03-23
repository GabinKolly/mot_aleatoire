import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Dispatch } from 'react';
import { buildShuffledTiles, pickWordFromList } from '../utils/wordPicking';
import { NEXT_WORD_DELAY_MS, BONUS_ANIMATION_MS } from '../constants/timings';
import type { Tile } from '../types/game';
import {
  buildAnagramGroupIndex,
  getWordCheckResult,
  pickWordWithAcceptedAnagrams,
} from '../utils/anagramWordPicking';
import type { AnswerValidationMode } from '../types/game';

export interface WordPickingState {
  allWords: string[];
  bonusCheckWords: string[];
  minWordLength: number;
  maxWordLength: number;
  answerValidationMode: AnswerValidationMode;
  usedWords: string[];
  tiles: Tile[];
  currentWord: string;
  currentAcceptedWords: string[];
  isPlaying: boolean;
}

export type WordPickingAction =
  | { type: 'NO_MORE_WORDS' }
  | { type: 'SET_NEXT_WORD'; payload: { word: string; acceptedWords: string[]; tiles: Tile[] } }
  | { type: 'CORRECT_WORD'; payload: { solvedWord: string } }
  | { type: 'AWARD_ALT_BONUS' }
  | { type: 'CLEAR_ALT_BONUS' };

export function useWordPicking(state: WordPickingState, dispatch: Dispatch<WordPickingAction>) {
  const bonusAwardedWordsRef = useRef<Set<string>>(new Set());
  const currentWordScoredRef = useRef(false);
  const pickNewWordRef = useRef<() => void>(() => {});

  const words = useMemo(
    () =>
      state.allWords.filter(
        (word) => word.length >= state.minWordLength && word.length <= state.maxWordLength
      ),
    [state.allWords, state.minWordLength, state.maxWordLength]
  );
  const wordsSet = useMemo(() => new Set(words), [words]);
  const bonusCheckWordsSet = useMemo(
    () => new Set(state.bonusCheckWords),
    [state.bonusCheckWords]
  );
  const currentAcceptedWordsSet = useMemo(
    () => new Set(state.currentAcceptedWords),
    [state.currentAcceptedWords]
  );
  const anagramGroups = useMemo(() => buildAnagramGroupIndex(words), [words]);

  const resetBonusRef = useCallback(() => {
    bonusAwardedWordsRef.current = new Set();
    currentWordScoredRef.current = false;
  }, []);

  const pickNewWord = useCallback(() => {
    const availableWords = words.filter((word) => !state.usedWords.includes(word));

    if (availableWords.length === 0) {
      dispatch({ type: 'NO_MORE_WORDS' });
      return;
    }

    resetBonusRef();
    if (state.answerValidationMode === 'loose') {
      const selection = pickWordWithAcceptedAnagrams(availableWords, words, anagramGroups);
      if (!selection) {
        dispatch({ type: 'NO_MORE_WORDS' });
        return;
      }

      dispatch({ type: 'SET_NEXT_WORD', payload: selection });
      return;
    }

    const word = pickWordFromList(availableWords, words);
    if (!word) {
      dispatch({ type: 'NO_MORE_WORDS' });
      return;
    }

    const nextTiles = buildShuffledTiles(word);
    dispatch({
      type: 'SET_NEXT_WORD',
      payload: { word, acceptedWords: [word], tiles: nextTiles },
    });
  }, [state.usedWords, state.answerValidationMode, words, anagramGroups, dispatch, resetBonusRef]);

  useEffect(() => {
    pickNewWordRef.current = pickNewWord;
  }, [pickNewWord]);

  const checkWord = useCallback(() => {
    if (currentWordScoredRef.current) {
      return;
    }

    const currentTileWord = state.tiles.map((tile) => tile.letter).join('');

    const result = getWordCheckResult({
      currentTileWord,
      currentWord: state.currentWord,
      acceptedWordsSet: currentAcceptedWordsSet,
      bonusCheckWordsSet,
      filteredWordsSet: wordsSet,
      bonusAwardedWords: bonusAwardedWordsRef.current,
    });

    if (result === 'correct') {
      currentWordScoredRef.current = true;
      dispatch({ type: 'CORRECT_WORD', payload: { solvedWord: currentTileWord } });
      setTimeout(() => pickNewWordRef.current(), NEXT_WORD_DELAY_MS);
      return;
    }

    if (result === 'bonus') {
      dispatch({ type: 'AWARD_ALT_BONUS' });
      bonusAwardedWordsRef.current.add(currentTileWord);
      setTimeout(() => dispatch({ type: 'CLEAR_ALT_BONUS' }), BONUS_ANIMATION_MS);
    }
  }, [state.tiles, state.currentWord, currentAcceptedWordsSet, bonusCheckWordsSet, wordsSet, dispatch]);

  useEffect(() => {
    if (state.isPlaying && state.currentWord === '') {
      pickNewWord();
    }
  }, [state.isPlaying, state.currentWord, pickNewWord]);

  return { words, wordsSet, bonusCheckWordsSet, checkWord, resetBonusRef };
}
