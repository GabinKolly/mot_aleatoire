import { getTileVisualClasses } from './tileVisualState';

export default function Tile({
  tile,
  index,
  tileSize,
  fontSize,
  isCorrect,
  isBonusWord,
  draggedIndex,
  touchDragPosition,
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
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(event) => onDragOver(event, index)}
      onDragEnd={onDragEnd}
      onTouchStart={(event) => onTouchStart(event, index)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      className={`border-2 rounded-lg flex items-center justify-center font-bold cursor-move select-none shadow-md hover:shadow-lg transition-all flex-shrink-0 ${getTileVisualClasses(
        { isCorrect, isBonusWord }
      )} ${
        draggedIndex === index && touchDragPosition
          ? 'opacity-0'
          : draggedIndex === index
            ? 'opacity-50'
            : ''
      }`}
      style={{
        width: `${tileSize}px`,
        height: `${tileSize}px`,
        fontSize: `${fontSize}px`,
        touchAction: 'none',
      }}
    >
      {tile.letter}
    </div>
  );
}
