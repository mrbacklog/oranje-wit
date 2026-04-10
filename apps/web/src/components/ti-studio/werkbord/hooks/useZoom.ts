// apps/web/src/components/ti-studio/werkbord/hooks/useZoom.ts
"use client";
import { useState, useCallback } from "react";
import type { ZoomLevel } from "../types";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.5;
const DEFAULT_ZOOM = 0.75;

function toZoomLevel(zoom: number): ZoomLevel {
  if (zoom < 0.8) return "compact";
  if (zoom < 1.0) return "normaal";
  return "detail";
}

export function useZoom() {
  const [zoom, setZoomRaw] = useState<number>(DEFAULT_ZOOM);

  const setZoom = useCallback((value: number) => {
    setZoomRaw(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)));
  }, []);

  const zoomIn = useCallback(() => setZoom(zoom + 0.1), [zoom, setZoom]);
  const zoomOut = useCallback(() => setZoom(zoom - 0.1), [zoom, setZoom]);
  const resetZoom = useCallback(() => setZoom(DEFAULT_ZOOM), [setZoom]);

  return {
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomLevel: toZoomLevel(zoom),
    zoomPercent: Math.round(zoom * 100),
  };
}
