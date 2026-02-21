export const STORAGE_KEY = 'mot_aleatoire:v1';
const STORAGE_VERSION = 2;

const clampInt = (value, min, max, fallback) => {
  const parsed = Number.parseInt(value, 10);
  const candidate = Number.isNaN(parsed) ? fallback : parsed;
  return Math.min(max, Math.max(min, candidate));
};

const buildUniqueName = (rawName, usedNames) => {
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

const sanitizeSettings = (rawSettings = {}) => {
  const minWordLength = clampInt(rawSettings.minWordLength, 2, 100, 4);
  const maxWordLength = clampInt(rawSettings.maxWordLength, minWordLength, 100, 7);

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
  };
};

const sanitizeWords = (rawWords) => {
  if (!Array.isArray(rawWords)) {
    return [];
  }

  return rawWords
    .filter((word) => typeof word === 'string')
    .map((word) => word.trim().toUpperCase())
    .filter((word) => word.length > 1);
};

const sanitizeAddedWordLists = (rawAdded) => {
  if (!Array.isArray(rawAdded)) {
    return [];
  }

  const usedIds = new Set();
  const usedNames = new Set();
  const added = [];

  rawAdded.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const words = sanitizeWords(entry.words);
    if (words.length === 0) {
      return;
    }

    const name = buildUniqueName(entry.name, usedNames);
    const rawId =
      typeof entry.id === 'string' && entry.id.trim().length > 0
        ? entry.id.trim()
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

const sanitizeListV2 = (rawList = {}, presetKeys) => {
  const added = sanitizeAddedWordLists(rawList.added);
  const selectedPresetCandidate =
    typeof rawList.selectedPreset === 'string' && presetKeys.includes(rawList.selectedPreset)
      ? rawList.selectedPreset
      : null;

  const selectedAddedListIdCandidate =
    typeof rawList.selectedAddedListId === 'string'
      ? rawList.selectedAddedListId
      : null;
  const selectedAddedListId = added.some((list) => list.id === selectedAddedListIdCandidate)
    ? selectedAddedListIdCandidate
    : null;

  return {
    selectedPreset: selectedPresetCandidate,
    selectedAddedListId,
    added,
  };
};

const sanitizeCustomWordListV1 = (rawCustom) => {
  if (!rawCustom || typeof rawCustom !== 'object') {
    return null;
  }

  const words = sanitizeWords(rawCustom.words);
  if (words.length === 0) {
    return null;
  }

  const name =
    typeof rawCustom.name === 'string' && rawCustom.name.trim().length > 0
      ? rawCustom.name.trim()
      : 'Liste ajoutee';

  return { name, words };
};

const migrateV1ToV2 = (parsed, presetKeys) => {
  const settings = sanitizeSettings(parsed.settings);
  const rawList = parsed.list ?? {};
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

export const loadPersistedConfig = ({ presetKeys }) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (parsed.version === 1) {
      return migrateV1ToV2(parsed, presetKeys);
    }

    if (parsed.version !== STORAGE_VERSION) {
      return null;
    }

    return {
      settings: sanitizeSettings(parsed.settings),
      list: sanitizeListV2(parsed.list, presetKeys),
    };
  } catch {
    return null;
  }
};

export const savePersistedConfig = (config) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Best effort persistence only.
  }
};
