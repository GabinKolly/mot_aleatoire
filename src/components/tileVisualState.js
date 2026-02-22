export function getTileVisualClasses({ isCorrect, isBonusWord, isWordSkipped }) {
  if (isCorrect && isWordSkipped) {
    return 'bg-red-400 border-red-500 text-white scale-110';
  }

  if (isCorrect) {
    return 'bg-green-400 border-green-500 text-white scale-110';
  }

  if (isBonusWord) {
    return 'bg-yellow-300 border-yellow-500 text-yellow-900 scale-105';
  }

  return 'bg-amber-100 border-amber-300 text-amber-900';
}
