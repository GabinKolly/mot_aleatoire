import { getTileVisualClasses } from './tileVisualState';

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
}) {
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
