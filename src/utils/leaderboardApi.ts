const PARTYKIT_HOST =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_PARTYKIT_HOST
    ? import.meta.env.VITE_PARTYKIT_HOST
    : `${
        typeof window !== 'undefined' ? window.location.hostname : 'localhost'
      }:1999`;

const PROTOCOL = PARTYKIT_HOST.startsWith('localhost') ? 'http' : 'https';
const LEADERBOARD_URL = `${PROTOCOL}://${PARTYKIT_HOST}/parties/leaderboard/global`;

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  wordsFound: number;
  tierReached: number;
  allWordsCompleted: boolean;
  date: string;
}

export interface ScorePayload {
  playerId: string;
  playerName: string;
  score: number;
  wordsFound: number;
  tierReached: number;
  allWordsCompleted: boolean;
}

export interface SubmitScoreResult {
  success: boolean;
  rank: number | null;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch(LEADERBOARD_URL);
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
  const data = (await res.json()) as { entries: LeaderboardEntry[] };
  return data.entries;
}

export async function fetchPersonalBestScore(playerId: string): Promise<number | null> {
  const url = `${LEADERBOARD_URL}?playerId=${encodeURIComponent(playerId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Personal best fetch failed: ${res.status}`);
  const data = (await res.json()) as { personalBestScore: number | null };
  return typeof data.personalBestScore === 'number' ? data.personalBestScore : null;
}

export async function submitScore(payload: ScorePayload): Promise<SubmitScoreResult> {
  const res = await fetch(LEADERBOARD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { success: false, rank: null };
  const data = (await res.json()) as { success: boolean; rank: number };
  return { success: data.success, rank: data.rank };
}
