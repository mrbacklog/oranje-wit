"use client";

import { useMemo } from "react";
import { useCanvasZoom } from "../hooks/useCanvasZoom";
import { getDetailLevel } from "../types";
import type { DetailLevel } from "../types";
import { ZoomScaleProvider } from "./ZoomScaleContext";

interface ZoomCanvasProps {
  children: (detailLevel: DetailLevel) => React.ReactNode;
}

export default function ZoomCanvas({ children }: ZoomCanvasProps) {
  const { transform, containerRef, zoomIn, zoomOut, zoomToFit, resetZoom } = useCanvasZoom();

  const detailLevel = useMemo(() => getDetailLevel(transform.k), [transform.k]);
  const percentage = Math.round(transform.k * 100);

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Zoom viewport — d3-zoom luistert hier */}
      <div ref={containerRef} className="h-full w-full overflow-hidden">
        {/* Getransformeerde inner div */}
        <div
          style={
            {
              transformOrigin: "0 0",
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
              willChange: "transform",
              "--zoom-scale": transform.k,
            } as React.CSSProperties
          }
        >
          <ZoomScaleProvider value={transform.k}>{children(detailLevel)}</ZoomScaleProvider>
        </div>
      </div>

      {/* Zoom controls — zwevend rechtsonder */}
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
          onClick={() => zoomToFit(2400, 1600)}
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
