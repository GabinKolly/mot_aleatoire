import type { LeaderboardEntry } from '../utils/leaderboardApi';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  fetchError: string | null;
  currentPlayerId?: string;
  highlightRank?: number | null;
}

export default function LeaderboardTable({
  entries,
  isLoading,
  fetchError,
  currentPlayerId,
  highlightRank,
}: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="mm-leaderboard mm-leaderboard--loading" aria-live="polite">
        Chargement du classement…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="mm-leaderboard mm-leaderboard--error" role="alert">
        {fetchError}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="mm-leaderboard mm-leaderboard--empty">
        Aucun score pour l&apos;instant. Soyez le premier !
      </div>
    );
  }

  return (
    <div className="mm-leaderboard">
      <ol className="mm-leaderboard__list" aria-label="Classement compétition">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const isCurrentPlayer = entry.playerId === currentPlayerId;
          const isHighlighted = highlightRank != null && rank === highlightRank;
          return (
            <li
              key={entry.playerId}
              className={[
                'mm-leaderboard__entry',
                isCurrentPlayer ? 'mm-leaderboard__entry--me' : '',
                isHighlighted ? 'mm-leaderboard__entry--highlight' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={isHighlighted ? 'true' : undefined}
            >
              <span className="mm-leaderboard__rank">{rank}</span>
              <span className="mm-leaderboard__name">{entry.playerName}</span>
              <div className="mm-leaderboard__meta">
                <span className="mm-leaderboard__score">{entry.score}</span>
                <span className="mm-leaderboard__detail">
                  {entry.wordsFound} mot{entry.wordsFound !== 1 ? 's' : ''}
                  {' · '}palier {entry.tierReached + 1}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
