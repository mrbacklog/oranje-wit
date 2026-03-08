"use client";

import { useMemo } from "react";
import { useCanvasGesture } from "../hooks/useCanvasGesture";
import { getDetailLevel } from "../types";
import type { DetailLevel } from "../types";
import { ZoomScaleProvider } from "./ZoomScaleContext";

interface GestureCanvasProps {
  children: (detailLevel: DetailLevel) => React.ReactNode;
  contentSize?: { width: number; height: number };
}

export default function GestureCanvas({ children, contentSize }: GestureCanvasProps) {
  const { transform, containerRef, zoomIn, zoomOut, zoomToFit, resetZoom } = useCanvasGesture();
  const detailLevel = useMemo(() => getDetailLevel(transform.scale), [transform.scale]);
  const percentage = Math.round(transform.scale * 100);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden"
        style={{ touchAction: "none" }}
      >
        <div
          style={
            {
              transformOrigin: "0 0",
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              willChange: "transform",
              "--zoom-scale": transform.scale,
            } as React.CSSProperties
          }
        >
          <ZoomScaleProvider value={transform.scale}>{children(detailLevel)}</ZoomScaleProvider>
        </div>
      </div>
      <div className="absolute right-4 bottom-4 z-10 flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
        <button
          onClick={zoomOut}
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Zoom uit"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="min-w-[3rem] text-center text-xs text-gray-500">{percentage}%</span>
        <button
          onClick={zoomIn}
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Zoom in"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="mx-1 h-4 w-px bg-gray-200" />
        <button
          onClick={() => zoomToFit(contentSize?.width ?? 2400, contentSize?.height ?? 1600)}
          className="rounded p-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Pas alles in"
        >
          Fit
        </button>
        <button
          onClick={resetZoom}
          className="rounded p-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Reset naar 100%"
        >
          100%
        </button>
      </div>
    </div>
  );
}
