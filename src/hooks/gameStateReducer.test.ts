import { describe, expect, it } from 'vitest';
import {
  getInitialState,
  getStandardSettingsForSelection,
  reducer,
} from './gameStateReducer';

describe('gameStateReducer', () => {
  it('uses loose validation in standard settings', () => {
    const settings = getStandardSettingsForSelection({
      selectedPreset: 'default',
      selectedAddedListId: null,
    });

    expect(settings.answerValidationMode).toBe('loose');
  });

  it('stores accepted anagrams and reveals the solved anagram', () => {
    const initialState = getInitialState('default');
    const roundState = reducer(initialState, {
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

    const solvedState = reducer(roundState, {
      type: 'CORRECT_WORD',
      payload: { solvedWord: 'ABRITER' },
    });

    expect(roundState.currentAcceptedWords).toEqual(['ARBITRE', 'ABRITER']);
    expect(roundState.usedWords).toEqual(['ARBITRE', 'ABRITER']);
    expect(solvedState.currentWord).toBe('ABRITER');
    expect(solvedState.tiles.map((tile) => tile.letter).join('')).toBe('ABRITER');
  });
});
