import { useRef, useState } from 'react';
import type { DragEvent, TouchEvent } from 'react';
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
  const dragImageElementRef = useRef<HTMLElement | null>(null);

  const clearDesktopDragImage = () => {
    dragImageElementRef.current?.remove();
    dragImageElementRef.current = null;
  };

  const clearDragState = () => {
    clearDesktopDragImage();
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

  const handleDragStart = (
    event: DragEvent<HTMLElement>,
    index: number
  ): void => {
    if (isInteractionLocked) {
      clearDragState();
      return;
    }

    const dragSourceElement = event?.currentTarget;
    const dataTransfer = event?.dataTransfer;

    if (dataTransfer) {
      dataTransfer.effectAllowed = 'move';

      try {
        dataTransfer.setData('text/plain', String(index));
      } catch {
        // Some browsers can throw here; drag still works without the payload.
      }

      if (
        typeof document !== 'undefined' &&
        dragSourceElement instanceof HTMLElement
      ) {
        clearDesktopDragImage();

        const dragImageElement = dragSourceElement.cloneNode(true) as HTMLElement;
        const { width, height } = dragSourceElement.getBoundingClientRect();
        dragImageElement.style.position = 'fixed';
        dragImageElement.style.top = '-9999px';
        dragImageElement.style.left = '-9999px';
        dragImageElement.style.margin = '0';
        dragImageElement.style.transform = 'none';
        dragImageElement.style.opacity = '1';
        dragImageElement.style.pointerEvents = 'none';
        document.body.appendChild(dragImageElement);
        dragImageElementRef.current = dragImageElement;
        dataTransfer.setDragImage(dragImageElement, width / 2, height / 2);
      }
    }

    draggedIndexRef.current = index;
    setDraggedIndex(index);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>, index: number): void => {
    if (isInteractionLocked) {
      clearDragState();
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    const from = draggedIndexRef.current;
    if (from === null || from === index) {
      return;
    }

    reorderTiles(from, index);
  };

  const finishDrop = (): void => {
    clearDragState();
    if (isInteractionLocked) {
      return;
    }

    onDropComplete();
  };

  const handleDragEnd = (): void => {
    finishDrop();
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

    setTouchDragPosition((previous) =>
      previous
        ? { ...previous, x: touch.clientX, y: touch.clientY }
        : null
    );

    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
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

  const handleTouchEnd = (): void => {
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
