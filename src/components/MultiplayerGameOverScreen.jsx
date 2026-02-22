import { Play, ArrowLeft, Trophy } from 'lucide-react';
import GameActionButton from './GameActionButton';

export default function MultiplayerGameOverScreen({
  scores,
  wordsFound,
  winner,
  playerNumber,
  players,
  onPlayAgain,
  onBackToMenu,
}) {
  const isWinner = winner === playerNumber;
  const isTie = winner === null;

  const self = players.find((p) => p.number === playerNumber);
  const opponent = players.find((p) => p.number !== playerNumber);

  const myScore = scores[playerNumber] ?? 0;
  const opponentScore = opponent ? (scores[opponent.number] ?? 0) : 0;
  const myWordsFound = wordsFound[playerNumber] ?? 0;
  const opponentWordsFound = opponent ? (wordsFound[opponent.number] ?? 0) : 0;

  return (
    <div className="text-center py-8">
      <div className="mb-6">
        {isTie ? (
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
            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Menu principal
          </button>
        </div>
      </div>
    </div>
  );
}
