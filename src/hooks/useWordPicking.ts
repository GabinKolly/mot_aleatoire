import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Dispatch } from 'react';
import { buildShuffledTiles, pickWordFromList } from '../utils/wordPicking';
import { NEXT_WORD_DELAY_MS, BONUS_ANIMATION_MS } from '../constants/timings';
import type { GameAction, GameState } from '../types/game';

export function useWordPicking(state: GameState, dispatch: Dispatch<GameAction>) {
  const bonusAwardedWordsRef = useRef<Set<string>>(new Set());
  const currentWordScoredRef = useRef(false);

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

    const word = pickWordFromList(availableWords, words);
    if (!word) {
      dispatch({ type: 'NO_MORE_WORDS' });
      return;
    }

    resetBonusRef();
    const nextTiles = buildShuffledTiles(word);
    dispatch({ type: 'SET_NEXT_WORD', payload: { word, tiles: nextTiles } });
  }, [state.usedWords, words, dispatch, resetBonusRef]);

  const checkWord = useCallback(() => {
    if (currentWordScoredRef.current) {
      return;
    }

    const currentTileWord = state.tiles.map((tile) => tile.letter).join('');

    if (currentTileWord === state.currentWord && state.currentWord.length > 0) {
      currentWordScoredRef.current = true;
      dispatch({ type: 'CORRECT_WORD' });
      setTimeout(() => pickNewWord(), NEXT_WORD_DELAY_MS);
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
      setTimeout(() => dispatch({ type: 'CLEAR_ALT_BONUS' }), BONUS_ANIMATION_MS);
    }
  }, [state.tiles, state.currentWord, bonusCheckWordsSet, wordsSet, pickNewWord, dispatch]);

  useEffect(() => {
    if (state.isPlaying && state.usedWords.length === 0 && state.currentWord === '') {
      pickNewWord();
    }
  }, [state.isPlaying, state.usedWords.length, state.currentWord, pickNewWord]);

  return { words, wordsSet, bonusCheckWordsSet, checkWord, resetBonusRef };
}
