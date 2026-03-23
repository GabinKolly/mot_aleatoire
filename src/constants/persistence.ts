import type { AddedWordList, GameSettings } from '../types/game';

export const STORAGE_KEY = 'mot_aleatoire:v1';
const STORAGE_VERSION = 3;

interface PersistedList {
  selectedPreset: string | null;
  selectedAddedListId: string | null;
  added: AddedWordList[];
}

interface PersistedConfig {
  settings: GameSettings;
  list: PersistedList;
  highScores: Record<string, number>;
}

type ParsedObject = Record<string, unknown>;

const clampInt = (
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number => {
  const parsed = Number.parseInt(String(value), 10);
  const candidate = Number.isNaN(parsed) ? fallback : parsed;
  return Math.min(max, Math.max(min, candidate));
};

const buildUniqueName = (rawName: unknown, usedNames: Set<string>): string => {
  const baseName =
    typeof rawName === 'string' && rawName.trim().length > 0
      ? rawName.trim()
      : 'Liste ajoutee';

  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return baseName;
  }

  let suffix = 2;
  let candidate = `${baseName} (${suffix})`;
  while (usedNames.has(candidate)) {
    suffix += 1;
    candidate = `${baseName} (${suffix})`;
  }
  usedNames.add(candidate);
  return candidate;
};

const sanitizeSettings = (rawSettings: ParsedObject = {}): GameSettings => {
  const minWordLength = clampInt(rawSettings.minWordLength, 2, 100, 4);
  const maxWordLength = clampInt(rawSettings.maxWordLength, minWordLength, 100, 7);
  const answerValidationMode =
    rawSettings.answerValidationMode === 'strict' ? 'strict' : 'loose';

  return {
    startTime: clampInt(rawSettings.startTime, 1, 9999, 45),
    bonusTime: clampInt(rawSettings.bonusTime, 0, 9999, 10),
    alternativeWordBonusTime: clampInt(
      rawSettings.alternativeWordBonusTime,
      0,
      9999,
      5
    ),
    minWordLength,
    maxWordLength,
    answerValidationMode,
  };
};

const sanitizeHighScores = (rawHighScores: unknown): Record<string, number> => {
  if (!rawHighScores || typeof rawHighScores !== 'object' || Array.isArray(rawHighScores)) {
    return {};
  }

  const sanitized: Record<string, number> = {};

  Object.entries(rawHighScores as ParsedObject).forEach(([key, value]) => {
    if (key.length === 0) {
      return;
    }

    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    sanitized[key] = parsed;
  });

  return sanitized;
};

const sanitizeWords = (rawWords: unknown): string[] => {
  if (!Array.isArray(rawWords)) {
    return [];
  }

  return rawWords
    .filter((word): word is string => typeof word === 'string')
    .map((word) => word.trim().toUpperCase())
    .filter((word) => word.length > 1);
};

const sanitizeAddedWordLists = (rawAdded: unknown): AddedWordList[] => {
  if (!Array.isArray(rawAdded)) {
    return [];
  }

  const usedIds = new Set<string>();
  const usedNames = new Set<string>();
  const added: AddedWordList[] = [];

  rawAdded.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const typedEntry = entry as ParsedObject;
    const words = sanitizeWords(typedEntry.words);
    if (words.length === 0) {
      return;
    }

    const name = buildUniqueName(typedEntry.name, usedNames);
    const rawId =
      typeof typedEntry.id === 'string' && typedEntry.id.trim().length > 0
        ? typedEntry.id.trim()
        : `added-${index + 1}`;

    let id = rawId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${rawId}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);

    added.push({ id, name, words });
  });

  return added;
};

const sanitizeListV2 = (
  rawList: ParsedObject = {},
  presetKeys: string[]
): PersistedList => {
  const added = sanitizeAddedWordLists(rawList.added);
  const selectedPresetCandidate =
    typeof rawList.selectedPreset === 'string' && presetKeys.includes(rawList.selectedPreset)
      ? rawList.selectedPreset
      : null;

  const selectedAddedListIdCandidate =
    typeof rawList.selectedAddedListId === 'string' ? rawList.selectedAddedListId : null;
  const selectedAddedListId = added.some((list) => list.id === selectedAddedListIdCandidate)
    ? selectedAddedListIdCandidate
    : null;

  return {
    selectedPreset: selectedPresetCandidate,
    selectedAddedListId,
    added,
  };
};

const sanitizeCustomWordListV1 = (
  rawCustom: unknown
): Pick<AddedWordList, 'name' | 'words'> | null => {
  if (!rawCustom || typeof rawCustom !== 'object') {
    return null;
  }

  const typedCustom = rawCustom as ParsedObject;
  const words = sanitizeWords(typedCustom.words);
  if (words.length === 0) {
    return null;
  }

  const name =
    typeof typedCustom.name === 'string' && typedCustom.name.trim().length > 0
      ? typedCustom.name.trim()
      : 'Liste ajoutee';

  return { name, words };
};

const migrateV1ToV2 = (
  parsed: ParsedObject,
  presetKeys: string[]
): Omit<PersistedConfig, 'highScores'> => {
  const settings = sanitizeSettings(parsed.settings as ParsedObject);
  const rawList =
    parsed.list && typeof parsed.list === 'object' && !Array.isArray(parsed.list)
      ? (parsed.list as ParsedObject)
      : {};
  const rawSelectedPreset = rawList.selectedPreset;
  const selectedPreset =
    typeof rawSelectedPreset === 'string' && presetKeys.includes(rawSelectedPreset)
      ? rawSelectedPreset
      : null;

  const custom = sanitizeCustomWordListV1(rawList.custom);
  if (rawSelectedPreset === 'custom' && custom) {
    return {
      settings,
      list: {
        selectedPreset: selectedPreset ?? 'default',
        selectedAddedListId: 'added-1',
        added: [{ id: 'added-1', name: custom.name, words: custom.words }],
      },
    };
  }

  return {
    settings,
    list: {
      selectedPreset,
      selectedAddedListId: null,
      added: [],
    },
  };
};

const migrateV2ToV3 = (parsed: ParsedObject, presetKeys: string[]): PersistedConfig => ({
  settings: sanitizeSettings(parsed.settings as ParsedObject),
  list: sanitizeListV2(parsed.list as ParsedObject, presetKeys),
  highScores: {},
});

export const loadPersistedConfig = ({
  presetKeys,
}: {
  presetKeys: string[];
}): PersistedConfig | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsedUnknown = JSON.parse(raw);
    if (!parsedUnknown || typeof parsedUnknown !== 'object' || Array.isArray(parsedUnknown)) {
      return null;
    }

    const parsed = parsedUnknown as ParsedObject;

    if (parsed.version === 1) {
      return {
        ...migrateV1ToV2(parsed, presetKeys),
        highScores: {},
      };
    }

    if (parsed.version === 2) {
      return migrateV2ToV3(parsed, presetKeys);
    }

    if (parsed.version !== STORAGE_VERSION) {
      return null;
    }

    return {
      settings: sanitizeSettings(parsed.settings as ParsedObject),
      list: sanitizeListV2(parsed.list as ParsedObject, presetKeys),
      highScores: sanitizeHighScores(parsed.highScores),
    };
  } catch {
    return null;
  }
};

export const savePersistedConfig = (config: unknown): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Best effort persistence only.
  }
};
