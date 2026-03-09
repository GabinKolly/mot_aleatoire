import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';
import GameScreen from './GameScreen';
import type { DragHandlers } from './GameScreen';
import LeaderboardTable from './LeaderboardTable';
import MobileFooter from './MobileFooter';
import SoloStatsRow from './SoloStatsRow';
import { bandEndSelector, bandStartSelector } from '../constants/dom';
import { COMPETITION_TIERS } from '../constants/competitionConfig';
import { useBandHighlightStyle } from '../hooks/useBandHighlightStyle';
import { useCompetitionState } from '../hooks/useCompetitionState';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useLeaderboard } from '../hooks/useLeaderboard';
import {
  getOrCreatePlayerId,
  getSavedPlayerName,
  savePlayerName,
} from '../utils/playerIdentity';

const NOOP = (): void => {};

const NOOP_DRAG_HANDLERS: DragHandlers = {
  draggedIndex: null,
  touchDragPosition: null,
  onMouseDown: NOOP,
  onTouchStart: NOOP,
  onTouchMove: NOOP,
  onTouchEnd: NOOP,
};

const MAX_TIER_INDEX = COMPETITION_TIERS.length - 1;

interface CompetitionGameProps {
  onBack: () => void;
}

export default function CompetitionGame({ onBack }: CompetitionGameProps) {
  const { state, actions, wordsFoundText } = useCompetitionState();
  const { startGame, giveUp, setTiles, reshuffleCurrentWord, checkWord } = actions;

  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 400
  );
  const soloCoreRef = useRef<HTMLElement | null>(null);

  // Player identity
  const playerId = useMemo(() => getOrCreatePlayerId(), []);
  const [playerName, setPlayerName] = useState(() => getSavedPlayerName());

  // Leaderboard
  const {
    entries: leaderboardEntries,
    isLoading: leaderboardLoading,
    fetchError: leaderboardError,
    submitStatus,
    playerRank,
    submit: submitScore,
    getPersonalBestScore,
    resetSubmitStatus,
  } = useLeaderboard();
  const hasEvaluatedEndRef = useRef(false);
  const [isCheckingPersonalBest, setIsCheckingPersonalBest] = useState(false);
  const [requiresPostGameName, setRequiresPostGameName] = useState(false);
  const [personalBestCheckFailed, setPersonalBestCheckFailed] = useState(false);
  const [personalBestScoreAtEnd, setPersonalBestScoreAtEnd] = useState<number | null>(null);

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

  const isPreStart = !state.isPlaying && !state.gameOver && !state.allWordsCompleted;
  const hasEnded = !state.isPlaying && (state.gameOver || state.allWordsCompleted);
  const showCoreZone = isPreStart || state.isPlaying || hasEnded;
  const showTierTransition =
    state.isPlaying && !state.isCorrect && state.tierTransitionBonus !== null;

  const endScreenTiles =
    state.currentWord.length > 0
      ? state.currentWord
          .split('')
          .map((letter, index) => ({ letter, id: `end-${index}` }))
      : state.tiles;

  const finalScoreLine = `Score final : ${state.score}`;
  const showPostGameNamePrompt = requiresPostGameName && submitStatus !== 'submitted';
  const showPostGameStatus =
    state.allWordsCompleted ||
    isCheckingPersonalBest ||
    (requiresPostGameName && submitStatus === 'idle') ||
    submitStatus === 'submitting' ||
    submitStatus === 'error' ||
    personalBestCheckFailed ||
    (submitStatus === 'submitted' && playerRank != null) ||
    (!isCheckingPersonalBest &&
      !personalBestCheckFailed &&
      !requiresPostGameName &&
      submitStatus === 'idle' &&
      personalBestScoreAtEnd != null &&
      state.score <= personalBestScoreAtEnd);

  // Evaluate whether this run beats the player's stored global personal best.
  useEffect(() => {
    if (!hasEnded) {
      hasEvaluatedEndRef.current = false;
      return;
    }
    if (hasEvaluatedEndRef.current) return;
    if (state.score === 0 && state.wordsFound === 0) return;
    hasEvaluatedEndRef.current = true;

    let cancelled = false;

    void (async () => {
      setIsCheckingPersonalBest(true);
      setPersonalBestCheckFailed(false);
      try {
        const personalBestScore = await getPersonalBestScore(playerId);
        if (cancelled) return;
        setPersonalBestScoreAtEnd(personalBestScore);
        const brokePersonalBest =
          personalBestScore === null ? state.score > 0 : state.score > personalBestScore;
        setRequiresPostGameName(brokePersonalBest);
      } catch {
        if (cancelled) return;
        setPersonalBestScoreAtEnd(null);
        setRequiresPostGameName(false);
        setPersonalBestCheckFailed(true);
      } finally {
        if (!cancelled) {
          setIsCheckingPersonalBest(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    hasEnded,
    state.score,
    state.wordsFound,
    playerId,
    getPersonalBestScore,
  ]);

  const handleStartGame = useCallback(() => {
    resetSubmitStatus();
    setRequiresPostGameName(false);
    setIsCheckingPersonalBest(false);
    setPersonalBestCheckFailed(false);
    setPersonalBestScoreAtEnd(null);
    startGame();
  }, [resetSubmitStatus, startGame]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const name = e.target.value.slice(0, 20);
      setPlayerName(name);
    },
    []
  );

  const handleSubmitScore = useCallback(() => {
    if (!hasEnded || !requiresPostGameName) return;
    const trimmedName = playerName.trim().slice(0, 20);
    if (!trimmedName) return;

    savePlayerName(trimmedName);
    setPlayerName(trimmedName);

    submitScore({
      playerId,
      playerName: trimmedName,
      score: state.score,
      wordsFound: state.wordsFound,
      tierReached: Math.min(state.tierIndex, MAX_TIER_INDEX),
      allWordsCompleted: state.allWordsCompleted,
    });
  }, [
    hasEnded,
    requiresPostGameName,
    playerName,
    submitScore,
    playerId,
    state.score,
    state.wordsFound,
    state.tierIndex,
    state.allWordsCompleted,
  ]);

  const soloBandStyle = useBandHighlightStyle(
    soloCoreRef,
    bandStartSelector('solo'),
    bandEndSelector('solo'),
    [
      state.isPlaying,
      state.tiles.length,
      screenWidth,
      state.gameOver,
      state.allWordsCompleted,
      state.tierTransitionBonus,
    ]
  );

  const showLeaderboard = isPreStart || hasEnded;

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
        </div>

        <div className="mm-summary-chip" aria-label="Mode de jeu">
          <span>MODE COMPÉTITION</span>
        </div>

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
                    <p className="mm-solo-status-text">{finalScoreLine}</p>
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
                wordsFoundText={wordsFoundText}
              />

              {isPreStart && (
                <div className="mm-solo-start">
                  <div className="mm-solo-middle-slot" />
                  <div className="mm-solo-start__cta">
                    <button
                      type="button"
                      onClick={handleStartGame}
                      className="mm-pill-button mm-pill-button--beige mm-pill-button--title"
                      data-mm-band-end-anchor="solo"
                    >
                      Commencer
                    </button>
                  </div>
                </div>
              )}

              {state.isPlaying && showTierTransition && (
                <div className="mm-solo-game">
                  <div className="mm-solo-middle-slot mm-solo-middle-slot--transition">
                    <div className="mm-tier-transition" role="status" aria-live="polite">
                      <p className="mm-tier-transition__badge">{`NIVEAU ${state.tierIndex + 1}`}</p>
                    </div>
                  </div>
                  <div className="mm-solo-game__actions">
                    <button
                      type="button"
                      disabled
                      className="mm-pill-button mm-pill-button--beige mm-pill-button--title"
                      data-mm-band-end-anchor="solo"
                    >
                      <Shuffle className="w-5 h-5" />
                      Mélanger
                    </button>
                  </div>
                </div>
              )}

              {state.isPlaying && !showTierTransition && (
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
                  onPrimaryAction={handleStartGame}
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

              {hasEnded && (showPostGameStatus || showPostGameNamePrompt) && (
                <section className="mm-competition-postgame">
                  {showPostGameStatus && (
                    <div className="mm-solo-status-stack" role="status" aria-live="polite">
                      {state.allWordsCompleted && (
                        <p className="mm-solo-status-text">
                          Vous avez trouvé tous les mots disponibles !
                        </p>
                      )}
                      {isCheckingPersonalBest && (
                        <p className="mm-solo-status-text">
                          Vérification du meilleur score global…
                        </p>
                      )}
                      {requiresPostGameName && submitStatus === 'idle' && (
                        <p className="mm-solo-status-text">
                          Nouveau meilleur score ! Confirmez votre nom pour le classement.
                        </p>
                      )}
                      {submitStatus === 'submitting' && (
                        <p className="mm-solo-status-text">Envoi du score…</p>
                      )}
                      {submitStatus === 'error' && (
                        <p className="mm-solo-status-text">
                          Impossible d&apos;enregistrer ce score pour le moment.
                        </p>
                      )}
                      {personalBestCheckFailed && (
                        <p className="mm-solo-status-text">
                          Impossible de vérifier votre meilleur score global.
                        </p>
                      )}
                      {submitStatus === 'submitted' &&
                        playerRank != null && (
                          <p className="mm-solo-status-text">
                            {`Vous êtes #${playerRank} au classement !`}
                          </p>
                        )}
                      {!isCheckingPersonalBest &&
                        !personalBestCheckFailed &&
                        !requiresPostGameName &&
                        submitStatus === 'idle' &&
                        personalBestScoreAtEnd != null &&
                        state.score <= personalBestScoreAtEnd && (
                          <p className="mm-solo-status-text">
                            {`Vous n'avez pas battu votre meilleur score de ${personalBestScoreAtEnd}.`}
                          </p>
                        )}
                    </div>
                  )}

                  {showPostGameNamePrompt && (
                    <div className="mm-name-prompt">
                      <label htmlFor="competition-name" className="mm-name-prompt__label">
                        Votre nom pour le classement
                      </label>
                      <input
                        id="competition-name"
                        type="text"
                        value={playerName}
                        onChange={handleNameChange}
                        placeholder="Entrez votre nom…"
                        maxLength={20}
                        className="mm-name-prompt__input"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={handleSubmitScore}
                        disabled={submitStatus === 'submitting' || !playerName.trim()}
                        className="mm-pill-button mm-pill-button--beige"
                      >
                        Confirmer
                      </button>
                    </div>
                  )}
                </section>
              )}
            </div>
          </section>
        )}

        {showLeaderboard && (
          <>
            <LeaderboardTable
              entries={leaderboardEntries}
              isLoading={leaderboardLoading || submitStatus === 'submitting'}
              fetchError={leaderboardError}
              currentPlayerId={playerId}
              highlightRank={hasEnded ? playerRank : undefined}
            />
            <section className="mm-how-to-play" aria-label="Comment jouer">
              <h2 className="mm-how-to-play__title">Comment jouer</h2>
              <ul className="mm-how-to-play__list">
                <li className="mm-how-to-play__item">
                  Des mots mélangés apparaissent un par un, et vous devez retrouver le mot
                  d&apos;origine et remettre les lettres dans l&apos;ordre avant la fin du chrono.
                </li>
                <li className="mm-how-to-play__item">
                  Chaque mot que vous trouvez vous
                  donne 15 secondes supplémentaires et un nombre de points équivalent à la
                  longueur du mot.
                </li>
                <li className="mm-how-to-play__item">
                  Si vous ne trouvez pas le mot à temps, la partie se termine.
                </li>
                <li className="mm-how-to-play__item">
                  Les mots peuvent être n&apos;importe quel mot commun en français : verbe à l&apos;infinitif,
                  adjectif, onomatopée, langage familier...
                </li>
                <li className="mm-how-to-play__item">
                  Il n&apos;y aura pas de verbe conjugué, de pluriel ou de féminin (sauf noms communs comme
                  "arrivée" ou mots existant seulement au pluriel comme "prémices").
                </li>
                <li className="mm-how-to-play__item">
                  Si vous écrivez un mot reconnu mais différent de celui attendu, il s&apos;illuminera
                  en jaune et vous donnera un petit bonus de temps, mais il ne sera pas validé.
                </li>
                <li className="mm-how-to-play__item">
                  Tous les 10 mots, vous passez au niveau suivant : le temps restant est ajouté à votre score,
                  puis le chrono revient à 45 secondes et la
                  longueur des mots augmente.
                </li>
                <li className="mm-how-to-play__item">
                  À partir du niveau 6, les mots ne deviennent pas plus longs, mais le temps de départ
                  et les bonus de temps diminuent. Le niveau 8 est le niveau final :
                  serez-vous la première personne à l&apos;atteindre ?
                </li>
              </ul>
            </section>
          </>
        )}
      </div>
      <MobileFooter />
    </div>
  );
}
