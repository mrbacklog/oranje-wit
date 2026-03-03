"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { RefCallback } from "react";
import { zoom as d3Zoom, zoomIdentity } from "d3-zoom";
import type { ZoomBehavior, ZoomTransform } from "d3-zoom";
import { select } from "d3-selection";

export interface CanvasZoomResult {
  transform: ZoomTransform;
  containerRef: RefCallback<HTMLDivElement>;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: (contentWidth: number, contentHeight: number) => void;
  resetZoom: () => void;
}

const TRANSITION_MS = 300;
const SCALE_STEP = 1.4;
const SCALE_EXTENT: [number, number] = [0.25, 1.5];

export function useCanvasZoom(): CanvasZoomResult {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);

  const spaceHeld = useRef(false);

  useLayoutEffect(() => {
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

  const behavior = useMemo<ZoomBehavior<HTMLDivElement, unknown>>(() => {
    return d3Zoom<HTMLDivElement, unknown>()
      .scaleExtent(SCALE_EXTENT)
      .filter((event: Event) => {
        const e = event as MouseEvent & WheelEvent;
        if (e.type === "wheel") return true;
        if (e.type === "mousedown" && (e as MouseEvent).button === 1) return true;
        if (e.type === "mousedown" && (e as MouseEvent).button === 0 && spaceHeld.current)
          return true;
        return false;
      })
      .on("zoom", ({ transform: t }: { transform: ZoomTransform }) => {
        setTransform(t);
      });
  }, []);

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const sel = select<HTMLDivElement, unknown>(el);
    sel.call(behavior);
    return () => {
      sel.on(".zoom", null);
    };
  }, [behavior]);

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    elRef.current = el;
  }, []);

  const getSelection = useCallback(() => {
    return elRef.current ? select<HTMLDivElement, unknown>(elRef.current) : null;
  }, []);

  const zoomIn = useCallback(() => {
    getSelection()?.transition().duration(TRANSITION_MS).call(behavior.scaleBy, SCALE_STEP);
  }, [behavior, getSelection]);

  const zoomOut = useCallback(() => {
    getSelection()
      ?.transition()
      .duration(TRANSITION_MS)
      .call(behavior.scaleBy, 1 / SCALE_STEP);
  }, [behavior, getSelection]);

  const resetZoom = useCallback(() => {
    getSelection()?.transition().duration(TRANSITION_MS).call(behavior.transform, zoomIdentity);
  }, [behavior, getSelection]);

  const zoomToFit = useCallback(
    (contentWidth: number, contentHeight: number) => {
      const el = elRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const scale = Math.min(width / contentWidth, height / contentHeight, SCALE_EXTENT[1]) * 0.9;
      const clampedScale = Math.max(SCALE_EXTENT[0], scale);
      const tx = (width - contentWidth * clampedScale) / 2;
      const ty = (height - contentHeight * clampedScale) / 2;
      getSelection()
        ?.transition()
        .duration(TRANSITION_MS)
        .call(behavior.transform, zoomIdentity.translate(tx, ty).scale(clampedScale));
    },
    [behavior, getSelection]
  );

  return { transform, containerRef, zoomIn, zoomOut, zoomToFit, resetZoom };
}
