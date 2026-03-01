import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';
import Tile from './Tile';
import { getTileVisualClasses } from './tileVisualState';
import type { TileRevealType } from './tileVisualState';
import type { Tile as TileType } from '../types/game';

export interface DragHandlers {
  draggedIndex: number | null;
  touchDragPosition: { x: number; y: number } | null;
  onDragStart: (event: React.DragEvent<HTMLElement>, index: number) => void;
  onDragOver: (event: React.DragEvent<HTMLElement>, index: number) => void;
  onDragEnd: () => void;
  onTouchStart: (event: React.TouchEvent<HTMLElement>, index: number) => void;
  onTouchMove: (event: React.TouchEvent<HTMLElement>) => void;
  onTouchEnd: () => void;
}

interface GameScreenProps {
  tiles: TileType[];
  isCorrect: boolean;
  isBonusWord: boolean;
  revealType?: TileRevealType;
  dragHandlers: DragHandlers;
  screenWidth: number;
  onReshuffle: () => void;
  onGiveUp: () => void;
  showGiveUpButton?: boolean;
  primaryActionLabel?: string;
  primaryActionIcon?: ComponentType<SVGProps<SVGSVGElement>> | null;
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
  bandEndAnchorKey?: string;
}

const calculateTileSize = ({ screenWidth, numLetters }: { screenWidth: number; numLetters: number }) => {
  const maxTilePlusSpacing = Math.max(1, Math.floor(screenWidth / numLetters));
  const gapPx = Math.max(
    1,
    Math.floor(
      Math.min(12, Math.max(2, Math.floor(maxTilePlusSpacing * 0.2))) / 2
    )
  );
  const maxTileSizeFromWidth = Math.max(18, maxTilePlusSpacing - gapPx);
  const legacyCalculatedSize = Math.floor(screenWidth / numLetters / 1.2);
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
  revealType = null,
  dragHandlers,
  screenWidth,
  onReshuffle,
  onGiveUp,
  showGiveUpButton = true,
  primaryActionLabel = 'Mélanger',
  primaryActionIcon: PrimaryActionIcon = Shuffle,
  onPrimaryAction,
  primaryActionDisabled,
  bandEndAnchorKey = 'solo',
}: GameScreenProps) {
  const tilesTouchZoneRef = useRef<HTMLDivElement>(null);
  const { size: tileSize, gapPx, fontSize } = calculateTileSize({
    screenWidth,
    numLetters: tiles.length || 1,
  });
  const tileRadius = Math.max(4, Math.min(16, Math.round(tileSize * 0.18)));
  const tileBorderWidth = Math.max(2, Math.min(4, Math.round(tileSize * 0.07)));
  const interactionsDisabled = isCorrect;
  const primaryActionHandler = onPrimaryAction ?? onReshuffle;
  const primaryActionIsDisabled = primaryActionDisabled ?? interactionsDisabled;

  const { draggedIndex, touchDragPosition } = dragHandlers;

  useEffect(() => {
    const zone = tilesTouchZoneRef.current;
    if (!zone) {
      return undefined;
    }

    const preventZoneScroll = (event: TouchEvent) => {
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    zone.addEventListener('touchstart', preventZoneScroll, { passive: false });
    zone.addEventListener('touchmove', preventZoneScroll, { passive: false });

    return () => {
      zone.removeEventListener('touchstart', preventZoneScroll);
      zone.removeEventListener('touchmove', preventZoneScroll);
    };
  }, []);

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

  return (
    <div className="mm-solo-game">
      <div className="mm-solo-middle-slot mm-solo-middle-slot--tiles">
        <div className="mm-tiles-shell">
          <div className="mm-tiles-touch-zone" ref={tilesTouchZoneRef}>
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
                  onDragStart={dragHandlers.onDragStart}
                  onDragOver={dragHandlers.onDragOver}
                  onDragEnd={dragHandlers.onDragEnd}
                  onTouchStart={dragHandlers.onTouchStart}
                  onTouchMove={dragHandlers.onTouchMove}
                  onTouchEnd={dragHandlers.onTouchEnd}
                />
              ))}
            </div>
          </div>
          {dragPreview}
        </div>
      </div>

      <div className="mm-solo-game__actions">
        <button
          type="button"
          onClick={primaryActionHandler}
          disabled={primaryActionIsDisabled}
          className="mm-pill-button mm-pill-button--beige mm-pill-button--title"
          data-mm-band-end-anchor={bandEndAnchorKey}
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
