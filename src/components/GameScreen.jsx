import { createPortal } from 'react-dom';
import { RotateCcw } from 'lucide-react';
import BlackButton from './BlackButton';
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
  draggedIndex,
  touchDragPosition,
  screenWidth,
  onDragStart,
  onDragOver,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onGiveUp,
}) {
  const { size: tileSize, fontSize } = calculateTileSize(screenWidth, tiles.length || 1);

  return (
    <div className="space-y-6">
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
                { isCorrect, isBonusWord }
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

      <div className="text-center">
        <BlackButton
          onClick={onGiveUp}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Abandonner
        </BlackButton>
      </div>
    </div>
  );
}
