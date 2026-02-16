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
      className={`border-2 rounded-lg flex items-center justify-center font-bold cursor-move select-none shadow-md hover:shadow-lg transition-all flex-shrink-0 ${
        isCorrect
          ? 'bg-green-400 border-green-500 text-white scale-110'
          : isBonusWord
            ? 'bg-yellow-300 border-yellow-500 text-yellow-900 scale-105'
            : 'bg-amber-100 border-amber-300 text-amber-900'
      } ${
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
