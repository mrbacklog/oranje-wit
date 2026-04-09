"use client";

import { useMemo, useEffect } from "react";
import { useCanvasGesture } from "../hooks/useCanvasGesture";
import { getDetailLevel } from "../types";
import type { DetailLevel } from "../types";
import { ZoomScaleProvider } from "./ZoomScaleContext";

interface GestureCanvasProps {
  children: (detailLevel: DetailLevel) => React.ReactNode;
  onZoomLabelChange?: (label: string) => void;
}

function getZoomLabel(scale: number): string {
  if (scale < 0.64) return "Compact";
  if (scale < 1.0) return "Normaal";
  return "Detail";
}

export default function GestureCanvas({ children, onZoomLabelChange }: GestureCanvasProps) {
  const { transform, containerRef, toggleZoom, zoomIn, zoomOut, resetZoom } = useCanvasGesture();
  const detailLevel = useMemo(() => getDetailLevel(transform.scale), [transform.scale]);
  const isDetail = detailLevel === "detail";
  const zoomPct = Math.round(transform.scale * 100);
  const zoomLabel = getZoomLabel(transform.scale);

  useEffect(() => {
    onZoomLabelChange?.(zoomLabel);
  }, [zoomLabel, onZoomLabelChange]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden"
        style={{ touchAction: "none" }}
        data-zoom-level={detailLevel}
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
      <div
        className="absolute right-4 bottom-4 z-10 flex items-center gap-1 rounded-lg px-1 py-1 shadow-sm"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <button
          onClick={zoomOut}
          className="hover:bg-surface-raised rounded px-1.5 py-1 text-xs font-bold transition-colors"
          style={{ color: "var(--text-secondary)" }}
          title="Zoom uit"
        >
          −
        </button>
        <button
          onClick={resetZoom}
          className="hover:bg-surface-raised min-w-[38px] rounded px-1 py-1 text-center text-xs font-medium transition-colors"
          style={{ color: "var(--text-secondary)" }}
          title="Reset zoom naar 100%"
        >
          {zoomPct}%
        </button>
        <button
          onClick={zoomIn}
          className="hover:bg-surface-raised rounded px-1.5 py-1 text-xs font-bold transition-colors"
          style={{ color: "var(--text-secondary)" }}
          title="Zoom in"
        >
          +
        </button>
        <div className="mx-0.5 h-4 w-px" style={{ background: "var(--border-default)" }} />
        <button
          onClick={toggleZoom}
          className="hover:bg-surface-raised rounded px-2 py-1 text-xs font-medium transition-colors"
          style={{ color: "var(--text-secondary)" }}
          title={isDetail ? "Schakel naar overzicht" : "Schakel naar detail"}
        >
          {isDetail ? "Overzicht" : "Detail"}
        </button>
      </div>
    </div>
  );
}
