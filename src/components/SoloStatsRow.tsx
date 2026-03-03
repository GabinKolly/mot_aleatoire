import { getStatValueSizingStyle } from '../utils/statValueSizing';
import { formatClock } from '../utils/time';

interface SoloStatsRowProps {
  timeLeft: number;
  wordsFound: number;
  score: number;
  wordsFoundText?: string;
}

export default function SoloStatsRow({ timeLeft, wordsFound, score, wordsFoundText: wordsFoundTextOverride }: SoloStatsRowProps) {
  const timeText = formatClock(timeLeft);
  const wordsFoundText = wordsFoundTextOverride ?? `${wordsFound}`;
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
