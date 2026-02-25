export function getTileVisualClasses({ isCorrect, isBonusWord, revealType }) {
  if (isCorrect && revealType === 'opponent') {
    return 'mm-tile-state--opponent';
  }

  if (isCorrect && revealType === 'timeout') {
    return 'mm-tile-state--timeout';
  }

  if (isCorrect) {
    return 'mm-tile-state--correct';
  }

  if (isBonusWord) {
    return 'mm-tile-state--bonus';
  }

  return 'mm-tile-state--default';
}
