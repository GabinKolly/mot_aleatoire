import { useState, useEffect, useCallback } from 'react';
import { fetchLeaderboard, submitScore } from '../utils/leaderboardApi';
import type { LeaderboardEntry, ScorePayload } from '../utils/leaderboardApi';

type SubmitStatus = 'idle' | 'submitting' | 'submitted' | 'error';

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [playerRank, setPlayerRank] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchLeaderboard();
      setEntries(data);
    } catch {
      setFetchError('Impossible de charger le classement.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(
    async (payload: ScorePayload) => {
      setSubmitStatus('submitting');
      try {
        const result = await submitScore(payload);
        if (result.success) {
          setPlayerRank(result.rank);
          setSubmitStatus('submitted');
          await load();
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

  return {
    entries,
    isLoading,
    fetchError,
    submitStatus,
    playerRank,
    submit,
    refresh: load,
    resetSubmitStatus,
  };
}
