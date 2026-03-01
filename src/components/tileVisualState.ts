export type TileRevealType =
  | 'correct'
  | 'timeout'
  | 'opponent'
  | 'gameOver'
  | null;

interface TileVisualInput {
  isCorrect: boolean;
  isBonusWord: boolean;
  revealType: TileRevealType;
}

export function getTileVisualClasses({
  isCorrect,
  isBonusWord,
  revealType,
}: TileVisualInput): string {
  if (isCorrect && revealType === 'gameOver') {
    return 'mm-tile-state--game-over';
  }

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
