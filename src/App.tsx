import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  RotateCcw,
  Settings as SettingsIcon,
  Users,
} from 'lucide-react';
import GameScreen from './components/GameScreen';
import type { DragHandlers } from './components/GameScreen';
import IconButton from './components/IconButton';
import Lobby from './components/Lobby';
import ModeSelection from './components/ModeSelection';
import MultiplayerGameOverScreen from './components/MultiplayerGameOverScreen';
import MultiplayerStatsPanel from './components/MultiplayerStatsPanel';
import Settings from './components/Settings';
import StartScreen from './components/StartScreen';
import WaitingRoom from './components/WaitingRoom';
import { WORD_LISTS, parseWordsText } from './constants/wordLists';
import { bandStartSelector, bandEndSelector } from './constants/dom';
import { useBandHighlightStyle } from './hooks/useBandHighlightStyle';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useGameState } from './hooks/useGameState';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { useSettingsBindings } from './hooks/useSettingsBindings';
import type { MultiplayerConfig } from './types/multiplayer';
import { getStatValueSizingStyle } from './utils/statValueSizing';
import { formatClock } from './utils/time';
import { countWordsMatchingLength } from './utils/wordPicking';

const NOOP = (): void => {};

const NOOP_DRAG_HANDLERS: DragHandlers = {
  draggedIndex: null,
  touchDragPosition: null,
  onDragStart: NOOP,
  onDragOver: NOOP,
  onDragEnd: NOOP,
  onTouchStart: NOOP,
  onTouchMove: NOOP,
  onTouchEnd: NOOP,
};

function MobileFooter() {
  return (
    <footer className="mm-footer" aria-label="Crédits">
      <span>© 2026</span>
      <span className="mm-footer__credit">
        créé par Gabin Kolly
        <br />
        visuel par Magali
      </span>
    </footer>
  );
}

interface SoloStatsRowProps {
  timeLeft: number;
  wordsFound: number;
  score: number;
}

function SoloStatsRow({ timeLeft, wordsFound, score }: SoloStatsRowProps) {
  const timeText = formatClock(timeLeft);
  const wordsFoundText = `${wordsFound}`;
  const scoreText = `${score}`;

  return (
    <div className="mm-solo-stats" data-mm-band-start-anchor="solo">
      <div className="mm-stat-card mm-stat-card--green">
        <div className="mm-stat-card__value" style={getStatValueSizingStyle(timeText)}>
          {timeText}
        </div>
        <div className="mm-stat-card__label">TEMPS</div>
      </div>
      <div className="mm-stat-card mm-stat-card--yellow">
        <div className="mm-stat-card__value" style={getStatValueSizingStyle(wordsFoundText)}>
          {wordsFoundText}
        </div>
        <div className="mm-stat-card__label">MOTS</div>
      </div>
      <div className="mm-stat-card mm-stat-card--red">
        <div className="mm-stat-card__value" style={getStatValueSizingStyle(scoreText)}>
          {scoreText}
        </div>
        <div className="mm-stat-card__label">SCORE</div>
      </div>
    </div>
  );
}

interface MultiplayerSummaryChipProps {
  config: MultiplayerConfig;
  wordListKey: string;
}

function MultiplayerSummaryChip({
  config,
  wordListKey,
}: MultiplayerSummaryChipProps) {
  const activeWordListKey = config.wordListKey || wordListKey || 'default';
  const activeWordList = WORD_LISTS[activeWordListKey] || WORD_LISTS.default;
  const wordListName = activeWordList.name || activeWordListKey;
  const minWordLength = Number.isInteger(config.minWordLength) ? config.minWordLength : 2;
  const maxWordLength = Number.isInteger(config.maxWordLength)
    ? Math.max(config.maxWordLength, minWordLength)
    : minWordLength;
  const wordCount = countWordsMatchingLength(
    activeWordList.words,
    minWordLength,
    maxWordLength
  );

  return (
    <div className="mm-summary-chip" aria-label="Résumé de la partie multijoueur">
      <span>{`${config.gameTime} s, ${config.wordTime} s par mot`}</span>
      <span>{`${config.minWordLength} à ${config.maxWordLength} lettres`}</span>
      <span>{`${wordListName} • ${wordCount} mots`}</span>
    </div>
  );
}


interface MainMenuScreenProps {
  onSelectSolo: () => void;
  onSelectMultiplayer: () => void;
}

function MainMenuScreen({
  onSelectSolo,
  onSelectMultiplayer,
}: MainMenuScreenProps) {
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

interface SoloGameProps {
  onBack: () => void;
  onOpenMultiplayer: () => void;
}

function SoloGame({ onBack, onOpenMultiplayer }: SoloGameProps) {
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
  const soloCoreRef = useRef<HTMLElement | null>(null);

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

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent: ProgressEvent<FileReader>) => {
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
  const shouldShowBestScoreMessage = state.lastGameWasScoreEligible;
  const bestScoreMessage = shouldShowBestScoreMessage
    ? state.lastGameWasNewRecord
      ? 'Vous avez battu le meilleur score !'
      : `Le meilleur score est de ${
          Number.isInteger(state.currentListHighScore) ? state.currentListHighScore : '-'
        }.`
    : null;
  const endStatusLines = [
    ...(state.allWordsCompleted
      ? [`Vous avez trouvé tous les mots et obtenu un bonus de ${state.completionTimeBonus}.`]
      : []),
    ...(bestScoreMessage ? [bestScoreMessage] : []),
  ];
  const soloBandStyle = useBandHighlightStyle(
    soloCoreRef,
    bandStartSelector('solo'),
    bandEndSelector('solo'),
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
          <span>{`${state.minWordLength} à ${state.maxWordLength} lettres, +${state.bonusTime} sec`}</span>
          <span>{`${state.wordListName} • ${state.words.length} mots`}</span>
        </div>

        {state.showSettings && (
          <div className="mm-settings-panel-slot">
            <Settings {...settingsProps} onClose={toggleSettings} />
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
                  onStart={startGame}
                  isScoreEligibleForHighScore={state.isUsingStandardSettings}
                />
              )}

              {state.isPlaying && (
                <GameScreen
                  showGiveUpButton={false}
                  tiles={state.tiles}
                  isCorrect={state.isCorrect}
                  isBonusWord={state.isBonusWord}
                  dragHandlers={{
                    draggedIndex: dragAndDrop.draggedIndex,
                    touchDragPosition: dragAndDrop.touchDragPosition,
                    onDragStart: dragAndDrop.handleDragStart,
                    onDragOver: dragAndDrop.handleDragOver,
                    onDragEnd: dragAndDrop.handleDragEnd,
                    onTouchStart: dragAndDrop.handleTouchStart,
                    onTouchMove: dragAndDrop.handleTouchMove,
                    onTouchEnd: dragAndDrop.handleTouchEnd,
                  }}
                  screenWidth={screenWidth}
                  onReshuffle={reshuffleCurrentWord}
                  onGiveUp={giveUp}
                />
              )}

              {hasEnded && (
                <GameScreen
                  showGiveUpButton={false}
                  primaryActionLabel="Recommencer"
                  primaryActionIcon={null}
                  onPrimaryAction={startGame}
                  primaryActionDisabled={false}
                  tiles={endScreenTiles}
                  isCorrect={true}
                  isBonusWord={false}
                  revealType={state.allWordsCompleted ? null : 'gameOver'}
                  dragHandlers={NOOP_DRAG_HANDLERS}
                  screenWidth={screenWidth}
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

interface MultiplayerGameProps {
  onBack: () => void;
}

function MultiplayerGame({ onBack }: MultiplayerGameProps) {
  const { state, actions } = useMultiplayerGame();
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 400
  );
  const waitingZoneRef = useRef<HTMLElement | null>(null);
  const playingZoneRef = useRef<HTMLElement | null>(null);
  const resultsZoneRef = useRef<HTMLElement | null>(null);

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

  const waitingBandStyle = useBandHighlightStyle(
    waitingZoneRef,
    bandStartSelector('mp-waiting'),
    bandEndSelector('mp-waiting'),
    [state.phase, state.players.length, state.isHost]
  );
  const playingBandStyle = useBandHighlightStyle(
    playingZoneRef,
    bandStartSelector('mp'),
    bandEndSelector('mp'),
    [state.phase, state.tiles.length, state.gameTimeLeft, state.wordTimeLeft, screenWidth]
  );
  const resultsBandStyle = useBandHighlightStyle(
    resultsZoneRef,
    bandStartSelector('mp-results'),
    bandEndSelector('mp-results'),
    [state.phase, state.players.length, state.wordHistory.length]
  );

  const isPlayingPhase = state.phase === 'playing';

  return (
    <div className="mm-page-shell">
      <div className="mm-page-shell__content mm-solo-layout">
        <div className="mm-mp-header">
          <button
            type="button"
            onClick={handleBackToMenu}
            className="mm-title-button"
            aria-label="Retour au menu principal"
          >
            <span className="mm-title mm-title--solo">
              <span>Mot</span>
              <span>mélangé</span>
            </span>
          </button>
        </div>

        {isPlayingPhase && (
          <MultiplayerSummaryChip config={state.config} wordListKey={state.wordListKey} />
        )}

        {state.phase === 'lobby' && (
          <div className="mm-mp-phase-wrap">
            <Lobby
              onCreateRoom={actions.createRoom}
              onJoinRoom={actions.joinRoom}
              error={state.connectionError}
            />
          </div>
        )}

        {state.phase === 'waiting' && (
          <section className="mm-band-zone mm-mp-waiting-zone" ref={waitingZoneRef}>
            {waitingBandStyle && (
              <div
                className="mm-band-zone__fill"
                aria-hidden="true"
                style={waitingBandStyle}
              />
            )}
            <div className="mm-mp-waiting-zone__content">
              <WaitingRoom state={state} actions={actions} />
            </div>
          </section>
        )}

        {state.phase === 'playing' && (
          <section className="mm-band-zone mm-solo-core mm-mp-core" ref={playingZoneRef}>
            {playingBandStyle && (
              <div
                className="mm-band-zone__fill"
                aria-hidden="true"
                style={playingBandStyle}
              />
            )}
            <div className="mm-solo-core__stack">
              <div className="mm-solo-giveup-row">
                <button
                  type="button"
                  onClick={actions.forfeit}
                  className="mm-pill-button mm-pill-button--beige"
                >
                  <RotateCcw className="w-4 h-4" />
                  Abandonner
                </button>
              </div>

              <MultiplayerStatsPanel
                gameTimeLeft={state.gameTimeLeft}
                wordTimeLeft={state.wordTimeLeft}
                scores={state.scores}
                playerNumber={state.playerNumber}
                players={state.players}
              />

              <GameScreen
                showGiveUpButton={false}
                bandEndAnchorKey="mp"
                tiles={state.tiles}
                isCorrect={state.isCorrect}
                isBonusWord={state.isBonusWord}
                revealType={
                  state.isCorrect
                    ? state.wordSkipped
                      ? 'timeout'
                      : state.lastClaimedBy === state.playerNumber
                        ? 'correct'
                        : 'opponent'
                    : null
                }
                dragHandlers={{
                  draggedIndex: dragAndDrop.draggedIndex,
                  touchDragPosition: dragAndDrop.touchDragPosition,
                  onDragStart: dragAndDrop.handleDragStart,
                  onDragOver: dragAndDrop.handleDragOver,
                  onDragEnd: dragAndDrop.handleDragEnd,
                  onTouchStart: dragAndDrop.handleTouchStart,
                  onTouchMove: dragAndDrop.handleTouchMove,
                  onTouchEnd: dragAndDrop.handleTouchEnd,
                }}
                screenWidth={screenWidth}
                onReshuffle={actions.reshuffleCurrentWord}
                onGiveUp={actions.forfeit}
              />
            </div>
          </section>
        )}

        {state.phase === 'gameOver' && (
          <section className="mm-band-zone mm-mp-phase-wrap mm-mp-results-wrap" ref={resultsZoneRef}>
            {resultsBandStyle && (
              <div
                className="mm-band-zone__fill"
                aria-hidden="true"
                style={resultsBandStyle}
              />
            )}
            <div className="mm-mp-results-wrap__content">
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
              />
            </div>
          </section>
        )}
      </div>
      <MobileFooter />
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState<'solo' | 'multiplayer' | null>(null);

  if (mode === 'multiplayer') {
    return <MultiplayerGame onBack={() => setMode(null)} />;
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
