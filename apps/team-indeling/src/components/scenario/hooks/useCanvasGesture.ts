"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGesture } from "@use-gesture/react";

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface CanvasGestureResult {
  transform: CanvasTransform;
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: (contentWidth: number, contentHeight: number) => void;
  resetZoom: () => void;
}

const SCALE_MIN = 0.25;
const SCALE_MAX = 1.5;
const SCALE_STEP = 1.4;
const WHEEL_FACTOR = -0.002;

function clampScale(s: number): number {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, s));
}

export function useCanvasGesture(): CanvasGestureResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState<CanvasTransform>({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const spaceHeld = useRef(false);

  // Track space key for space+left-click panning
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        spaceHeld.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeld.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useGesture(
    {
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault();
        const el = containerRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const cursorX = (event as WheelEvent).clientX - rect.left;
        const cursorY = (event as WheelEvent).clientY - rect.top;

        setTransform((prev) => {
          const newScale = clampScale(prev.scale * Math.exp(dy * WHEEL_FACTOR));
          const ratio = newScale / prev.scale;
          return {
            x: cursorX - ratio * (cursorX - prev.x),
            y: cursorY - ratio * (cursorY - prev.y),
            scale: newScale,
          };
        });
      },

      onDrag: ({ delta: [dx, dy], buttons, event, first, cancel }) => {
        // Allow pan only with middle mouse (button bitmask 4) or space+left-click
        const isMiddleMouse = (buttons & 4) !== 0;
        const isSpaceLeftClick = (buttons & 1) !== 0 && spaceHeld.current;

        if (!isMiddleMouse && !isSpaceLeftClick) {
          if (first) cancel();
          return;
        }

        event.preventDefault();

        setTransform((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
          scale: prev.scale,
        }));
      },
    },
    {
      target: containerRef,
      wheel: { eventOptions: { passive: false } },
      drag: { filterTaps: true },
    }
  );

  const zoomIn = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    setTransform((prev) => {
      const newScale = clampScale(prev.scale * SCALE_STEP);
      const ratio = newScale / prev.scale;
      return {
        x: cx - ratio * (cx - prev.x),
        y: cy - ratio * (cy - prev.y),
        scale: newScale,
      };
    });
  }, []);

  const zoomOut = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    setTransform((prev) => {
      const newScale = clampScale(prev.scale / SCALE_STEP);
      const ratio = newScale / prev.scale;
      return {
        x: cx - ratio * (cx - prev.x),
        y: cy - ratio * (cy - prev.y),
        scale: newScale,
      };
    });
  }, []);

  const resetZoom = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  const zoomToFit = useCallback((contentWidth: number, contentHeight: number) => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const scale = clampScale(
      Math.min(width / contentWidth, height / contentHeight, SCALE_MAX) * 0.9
    );
    const tx = (width - contentWidth * scale) / 2;
    const ty = (height - contentHeight * scale) / 2;
    setTransform({ x: tx, y: ty, scale });
  }, []);

  return { transform, containerRef, zoomIn, zoomOut, zoomToFit, resetZoom };
}
