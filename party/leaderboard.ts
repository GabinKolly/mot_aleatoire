import type * as Party from 'partykit/server';

const MAX_STORED_ENTRIES = 100;
const MAX_DISPLAYED_ENTRIES = 20;
const MAX_SCORE = 50_000;
const MAX_TIER = 4; // COMPETITION_MAX_WORD_LENGTH(8) - COMPETITION_STARTING_WORD_LENGTH(4)
const PLAYER_ID_RE = /^[0-9a-f-]{10,64}$/i;
const ENTRIES_KEY = 'entries';
const ADMIN_TOKEN_ENV_KEY = 'LEADERBOARD_ADMIN_TOKEN';

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

type AdminAction = 'export' | 'restore' | 'clear';

interface RestorePayload {
  entries?: unknown;
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

function normalizeEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const bestByPlayer = new Map<string, LeaderboardEntry>();

  entries.forEach((entry) => {
    const existing = bestByPlayer.get(entry.playerId);
    if (!existing) {
      bestByPlayer.set(entry.playerId, entry);
      return;
    }

    if (entry.score > existing.score) {
      bestByPlayer.set(entry.playerId, entry);
      return;
    }

    if (entry.score === existing.score && entry.date > existing.date) {
      bestByPlayer.set(entry.playerId, entry);
    }
  });

  const normalized = Array.from(bestByPlayer.values());
  normalized.sort((a, b) => b.score - a.score);

  if (normalized.length > MAX_STORED_ENTRIES) {
    normalized.splice(MAX_STORED_ENTRIES);
  }

  return normalized;
}

function parseIsoDate(rawDate: unknown): string | null {
  if (typeof rawDate !== 'string') return null;
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function validateStoredEntry(rawEntry: unknown): LeaderboardEntry | null {
  if (!rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) return null;
  const candidate = rawEntry as Record<string, unknown>;

  const playerId = typeof candidate.playerId === 'string' ? candidate.playerId.trim() : '';
  if (!PLAYER_ID_RE.test(playerId)) return null;

  const rawName = typeof candidate.playerName === 'string' ? candidate.playerName.trim() : '';
  const playerName = rawName.slice(0, 20);
  if (playerName.length === 0) return null;

  const score =
    typeof candidate.score === 'number' && Number.isInteger(candidate.score)
      ? candidate.score
      : -1;
  if (score < 0 || score > MAX_SCORE) return null;

  const wordsFound =
    typeof candidate.wordsFound === 'number' && Number.isInteger(candidate.wordsFound)
      ? candidate.wordsFound
      : -1;
  if (wordsFound < 0) return null;

  const tierReached =
    typeof candidate.tierReached === 'number' && Number.isInteger(candidate.tierReached)
      ? candidate.tierReached
      : -1;
  if (tierReached < 0 || tierReached > MAX_TIER) return null;

  const date = parseIsoDate(candidate.date);
  if (!date) return null;

  return {
    playerId,
    playerName,
    score,
    wordsFound,
    tierReached,
    allWordsCompleted: candidate.allWordsCompleted === true,
    date,
  };
}

function parseRestoreEntries(rawEntries: unknown): LeaderboardEntry[] | null {
  if (!Array.isArray(rawEntries)) return null;

  const entries: LeaderboardEntry[] = [];
  for (const rawEntry of rawEntries) {
    const parsed = validateStoredEntry(rawEntry);
    if (!parsed) return null;
    entries.push(parsed);
  }

  return normalizeEntries(entries);
}

function getAdminAction(url: URL): AdminAction | null {
  const trimmedPath = url.pathname.replace(/\/+$/, '');

  if (trimmedPath.endsWith('/admin/export')) return 'export';
  if (trimmedPath.endsWith('/admin/restore')) return 'restore';
  if (trimmedPath.endsWith('/admin/clear')) return 'clear';

  const action = url.searchParams.get('admin');
  if (action === 'export' || action === 'restore' || action === 'clear') {
    return action;
  }

  return null;
}

function getAdminToken(env: Record<string, unknown>): string | null {
  const rawToken = env[ADMIN_TOKEN_ENV_KEY];
  if (typeof rawToken !== 'string') return null;
  const token = rawToken.trim();
  return token.length > 0 ? token : null;
}

function getBearerToken(request: Party.Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  if (!match) return null;
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

function secureTokenEquals(expected: string, provided: string): boolean {
  if (expected.length !== provided.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }

  return mismatch === 0;
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

    const url = new URL(request.url);
    const adminAction = getAdminAction(url);
    if (adminAction) {
      return this.handleAdminAction(request, adminAction);
    }

    if (request.method === 'GET') {
      const raw = await this.room.storage.get<LeaderboardEntry[]>(ENTRIES_KEY);
      const entries = raw ?? [];
      const playerId = url.searchParams.get('playerId');

      if (playerId !== null) {
        const normalizedId = playerId.trim();
        if (!PLAYER_ID_RE.test(normalizedId)) {
          return new Response('Invalid player id', { status: 422, headers: CORS_HEADERS });
        }

        const existing = entries.find((entry) => entry.playerId === normalizedId);
        return Response.json(
          { personalBestScore: existing?.score ?? null },
          { headers: CORS_HEADERS }
        );
      }

      return Response.json(
        { entries: entries.slice(0, MAX_DISPLAYED_ENTRIES) },
        { headers: CORS_HEADERS }
      );
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

      const raw = await this.room.storage.get<LeaderboardEntry[]>(ENTRIES_KEY);
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
      const normalized = normalizeEntries(entries);

      await this.room.storage.put(ENTRIES_KEY, normalized);

      const rank = normalized.findIndex((e) => e.playerId === entry.playerId) + 1;
      return Response.json({ success: true, rank }, { headers: CORS_HEADERS });
    }

    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
  }

  private async handleAdminAction(
    request: Party.Request,
    action: AdminAction
  ): Promise<Response> {
    const adminToken = getAdminToken(this.room.env);
    if (!adminToken) {
      return new Response('Admin endpoints disabled', { status: 503, headers: CORS_HEADERS });
    }

    const suppliedToken = getBearerToken(request);
    if (!suppliedToken || !secureTokenEquals(adminToken, suppliedToken)) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { ...CORS_HEADERS, 'WWW-Authenticate': 'Bearer' },
      });
    }

    if (action === 'export') {
      if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
      }

      const raw = await this.room.storage.get<LeaderboardEntry[]>(ENTRIES_KEY);
      const entries = normalizeEntries(raw ?? []);
      return Response.json(
        {
          exportedAt: new Date().toISOString(),
          count: entries.length,
          entries,
        },
        { headers: CORS_HEADERS }
      );
    }

    if (action === 'restore') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
      }

      let body: RestorePayload;
      try {
        body = (await request.json()) as RestorePayload;
      } catch {
        return new Response('Bad request', { status: 400, headers: CORS_HEADERS });
      }

      const entries = parseRestoreEntries(body.entries);
      if (!entries) {
        return new Response('Invalid restore payload', { status: 422, headers: CORS_HEADERS });
      }

      await this.room.storage.put(ENTRIES_KEY, entries);

      return Response.json(
        {
          success: true,
          count: entries.length,
        },
        { headers: CORS_HEADERS }
      );
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    await this.room.storage.delete(ENTRIES_KEY);
    return Response.json({ success: true, count: 0 }, { headers: CORS_HEADERS });
  }
}

LeaderboardServer satisfies Party.Worker;
