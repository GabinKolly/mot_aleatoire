import { Play, ArrowLeft, Trophy } from 'lucide-react';
import GameActionButton from './GameActionButton';

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
  onBackToMenu,
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
        containerClass: 'bg-gray-100 border-gray-200',
        wordClass: 'text-gray-800',
        labelClass: 'text-gray-600',
        label: 'Non trouvé',
      };
    }

    if (entry.claimedBy === playerNumber) {
      return {
        containerClass: 'bg-blue-50 border-blue-200',
        wordClass: 'text-blue-800',
        labelClass: 'text-blue-600',
        label: 'Vous',
      };
    }

    return {
      containerClass: 'bg-red-50 border-red-200',
      wordClass: 'text-red-800',
      labelClass: 'text-red-600',
      label: opponent?.name || 'Adversaire',
    };
  };

  return (
    <div className="text-center py-8">
      <div className="mb-6">
        {endedByForfeit ? (
          selfForfeited ? (
            <p className="text-2xl font-bold text-red-700">Vous avez abandonné.</p>
          ) : (
            <div className="space-y-2">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto" />
              <p className="text-2xl font-bold text-emerald-700">
                Votre adversaire a abandonné.
              </p>
            </div>
          )
        ) : isTie ? (
          <p className="text-2xl font-bold text-yellow-700">Égalité !</p>
        ) : isWinner ? (
          <div className="space-y-2">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto" />
            <p className="text-2xl font-bold text-emerald-700">Vous avez gagné !</p>
          </div>
        ) : (
          <p className="text-2xl font-bold text-red-700">Vous avez perdu...</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
        <div
          className={`p-4 rounded-lg ${
            isWinner ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-blue-50'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">{self?.name || 'Vous'}</div>
          <div className="text-3xl font-bold text-blue-700">{myScore}</div>
          <div className="text-sm text-gray-600">{myWordsFound} mots trouvés</div>
        </div>
        <div
          className={`p-4 rounded-lg ${
            !isTie && !isWinner ? 'bg-red-100 ring-2 ring-red-400' : 'bg-red-50'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">
            {opponent?.name || 'Adversaire'}
          </div>
          <div className="text-3xl font-bold text-red-700">{opponentScore}</div>
          <div className="text-sm text-gray-600">
            {opponentWordsFound} mots trouvés
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <GameActionButton onClick={onPlayAgain} icon={Play}>
            Nouvelle partie
          </GameActionButton>
        </div>
        <div>
          <button
            onClick={onBackToMenu}
            className="btn btn-link"
          >
            <ArrowLeft className="w-4 h-4" />
            Menu principal
          </button>
        </div>
      </div>

      {wordHistory.length > 0 && (
        <div className="mt-10 max-w-xl mx-auto text-left">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600 mb-3">
            Historique des mots
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {wordHistory.map((entry) => {
              const visuals = getWordHistoryVisuals(entry);
              return (
                <div
                  key={entry.wordIndex}
                  className={`w-full rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${visuals.containerClass}`}
                >
                  <span className={`font-semibold break-all ${visuals.wordClass}`}>
                    {entry.word}
                  </span>
                  <span className={`text-xs font-medium shrink-0 ${visuals.labelClass}`}>
                    {visuals.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
