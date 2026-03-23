import { WORD_LISTS } from '../constants/wordLists';
import { loadPersistedConfig } from '../constants/persistence';
import {
  DEFAULT_START_TIME,
  DEFAULT_BONUS_TIME,
  DEFAULT_ALT_BONUS_TIME,
} from '../constants/gameConfig';
import type { AddedWordList, GameAction, GameSettings, GameState, Tile } from '../types/game';
import { mergeUsedWords } from '../utils/anagramWordPicking';

export type TileUpdater = Tile[] | ((tiles: Tile[]) => Tile[]);

export type ListSelection = {
  selectedPreset: string;
  selectedAddedListId: string | null;
  addedWordLists: AddedWordList[];
};

type WordLengthRange = { minWordLength: number; maxWordLength: number };
type ListKeyInput = Pick<ListSelection, 'selectedPreset' | 'selectedAddedListId'>;

const DEFAULT_TIME_SETTINGS = {
  startTime: DEFAULT_START_TIME,
  bonusTime: DEFAULT_BONUS_TIME,
  alternativeWordBonusTime: DEFAULT_ALT_BONUS_TIME,
  answerValidationMode: 'loose' as const,
};

export const buildListScoreKey = ({
  selectedPreset,
  selectedAddedListId,
}: ListKeyInput): string =>
  selectedAddedListId ? `added:${selectedAddedListId}` : `preset:${selectedPreset}`;

export const getStandardWordLengthForSelection = ({
  selectedPreset,
  selectedAddedListId,
}: ListKeyInput): WordLengthRange => {
  if (selectedAddedListId) {
    return { minWordLength: 3, maxWordLength: 30 };
  }

  if (selectedPreset === 'default' || selectedPreset === 'hard') {
    return { minWordLength: 4, maxWordLength: 7 };
  }

  if (selectedPreset === 'motsAvecW' || selectedPreset === 'motsAvecWFacile') {
    return { minWordLength: 3, maxWordLength: 7 };
  }

  return { minWordLength: 3, maxWordLength: 30 };
};

export const getStandardSettingsForSelection = (selection: ListKeyInput): GameSettings => ({
  ...DEFAULT_TIME_SETTINGS,
  ...getStandardWordLengthForSelection(selection),
});

export const createListNameResolver = (existingNames: string[]): ((rawName: string) => string) => {
  const used = new Set(existingNames);

  return (rawName: string) => {
    const baseName =
      typeof rawName === 'string' && rawName.trim().length > 0
        ? rawName.trim()
        : 'Liste ajoutee';

    if (!used.has(baseName)) {
      used.add(baseName);
      return baseName;
    }

    let suffix = 2;
    let candidate = `${baseName} (${suffix})`;
    while (used.has(candidate)) {
      suffix += 1;
      candidate = `${baseName} (${suffix})`;
    }
    used.add(candidate);
    return candidate;
  };
};

export const generateAddedListId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `added-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const resolveActiveList = ({
  selectedPreset,
  selectedAddedListId,
  addedWordLists,
}: ListSelection): {
  allWords: string[];
  bonusCheckWords: string[];
  wordListName: string;
  selectedPreset: string;
  selectedAddedListId: string | null;
} => {
  const selectedAddedList = addedWordLists.find((list) => list.id === selectedAddedListId);
  if (selectedAddedList) {
    return {
      allWords: selectedAddedList.words,
      bonusCheckWords: selectedAddedList.words,
      wordListName: selectedAddedList.name,
      selectedPreset: WORD_LISTS[selectedPreset] ? selectedPreset : 'default',
      selectedAddedListId: selectedAddedList.id,
    };
  }

  const resolvedPreset = WORD_LISTS[selectedPreset] ? selectedPreset : 'default';
  const preset = WORD_LISTS[resolvedPreset];
  return {
    allWords: preset.words,
    bonusCheckWords: preset.bonusCheckWords,
    wordListName: preset.name,
    selectedPreset: resolvedPreset,
    selectedAddedListId: null,
  };
};

export const getInitialState = (initialPresetKey: string): GameState => {
  const fallbackPreset = WORD_LISTS[initialPresetKey] ? initialPresetKey : 'default';
  const persisted = loadPersistedConfig({ presetKeys: Object.keys(WORD_LISTS) });

  const selectedPreset = persisted?.list?.selectedPreset ?? fallbackPreset;
  const selectedAddedListId = persisted?.list?.selectedAddedListId ?? null;
  const addedWordLists = persisted?.list?.added ?? [];
  const resolvedList = resolveActiveList({ selectedPreset, selectedAddedListId, addedWordLists });
  const persistedSettings = persisted?.settings;

  return {
    allWords: resolvedList.allWords,
    bonusCheckWords: resolvedList.bonusCheckWords,
    currentWord: '',
    currentAcceptedWords: [],
    tiles: [],
    usedWords: [],
    isCorrect: false,
    isBonusWord: false,
    timeLeft: 0,
    score: 0,
    wordsFound: 0,
    completionTimeBonus: 0,
    lastGameWasNewRecord: false,
    lastGameWasScoreEligible: false,
    isPlaying: false,
    gameOver: false,
    allWordsCompleted: false,
    showSettings: false,
    wordListName: resolvedList.wordListName,
    selectedPreset: resolvedList.selectedPreset,
    selectedAddedListId: resolvedList.selectedAddedListId,
    addedWordLists,
    highScores: persisted?.highScores ?? {},
    startTime: persistedSettings?.startTime ?? 45,
    bonusTime: persistedSettings?.bonusTime ?? 10,
    alternativeWordBonusTime: persistedSettings?.alternativeWordBonusTime ?? 5,
    minWordLength: persistedSettings?.minWordLength ?? 4,
    maxWordLength: persistedSettings?.maxWordLength ?? 7,
    answerValidationMode: persistedSettings?.answerValidationMode ?? 'loose',
  };
};

const buildRoundResetState = (
  state: GameState,
  overrides: Partial<GameState> = {}
): GameState => ({
  ...state,
  isPlaying: false,
  gameOver: false,
  allWordsCompleted: false,
  usedWords: [],
  score: 0,
  wordsFound: 0,
  completionTimeBonus: 0,
  lastGameWasNewRecord: false,
  lastGameWasScoreEligible: false,
  timeLeft: 0,
  currentWord: '',
  currentAcceptedWords: [],
  tiles: [],
  isCorrect: false,
  isBonusWord: false,
  ...overrides,
});

const buildListSelectionState = (state: GameState, selection: ListSelection): GameState => {
  const resolved = resolveActiveList(selection);
  return buildRoundResetState(state, {
    allWords: resolved.allWords,
    bonusCheckWords: resolved.bonusCheckWords,
    wordListName: resolved.wordListName,
    selectedPreset: resolved.selectedPreset,
    selectedAddedListId: resolved.selectedAddedListId,
    addedWordLists: selection.addedWordLists,
  });
};

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings };
    case 'SET_START_TIME':
      return buildRoundResetState(state, { startTime: action.payload });
    case 'SET_BONUS_TIME':
      return buildRoundResetState(state, { bonusTime: action.payload });
    case 'SET_ALT_BONUS_TIME':
      return buildRoundResetState(state, { alternativeWordBonusTime: action.payload });
    case 'SET_ANSWER_VALIDATION_MODE':
      return buildRoundResetState(state, { answerValidationMode: action.payload });
    case 'CLEAR_HIGH_SCORE_FOR_CURRENT_LIST': {
      const listKey = buildListScoreKey({
        selectedPreset: state.selectedPreset,
        selectedAddedListId: state.selectedAddedListId,
      });
      const { [listKey]: _removedHighScore, ...nextHighScores } = state.highScores;
      return { ...state, highScores: nextHighScores };
    }
    case 'RESET_SETTINGS_TO_STANDARD': {
      const standardSettings = getStandardSettingsForSelection({
        selectedPreset: state.selectedPreset,
        selectedAddedListId: state.selectedAddedListId,
      });
      return buildRoundResetState(state, standardSettings);
    }
    case 'SET_MIN_WORD_LENGTH': {
      const nextMin = action.payload;
      return buildRoundResetState(state, {
        minWordLength: nextMin,
        maxWordLength: Math.max(state.maxWordLength, nextMin),
      });
    }
    case 'SET_MAX_WORD_LENGTH':
      return buildRoundResetState(state, { maxWordLength: action.payload });
    case 'CHANGE_PRESET':
      return buildListSelectionState(state, {
        selectedPreset: action.payload,
        selectedAddedListId: null,
        addedWordLists: state.addedWordLists,
      });
    case 'SELECT_ADDED_LIST':
      return buildListSelectionState(state, {
        selectedPreset: state.selectedPreset,
        selectedAddedListId: action.payload,
        addedWordLists: state.addedWordLists,
      });
    case 'ADD_ADDED_LIST': {
      const nextAddedWordLists = [...state.addedWordLists, action.payload];
      return buildListSelectionState(state, {
        selectedPreset: state.selectedPreset,
        selectedAddedListId: action.payload.id,
        addedWordLists: nextAddedWordLists,
      });
    }
    case 'RENAME_ADDED_LIST': {
      const { id, name } = action.payload;
      const nextAddedWordLists = state.addedWordLists.map((list) =>
        list.id === id ? { ...list, name } : list
      );
      if (state.selectedAddedListId === id) {
        return { ...state, addedWordLists: nextAddedWordLists, wordListName: name };
      }
      return { ...state, addedWordLists: nextAddedWordLists };
    }
    case 'REMOVE_ADDED_LIST': {
      const removedId = action.payload;
      const nextAddedWordLists = state.addedWordLists.filter((list) => list.id !== removedId);
      const { [`added:${removedId}`]: _removedHighScore, ...nextHighScores } = state.highScores;

      if (state.selectedAddedListId === removedId) {
        return buildListSelectionState(
          { ...state, highScores: nextHighScores },
          { selectedPreset: 'default', selectedAddedListId: null, addedWordLists: nextAddedWordLists }
        );
      }

      return { ...state, addedWordLists: nextAddedWordLists, highScores: nextHighScores };
    }
    case 'START_GAME':
      return buildRoundResetState(state, {
        timeLeft: state.startTime,
        isPlaying: true,
        lastGameWasScoreEligible: action.payload?.isScoreEligible === true,
      });
    case 'GIVE_UP':
      return { ...state, isPlaying: false, gameOver: true };
    case 'SET_TILES': {
      const nextTiles =
        typeof action.payload === 'function'
          ? action.payload(state.tiles)
          : action.payload;
      return { ...state, tiles: nextTiles };
    }
    case 'SET_NEXT_WORD':
      return {
        ...state,
        currentWord: action.payload.word,
        currentAcceptedWords: action.payload.acceptedWords,
        usedWords: mergeUsedWords(state.usedWords, action.payload.acceptedWords),
        tiles: action.payload.tiles,
        isCorrect: false,
        isBonusWord: false,
      };
    case 'NO_MORE_WORDS':
      return {
        ...state,
        isPlaying: false,
        allWordsCompleted: true,
        score: state.score + Math.max(0, state.timeLeft),
        completionTimeBonus: Math.max(0, state.timeLeft),
      };
    case 'CORRECT_WORD':
      return {
        ...state,
        currentWord: action.payload.solvedWord,
        isCorrect: true,
        isBonusWord: false,
        tiles: action.payload.solvedWord
          .split('')
          .map((letter, index) => ({ letter, id: index })),
        wordsFound: state.wordsFound + 1,
        score: state.score + action.payload.solvedWord.length,
        timeLeft: state.timeLeft + state.bonusTime,
      };
    case 'AWARD_ALT_BONUS':
      return {
        ...state,
        isBonusWord: true,
        timeLeft: state.timeLeft + state.alternativeWordBonusTime,
      };
    case 'CLEAR_ALT_BONUS':
      return { ...state, isBonusWord: false };
    case 'TICK':
      return { ...state, timeLeft: state.timeLeft - 1 };
    case 'TIME_UP':
      return { ...state, isPlaying: false, gameOver: true };
    case 'SET_HIGH_SCORE_FOR_LIST': {
      const { listKey, score } = action.payload;
      const previous = state.highScores[listKey] ?? 0;
      if (score <= previous) return state;
      return {
        ...state,
        highScores: { ...state.highScores, [listKey]: score },
        lastGameWasNewRecord: true,
      };
    }
    default:
      return state;
  }
}
