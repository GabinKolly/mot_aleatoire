import { createPortal } from 'react-dom';
import { RotateCcw, Shuffle } from 'lucide-react';
import Tile from './Tile';
import { getTileVisualClasses } from './tileVisualState';

const calculateTileSize = ({ screenWidth, numLetters, variant }) => {
  const maxTilePlusSpacing = Math.max(1, Math.floor(screenWidth / numLetters));
  const gapPx =
    variant === 'solo-mockup'
      ? Math.max(
          1,
          Math.floor(
            Math.min(12, Math.max(2, Math.floor(maxTilePlusSpacing * 0.2))) / 2
          )
        )
      : 4;
  const maxTileSizeFromWidth = Math.max(18, maxTilePlusSpacing - gapPx);
  const legacyCalculatedSize = Math.floor((screenWidth / numLetters) / 1.2);
  const calculatedSize = Math.min(100, legacyCalculatedSize, maxTileSizeFromWidth);

  return {
    size: calculatedSize,
    gapPx,
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
  variant = 'default',
  showGiveUpButton = true,
  primaryActionLabel = 'Mélanger',
  primaryActionIcon: PrimaryActionIcon = Shuffle,
  onPrimaryAction,
  primaryActionDisabled,
}) {
  const { size: tileSize, gapPx, fontSize } = calculateTileSize({
    screenWidth,
    numLetters: tiles.length || 1,
    variant,
  });
  const tileRadius = Math.max(4, Math.min(16, Math.round(tileSize * 0.18)));
  const tileBorderWidth = Math.max(2, Math.min(4, Math.round(tileSize * 0.07)));
  const interactionsDisabled = isCorrect;
  const soloPrimaryActionHandler = onPrimaryAction ?? onReshuffle;
  const soloPrimaryActionDisabled = primaryActionDisabled ?? interactionsDisabled;
  const dragPreview =
    touchDragPosition &&
    draggedIndex !== null &&
    tiles[draggedIndex] &&
    typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`fixed mm-tile mm-tile--drag-proxy ${getTileVisualClasses({
              isCorrect,
              isBonusWord,
              revealType,
            })} z-50 pointer-events-none`}
            style={{
              width: `${tileSize}px`,
              height: `${tileSize}px`,
              fontSize: `${fontSize}px`,
              borderRadius: `${tileRadius}px`,
              borderWidth: `${tileBorderWidth}px`,
              left: `${touchDragPosition.x - tileSize / 2}px`,
              top: `${touchDragPosition.y - tileSize / 2}px`,
            }}
          >
            {tiles[draggedIndex].letter}
          </div>,
          document.body
        )
      : null;

  if (variant === 'solo-mockup') {
    return (
      <div className="mm-solo-game">
        <div className="mm-solo-middle-slot mm-solo-middle-slot--tiles">
          <div className="mm-tiles-shell">
            <div className="mm-tiles-row" style={{ gap: `${gapPx}px` }}>
              {tiles.map((tile, index) => (
                <Tile
                  key={tile.id}
                  tile={tile}
                  index={index}
                  tileSize={tileSize}
                  fontSize={fontSize}
                  cornerRadius={tileRadius}
                  borderWidth={tileBorderWidth}
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
            {dragPreview}
          </div>
        </div>

        <div className="mm-solo-game__actions">
          <button
            type="button"
            onClick={soloPrimaryActionHandler}
            disabled={soloPrimaryActionDisabled}
            className="mm-pill-button mm-pill-button--beige mm-pill-button--title"
            data-mm-band-end-anchor="solo"
          >
            {PrimaryActionIcon && <PrimaryActionIcon className="w-5 h-5" />}
            {primaryActionLabel}
          </button>
          {showGiveUpButton && (
            <button
              type="button"
              onClick={onGiveUp}
              className="mm-pill-button mm-pill-button--beige"
            >
              <RotateCcw className="w-4 h-4" />
              Abandonner
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-md:flex max-md:flex-col max-md:flex-grow">
      {/* Abandonner — mobile only, placed right below stats */}
      {showGiveUpButton && (
        <div className="text-center md:hidden">
          <button
            onClick={onGiveUp}
            className="btn btn-danger btn-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Abandonner
          </button>
        </div>
      )}

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
              cornerRadius={tileRadius}
              borderWidth={tileBorderWidth}
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

        {dragPreview}
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
        {showGiveUpButton && (
          <button
            onClick={onGiveUp}
            className="btn btn-danger btn-sm hidden md:inline-flex"
          >
            <RotateCcw className="w-4 h-4" />
            Abandonner
          </button>
        )}
      </div>
    </div>
  );
}
