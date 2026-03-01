interface StartScreenProps {
  onStart: () => void;
  isScoreEligibleForHighScore?: boolean;
}

export default function StartScreen({
  onStart,
  isScoreEligibleForHighScore = true,
}: StartScreenProps) {
  return (
    <div className="mm-solo-start">
      <div className="mm-solo-middle-slot">
        {!isScoreEligibleForHighScore && (
          <div className="mm-warning-panel" role="note">
            <p>
              Vous ne jouez pas avec les paramètres standards.
              <br />
              Votre score ne sera pas éligible au meilleur score.
            </p>
          </div>
        )}
      </div>
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
