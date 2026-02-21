import { useRef, useState } from 'react';

export function useDragAndDrop({ setTiles, onDropComplete, isInteractionLocked = false }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [touchDragPosition, setTouchDragPosition] = useState(null);
  const draggedIndexRef = useRef(null);

  const clearDragState = () => {
    draggedIndexRef.current = null;
    setDraggedIndex(null);
    setTouchDragPosition(null);
  };

  const reorderTiles = (from, to) => {
    if (isInteractionLocked) {
      return;
    }

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
    if (isInteractionLocked) {
      clearDragState();
      return;
    }

    draggedIndexRef.current = index;
    setDraggedIndex(index);
  };

  const handleDragOver = (event, index) => {
    if (isInteractionLocked) {
      clearDragState();
      return;
    }

    event.preventDefault();
    const from = draggedIndexRef.current;
    if (from === null || from === index) {
      return;
    }

    reorderTiles(from, index);
  };

  const finishDrop = () => {
    clearDragState();
    if (isInteractionLocked) {
      return;
    }

    onDropComplete();
  };

  const handleDragEnd = () => {
    finishDrop();
  };

  const handleTouchStart = (event, index) => {
    if (isInteractionLocked) {
      clearDragState();
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    draggedIndexRef.current = index;
    setDraggedIndex(index);
    setTouchDragPosition({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (event) => {
    if (isInteractionLocked) {
      clearDragState();
      return;
    }

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
