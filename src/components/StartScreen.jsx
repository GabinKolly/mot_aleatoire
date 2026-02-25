import { ArrowLeft, Play } from 'lucide-react';
import GameActionButton from './GameActionButton';

export default function StartScreen({
  onStart,
  onBack,
  isScoreEligibleForHighScore = true,
  variant = 'default',
}) {
  if (variant === 'solo-mockup') {
    return (
      <div className="mm-solo-start">
        {!isScoreEligibleForHighScore && (
          <div className="mm-warning-panel" role="note">
            <p>
              Vous ne jouez pas avec les paramètres standards.
              <br />
              Votre score ne sera pas éligible au meilleur score.
            </p>
          </div>
        )}
        <div className="mm-solo-start__cta">
          <button
            type="button"
            onClick={onStart}
            className="mm-pill-button mm-pill-button--beige mm-pill-button--title"
            data-mm-band-end-anchor="solo"
          >
            Commencer
          </button>
        </div>
      </div>
    );
  }

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
            className="btn btn-link"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>
      )}
    </div>
  );
}
