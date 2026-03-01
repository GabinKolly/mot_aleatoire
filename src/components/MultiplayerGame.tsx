import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import GameScreen from './GameScreen';
import Lobby from './Lobby';
import MobileFooter from './MobileFooter';
import MultiplayerGameOverScreen from './MultiplayerGameOverScreen';
import MultiplayerStatsPanel from './MultiplayerStatsPanel';
import MultiplayerSummaryChip from './MultiplayerSummaryChip';
import WaitingRoom from './WaitingRoom';
import { bandEndSelector, bandStartSelector } from '../constants/dom';
import { useBandHighlightStyle } from '../hooks/useBandHighlightStyle';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';

interface MultiplayerGameProps {
  onBack: () => void;
}

export default function MultiplayerGame({ onBack }: MultiplayerGameProps) {
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
