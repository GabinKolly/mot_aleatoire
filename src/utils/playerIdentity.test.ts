// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSavedPlayerName,
  savePlayerName,
  getOrCreatePlayerId,
  generateRoomCode,
} from './playerIdentity';

beforeEach(() => {
  localStorage.clear();
});

describe('savePlayerName / getSavedPlayerName', () => {
  it('returns an empty string when nothing has been saved', () => {
    expect(getSavedPlayerName()).toBe('');
  });

  it('returns the name that was previously saved', () => {
    savePlayerName('Alice');
    expect(getSavedPlayerName()).toBe('Alice');
  });

  it('overwrites a previously saved name', () => {
    savePlayerName('Alice');
    savePlayerName('Bob');
    expect(getSavedPlayerName()).toBe('Bob');
  });
});

describe('getOrCreatePlayerId', () => {
  it('creates a non-empty string id', () => {
    const id = getOrCreatePlayerId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns the same id on subsequent calls (persists to localStorage)', () => {
    const id1 = getOrCreatePlayerId();
    const id2 = getOrCreatePlayerId();
    expect(id1).toBe(id2);
  });
});

describe('generateRoomCode', () => {
  const VALID_CHARS = new Set('ABCDEFGHJKLMNPQRSTUVWXYZ23456789');

  it('returns a 4-character string', () => {
    expect(generateRoomCode()).toHaveLength(4);
  });

  it('uses only characters from the allowed set (no O, I, 0, 1)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      for (const char of code) {
        expect(VALID_CHARS.has(char)).toBe(true);
      }
    }
  });

  it('produces different codes across calls', () => {
    const codes = new Set(Array.from({ length: 20 }, generateRoomCode));
    expect(codes.size).toBeGreaterThan(1);
  });
});
