import { useEffect, useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import Settings from './components/Settings';
import StartScreen from './components/StartScreen';
import StatsPanel from './components/StatsPanel';
import { parseWordsText } from './constants/wordLists';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useGameState } from './hooks/useGameState';
import { useSettingsBindings } from './hooks/useSettingsBindings';

export default function App() {
  const { state, actions } = useGameState();
  const {
    startGame,
    giveUp,
    toggleSettings,
    addAddedWordList,
    setTiles,
    reshuffleCurrentWord,
    checkWord,
  } = actions;
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 400
  );

  useEffect(() => {
    const updateWidth = () => setScreenWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const dragAndDrop = useDragAndDrop({
    setTiles,
    onDropComplete: checkWord,
    isInteractionLocked: state.isCorrect,
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
        addAddedWordList(parsed, file.name);
      }
    };
    reader.readAsText(file);
  };

  const settingsProps = useSettingsBindings({
    state,
    actions,
    onFileUpload: handleFileUpload,
  });

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
              <SettingsIcon className="w-6 h-6 text-white" />
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
              onReshuffle={reshuffleCurrentWord}
              onGiveUp={giveUp}
            />
          )}
        </div>
      </div>
    </div>
  );
}
