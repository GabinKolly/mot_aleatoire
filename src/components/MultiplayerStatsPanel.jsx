import { useValuePopup } from '../hooks/useValuePopup';

export default function MultiplayerStatsPanel({
  gameTimeLeft,
  wordTimeLeft,
  scores,
  wordsFound,
  playerNumber,
  players,
}) {
  const opponent = players.find((p) => p.number !== playerNumber);
  const self = players.find((p) => p.number === playerNumber);

  const myScore = scores[playerNumber] ?? 0;
  const opponentScore = opponent ? (scores[opponent.number] ?? 0) : 0;
  const myWordsFound = wordsFound[playerNumber] ?? 0;
  const opponentWordsFound = opponent ? (wordsFound[opponent.number] ?? 0) : 0;

  const myScoreDelta = useValuePopup(myScore);
  const opponentScoreDelta = useValuePopup(opponentScore);

  return (
    <div className="space-y-2 mb-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-emerald-700">
            {Math.floor(gameTimeLeft / 60)}:
            {(gameTimeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-600">Temps total</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-700">
            {wordTimeLeft}s
          </div>
          <div className="text-xs text-gray-600">Temps pour ce mot</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className={`relative bg-blue-50 p-3 rounded-lg text-center border-2 transition-colors duration-300 ${
            myScoreDelta !== null ? 'border-blue-500' : 'border-blue-200'
          }`}
        >
          {myScoreDelta !== null && (
            <span className="absolute -top-3 left-1/2 text-sm font-bold text-blue-600 pointer-events-none animate-pop-up">
              +{myScoreDelta}
            </span>
          )}
          <div className="text-xs text-gray-500 mb-1">
            {self?.name || 'Vous'} (vous)
          </div>
          <div className="text-2xl font-bold text-blue-700">{myScore}</div>
          <div className="text-xs text-gray-600">{myWordsFound} mots</div>
        </div>
        <div
          className={`relative bg-red-50 p-3 rounded-lg text-center border-2 transition-colors duration-300 ${
            opponentScoreDelta !== null ? 'border-red-500' : 'border-red-200'
          }`}
        >
          {opponentScoreDelta !== null && (
            <span className="absolute -top-3 left-1/2 text-sm font-bold text-red-600 pointer-events-none animate-pop-up">
              +{opponentScoreDelta}
            </span>
          )}
          <div className="text-xs text-gray-500 mb-1">
            {opponent?.name || 'Adversaire'}
          </div>
          <div className="text-2xl font-bold text-red-700">{opponentScore}</div>
          <div className="text-xs text-gray-600">{opponentWordsFound} mots</div>
        </div>
      </div>
    </div>
  );
}
