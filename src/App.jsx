import { useCallback, useEffect, useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import Lobby from './components/Lobby';
import ModeSelection from './components/ModeSelection';
import MultiplayerGameOverScreen from './components/MultiplayerGameOverScreen';
import MultiplayerStatsPanel from './components/MultiplayerStatsPanel';
import Settings from './components/Settings';
import StartScreen from './components/StartScreen';
import StatsPanel from './components/StatsPanel';
import WaitingRoom from './components/WaitingRoom';
import { parseWordsText } from './constants/wordLists';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useGameState } from './hooks/useGameState';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { useSettingsBindings } from './hooks/useSettingsBindings';

function SoloGame({ onBack }) {
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
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = loadEvent.target?.result;
      if (typeof text !== 'string') return;
      const parsed = parseWordsText(text).filter((word) => word.length > 0);
      if (parsed.length > 0) addAddedWordList(parsed, file.name);
    };
    reader.readAsText(file);
  };

  const settingsProps = useSettingsBindings({
    state,
    actions,
    onFileUpload: handleFileUpload,
  });

  return (
    <>
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
        <StartScreen onStart={startGame} onBack={onBack} />
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
    </>
  );
}

function MultiplayerGame({ onBack }) {
  const { state, actions } = useMultiplayerGame();
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
    setTiles: actions.setTiles,
    onDropComplete: actions.checkWord,
    isInteractionLocked: state.isCorrect,
  });

  const handleBackToMenu = useCallback(() => {
    actions.goBackToLobby();
    onBack();
  }, [actions, onBack]);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-emerald-800">Mot mélangé</h1>
        <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
          2 joueurs
        </span>
      </div>

      {state.phase === 'lobby' && (
        <Lobby
          onCreateRoom={actions.createRoom}
          onJoinRoom={actions.joinRoom}
          onBack={handleBackToMenu}
          error={state.connectionError}
        />
      )}

      {state.phase === 'waiting' && (
        <WaitingRoom state={state} actions={actions} />
      )}

      {state.phase === 'playing' && (
        <>
          <MultiplayerStatsPanel
            gameTimeLeft={state.gameTimeLeft}
            wordTimeLeft={state.wordTimeLeft}
            scores={state.scores}
            wordsFound={state.wordsFound}
            playerNumber={state.playerNumber}
            players={state.players}
          />
          <GameScreen
            tiles={state.tiles}
            isCorrect={state.isCorrect}
            isBonusWord={false}
            revealType={
              state.isCorrect
                ? state.wordSkipped
                  ? 'timeout'
                  : state.lastClaimedBy === state.playerNumber
                    ? 'self'
                    : 'opponent'
                : null
            }
            draggedIndex={dragAndDrop.draggedIndex}
            touchDragPosition={dragAndDrop.touchDragPosition}
            screenWidth={screenWidth}
            onDragStart={dragAndDrop.handleDragStart}
            onDragOver={dragAndDrop.handleDragOver}
            onDragEnd={dragAndDrop.handleDragEnd}
            onTouchStart={dragAndDrop.handleTouchStart}
            onTouchMove={dragAndDrop.handleTouchMove}
            onTouchEnd={dragAndDrop.handleTouchEnd}
            onReshuffle={actions.reshuffleCurrentWord}
            onGiveUp={actions.forfeit}
          />
        </>
      )}

      {state.phase === 'gameOver' && (
        <MultiplayerGameOverScreen
          scores={state.scores}
          wordsFound={state.wordsFound}
          winner={state.winner}
          gameOverReason={state.gameOverReason}
          forfeitedBy={state.forfeitedBy}
          playerNumber={state.playerNumber}
          players={state.players}
          onPlayAgain={actions.playAgain}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </>
  );
}

export default function App() {
  const [mode, setMode] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="w-full">
        <div className="bg-white rounded-b-xl shadow-xl p-6 mb-6 max-md:min-h-[100dvh] max-md:mb-0 max-md:rounded-none max-md:flex max-md:flex-col">
          {mode === null && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-emerald-800">
                  Mot mélangé
                </h1>
              </div>
              <ModeSelection
                onSelectSolo={() => setMode('solo')}
                onSelectMultiplayer={() => setMode('multiplayer')}
              />
            </>
          )}

          {mode === 'solo' && <SoloGame onBack={() => setMode(null)} />}
          {mode === 'multiplayer' && (
            <MultiplayerGame onBack={() => setMode(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
