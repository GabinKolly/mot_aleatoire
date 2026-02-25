import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  RotateCcw,
  Settings as SettingsIcon,
  Users,
} from 'lucide-react';
import GameScreen from './components/GameScreen';
import IconButton from './components/IconButton';
import Lobby from './components/Lobby';
import ModeSelection from './components/ModeSelection';
import MultiplayerGameOverScreen from './components/MultiplayerGameOverScreen';
import MultiplayerStatsPanel from './components/MultiplayerStatsPanel';
import Settings from './components/Settings';
import StartScreen from './components/StartScreen';
import WaitingRoom from './components/WaitingRoom';
import { parseWordsText } from './constants/wordLists';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useGameState } from './hooks/useGameState';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { useSettingsBindings } from './hooks/useSettingsBindings';

const NOOP = () => {};

function formatClock(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remaining}`;
}

function MobileFooter() {
  return (
    <footer className="mm-footer" aria-label="Crédits">
      <span>© 2026</span>
      <span>créé par Gabin Kolly</span>
    </footer>
  );
}

function SoloStatsRow({ timeLeft, wordsFound, score }) {
  return (
    <div className="mm-solo-stats" data-mm-band-start-anchor="solo">
      <div className="mm-stat-card mm-stat-card--green">
        <div className="mm-stat-card__value">{formatClock(timeLeft)}</div>
        <div className="mm-stat-card__label">TEMPS</div>
      </div>
      <div className="mm-stat-card mm-stat-card--yellow">
        <div className="mm-stat-card__value">{wordsFound}</div>
        <div className="mm-stat-card__label">MOTS</div>
      </div>
      <div className="mm-stat-card mm-stat-card--red">
        <div className="mm-stat-card__value">{score}</div>
        <div className="mm-stat-card__label">SCORE</div>
      </div>
    </div>
  );
}

function useBandHighlightStyle(containerRef, startSelector, endSelector, deps = []) {
  const [style, setStyle] = useState(null);
  const lastSignatureRef = useRef('');
  const depsSignature = deps.join('|');

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    let frameId = null;
    let resizeObserver = null;

    const measure = () => {
      const startNode = container.querySelector(startSelector);
      const endNode = container.querySelector(endSelector);

      if (!startNode || !endNode) {
        lastSignatureRef.current = '';
        setStyle(null);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const startRect = startNode.getBoundingClientRect();
      const endRect = endNode.getBoundingClientRect();
      const top = Math.max(
        0,
        Math.round(startRect.top + startRect.height / 2 - containerRect.top)
      );
      const bottom = Math.max(
        top,
        Math.round(endRect.top + endRect.height / 2 - containerRect.top)
      );
      const height = Math.max(0, bottom - top);
      const signature = `${top}:${height}`;

      if (signature === lastSignatureRef.current) {
        return;
      }

      lastSignatureRef.current = signature;
      setStyle({
        top: `${top}px`,
        height: `${height}px`,
      });
    };

    const scheduleMeasure = () => {
      if (typeof window === 'undefined') {
        measure();
        return;
      }

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        measure();
      });
    };

    scheduleMeasure();
    window.addEventListener('resize', scheduleMeasure);

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      resizeObserver.observe(container);
      const startNode = container.querySelector(startSelector);
      const endNode = container.querySelector(endSelector);
      if (startNode) resizeObserver.observe(startNode);
      if (endNode && endNode !== startNode) resizeObserver.observe(endNode);
    }

    return () => {
      window.removeEventListener('resize', scheduleMeasure);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      resizeObserver?.disconnect();
    };
  }, [containerRef, startSelector, endSelector, depsSignature]);

  return style;
}

function MainMenuScreen({ onSelectSolo, onSelectMultiplayer }) {
  return (
    <div className="mm-page-shell">
      <div className="mm-page-shell__content mm-menu-layout">
        <div className="mm-menu-title-wrap">
          <h1 className="mm-title mm-title--menu">
            <span>Mot</span>
            <span>mélangé</span>
          </h1>
        </div>

        <div className="mm-menu-actions-wrap">
          <ModeSelection
            onSelectSolo={onSelectSolo}
            onSelectMultiplayer={onSelectMultiplayer}
          />
        </div>
      </div>
      <MobileFooter />
    </div>
  );
}

function SoloGame({ onBack, onOpenMultiplayer }) {
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
  const soloCoreRef = useRef(null);

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

  const isPreStart = !state.isPlaying && !state.gameOver && !state.allWordsCompleted;
  const hasEnded = !state.isPlaying && (state.gameOver || state.allWordsCompleted);
  const showCoreZone = isPreStart || state.isPlaying || hasEnded;
  const endScreenTiles =
    state.currentWord.length > 0
      ? state.currentWord
          .split('')
          .map((letter, index) => ({ letter, id: `end-${index}` }))
      : state.tiles;
  const bestScoreMessage = state.lastGameWasNewRecord
    ? 'Vous avez battu le meilleur score !'
    : `Le meilleur score est de ${
        Number.isInteger(state.currentListHighScore) ? state.currentListHighScore : '-'
      }`;
  const endStatusLines = state.allWordsCompleted
    ? [
        `Vous avez trouvé tous les mots et obtenu un bonus de ${state.completionTimeBonus}`,
        bestScoreMessage,
      ]
    : [bestScoreMessage];
  const soloBandStyle = useBandHighlightStyle(
    soloCoreRef,
    '[data-mm-band-start-anchor="solo"]',
    '[data-mm-band-end-anchor="solo"]',
    [
      state.isPlaying,
      state.isUsingStandardSettings,
      state.tiles.length,
      screenWidth,
      state.gameOver,
      state.allWordsCompleted,
    ]
  );

  return (
    <div className="mm-page-shell">
      <div className="mm-page-shell__content mm-solo-layout">
        <div className="mm-solo-header">
          <button
            type="button"
            onClick={onBack}
            className="mm-title-button"
            aria-label="Retour au menu principal"
          >
            <span className="mm-title mm-title--solo">
              <span>Mot</span>
              <span>mélangé</span>
            </span>
          </button>

          <div className="mm-solo-header__icons" aria-label="Raccourcis">
            <IconButton
              label="Mode multijoueur"
              variant="mockup"
              onClick={onOpenMultiplayer}
            >
              <Users className="w-6 h-6" />
            </IconButton>
            <IconButton
              label="Ouvrir les paramètres"
              variant="mockup"
              onClick={toggleSettings}
            >
              <SettingsIcon className="w-6 h-6" />
            </IconButton>
          </div>
        </div>

        <div className="mm-summary-chip" aria-label="Résumé des paramètres">
          <span>{`${state.minWordLength} à ${state.maxWordLength} lettres, +${state.bonusTime} sec,`}</span>
          <span>{state.wordListName}</span>
        </div>

        {state.showSettings && (
          <div className="mm-settings-panel-slot">
            <Settings {...settingsProps} />
          </div>
        )}

        {showCoreZone && (
          <section className="mm-band-zone mm-solo-core" ref={soloCoreRef}>
            {soloBandStyle && (
              <div
                className="mm-band-zone__fill"
                aria-hidden="true"
                style={soloBandStyle}
              />
            )}

            <div className="mm-solo-core__stack">
              <div className="mm-solo-giveup-row">
                {hasEnded ? (
                  <div className="mm-solo-status-stack" role="status" aria-live="polite">
                    {endStatusLines.map((line) => (
                      <p key={line} className="mm-solo-status-text">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={giveUp}
                    disabled={!state.isPlaying}
                    aria-hidden={!state.isPlaying}
                    tabIndex={state.isPlaying ? 0 : -1}
                    className={`mm-pill-button mm-pill-button--beige ${
                      state.isPlaying ? '' : 'mm-pill-button--reserved-space'
                    }`.trim()}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Abandonner
                  </button>
                )}
              </div>

              <SoloStatsRow
                timeLeft={state.timeLeft}
                wordsFound={state.wordsFound}
                score={state.score}
              />

              {isPreStart && (
                <StartScreen
                  variant="solo-mockup"
                  onStart={startGame}
                  onBack={onBack}
                  isScoreEligibleForHighScore={state.isUsingStandardSettings}
                />
              )}

              {state.isPlaying && (
                <GameScreen
                  variant="solo-mockup"
                  showGiveUpButton={false}
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

              {hasEnded && (
                <GameScreen
                  variant="solo-mockup"
                  showGiveUpButton={false}
                  primaryActionLabel="Recommencer"
                  primaryActionIcon={null}
                  onPrimaryAction={startGame}
                  primaryActionDisabled={false}
                  tiles={endScreenTiles}
                  isCorrect={true}
                  isBonusWord={false}
                  revealType={state.allWordsCompleted ? null : 'gameOver'}
                  draggedIndex={null}
                  touchDragPosition={null}
                  screenWidth={screenWidth}
                  onDragStart={NOOP}
                  onDragOver={NOOP}
                  onDragEnd={NOOP}
                  onTouchStart={NOOP}
                  onTouchMove={NOOP}
                  onTouchEnd={NOOP}
                  onReshuffle={NOOP}
                  onGiveUp={NOOP}
                />
              )}
            </div>
          </section>
        )}
      </div>
      <MobileFooter />
    </div>
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
          wordHistory={state.wordHistory}
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

  if (mode === 'multiplayer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="w-full">
          <div className="bg-white rounded-b-xl shadow-xl p-6 mb-6 max-md:min-h-[100dvh] max-md:mb-0 max-md:rounded-none max-md:flex max-md:flex-col">
            <MultiplayerGame onBack={() => setMode(null)} />
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'solo') {
    return (
      <SoloGame
        onBack={() => setMode(null)}
        onOpenMultiplayer={() => setMode('multiplayer')}
      />
    );
  }

  return (
    <MainMenuScreen
      onSelectSolo={() => setMode('solo')}
      onSelectMultiplayer={() => setMode('multiplayer')}
    />
  );
}
