export default function GameOverScreen({
  variant,
  currentWord,
  score,
  highScore = null,
  isNewRecord = false,
  completionTimeBonus = 0,
  onRestart,
}) {
  const isVictory = variant === 'allWordsCompleted';
  const showHighScoreHint = Number.isInteger(highScore) && !isNewRecord;

  return (
    <div className="text-center py-12">
      <div className="mb-6">
        {isVictory ? (
          <>
            <p className="text-2xl text-emerald-700 font-bold mb-4">
              Vous avez trouvé tous les mots !
            </p>
            <p className="text-2xl font-bold text-purple-700">Votre score est {score} !</p>
            <p className="text-sm text-emerald-700 mt-2">
              Bonus fin de liste: +{completionTimeBonus} points ({completionTimeBonus}{' '}
              secondes restantes ajoutées au score).
            </p>
          </>
        ) : (
          <>
            <p className="text-xl text-gray-700 mb-2">
              Le mot était <span className="font-bold text-emerald-700">{currentWord}</span>
            </p>
            <p className="text-2xl font-bold text-purple-700">
              Vous avez obtenu un score de {score} !
            </p>
          </>
        )}
        {isNewRecord && (
          <p className="text-2xl font-bold text-purple-700 mt-4">
            C&apos;est un nouveau record !
          </p>
        )}
        {showHighScoreHint && (
          <p className="text-sm text-gray-600 mt-3">Le meilleur score est {highScore}.</p>
        )}
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="mm-pill-button mm-pill-button--beige mm-pill-button--title"
      >
        {isVictory ? 'Nouvelle partie' : 'Recommencer'}
      </button>
    </div>
  );
}
