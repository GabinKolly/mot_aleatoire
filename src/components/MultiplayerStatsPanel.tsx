import { useValuePopup } from '../hooks/useValuePopup';
import { getStatValueSizingStyle } from '../utils/statValueSizing';
import { formatClock } from '../utils/time';
import { truncateLabel } from '../utils/strings';
import type { Player } from '../types/multiplayer';

interface MultiplayerStatsPanelProps {
  gameTimeLeft: number;
  wordTimeLeft: number;
  scores: Record<number, number>;
  playerNumber: number | null;
  players: Player[];
}

export default function MultiplayerStatsPanel({
  gameTimeLeft,
  wordTimeLeft,
  scores,
  playerNumber,
  players,
}: MultiplayerStatsPanelProps) {
  const opponent = players.find((p) => p.number !== playerNumber);
  const self = players.find((p) => p.number === playerNumber);

  const myScore = scores[playerNumber ?? 0] ?? 0;
  const opponentScore = opponent ? (scores[opponent.number] ?? 0) : 0;

  const myScoreDelta = useValuePopup(myScore);
  const opponentScoreDelta = useValuePopup(opponentScore);

  const gameTimeText = formatClock(gameTimeLeft);
  const wordTimeText = `${Math.max(0, wordTimeLeft)} sec`;
  const myScoreText = `${myScore}`;
  const opponentScoreText = `${opponentScore}`;

  return (
    <div className="mm-mp-stats" data-mm-band-start-anchor="mp">
      <div className="mm-stat-card mm-stat-card--green mm-mp-stat-card mm-mp-stat-card--score">
        {myScoreDelta !== null && (
          <span className="mm-mp-stat-card__delta animate-pop-up">+{myScoreDelta}</span>
        )}
        <div className="mm-stat-card__value" style={getStatValueSizingStyle(myScoreText)}>
          {myScoreText}
        </div>
        <div className="mm-stat-card__label">{truncateLabel(self?.name, 'Vous')}</div>
      </div>

      <div className="mm-stat-card mm-stat-card--yellow mm-mp-stat-card">
        <div className="mm-stat-card__value" style={getStatValueSizingStyle(gameTimeText)}>
          {gameTimeText}
        </div>
        <div className="mm-mp-stat-card__divider" aria-hidden="true" />
        <div
          className="mm-stat-card__value mm-mp-stat-card__value--word-time"
          style={getStatValueSizingStyle(wordTimeText)}
        >
          {wordTimeText}
        </div>
      </div>

      <div className="mm-stat-card mm-stat-card--red mm-mp-stat-card mm-mp-stat-card--score">
        {opponentScoreDelta !== null && (
          <span className="mm-mp-stat-card__delta animate-pop-up">+{opponentScoreDelta}</span>
        )}
        <div
          className="mm-stat-card__value"
          style={getStatValueSizingStyle(opponentScoreText)}
        >
          {opponentScoreText}
        </div>
        <div className="mm-stat-card__label">
          {truncateLabel(opponent?.name, 'Adversaire')}
        </div>
      </div>
    </div>
  );
}
