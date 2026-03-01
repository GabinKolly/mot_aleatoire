import type { Tile } from './game';

export interface Player {
  id: string;
  number: 1 | 2;
  name: string;
  connected?: boolean;
}

export interface MultiplayerConfig {
  gameTime: number;
  wordTime: number;
  minWordLength: number;
  maxWordLength: number;
  wordListKey?: string;
}

export interface WordHistoryEntry {
  wordIndex: number;
  word: string;
  claimedBy: number | null;
}

export type MultiplayerPhase = 'lobby' | 'waiting' | 'playing' | 'gameOver';

export type GameOverReason = 'score' | 'time' | 'forfeit';

export interface WordSequenceEntry {
  word: string;
  tiles: Tile[];
}

export interface MultiplayerState {
  phase: MultiplayerPhase;
  roomCode: string;
  playerNumber: 1 | 2 | null;
  players: Player[];
  hostId: string | null;
  isHost: boolean;
  config: MultiplayerConfig;
  wordListKey: string;
  connectionError: string | null;

  isPlaying: boolean;
  seed: number | null;
  wordSequence: WordSequenceEntry[];
  currentWordIndex: number;
  currentWord: string;
  tiles: Tile[];
  isCorrect: boolean;
  isBonusWord: boolean;
  gameTimeLeft: number;
  wordTimeLeft: number;
  scores: Record<number, number>;
  wordsFound: Record<number, number>;
  gameOver: boolean;
  winner: number | null;
  gameOverReason: GameOverReason | null;
  forfeitedBy: number | null;
  lastClaimedBy: number | null;
  wordSkipped: boolean;
  wordHistory: WordHistoryEntry[];
}

export type MultiplayerAction =
  | { type: 'SET_ROOM_CODE'; payload: string }
  | { type: 'WELCOME'; payload: { playerNumber: 1 | 2; roomId: string } }
  | { type: 'ROOM_STATE'; payload: { players: Player[]; hostId: string; myPlayerId: string; config: MultiplayerConfig; wordListKey: string; status: string } }
  | { type: 'ENTER_WAITING' }
  | { type: 'GAME_STARTED'; payload: { seed: number; config: MultiplayerConfig; wordListKey: string } }
  | { type: 'SET_TILES'; payload: Tile[] | ((tiles: Tile[]) => Tile[]) }
  | { type: 'LOCAL_CORRECT' }
  | { type: 'WORD_CLAIMED'; payload: { scores: Record<number, { score: number; wordsFound: number }>; playerNumber: 1 | 2; wordIndex: number } }
  | { type: 'WORD_SKIPPED'; payload: { wordIndex: number } }
  | { type: 'NEXT_WORD'; payload: { wordIndex: number; gameTimeLeft: number; wordTimeLeft: number } }
  | { type: 'TIMER_SYNC'; payload: { gameTimeLeft: number; wordTimeLeft: number } }
  | { type: 'AWARD_ALT_BONUS' }
  | { type: 'CLEAR_ALT_BONUS' }
  | { type: 'REVEAL_FINAL_WORD' }
  | { type: 'GAME_OVER'; payload: { winner: 1 | 2 | null; endReason?: GameOverReason; forfeitedBy?: 1 | 2 | null; scores: Record<number, { score: number; wordsFound: number }> } }
  | { type: 'PLAYER_DISCONNECTED'; payload: unknown }
  | { type: 'ROOM_FULL' }
  | { type: 'CONNECTION_ERROR'; payload: string }
  | { type: 'RESET' };
