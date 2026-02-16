export default function StatsPanel({ timeLeft, wordsFound, score }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-emerald-50 p-4 rounded-lg text-center">
        <div className="text-3xl font-bold text-emerald-700">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
        <div className="text-sm text-gray-600 mt-1">Temps restant</div>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg text-center">
        <div className="text-3xl font-bold text-blue-700">{wordsFound}</div>
        <div className="text-sm text-gray-600 mt-1">Mots trouvés</div>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg text-center">
        <div className="text-3xl font-bold text-purple-700">{score}</div>
        <div className="text-sm text-gray-600 mt-1">Score</div>
      </div>
    </div>
  );
}
