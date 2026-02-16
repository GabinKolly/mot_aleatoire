import { useRef, useState } from 'react';

export function useDragAndDrop({ setTiles, onDropComplete }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [touchDragPosition, setTouchDragPosition] = useState(null);
  const draggedIndexRef = useRef(null);

  const clearDragState = () => {
    draggedIndexRef.current = null;
    setDraggedIndex(null);
    setTouchDragPosition(null);
  };

  const reorderTiles = (from, to) => {
    setTiles((previousTiles) => {
      const nextTiles = [...previousTiles];
      const draggedTile = nextTiles[from];
      nextTiles.splice(from, 1);
      nextTiles.splice(to, 0, draggedTile);
      return nextTiles;
    });
    draggedIndexRef.current = to;
    setDraggedIndex(to);
  };

  const handleDragStart = (index) => {
    draggedIndexRef.current = index;
    setDraggedIndex(index);
  };

  const handleDragOver = (event, index) => {
    event.preventDefault();
    const from = draggedIndexRef.current;
    if (from === null || from === index) {
      return;
    }

    reorderTiles(from, index);
  };

  const finishDrop = () => {
    clearDragState();
    onDropComplete();
  };

  const handleDragEnd = () => {
    finishDrop();
  };

  const handleTouchStart = (event, index) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    draggedIndexRef.current = index;
    setDraggedIndex(index);
    setTouchDragPosition({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (event) => {
    const from = draggedIndexRef.current;
    if (from === null) {
      return;
    }

    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    setTouchDragPosition((previous) =>
      previous
        ? { ...previous, x: touch.clientX, y: touch.clientY }
        : null
    );

    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const tileElement = elements.find((element) => element.dataset.tileIndex);

    if (!tileElement) {
      return;
    }

    const targetIndex = Number.parseInt(tileElement.dataset.tileIndex, 10);
    if (Number.isNaN(targetIndex) || targetIndex === from) {
      return;
    }

    reorderTiles(from, targetIndex);
  };

  const handleTouchEnd = () => {
    finishDrop();
  };

  return {
    draggedIndex,
    touchDragPosition,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    clearDragState,
  };
}
