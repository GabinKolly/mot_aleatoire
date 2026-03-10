import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { RotateCcw, Settings as SettingsIcon, Users } from 'lucide-react';
import AppTitle from './AppTitle';
import GameScreen from './GameScreen';
import type { DragHandlers } from './GameScreen';
import IconButton from './IconButton';
import MobileFooter from './MobileFooter';
import Settings from './Settings';
import SoloStatsRow from './SoloStatsRow';
import StartScreen from './StartScreen';
import { bandEndSelector, bandStartSelector } from '../constants/dom';
import { parseWordsText } from '../constants/wordLists';
import { useBandHighlightStyle } from '../hooks/useBandHighlightStyle';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useGameState } from '../hooks/useGameState';
import { useSettingsBindings } from '../hooks/useSettingsBindings';

const NOOP = (): void => {};

const NOOP_DRAG_HANDLERS: DragHandlers = {
  draggedIndex: null,
  touchDragPosition: null,
  onMouseDown: NOOP,
  onTouchStart: NOOP,
  onTouchMove: NOOP,
  onTouchEnd: NOOP,
};

interface SoloGameProps {
  onBack: () => void;
  onOpenMultiplayer: () => void;
}

export default function SoloGame({ onBack, onOpenMultiplayer }: SoloGameProps) {
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
      ? 'Vous avez battu le meilleur score !'
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
            <AppTitle variant="solo" />
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
                    onMouseDown: dragAndDrop.handleMouseDown,
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
