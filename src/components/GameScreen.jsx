import { createPortal } from 'react-dom';
import { RotateCcw, Shuffle } from 'lucide-react';
import Tile from './Tile';
import { getTileVisualClasses } from './tileVisualState';

const calculateTileSize = (screenWidth, numLetters) => {
  const usableWidth = screenWidth;
  const calculatedSize = Math.min(100, Math.floor((usableWidth / numLetters) / 1.2));
  return {
    size: calculatedSize,
    fontSize: Math.max(10, Math.floor(calculatedSize * 0.42)),
  };
};

export default function GameScreen({
  tiles,
  isCorrect,
  isBonusWord,
  revealType,
  draggedIndex,
  touchDragPosition,
  screenWidth,
  onDragStart,
  onDragOver,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onReshuffle,
  onGiveUp,
}) {
  const { size: tileSize, fontSize } = calculateTileSize(screenWidth, tiles.length || 1);
  const interactionsDisabled = isCorrect;

  return (
    <div className="space-y-6 max-md:flex max-md:flex-col max-md:flex-grow">
      {/* Abandonner — mobile only, placed right below stats */}
      <div className="text-center md:hidden">
        <button
          onClick={onGiveUp}
          className="btn btn-danger btn-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Abandonner
        </button>
      </div>

      {/* Spacer — pushes tiles to bottom on mobile */}
      <div className="flex-grow md:hidden" />

      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-amber-50 py-4 text-center">
        <div className="flex justify-center gap-1 overflow-x-auto pb-2">
          {tiles.map((tile, index) => (
            <Tile
              key={tile.id}
              tile={tile}
              index={index}
              tileSize={tileSize}
              fontSize={fontSize}
              isCorrect={isCorrect}
              isBonusWord={isBonusWord}
              revealType={revealType}
              interactionsDisabled={interactionsDisabled}
              draggedIndex={draggedIndex}
              touchDragPosition={touchDragPosition}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            />
          ))}
        </div>

        {touchDragPosition &&
          draggedIndex !== null &&
          tiles[draggedIndex] &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className={`fixed border-2 rounded-lg flex items-center justify-center font-bold select-none shadow-xl z-50 pointer-events-none ${getTileVisualClasses(
                { isCorrect, isBonusWord, revealType }
              )}`}
              style={{
                width: `${tileSize}px`,
                height: `${tileSize}px`,
                fontSize: `${fontSize}px`,
                left: `${touchDragPosition.x - tileSize / 2}px`,
                top: `${touchDragPosition.y - tileSize / 2}px`,
              }}
            >
              {tiles[draggedIndex].letter}
            </div>,
            document.body
          )}
      </div>

      <div className="text-center flex items-center justify-center gap-3">
        <button
          onClick={onReshuffle}
          disabled={interactionsDisabled}
          className="btn btn-primary btn-sm"
        >
          <Shuffle className="w-4 h-4" />
          Mélanger
        </button>
        {/* Abandonner — desktop only */}
        <button
          onClick={onGiveUp}
          className="btn btn-danger btn-sm hidden md:inline-flex"
        >
          <RotateCcw className="w-4 h-4" />
          Abandonner
        </button>
      </div>
    </div>
  );
}
