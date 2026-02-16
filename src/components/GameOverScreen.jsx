import { Play, RotateCcw } from 'lucide-react';
import BlackButton from './BlackButton';

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

      <BlackButton
        onClick={onRestart}
        className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white text-xl font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
      >
        {isVictory ? <Play className="w-6 h-6" /> : <RotateCcw className="w-6 h-6" />}
        {isVictory ? 'Nouvelle partie' : 'Recommencer'}
      </BlackButton>
    </div>
  );
}
