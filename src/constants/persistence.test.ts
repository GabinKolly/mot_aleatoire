// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { loadPersistedConfig, savePersistedConfig, STORAGE_KEY } from './persistence';

const PRESET_KEYS = ['default', 'hard', 'motsAvecW'];

beforeEach(() => {
  localStorage.clear();
});

describe('loadPersistedConfig', () => {
  it('returns null when localStorage is empty', () => {
    expect(loadPersistedConfig({ presetKeys: PRESET_KEYS })).toBeNull();
  });

  it('returns null for corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json {{');
    expect(loadPersistedConfig({ presetKeys: PRESET_KEYS })).toBeNull();
  });

  it('returns null for an unknown storage version', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 999 }));
    expect(loadPersistedConfig({ presetKeys: PRESET_KEYS })).toBeNull();
  });

  it('loads a valid v3 config correctly', () => {
    const stored = {
      version: 3,
      settings: {
        startTime: 60,
        bonusTime: 5,
        alternativeWordBonusTime: 3,
        minWordLength: 4,
        maxWordLength: 8,
        answerValidationMode: 'strict',
      },
      list: { selectedPreset: 'hard', selectedAddedListId: null, added: [] },
      highScores: { 'preset:hard': 42 },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const result = loadPersistedConfig({ presetKeys: PRESET_KEYS });
    expect(result?.settings.startTime).toBe(60);
    expect(result?.settings.bonusTime).toBe(5);
    expect(result?.settings.answerValidationMode).toBe('strict');
    expect(result?.list.selectedPreset).toBe('hard');
    expect(result?.highScores['preset:hard']).toBe(42);
  });

  it('clamps out-of-range settings to their valid bounds', () => {
    const stored = {
      version: 3,
      settings: {
        startTime: 0,           // min is 1 → clamped to 1
        bonusTime: -5,          // min is 0 → clamped to 0
        alternativeWordBonusTime: 10000, // max is 9999 → clamped to 9999
        minWordLength: 4,
        maxWordLength: 7,
        answerValidationMode: 'strict',
      },
      list: { selectedPreset: 'default', selectedAddedListId: null, added: [] },
      highScores: {},
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const result = loadPersistedConfig({ presetKeys: PRESET_KEYS });
    expect(result?.settings.startTime).toBe(1);
    expect(result?.settings.bonusTime).toBe(0);
    expect(result?.settings.alternativeWordBonusTime).toBe(9999);
    expect(result?.settings.answerValidationMode).toBe('strict');
  });

  it('rejects a selectedPreset that is not in the provided preset keys', () => {
    const stored = {
      version: 3,
      settings: { startTime: 45, bonusTime: 10, alternativeWordBonusTime: 5, minWordLength: 4, maxWordLength: 7, answerValidationMode: 'loose' },
      list: { selectedPreset: 'unknownList', selectedAddedListId: null, added: [] },
      highScores: {},
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const result = loadPersistedConfig({ presetKeys: PRESET_KEYS });
    expect(result?.list.selectedPreset).toBeNull();
  });

  it('migrates a v1 config (without highScores) to the current format', () => {
    const v1 = {
      version: 1,
      settings: { startTime: 30, bonusTime: 8, alternativeWordBonusTime: 4, minWordLength: 3, maxWordLength: 6 },
      list: { selectedPreset: 'hard' },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v1));

    const result = loadPersistedConfig({ presetKeys: PRESET_KEYS });
    expect(result).not.toBeNull();
    expect(result?.settings.startTime).toBe(30);
    expect(result?.settings.answerValidationMode).toBe('loose');
    expect(result?.list.selectedPreset).toBe('hard');
    expect(result?.highScores).toEqual({});
  });

  it('migrates a v1 config with a custom word list into an added list', () => {
    const v1 = {
      version: 1,
      settings: { startTime: 45, bonusTime: 10, alternativeWordBonusTime: 5, minWordLength: 3, maxWordLength: 7 },
      list: { selectedPreset: 'custom', custom: { name: 'Ma liste', words: ['HELLO', 'WORLD'] } },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v1));

    const result = loadPersistedConfig({ presetKeys: PRESET_KEYS });
    expect(result?.list.added).toHaveLength(1);
    expect(result?.list.added[0].name).toBe('Ma liste');
    expect(result?.list.selectedAddedListId).toBe('added-1');
  });

  it('migrates a v2 config (without highScores) to the current format', () => {
    const v2 = {
      version: 2,
      settings: { startTime: 50, bonusTime: 12, alternativeWordBonusTime: 6, minWordLength: 4, maxWordLength: 7 },
      list: { selectedPreset: 'default', selectedAddedListId: null, added: [] },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v2));

    const result = loadPersistedConfig({ presetKeys: PRESET_KEYS });
    expect(result?.settings.startTime).toBe(50);
    expect(result?.highScores).toEqual({});
  });

  it('strips negative or non-finite values from highScores', () => {
    const stored = {
      version: 3,
      settings: { startTime: 45, bonusTime: 10, alternativeWordBonusTime: 5, minWordLength: 4, maxWordLength: 7, answerValidationMode: 'loose' },
      list: { selectedPreset: 'default', selectedAddedListId: null, added: [] },
      highScores: { 'preset:default': 100, 'preset:hard': -5, 'preset:bad': 'NaN' },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const result = loadPersistedConfig({ presetKeys: PRESET_KEYS });
    expect(result?.highScores['preset:default']).toBe(100);
    expect(result?.highScores['preset:hard']).toBeUndefined();
    expect(result?.highScores['preset:bad']).toBeUndefined();
  });

  it('defaults answer validation mode to loose when missing', () => {
    const stored = {
      version: 3,
      settings: {
        startTime: 45,
        bonusTime: 10,
        alternativeWordBonusTime: 5,
        minWordLength: 4,
        maxWordLength: 7,
      },
      list: { selectedPreset: 'default', selectedAddedListId: null, added: [] },
      highScores: {},
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const result = loadPersistedConfig({ presetKeys: PRESET_KEYS });
    expect(result?.settings.answerValidationMode).toBe('loose');
  });
});

describe('savePersistedConfig', () => {
  it('persists the given object to localStorage as JSON', () => {
    const config = { version: 3, foo: 'bar' };
    savePersistedConfig(config);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(config));
  });

  it('overwrites any previously saved value', () => {
    savePersistedConfig({ version: 3, score: 10 });
    savePersistedConfig({ version: 3, score: 99 });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.score).toBe(99);
  });
});
