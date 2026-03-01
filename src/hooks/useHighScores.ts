import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Dispatch } from 'react';
import { buildListScoreKey, getStandardSettingsForSelection } from './gameStateReducer';
import type { GameAction, GameState } from '../types/game';

export function useHighScores(state: GameState, dispatch: Dispatch<GameAction>) {
  const activeRunSnapshotRef = useRef<{
    isActive: boolean;
    isEligible: boolean;
    listKey: string | null;
    finalized: boolean;
  }>({
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

  const currentListHighScore = state.highScores[currentListKey] ?? null;

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
      payload: { listKey: run.listKey, score: state.score },
    });
  }, [
    state.isPlaying,
    state.gameOver,
    state.allWordsCompleted,
    state.score,
    state.highScores,
    dispatch,
  ]);

  const startRun = useCallback((isEligible: boolean, listKey: string) => {
    activeRunSnapshotRef.current = {
      isActive: true,
      isEligible,
      listKey,
      finalized: false,
    };
  }, []);

  return { currentListKey, currentListStandardSettings, currentListHighScore, startRun };
}
