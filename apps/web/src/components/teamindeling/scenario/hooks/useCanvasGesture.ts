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
  toggleZoom: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoom: (scale: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
}

// Twee preset zoomstanden
const ZOOM_DETAIL = 1.2;
const ZOOM_OVERZICHT = 0.55;

// Continue zoom limieten
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 2.0;
const ZOOM_STEP = 0.15; // stap voor +/- knoppen
const SCROLL_ZOOM_FACTOR = 0.002; // gevoeligheid scroll-zoom

export function useCanvasGesture(): CanvasGestureResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState<CanvasTransform>({ x: 0, y: 0, scale: ZOOM_DETAIL });
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

  // Zoom naar een punt (muiscursor of schermcentrum)
  const zoomToPoint = useCallback((newScale: number, clientX?: number, clientY?: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = clientX !== undefined ? clientX - rect.left : rect.width / 2;
    const cy = clientY !== undefined ? clientY - rect.top : rect.height / 2;
    const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newScale));

    setTransform((prev) => {
      const ratio = clamped / prev.scale;
      return {
        x: cx - ratio * (cx - prev.x),
        y: cy - ratio * (cy - prev.y),
        scale: clamped,
      };
    });
  }, []);

  useGesture(
    {
      onWheel: ({ event }) => {
        event.preventDefault();
        const delta = -event.deltaY * SCROLL_ZOOM_FACTOR;
        const prev = transformRef.current;
        const newScale = prev.scale * (1 + delta);
        zoomToPoint(newScale, event.clientX, event.clientY);
      },

      onDrag: ({ delta: [dx, dy], buttons, event, first, cancel }) => {
        const isMiddleMouse = (buttons & 4) !== 0;
        const isSpaceLeftClick = (buttons & 1) !== 0 && spaceHeld.current;
        // Left-click op de achtergrond (niet op een kaart) = ook pannen
        const target = event.target as HTMLElement | null;
        const isBackgroundLeftClick =
          (buttons & 1) !== 0 && !target?.closest("[data-gesture-card]");

        if (!isMiddleMouse && !isSpaceLeftClick && !isBackgroundLeftClick) {
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

  // 3-stap cycle: compact (0.55) → normaal (0.75) → detail (1.2) → compact
  const ZOOM_NORMAAL = 0.75;
  const toggleZoom = useCallback(() => {
    const prev = transformRef.current;
    if (prev.scale >= 1.0) {
      zoomToPoint(ZOOM_OVERZICHT); // detail → compact
    } else if (prev.scale >= 0.64) {
      zoomToPoint(ZOOM_DETAIL); // normaal → detail
    } else {
      zoomToPoint(ZOOM_NORMAAL); // compact → normaal
    }
  }, [zoomToPoint]);

  const zoomIn = useCallback(() => {
    const prev = transformRef.current;
    zoomToPoint(prev.scale + ZOOM_STEP);
  }, [zoomToPoint]);

  const zoomOut = useCallback(() => {
    const prev = transformRef.current;
    zoomToPoint(prev.scale - ZOOM_STEP);
  }, [zoomToPoint]);

  const resetZoom = useCallback(() => {
    zoomToPoint(1.0);
  }, [zoomToPoint]);

  const setZoom = useCallback(
    (scale: number) => {
      zoomToPoint(scale);
    },
    [zoomToPoint]
  );

  const setPan = useCallback((pan: { x: number; y: number }) => {
    setTransform((prev) => ({ ...prev, x: pan.x, y: pan.y }));
  }, []);

  return { transform, containerRef, toggleZoom, zoomIn, zoomOut, resetZoom, setZoom, setPan };
}
