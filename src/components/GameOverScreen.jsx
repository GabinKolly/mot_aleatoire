import { Play, RotateCcw } from 'lucide-react';
import GameActionButton from './GameActionButton';

export default function GameOverScreen({
  variant,
  currentWord,
  score,
  onRestart,
}) {
  const isVictory = variant === 'allWordsCompleted';

  return (
    <div className="text-center py-12">
      <div className="mb-6">
        {isVictory ? (
          <>
            <p className="text-2xl text-emerald-700 font-bold mb-4">
              Vous avez trouvé tous les mots !
            </p>
            <p className="text-2xl font-bold text-purple-700">Votre score est {score} !</p>
          </>
        ) : (
          <>
            <p className="text-xl text-gray-700 mb-2">
              Le mot était <span className="font-bold text-emerald-700">{currentWord}</span>
            </p>
            <p className="text-2xl font-bold text-purple-700">
              Vous avez obtenu un score de {score} !
            </p>
          </>
        )}
      </div>

      <GameActionButton onClick={onRestart} icon={isVictory ? Play : RotateCcw}>
        {isVictory ? 'Nouvelle partie' : 'Recommencer'}
      </GameActionButton>
    </div>
  );
}
