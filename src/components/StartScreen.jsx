import { ArrowLeft, Play } from 'lucide-react';
import GameActionButton from './GameActionButton';

export default function StartScreen({
  onStart,
  onBack,
  isScoreEligibleForHighScore = true,
}) {
  return (
    <div className="text-center py-12 space-y-3">
      <GameActionButton onClick={onStart} icon={Play}>
        Commencer
      </GameActionButton>
      {!isScoreEligibleForHighScore && (
        <p className="text-sm text-amber-700 max-w-md mx-auto">
          Vous ne jouez pas avec les paramètres standards. Votre score ne sera
          pas éligible au meilleur score.
        </p>
      )}
      {onBack && (
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>
      )}
    </div>
  );
}
