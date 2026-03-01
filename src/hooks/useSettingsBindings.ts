import { useCallback, useEffect, useMemo } from 'react';
import type { ChangeEventHandler } from 'react';
import { WORD_LISTS } from '../constants/wordLists';
import { useClampedInput } from './useClampedInput';
import type { GameActions, GameStateView } from './useGameState';

interface UseSettingsBindingsArgs {
  state: GameStateView;
  actions: GameActions;
  onFileUpload: ChangeEventHandler<HTMLInputElement>;
}

export function useSettingsBindings({
  state,
  actions,
  onFileUpload,
}: UseSettingsBindingsArgs) {
  const {
    changePreset,
    selectAddedWordList,
    renameAddedWordList,
    removeAddedWordList,
    setStartTime,
    setBonusTime,
    setAlternativeWordBonusTime,
    resetSettingsToStandardForCurrentList,
    clearHighScoreForCurrentList,
    setMinWordLength,
    setMaxWordLength,
  } = actions;

  const startTimeInput = useClampedInput({
    initialValue: state.startTime,
    min: 1,
    max: 9999,
    parse: (value) => Number.parseInt(value, 10),
  });
  const bonusTimeInput = useClampedInput({
    initialValue: state.bonusTime,
    min: 0,
    max: 9999,
    parse: (value) => Number.parseInt(value, 10),
  });
  const alternativeWordBonusTimeInput = useClampedInput({
    initialValue: state.alternativeWordBonusTime,
    min: 0,
    max: 9999,
    parse: (value) => Number.parseInt(value, 10),
  });
  const minWordLengthInput = useClampedInput({
    initialValue: state.minWordLength,
    min: 2,
    max: 100,
    parse: (value) => Number.parseInt(value, 10),
  });
  const maxWordLengthInput = useClampedInput({
    initialValue: state.maxWordLength,
    min: state.minWordLength,
    max: 100,
    parse: (value) => Number.parseInt(value, 10),
  });
  const setStartTimeInputValue = startTimeInput.setInputValue;
  const setBonusTimeInputValue = bonusTimeInput.setInputValue;
  const setAlternativeWordBonusTimeInputValue =
    alternativeWordBonusTimeInput.setInputValue;
  const setMinWordLengthInputValue = minWordLengthInput.setInputValue;
  const setMaxWordLengthInputValue = maxWordLengthInput.setInputValue;

  useEffect(() => {
    setStartTimeInputValue(String(state.startTime));
  }, [state.startTime, setStartTimeInputValue]);

  useEffect(() => {
    setBonusTimeInputValue(String(state.bonusTime));
  }, [state.bonusTime, setBonusTimeInputValue]);

  useEffect(() => {
    setAlternativeWordBonusTimeInputValue(String(state.alternativeWordBonusTime));
  }, [state.alternativeWordBonusTime, setAlternativeWordBonusTimeInputValue]);

  useEffect(() => {
    setMinWordLengthInputValue(String(state.minWordLength));
  }, [state.minWordLength, setMinWordLengthInputValue]);

  useEffect(() => {
    setMaxWordLengthInputValue(String(state.maxWordLength));
  }, [state.maxWordLength, state.minWordLength, setMaxWordLengthInputValue]);

  useEffect(() => {
    setStartTime(startTimeInput.committedValue);
  }, [setStartTime, startTimeInput.committedValue]);

  useEffect(() => {
    setBonusTime(bonusTimeInput.committedValue);
  }, [setBonusTime, bonusTimeInput.committedValue]);

  useEffect(() => {
    setAlternativeWordBonusTime(alternativeWordBonusTimeInput.committedValue);
  }, [setAlternativeWordBonusTime, alternativeWordBonusTimeInput.committedValue]);

  useEffect(() => {
    setMinWordLength(minWordLengthInput.committedValue);
  }, [setMinWordLength, minWordLengthInput.committedValue]);

  useEffect(() => {
    setMaxWordLength(maxWordLengthInput.committedValue);
  }, [setMaxWordLength, maxWordLengthInput.committedValue]);

  const highScoresByPreset = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(WORD_LISTS).map((presetKey) => [
          presetKey,
          state.highScores[`preset:${presetKey}`] ?? null,
        ])
      ),
    [state.highScores]
  );

  const highScoresByAddedListId = useMemo(
    () =>
      Object.fromEntries(
        state.addedWordLists.map((list) => [
          list.id,
          state.highScores[`added:${list.id}`] ?? null,
        ])
      ),
    [state.addedWordLists, state.highScores]
  );

  const handleResetToStandardForCurrentList = useCallback(() => {
    const standardSettings = state.currentListStandardSettings;
    if (!standardSettings) {
      return;
    }

    setStartTimeInputValue(String(standardSettings.startTime));
    setBonusTimeInputValue(String(standardSettings.bonusTime));
    setAlternativeWordBonusTimeInputValue(
      String(standardSettings.alternativeWordBonusTime)
    );
    setMinWordLengthInputValue(String(standardSettings.minWordLength));
    setMaxWordLengthInputValue(String(standardSettings.maxWordLength));

    resetSettingsToStandardForCurrentList();
  }, [
    state.currentListStandardSettings,
    setStartTimeInputValue,
    setBonusTimeInputValue,
    setAlternativeWordBonusTimeInputValue,
    setMinWordLengthInputValue,
    setMaxWordLengthInputValue,
    resetSettingsToStandardForCurrentList,
  ]);

  return {
    wordListName: state.wordListName,
    wordsCount: state.words.length,
    selectedPreset: state.selectedPreset,
    selectedAddedListId: state.selectedAddedListId,
    addedWordLists: state.addedWordLists,
    wordLists: WORD_LISTS,
    highScoresByPreset,
    highScoresByAddedListId,
    currentListHighScore: state.currentListHighScore,
    isUsingStandardSettings: state.isUsingStandardSettings,
    onPresetChange: changePreset,
    onSelectAddedList: selectAddedWordList,
    onRenameAddedList: renameAddedWordList,
    onRemoveAddedList: removeAddedWordList,
    onFileUpload,
    onResetToStandardForCurrentList: handleResetToStandardForCurrentList,
    onClearCurrentListHighScore: clearHighScoreForCurrentList,
    startTimeInput: startTimeInput.inputValue,
    onStartTimeChange: startTimeInput.onChange,
    onStartTimeBlur: startTimeInput.onBlur,
    bonusTimeInput: bonusTimeInput.inputValue,
    onBonusTimeChange: bonusTimeInput.onChange,
    onBonusTimeBlur: bonusTimeInput.onBlur,
    alternativeWordBonusTimeInput: alternativeWordBonusTimeInput.inputValue,
    onAlternativeWordBonusTimeChange: alternativeWordBonusTimeInput.onChange,
    onAlternativeWordBonusTimeBlur: alternativeWordBonusTimeInput.onBlur,
    minWordLength: state.minWordLength,
    minWordLengthInput: minWordLengthInput.inputValue,
    onMinWordLengthChange: minWordLengthInput.onChange,
    onMinWordLengthBlur: () => {
      minWordLengthInput.onBlur();
      maxWordLengthInput.setInputValue(String(state.maxWordLength));
    },
    maxWordLengthInput: maxWordLengthInput.inputValue,
    onMaxWordLengthChange: maxWordLengthInput.onChange,
    onMaxWordLengthBlur: maxWordLengthInput.onBlur,
  };
}

export type SettingsBindings = ReturnType<typeof useSettingsBindings>;
