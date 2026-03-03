import { useState, useEffect, useCallback } from 'react';
import {
  fetchLeaderboard,
  fetchPersonalBestScore,
  submitScore,
} from '../utils/leaderboardApi';
import type { LeaderboardEntry, ScorePayload } from '../utils/leaderboardApi';

type SubmitStatus = 'idle' | 'submitting' | 'submitted' | 'error';

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [playerRank, setPlayerRank] = useState<number | null>(null);

  const load = useCallback(async (): Promise<LeaderboardEntry[]> => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchLeaderboard();
      setEntries(data);
      return data;
    } catch (error) {
      setFetchError('Impossible de charger le classement.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  const submit = useCallback(
    async (payload: ScorePayload) => {
      setSubmitStatus('submitting');
      setPlayerRank(null);
      try {
        const result = await submitScore(payload);
        if (result.success) {
          const refreshedEntries = await load();
          const rank = result.rank;
          const confirmedEntry =
            rank != null && rank > 0 && rank <= refreshedEntries.length
              ? refreshedEntries[rank - 1]
              : null;
          const isConfirmed =
            confirmedEntry != null &&
            confirmedEntry.playerId === payload.playerId &&
            confirmedEntry.score === payload.score;
          if (isConfirmed) {
            setPlayerRank(rank);
          }
          setSubmitStatus('submitted');
        } else {
          setSubmitStatus('error');
        }
      } catch {
        setSubmitStatus('error');
      }
    },
    [load]
  );

  const resetSubmitStatus = useCallback(() => {
    setSubmitStatus('idle');
    setPlayerRank(null);
  }, []);

  const getPersonalBestScore = useCallback(async (playerId: string) => {
    return fetchPersonalBestScore(playerId);
  }, []);

  return {
    entries,
    isLoading,
    fetchError,
    submitStatus,
    playerRank,
    submit,
    getPersonalBestScore,
    refresh: load,
    resetSubmitStatus,
  };
}
