import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import PartySocket from 'partysocket';
import { GAME_OVER_REVEAL_MS } from '../constants/timings';
import { getOrCreatePlayerId, savePlayerName } from '../utils/playerIdentity';
import type { MultiplayerAction, MultiplayerConfig } from '../types/multiplayer';
import type {
  WelcomePayload,
  RoomStatePayload,
  GameStartedPayload,
  WordClaimedPayload,
  WordSkippedPayload,
  NextWordPayload,
  TimerSyncPayload,
  GameOverPayload,
  PlayerDisconnectedPayload,
} from './multiplayerReducer';

const PARTYKIT_HOST =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_PARTYKIT_HOST
    ? import.meta.env.VITE_PARTYKIT_HOST
    : `${
        typeof window !== 'undefined' ? window.location.hostname : 'localhost'
      }:1999`;

export type ClientMessage =
  | { type: 'JOIN'; playerId: string; playerName: string }
  | { type: 'UPDATE_CONFIG'; config: MultiplayerConfig; wordListKey: string }
  | { type: 'START_GAME' }
  | { type: 'WORD_FOUND'; wordIndex: number; wordLength: number }
  | { type: 'NO_MORE_WORDS' }
  | { type: 'FORFEIT' }
  | { type: 'PLAY_AGAIN' };

export function usePartySocket(dispatch: Dispatch<MultiplayerAction>) {
  const socketRef = useRef<PartySocket | null>(null);
  const playerIdRef = useRef(getOrCreatePlayerId());
  const playerNameRef = useRef('');
  const wordFoundSentRef = useRef<Set<number>>(new Set());
  const bonusAwardedWordsRef = useRef<Set<string>>(new Set());
  const noMoreWordsSentRef = useRef(false);

  const cleanup = useCallback((): void => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    wordFoundSentRef.current = new Set();
    bonusAwardedWordsRef.current = new Set();
    noMoreWordsSentRef.current = false;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const setupSocket = useCallback(
    (roomId: string, playerName: string): void => {
      cleanup();
      playerNameRef.current = playerName;
      savePlayerName(playerName);

      const socket = new PartySocket({
        host: PARTYKIT_HOST,
        room: roomId,
      });

      socket.addEventListener('open', () => {
        const joinMessage: ClientMessage = {
          type: 'JOIN',
          playerId: playerIdRef.current,
          playerName: playerNameRef.current,
        };
        socket.send(JSON.stringify(joinMessage));
      });

      socket.addEventListener('message', (event) => {
        if (typeof event.data !== 'string') {
          return;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(event.data);
        } catch {
          return;
        }

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return;
        }

        const data = parsed as { type?: unknown } & Record<string, unknown>;
        if (typeof data.type !== 'string') {
          return;
        }

        switch (data.type) {
          case 'WELCOME':
            dispatch({ type: 'WELCOME', payload: data as unknown as WelcomePayload });
            break;

          case 'ROOM_STATE':
            dispatch({
              type: 'ROOM_STATE',
              payload: {
                ...(data as unknown as Omit<RoomStatePayload, 'myPlayerId'>),
                myPlayerId: playerIdRef.current,
              },
            });
            break;

          case 'GAME_STARTED':
            wordFoundSentRef.current = new Set();
            bonusAwardedWordsRef.current = new Set();
            noMoreWordsSentRef.current = false;
            dispatch({
              type: 'GAME_STARTED',
              payload: data as unknown as GameStartedPayload,
            });
            break;

          case 'WORD_CLAIMED':
            dispatch({
              type: 'WORD_CLAIMED',
              payload: data as unknown as WordClaimedPayload,
            });
            break;

          case 'WORD_SKIPPED':
            dispatch({
              type: 'WORD_SKIPPED',
              payload: data as unknown as WordSkippedPayload,
            });
            break;

          case 'NEXT_WORD':
            bonusAwardedWordsRef.current = new Set();
            dispatch({
              type: 'NEXT_WORD',
              payload: data as unknown as NextWordPayload,
            });
            break;

          case 'TIMER_SYNC':
            dispatch({
              type: 'TIMER_SYNC',
              payload: data as unknown as TimerSyncPayload,
            });
            break;

          case 'GAME_OVER':
            dispatch({ type: 'REVEAL_FINAL_WORD' });
            setTimeout(() => {
              dispatch({
                type: 'GAME_OVER',
                payload: data as unknown as GameOverPayload,
              });
            }, GAME_OVER_REVEAL_MS);
            break;

          case 'PLAYER_DISCONNECTED':
            dispatch({
              type: 'PLAYER_DISCONNECTED',
              payload: data as unknown as PlayerDisconnectedPayload,
            });
            break;

          case 'ROOM_FULL':
            dispatch({ type: 'ROOM_FULL' });
            break;
        }
      });

      socket.addEventListener('error', () => {
        dispatch({
          type: 'CONNECTION_ERROR',
          payload: 'Erreur de connexion au serveur.',
        });
      });

      socketRef.current = socket;
    },
    [cleanup, dispatch]
  );

  const send = useCallback((data: ClientMessage): void => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send, setupSocket, cleanup, wordFoundSentRef, bonusAwardedWordsRef, noMoreWordsSentRef };
}
