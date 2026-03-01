import { useLayoutEffect, useRef, useState } from 'react';

type BandStyle = { top: string; height: string } | null;

/**
 * Measures the vertical span between two DOM nodes inside a container and
 * returns inline styles for an absolutely-positioned background band.
 *
 * @param containerRef - ref to the element that is `position: relative`
 * @param startSelector - CSS selector (relative to container) of the band's top anchor
 * @param endSelector   - CSS selector (relative to container) of the band's bottom anchor
 * @param deps          - additional values that should trigger re-measurement
 */
export function useBandHighlightStyle(
  containerRef: React.RefObject<HTMLElement | null>,
  startSelector: string,
  endSelector: string,
  deps: unknown[] = []
): BandStyle {
  const [style, setStyle] = useState<BandStyle>(null);
  const lastSignatureRef = useRef('');
  const depsSignature = deps.join('|');

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    let frameId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const measure = () => {
      const startNode = container.querySelector(startSelector);
      const endNode = container.querySelector(endSelector);

      if (!startNode || !endNode) {
        lastSignatureRef.current = '';
        setStyle(null);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const startRect = startNode.getBoundingClientRect();
      const endRect = endNode.getBoundingClientRect();
      const top = Math.max(
        0,
        Math.round(startRect.top + startRect.height / 2 - containerRect.top)
      );
      const bottom = Math.max(
        top,
        Math.round(endRect.top + endRect.height / 2 - containerRect.top)
      );
      const height = Math.max(0, bottom - top);
      const signature = `${top}:${height}`;

      if (signature === lastSignatureRef.current) {
        return;
      }

      lastSignatureRef.current = signature;
      setStyle({ top: `${top}px`, height: `${height}px` });
    };

    const scheduleMeasure = () => {
      if (typeof window === 'undefined') {
        measure();
        return;
      }

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        measure();
      });
    };

    scheduleMeasure();
    window.addEventListener('resize', scheduleMeasure);

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      resizeObserver.observe(container);
      const startNode = container.querySelector(startSelector);
      const endNode = container.querySelector(endSelector);
      if (startNode) resizeObserver.observe(startNode);
      if (endNode && endNode !== startNode) resizeObserver.observe(endNode);
    }

    return () => {
      window.removeEventListener('resize', scheduleMeasure);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      resizeObserver?.disconnect();
    };
  }, [containerRef, startSelector, endSelector, depsSignature]);

  return style;
}
