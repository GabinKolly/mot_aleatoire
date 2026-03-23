export interface Tile {
  letter: string;
  id: number | string;
}

export interface AddedWordList {
  id: string;
  name: string;
  words: string[];
}

export type AnswerValidationMode = 'loose' | 'strict';

export interface GameSettings {
  startTime: number;
  bonusTime: number;
  alternativeWordBonusTime: number;
  minWordLength: number;
  maxWordLength: number;
  answerValidationMode: AnswerValidationMode;
}

export interface GameState extends GameSettings {
  allWords: string[];
  bonusCheckWords: string[];
  currentWord: string;
  currentAcceptedWords: string[];
  tiles: Tile[];
  usedWords: string[];
  isCorrect: boolean;
  isBonusWord: boolean;
  timeLeft: number;
  score: number;
  wordsFound: number;
  completionTimeBonus: number;
  lastGameWasNewRecord: boolean;
  lastGameWasScoreEligible: boolean;
  isPlaying: boolean;
  gameOver: boolean;
  allWordsCompleted: boolean;
  showSettings: boolean;
  wordListName: string;
  selectedPreset: string;
  selectedAddedListId: string | null;
  addedWordLists: AddedWordList[];
  highScores: Record<string, number>;
}

export type GameAction =
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'SET_START_TIME'; payload: number }
  | { type: 'SET_BONUS_TIME'; payload: number }
  | { type: 'SET_ALT_BONUS_TIME'; payload: number }
  | { type: 'SET_ANSWER_VALIDATION_MODE'; payload: AnswerValidationMode }
  | { type: 'CLEAR_HIGH_SCORE_FOR_CURRENT_LIST' }
  | { type: 'RESET_SETTINGS_TO_STANDARD' }
  | { type: 'SET_MIN_WORD_LENGTH'; payload: number }
  | { type: 'SET_MAX_WORD_LENGTH'; payload: number }
  | { type: 'CHANGE_PRESET'; payload: string }
  | { type: 'SELECT_ADDED_LIST'; payload: string }
  | { type: 'ADD_ADDED_LIST'; payload: AddedWordList }
  | { type: 'RENAME_ADDED_LIST'; payload: { id: string; name: string } }
  | { type: 'REMOVE_ADDED_LIST'; payload: string }
  | { type: 'START_GAME'; payload?: { isScoreEligible: boolean } }
  | { type: 'GIVE_UP' }
  | { type: 'SET_TILES'; payload: Tile[] | ((tiles: Tile[]) => Tile[]) }
  | { type: 'SET_NEXT_WORD'; payload: { word: string; acceptedWords: string[]; tiles: Tile[] } }
  | { type: 'NO_MORE_WORDS' }
  | { type: 'CORRECT_WORD'; payload: { solvedWord: string } }
  | { type: 'AWARD_ALT_BONUS' }
  | { type: 'CLEAR_ALT_BONUS' }
  | { type: 'TICK' }
  | { type: 'TIME_UP' }
  | { type: 'SET_HIGH_SCORE_FOR_LIST'; payload: { listKey: string; score: number } };
