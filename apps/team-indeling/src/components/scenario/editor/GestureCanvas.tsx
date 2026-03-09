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
  const { transform, containerRef, toggleZoom } = useCanvasGesture();
  const detailLevel = useMemo(() => getDetailLevel(transform.scale), [transform.scale]);
  const isDetail = detailLevel === "detail";

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
          onClick={toggleZoom}
          className="rounded px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
          title={isDetail ? "Schakel naar overzicht (40%)" : "Schakel naar detail (100%)"}
        >
          {isDetail ? "Overzicht" : "Detail"}
        </button>
      </div>
    </div>
  );
}
