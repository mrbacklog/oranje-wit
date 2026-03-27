"use client";

import { useMemo } from "react";
import { useCanvasGesture } from "../hooks/useCanvasGesture";
import { getDetailLevel } from "../types";
import type { DetailLevel } from "../types";
import { ZoomScaleProvider } from "./ZoomScaleContext";

interface GestureCanvasProps {
  children: (detailLevel: DetailLevel) => React.ReactNode;
}

export default function GestureCanvas({ children }: GestureCanvasProps) {
  const { transform, containerRef, toggleZoom, zoomIn, zoomOut, resetZoom } = useCanvasGesture();
  const detailLevel = useMemo(() => getDetailLevel(transform.scale), [transform.scale]);
  const isDetail = detailLevel === "detail";
  const zoomPct = Math.round(transform.scale * 100);

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
      <div className="absolute right-4 bottom-4 z-10 flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-1 py-1 shadow-sm">
        <button
          onClick={zoomOut}
          className="rounded px-1.5 py-1 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          title="Zoom uit"
        >
          −
        </button>
        <button
          onClick={resetZoom}
          className="min-w-[38px] rounded px-1 py-1 text-center text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
          title="Reset zoom naar 100%"
        >
          {zoomPct}%
        </button>
        <button
          onClick={zoomIn}
          className="rounded px-1.5 py-1 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          title="Zoom in"
        >
          +
        </button>
        <div className="mx-0.5 h-4 w-px bg-gray-200" />
        <button
          onClick={toggleZoom}
          className="rounded px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
          title={isDetail ? "Schakel naar overzicht" : "Schakel naar detail"}
        >
          {isDetail ? "Overzicht" : "Detail"}
        </button>
      </div>
    </div>
  );
}
