import { getTileVisualClasses } from './tileVisualState';
import type { Tile as TileData } from '../types/game';
import type { DragHandlers } from './GameScreen';
import type { TileRevealType } from './tileVisualState';

interface TileProps {
  tile: TileData;
  index: number;
  tileSize: number;
  fontSize: number;
  cornerRadius: number;
  borderWidth: number;
  isCorrect: boolean;
  isBonusWord: boolean;
  revealType: TileRevealType;
  interactionsDisabled: boolean;
  draggedIndex: number | null;
  onDragStart: DragHandlers['onDragStart'];
  onDragOver: DragHandlers['onDragOver'];
  onDragEnd: DragHandlers['onDragEnd'];
  onTouchStart: DragHandlers['onTouchStart'];
  onTouchMove: DragHandlers['onTouchMove'];
  onTouchEnd: DragHandlers['onTouchEnd'];
}

export default function Tile({
  tile,
  index,
  tileSize,
  fontSize,
  cornerRadius,
  borderWidth,
  isCorrect,
  isBonusWord,
  revealType,
  interactionsDisabled,
  draggedIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: TileProps) {
  return (
    <div
      data-tile-index={index}
      draggable={!interactionsDisabled}
      onDragStart={(event) => onDragStart(event, index)}
      onDragOver={(event) => onDragOver(event, index)}
      onDragEnd={onDragEnd}
      onTouchStart={(event) => onTouchStart(event, index)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      className={`mm-tile ${interactionsDisabled ? 'cursor-default' : 'cursor-move'} ${
        interactionsDisabled ? '' : 'mm-tile--interactive'
      } ${getTileVisualClasses(
        { isCorrect, isBonusWord, revealType }
      )} ${draggedIndex === index ? 'opacity-0' : ''}`}
      style={{
        width: `${tileSize}px`,
        height: `${tileSize}px`,
        fontSize: `${fontSize}px`,
        borderRadius:
          typeof cornerRadius === 'number' ? `${cornerRadius}px` : undefined,
        borderWidth:
          typeof borderWidth === 'number' ? `${borderWidth}px` : undefined,
        touchAction: 'none',
      }}
    >
      {tile.letter}
    </div>
  );
}
