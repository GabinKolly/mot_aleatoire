import { useValuePopup } from '../hooks/useValuePopup';

export default function StatsPanel({ timeLeft, wordsFound, score }) {
  const wordsFoundDelta = useValuePopup(wordsFound);
  const scoreDelta = useValuePopup(score);

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-emerald-50 p-4 rounded-lg text-center">
        <div className="text-3xl font-bold text-emerald-700">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
        <div className="text-sm text-gray-600 mt-1">Temps restant</div>
      </div>
      <div
        className={`relative bg-blue-50 p-4 rounded-lg text-center transition-shadow duration-300 ${
          wordsFoundDelta !== null ? 'ring-2 ring-blue-400' : ''
        }`}
      >
        {wordsFoundDelta !== null && (
          <span className="absolute -top-3 left-1/2 text-sm font-bold text-blue-600 pointer-events-none animate-pop-up">
            +{wordsFoundDelta}
          </span>
        )}
        <div className="text-3xl font-bold text-blue-700">{wordsFound}</div>
        <div className="text-sm text-gray-600 mt-1">Mots trouvés</div>
      </div>
      <div
        className={`relative bg-purple-50 p-4 rounded-lg text-center transition-shadow duration-300 ${
          scoreDelta !== null ? 'ring-2 ring-purple-400' : ''
        }`}
      >
        {scoreDelta !== null && (
          <span className="absolute -top-3 left-1/2 text-sm font-bold text-purple-600 pointer-events-none animate-pop-up">
            +{scoreDelta}
          </span>
        )}
        <div className="text-3xl font-bold text-purple-700">{score}</div>
        <div className="text-sm text-gray-600 mt-1">Score</div>
      </div>
    </div>
  );
}
