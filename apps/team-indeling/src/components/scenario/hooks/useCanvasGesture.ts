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
}

// Twee vaste zoomstanden
const ZOOM_DETAIL = 1.0;
const ZOOM_OVERZICHT = 0.4;

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

  useGesture(
    {
      onWheel: ({ event }) => {
        // Voorkom standaard scrollgedrag maar zoom niet continu
        event.preventDefault();
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

  const toggleZoom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    setTransform((prev) => {
      const isDetail = prev.scale >= 0.7;
      const newScale = isDetail ? ZOOM_OVERZICHT : ZOOM_DETAIL;
      const ratio = newScale / prev.scale;
      return {
        x: cx - ratio * (cx - prev.x),
        y: cy - ratio * (cy - prev.y),
        scale: newScale,
      };
    });
  }, []);

  return { transform, containerRef, toggleZoom };
}
