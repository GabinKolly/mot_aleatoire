import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, TouchEvent } from 'react';
import type { Tile } from '../types/game';

interface UseDragAndDropOptions {
  setTiles: (updater: Tile[] | ((tiles: Tile[]) => Tile[])) => void;
  onDropComplete: () => void;
  isInteractionLocked?: boolean;
}

export function useDragAndDrop({
  setTiles,
  onDropComplete,
  isInteractionLocked = false,
}: UseDragAndDropOptions) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [touchDragPosition, setTouchDragPosition] = useState<{ x: number; y: number } | null>(null);
  const draggedIndexRef = useRef<number | null>(null);
  const clearMouseListenersRef = useRef<(() => void) | null>(null);
  const onDropCompleteRef = useRef(onDropComplete);
  const dropCompleteTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    onDropCompleteRef.current = onDropComplete;
  }, [onDropComplete]);

  useEffect(
    () => () => {
      clearMouseListenersRef.current?.();
      clearMouseListenersRef.current = null;
      if (dropCompleteTimeoutRef.current !== null) {
        window.clearTimeout(dropCompleteTimeoutRef.current);
        dropCompleteTimeoutRef.current = null;
      }
    },
    []
  );

  const clearMouseListeners = () => {
    clearMouseListenersRef.current?.();
    clearMouseListenersRef.current = null;
  };

  const clearDragState = () => {
    clearMouseListeners();
    draggedIndexRef.current = null;
    setDraggedIndex(null);
    setTouchDragPosition(null);
  };

  const reorderTiles = (from: number, to: number): void => {
    if (isInteractionLocked) {
      return;
    }

    setTiles((previousTiles: Tile[]) => {
      const nextTiles = [...previousTiles];
      const draggedTile = nextTiles[from];
      nextTiles.splice(from, 1);
      nextTiles.splice(to, 0, draggedTile);
      return nextTiles;
    });
    draggedIndexRef.current = to;
    setDraggedIndex(to);
  };

  const reorderToPoint = (x: number, y: number): void => {
    const from = draggedIndexRef.current;
    if (from === null || typeof document === 'undefined') {
      return;
    }

    const elements = document.elementsFromPoint(x, y);
    const tileElement = elements.find(
      (element) => (element as HTMLElement).dataset.tileIndex
    ) as HTMLElement | undefined;

    if (!tileElement) {
      return;
    }

    const targetIndex = Number.parseInt(tileElement.dataset.tileIndex!, 10);
    if (Number.isNaN(targetIndex) || targetIndex === from) {
      return;
    }

    reorderTiles(from, targetIndex);
  };

  const handleMouseDown = (
    event: MouseEvent<HTMLElement>,
    index: number
  ): void => {
    if (isInteractionLocked) {
      clearDragState();
      return;
    }

    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    clearMouseListeners();

    const handleWindowMouseMove = (moveEvent: globalThis.MouseEvent): void => {
      if (isInteractionLocked) {
        clearDragState();
        return;
      }

      setTouchDragPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
      reorderToPoint(moveEvent.clientX, moveEvent.clientY);
    };

    const handleWindowMouseUp = (): void => {
      finishDrop();
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('blur', handleWindowMouseUp);

    clearMouseListenersRef.current = () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('blur', handleWindowMouseUp);
    };

    draggedIndexRef.current = index;
    setDraggedIndex(index);
    setTouchDragPosition({ x: event.clientX, y: event.clientY });
  };

  const finishDrop = (): void => {
    clearDragState();
    if (isInteractionLocked) {
      return;
    }

    if (dropCompleteTimeoutRef.current !== null) {
      window.clearTimeout(dropCompleteTimeoutRef.current);
    }

    // Defer validation so it reads the latest tile order after React applies
    // any in-flight reorder updates from the final drag movement.
    dropCompleteTimeoutRef.current = window.setTimeout(() => {
      dropCompleteTimeoutRef.current = null;
      onDropCompleteRef.current();
    }, 0);
  };

  const handleTouchStart = (
    event: TouchEvent<HTMLElement>,
    index: number
  ): void => {
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

  const handleTouchMove = (event: TouchEvent<HTMLElement>): void => {
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

    setTouchDragPosition({ x: touch.clientX, y: touch.clientY });
    reorderToPoint(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (): void => {
    finishDrop();
  };

  return {
    draggedIndex,
    touchDragPosition,
    handleMouseDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    clearDragState,
  };
}
