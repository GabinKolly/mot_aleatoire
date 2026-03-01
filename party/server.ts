import type * as Party from 'partykit/server';

const DISCONNECT_GRACE_PERIOD = 15000; // 15 seconds
const WORD_TRANSITION_MS = 1500;

interface GameConfig {
  gameTime: number;
  wordTime: number;
  minWordLength: number;
  maxWordLength: number;
}

const DEFAULT_CONFIG: GameConfig = {
  gameTime: 180,
  wordTime: 30,
  minWordLength: 4,
  maxWordLength: 7,
};

type PlayerNumber = 1 | 2;
type RoomStatus = 'waiting' | 'playing' | 'gameOver';

interface PlayerState {
  name: string;
  number: PlayerNumber;
  score: number;
  wordsFound: number;
  connectionId: string | null;
  connected: boolean;
}

interface PlayerSnapshot {
  id: string;
  name: string;
  number: PlayerNumber;
  score: number;
  wordsFound: number;
  connected: boolean;
}

type JsonRecord = Record<string, unknown>;

type JoinMessage = {
  type: 'JOIN';
  playerId?: unknown;
  playerName?: unknown;
};

type UpdateConfigMessage = {
  type: 'UPDATE_CONFIG';
  config?: unknown;
  wordListKey?: unknown;
};

type StartGameMessage = { type: 'START_GAME' };

type WordFoundMessage = {
  type: 'WORD_FOUND';
  wordIndex?: unknown;
  wordLength?: unknown;
};

type ForfeitMessage = { type: 'FORFEIT' };
type PlayAgainMessage = { type: 'PLAY_AGAIN' };

type IncomingMessage =
  | JoinMessage
  | UpdateConfigMessage
  | StartGameMessage
  | WordFoundMessage
  | ForfeitMessage
  | PlayAgainMessage
  | ({ type: string } & JsonRecord);

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toMessageString(message: string | ArrayBuffer | ArrayBufferView): string {
  if (typeof message === 'string') {
    return message;
  }

  const decoder = new TextDecoder();
  if (message instanceof ArrayBuffer) {
    return decoder.decode(new Uint8Array(message));
  }

  return decoder.decode(
    new Uint8Array(message.buffer, message.byteOffset, message.byteLength)
  );
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  const integer = Math.trunc(value);
  return Math.min(max, Math.max(min, integer));
}

export default class GameRoom implements Party.Server {
  readonly room: Party.Room;
  players: Map<string, PlayerState>;
  connectionToPlayer: Map<string, string>;
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
  hostPlayerId: string | null;
  status: RoomStatus;
  config: GameConfig;
  wordListKey: string;
  seed: number;
  currentWordIndex: number;
  claimedWords: Set<number>;
  gameTimeLeft: number;
  wordTimeLeft: number;
  timerInterval: ReturnType<typeof setInterval> | null;
  transitioning: boolean;
  transitionTimeout: ReturnType<typeof setTimeout> | null;

  constructor(room: Party.Room) {
    this.room = room;
    this.players = new Map();
    this.connectionToPlayer = new Map();
    this.disconnectTimers = new Map();
    this.hostPlayerId = null;
    this.status = 'waiting';
    this.config = { ...DEFAULT_CONFIG };
    this.wordListKey = 'default';
    this.seed = 0;
    this.currentWordIndex = 0;
    this.claimedWords = new Set();
    this.gameTimeLeft = 0;
    this.wordTimeLeft = 0;
    this.timerInterval = null;
    this.transitioning = false;
    this.transitionTimeout = null;
  }

  broadcast(message: JsonRecord): void {
    const data = JSON.stringify(message);
    for (const player of this.players.values()) {
      if (player.connectionId) {
        const conn = this.room.getConnection(player.connectionId);
        if (conn) conn.send(data);
      }
    }
  }

  sendTo(connectionId: string, message: JsonRecord): void {
    const conn = this.room.getConnection(connectionId);
    if (conn) {
      conn.send(JSON.stringify(message));
    }
  }

  getPlayerList(): PlayerSnapshot[] {
    return Array.from(this.players.entries()).map(([playerId, player]) => ({
      id: playerId,
      name: player.name,
      number: player.number,
      score: player.score,
      wordsFound: player.wordsFound,
      connected: player.connected,
    }));
  }

  broadcastRoomState(): void {
    this.broadcast({
      type: 'ROOM_STATE',
      players: this.getPlayerList(),
      hostId: this.hostPlayerId,
      config: this.config,
      wordListKey: this.wordListKey,
      status: this.status,
    });
  }

  startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => this.tick(), 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
    this.transitioning = false;
  }

  tick(): void {
    if (this.status !== 'playing') {
      this.stopTimer();
      return;
    }

    this.gameTimeLeft -= 1;

    if (!this.transitioning) {
      this.wordTimeLeft -= 1;
    }

    if (this.gameTimeLeft <= 0) {
      this.endGame({ endReason: 'time' });
      return;
    }

    if (this.wordTimeLeft <= 0 && !this.transitioning) {
      this.transitioning = true;
      this.broadcast({
        type: 'WORD_SKIPPED',
        wordIndex: this.currentWordIndex,
      });
      this.transitionTimeout = setTimeout(() => {
        this.transitioning = false;
        this.transitionTimeout = null;
        if (this.status === 'playing') {
          this.advanceWord(null);
          this.broadcast({
            type: 'TIMER_SYNC',
            gameTimeLeft: this.gameTimeLeft,
            wordTimeLeft: this.wordTimeLeft,
          });
        }
      }, WORD_TRANSITION_MS);
    }

    this.broadcast({
      type: 'TIMER_SYNC',
      gameTimeLeft: this.gameTimeLeft,
      wordTimeLeft: this.wordTimeLeft,
    });
  }

  advanceWord(claimedByPlayerNumber: PlayerNumber | null): void {
    this.currentWordIndex += 1;
    this.wordTimeLeft = this.config.wordTime;

    this.broadcast({
      type: 'NEXT_WORD',
      wordIndex: this.currentWordIndex,
      gameTimeLeft: this.gameTimeLeft,
      wordTimeLeft: this.wordTimeLeft,
      skipped: claimedByPlayerNumber === null,
    });
  }

  endGame({
    winnerOverride = null,
    endReason = 'score',
    forfeitedBy = null,
  }: {
    winnerOverride?: PlayerNumber | null;
    endReason?: 'score' | 'time' | 'forfeit';
    forfeitedBy?: PlayerNumber | null;
  } = {}): void {
    this.status = 'gameOver';
    this.stopTimer();

    const players = this.getPlayerList();
    let winner: PlayerNumber | null = winnerOverride;
    if (winner === null) {
      if (players.length === 2) {
        if (players[0].score > players[1].score) {
          winner = players[0].number;
        } else if (players[1].score > players[0].score) {
          winner = players[1].number;
        }
      } else if (players.length === 1) {
        winner = players[0].number;
      }
    }

    this.broadcast({
      type: 'GAME_OVER',
      scores: Object.fromEntries(
        players.map((p) => [
          p.number,
          { score: p.score, wordsFound: p.wordsFound, name: p.name },
        ])
      ),
      winner,
      endReason,
      forfeitedBy,
    });
  }

  onConnect(_connection: Party.Connection): void {
    // Don't add player yet — wait for JOIN message.
    // PartySocket sends JOIN automatically on every open (including reconnections).
  }

  onClose(connection: Party.Connection): void {
    const playerId = this.connectionToPlayer.get(connection.id);
    this.connectionToPlayer.delete(connection.id);

    if (!playerId) return;

    const player = this.players.get(playerId);
    if (!player) return;

    player.connected = false;
    player.connectionId = null;

    // Start grace period before treating as a real disconnect
    const timer = setTimeout(() => {
      this.disconnectTimers.delete(playerId);
      this.handlePlayerTimeout(playerId);
    }, DISCONNECT_GRACE_PERIOD);

    this.disconnectTimers.set(playerId, timer);

    this.broadcastRoomState();
  }

  handlePlayerTimeout(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // If they reconnected in the meantime, do nothing
    if (player.connected) return;

    this.players.delete(playerId);

    if (this.status === 'playing') {
      const remainingPlayer = Array.from(this.players.values())[0];
      this.endGame({
        winnerOverride: remainingPlayer?.number ?? null,
        endReason: 'forfeit',
        forfeitedBy: player.number,
      });
      return;
    }

    if (this.players.size > 0 && playerId === this.hostPlayerId) {
      const [newHostId] = this.players.keys();
      this.hostPlayerId = newHostId ?? null;
    }

    this.broadcast({
      type: 'PLAYER_DISCONNECTED',
      playerNumber: player.number,
    });
    this.broadcastRoomState();
  }

  handleJoin(data: JoinMessage, sender: Party.Connection): void {
    const playerId = typeof data.playerId === 'string' ? data.playerId : '';
    if (!playerId) return;

    const playerName =
      typeof data.playerName === 'string' ? data.playerName.slice(0, 20) : '';
    const existingPlayer = this.players.get(playerId);

    if (existingPlayer) {
      // Reconnection — cancel any pending disconnect timer
      const timer = this.disconnectTimers.get(playerId);
      if (timer) {
        clearTimeout(timer);
        this.disconnectTimers.delete(playerId);
      }

      // Clean up old connection mapping for this player
      for (const [connId, pid] of this.connectionToPlayer.entries()) {
        if (pid === playerId) this.connectionToPlayer.delete(connId);
      }

      existingPlayer.connectionId = sender.id;
      existingPlayer.connected = true;
      if (playerName) existingPlayer.name = playerName;
      this.connectionToPlayer.set(sender.id, playerId);

      this.sendTo(sender.id, {
        type: 'WELCOME',
        playerNumber: existingPlayer.number,
        roomId: this.room.id,
      });

      // If game is in progress, sync timers
      if (this.status === 'playing') {
        this.sendTo(sender.id, {
          type: 'TIMER_SYNC',
          gameTimeLeft: this.gameTimeLeft,
          wordTimeLeft: this.wordTimeLeft,
        });
      }

      this.broadcastRoomState();
      return;
    }

    // New player — check room availability
    if (this.players.size >= 2) {
      this.sendTo(sender.id, { type: 'ROOM_FULL' });
      return;
    }

    if (this.status === 'playing' || this.status === 'gameOver') {
      this.sendTo(sender.id, { type: 'ROOM_FULL' });
      return;
    }

    const playerNumber: PlayerNumber =
      this.players.size === 0
        ? 1
        : Array.from(this.players.values()).some((p) => p.number === 1)
          ? 2
          : 1;

    this.players.set(playerId, {
      name: playerName || `Joueur ${playerNumber}`,
      number: playerNumber,
      score: 0,
      wordsFound: 0,
      connectionId: sender.id,
      connected: true,
    });
    this.connectionToPlayer.set(sender.id, playerId);

    if (this.players.size === 1 || !this.hostPlayerId) {
      this.hostPlayerId = playerId;
    }

    this.sendTo(sender.id, {
      type: 'WELCOME',
      playerNumber,
      roomId: this.room.id,
    });

    this.broadcastRoomState();
  }

  onMessage(
    message: string | ArrayBuffer | ArrayBufferView,
    sender: Party.Connection
  ): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(toMessageString(message));
    } catch {
      return;
    }

    if (!isRecord(parsed) || typeof parsed.type !== 'string') {
      return;
    }

    const data = parsed as IncomingMessage;

    if (data.type === 'JOIN') {
      this.handleJoin(data as JoinMessage, sender);
      return;
    }

    const playerId = this.connectionToPlayer.get(sender.id);
    if (!playerId) return;
    const player = this.players.get(playerId);
    if (!player) return;

    switch (data.type) {
      case 'UPDATE_CONFIG':
        if (playerId !== this.hostPlayerId || this.status !== 'waiting') break;
        if (isRecord(data.config)) {
          this.config = {
            gameTime: clampInt(data.config.gameTime, 30, 600, this.config.gameTime),
            wordTime: clampInt(data.config.wordTime, 10, 120, this.config.wordTime),
            minWordLength: clampInt(
              data.config.minWordLength,
              2,
              15,
              this.config.minWordLength
            ),
            maxWordLength: clampInt(
              data.config.maxWordLength,
              2,
              15,
              this.config.maxWordLength
            ),
          };
        }
        if (typeof data.wordListKey === 'string' && data.wordListKey.length > 0) {
          this.wordListKey = data.wordListKey;
        }
        this.broadcastRoomState();
        break;

      case 'START_GAME':
        if (playerId !== this.hostPlayerId) break;
        if (this.players.size < 2 || this.status !== 'waiting') break;

        // All players must be connected
        for (const p of this.players.values()) {
          if (!p.connected) return;
        }

        this.status = 'playing';
        this.seed = Math.floor(Math.random() * 2147483647);
        this.currentWordIndex = 0;
        this.claimedWords = new Set();
        this.gameTimeLeft = this.config.gameTime;
        this.wordTimeLeft = this.config.wordTime;

        for (const p of this.players.values()) {
          p.score = 0;
          p.wordsFound = 0;
        }

        this.broadcast({
          type: 'GAME_STARTED',
          seed: this.seed,
          config: this.config,
          wordListKey: this.wordListKey,
        });

        this.startTimer();
        break;

      case 'WORD_FOUND': {
        if (this.status !== 'playing') break;
        if (this.transitioning) break;

        const wordIndex =
          typeof data.wordIndex === 'number' && Number.isInteger(data.wordIndex)
            ? data.wordIndex
            : null;
        if (wordIndex === null || wordIndex !== this.currentWordIndex) break;
        if (this.claimedWords.has(wordIndex)) break;

        this.claimedWords.add(wordIndex);
        const wordLength =
          typeof data.wordLength === 'number' && Number.isFinite(data.wordLength)
            ? data.wordLength
            : 0;
        player.score += wordLength;
        player.wordsFound += 1;
        this.transitioning = true;

        this.broadcast({
          type: 'WORD_CLAIMED',
          wordIndex,
          playerNumber: player.number,
          scores: Object.fromEntries(
            Array.from(this.players.values()).map((p) => [
              p.number,
              { score: p.score, wordsFound: p.wordsFound, name: p.name },
            ])
          ),
        });

        this.transitionTimeout = setTimeout(() => {
          this.transitioning = false;
          this.transitionTimeout = null;
          if (this.status === 'playing') {
            this.advanceWord(player.number);
            this.broadcast({
              type: 'TIMER_SYNC',
              gameTimeLeft: this.gameTimeLeft,
              wordTimeLeft: this.wordTimeLeft,
            });
          }
        }, WORD_TRANSITION_MS);
        break;
      }

      case 'FORFEIT':
        if (this.status !== 'playing') break;
        this.endGame({
          winnerOverride:
            Array.from(this.players.values()).find((p) => p.number !== player.number)
              ?.number ?? null,
          endReason: 'forfeit',
          forfeitedBy: player.number,
        });
        break;

      case 'PLAY_AGAIN':
        if (this.status !== 'gameOver') break;
        this.status = 'waiting';
        this.currentWordIndex = 0;
        this.claimedWords = new Set();
        this.gameTimeLeft = 0;
        this.wordTimeLeft = 0;
        for (const p of this.players.values()) {
          p.score = 0;
          p.wordsFound = 0;
        }
        this.broadcastRoomState();
        break;
    }
  }
}

GameRoom satisfies Party.Worker;
