import type * as Party from 'partykit/server';

const MAX_STORED_ENTRIES = 100;
const MAX_DISPLAYED_ENTRIES = 20;
const MAX_SCORE = 50_000;
const MAX_TIER = 4; // COMPETITION_MAX_WORD_LENGTH(8) - COMPETITION_STARTING_WORD_LENGTH(4)
const PLAYER_ID_RE = /^[0-9a-f-]{10,64}$/i;

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  wordsFound: number;
  tierReached: number;
  allWordsCompleted: boolean;
  date: string;
}

interface ScoreSubmission {
  playerId?: unknown;
  playerName?: unknown;
  score?: unknown;
  wordsFound?: unknown;
  tierReached?: unknown;
  allWordsCompleted?: unknown;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function validateSubmission(body: ScoreSubmission): LeaderboardEntry | null {
  const playerId = typeof body.playerId === 'string' ? body.playerId.trim() : '';
  if (!PLAYER_ID_RE.test(playerId)) return null;

  const rawName = typeof body.playerName === 'string' ? body.playerName.trim() : '';
  const playerName = rawName.slice(0, 20);
  if (playerName.length === 0) return null;

  const score =
    typeof body.score === 'number' && Number.isInteger(body.score) ? body.score : -1;
  if (score < 0 || score > MAX_SCORE) return null;

  const wordsFound =
    typeof body.wordsFound === 'number' && Number.isInteger(body.wordsFound)
      ? body.wordsFound
      : -1;
  if (wordsFound < 0) return null;

  const tierReached =
    typeof body.tierReached === 'number' && Number.isInteger(body.tierReached)
      ? body.tierReached
      : -1;
  if (tierReached < 0 || tierReached > MAX_TIER) return null;

  const allWordsCompleted = body.allWordsCompleted === true;

  return {
    playerId,
    playerName,
    score,
    wordsFound,
    tierReached,
    allWordsCompleted,
    date: new Date().toISOString(),
  };
}

export default class LeaderboardServer implements Party.Server {
  readonly room: Party.Room;

  constructor(room: Party.Room) {
    this.room = room;
  }

  async onRequest(request: Party.Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === 'GET') {
      const raw = await this.room.storage.get<LeaderboardEntry[]>('entries');
      const entries = (raw ?? []).slice(0, MAX_DISPLAYED_ENTRIES);
      return Response.json({ entries }, { headers: CORS_HEADERS });
    }

    if (request.method === 'POST') {
      let body: ScoreSubmission;
      try {
        body = (await request.json()) as ScoreSubmission;
      } catch {
        return new Response('Bad request', { status: 400, headers: CORS_HEADERS });
      }

      const entry = validateSubmission(body);
      if (!entry) {
        return new Response('Invalid submission', { status: 422, headers: CORS_HEADERS });
      }

      const raw = await this.room.storage.get<LeaderboardEntry[]>('entries');
      const entries = raw ?? [];

      // One entry per player — personal best only
      const existingIndex = entries.findIndex((e) => e.playerId === entry.playerId);
      if (existingIndex >= 0) {
        if (entry.score <= entries[existingIndex].score) {
          const rank = existingIndex + 1;
          return Response.json({ success: true, rank }, { headers: CORS_HEADERS });
        }
        entries.splice(existingIndex, 1);
      }

      entries.push(entry);
      entries.sort((a, b) => b.score - a.score);
      if (entries.length > MAX_STORED_ENTRIES) {
        entries.splice(MAX_STORED_ENTRIES);
      }

      await this.room.storage.put('entries', entries);

      const rank = entries.findIndex((e) => e.playerId === entry.playerId) + 1;
      return Response.json({ success: true, rank }, { headers: CORS_HEADERS });
    }

    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
  }
}

LeaderboardServer satisfies Party.Worker;
