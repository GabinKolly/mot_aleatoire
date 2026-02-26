import { Trophy } from 'lucide-react';

export default function MultiplayerGameOverScreen({
  scores,
  wordsFound,
  wordHistory = [],
  winner,
  gameOverReason,
  forfeitedBy,
  playerNumber,
  players,
  onPlayAgain,
}) {
  const isWinner = winner === playerNumber;
  const isTie = winner === null;
  const endedByForfeit = gameOverReason === 'forfeit';
  const selfForfeited = endedByForfeit && forfeitedBy === playerNumber;

  const self = players.find((p) => p.number === playerNumber);
  const opponent = players.find((p) => p.number !== playerNumber);

  const myScore = scores[playerNumber] ?? 0;
  const opponentScore = opponent ? (scores[opponent.number] ?? 0) : 0;
  const myWordsFound = wordsFound[playerNumber] ?? 0;
  const opponentWordsFound = opponent ? (wordsFound[opponent.number] ?? 0) : 0;

  const getWordHistoryVisuals = (entry) => {
    if (entry.claimedBy === null) {
      return {
        containerClass: 'is-neutral',
        label: 'Non trouvé',
      };
    }

    if (entry.claimedBy === playerNumber) {
      return {
        containerClass: 'is-self',
        label: 'Vous',
      };
    }

    return {
      containerClass: 'is-opponent',
      label: opponent?.name || 'Adversaire',
    };
  };

  return (
    <div className="mm-mp-results">
      <div className="mm-mp-results__hero">
        {endedByForfeit ? (
          selfForfeited ? (
            <p className="mm-mp-results__headline">Vous avez abandonné.</p>
          ) : (
            <>
              <Trophy className="mm-mp-results__trophy" />
              <p className="mm-mp-results__headline">Votre adversaire a abandonné.</p>
            </>
          )
        ) : isTie ? (
          <p className="mm-mp-results__headline">Égalité !</p>
        ) : isWinner ? (
          <>
            <Trophy className="mm-mp-results__trophy" />
            <p className="mm-mp-results__headline">Vous avez gagné !</p>
          </>
        ) : (
          <p className="mm-mp-results__headline">Vous avez perdu...</p>
        )}
      </div>

      <div className="mm-mp-results__scores" data-mm-band-start-anchor="mp-results">
        <div className={`mm-mp-results-score-card ${isWinner ? 'is-emphasis-self' : ''}`}>
          <div className="mm-mp-results-score-card__name">{self?.name || 'Vous'}</div>
          <div className="mm-mp-results-score-card__value">{myScore}</div>
          <div className="mm-mp-results-score-card__meta">{myWordsFound} mots trouvés</div>
        </div>
        <div
          className={`mm-mp-results-score-card mm-mp-results-score-card--opponent ${
            !isTie && !isWinner ? 'is-emphasis-opponent' : ''
          }`}
        >
          <div className="mm-mp-results-score-card__name">
            {opponent?.name || 'Adversaire'}
          </div>
          <div className="mm-mp-results-score-card__value">{opponentScore}</div>
          <div className="mm-mp-results-score-card__meta">
            {opponentWordsFound} mots trouvés
          </div>
        </div>
      </div>

      <div className="mm-mp-results__actions">
        <button
          type="button"
          onClick={onPlayAgain}
          className="mm-pill-button mm-pill-button--beige mm-pill-button--title"
          data-mm-band-end-anchor="mp-results"
        >
          Nouvelle partie
        </button>
      </div>

      {wordHistory.length > 0 && (
        <div className="mm-mp-history">
          <h2 className="mm-mp-history__title">Historique des mots</h2>
          <div className="mm-mp-history__list">
            {wordHistory.map((entry) => {
              const visuals = getWordHistoryVisuals(entry);
              return (
                <div
                  key={entry.wordIndex}
                  className={`mm-mp-history__row ${visuals.containerClass}`}
                >
                  <span className="mm-mp-history__word">{entry.word}</span>
                  <span className="mm-mp-history__label">{visuals.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
