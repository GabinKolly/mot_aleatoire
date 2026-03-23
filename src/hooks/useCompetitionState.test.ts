import { describe, expect, it } from 'vitest';
import {
  buildCompetitionInitialState,
  competitionReducer,
} from './useCompetitionState';

describe('competitionReducer', () => {
  it('stores accepted anagrams and consumes the whole family for future rounds', () => {
    const initialState = buildCompetitionInitialState();
    const nextState = competitionReducer(initialState, {
      type: 'SET_NEXT_WORD',
      payload: {
        word: 'ARBITRE',
        acceptedWords: ['ARBITRE', 'ABRITER'],
        tiles: [
          { letter: 'R', id: 0 },
          { letter: 'A', id: 1 },
        ],
      },
    });

    expect(nextState.currentWord).toBe('ARBITRE');
    expect(nextState.currentAcceptedWords).toEqual(['ARBITRE', 'ABRITER']);
    expect(nextState.usedWords).toEqual(['ARBITRE', 'ABRITER']);
  });

  it('reveals the solved anagram instead of the originally selected word', () => {
    const initialState = buildCompetitionInitialState();
    const roundState = competitionReducer(initialState, {
      type: 'SET_NEXT_WORD',
      payload: {
        word: 'ARBITRE',
        acceptedWords: ['ARBITRE', 'ABRITER'],
        tiles: [
          { letter: 'R', id: 0 },
          { letter: 'A', id: 1 },
        ],
      },
    });

    const solvedState = competitionReducer(roundState, {
      type: 'CORRECT_WORD',
      payload: { solvedWord: 'ABRITER' },
    });

    expect(solvedState.currentWord).toBe('ABRITER');
    expect(solvedState.isCorrect).toBe(true);
    expect(solvedState.tiles.map((tile) => tile.letter).join('')).toBe('ABRITER');
  });
});
