import { useEffect } from 'react';
import { WORD_LISTS } from '../constants/wordLists';
import { useClampedInput } from './useClampedInput';

export function useSettingsBindings({ state, actions, onFileUpload }) {
  const {
    changePreset,
    setStartTime,
    setBonusTime,
    setAlternativeWordBonusTime,
    setMinWordLength,
    setMaxWordLength,
  } = actions;

  const startTimeInput = useClampedInput({
    initialValue: state.startTime,
    min: 30,
    max: 300,
    parse: (value) => Number.parseInt(value, 10),
  });
  const bonusTimeInput = useClampedInput({
    initialValue: state.bonusTime,
    min: 5,
    max: 60,
    parse: (value) => Number.parseInt(value, 10),
  });
  const alternativeWordBonusTimeInput = useClampedInput({
    initialValue: state.alternativeWordBonusTime,
    min: 0,
    max: 30,
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

  return {
    wordListName: state.wordListName,
    wordsCount: state.words.length,
    selectedPreset: state.selectedPreset,
    wordLists: WORD_LISTS,
    onPresetChange: changePreset,
    onFileUpload,
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
