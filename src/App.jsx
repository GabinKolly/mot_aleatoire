import { useEffect, useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import Settings from './components/Settings';
import StartScreen from './components/StartScreen';
import StatsPanel from './components/StatsPanel';
import { parseWordsText, WORD_LISTS } from './constants/wordLists';
import { useClampedInput } from './hooks/useClampedInput';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useGameState } from './hooks/useGameState';

export default function App() {
  const { state, actions } = useGameState();
  const {
    startGame,
    giveUp,
    toggleSettings,
    changePreset,
    changeCustomWordList,
    setStartTime,
    setBonusTime,
    setAlternativeWordBonusTime,
    setMinWordLength,
    setMaxWordLength,
    setTiles,
    checkWord,
  } = actions;
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 400
  );

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

  useEffect(() => {
    const updateWidth = () => setScreenWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const dragAndDrop = useDragAndDrop({
    setTiles,
    onDropComplete: checkWord,
  });

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = loadEvent.target?.result;
      if (typeof text !== 'string') {
        return;
      }

      const parsed = parseWordsText(text).filter((word) => word.length > 0);
      if (parsed.length > 0) {
        changeCustomWordList(parsed, file.name);
      }
    };
    reader.readAsText(file);
  };

  const settingsProps = {
    wordListName: state.wordListName,
    wordsCount: state.words.length,
    selectedPreset: state.selectedPreset,
    wordLists: WORD_LISTS,
    onPresetChange: changePreset,
    onFileUpload: handleFileUpload,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="w-full">
        <div className="bg-white rounded-b-xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-emerald-800">Mot mélangé</h1>
            <button
              onClick={toggleSettings}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <SettingsIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {state.showSettings && <Settings {...settingsProps} />}

          <StatsPanel
            timeLeft={state.timeLeft}
            wordsFound={state.wordsFound}
            score={state.score}
          />

          {!state.isPlaying && !state.gameOver && !state.allWordsCompleted && (
            <StartScreen onStart={startGame} />
          )}

          {!state.isPlaying && state.gameOver && (
            <GameOverScreen
              variant="gameOver"
              currentWord={state.currentWord}
              score={state.score}
              onRestart={startGame}
            />
          )}

          {!state.isPlaying && state.allWordsCompleted && (
            <GameOverScreen
              variant="allWordsCompleted"
              currentWord={state.currentWord}
              score={state.score}
              onRestart={startGame}
            />
          )}

          {state.isPlaying && (
            <GameScreen
              tiles={state.tiles}
              isCorrect={state.isCorrect}
              isBonusWord={state.isBonusWord}
              draggedIndex={dragAndDrop.draggedIndex}
              touchDragPosition={dragAndDrop.touchDragPosition}
              screenWidth={screenWidth}
              onDragStart={dragAndDrop.handleDragStart}
              onDragOver={dragAndDrop.handleDragOver}
              onDragEnd={dragAndDrop.handleDragEnd}
              onTouchStart={dragAndDrop.handleTouchStart}
              onTouchMove={dragAndDrop.handleTouchMove}
              onTouchEnd={dragAndDrop.handleTouchEnd}
              onGiveUp={giveUp}
            />
          )}
        </div>
      </div>
    </div>
  );
}
