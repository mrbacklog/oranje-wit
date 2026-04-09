"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
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

// Canvas virtual dimensions used for minimap calculations
const CANVAS_W = 4000;
const CANVAS_H = 3000;

export default function GestureCanvas({ children, onZoomLabelChange }: GestureCanvasProps) {
  const { transform, containerRef, toggleZoom, zoomIn, zoomOut, resetZoom, setZoom, setPan } =
    useCanvasGesture();
  const detailLevel = useMemo(() => getDetailLevel(transform.scale), [transform.scale]);
  const zoomPct = Math.round(transform.scale * 100);
  const zoomLabel = getZoomLabel(transform.scale);

  useEffect(() => {
    onZoomLabelChange?.(zoomLabel);
  }, [zoomLabel, onZoomLabelChange]);

  const handleFit = useCallback(() => {
    setZoom(0.75);
    setPan({ x: 20, y: 20 });
  }, [setZoom, setPan]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setZoom(Number(e.target.value));
    },
    [setZoom]
  );

  // Viewport dimensions — stabiel op server én client (geen window tijdens SSR)
  const [vpSize, setVpSize] = useState({ w: 1280, h: 800 });
  useEffect(() => {
    setVpSize({ w: window.innerWidth, h: window.innerHeight });
    const onResize = () => setVpSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Minimap viewport indicator dimensions
  const minimapW = 140;
  const minimapH = 96;
  const mmVpLeft = Math.max(0, Math.min(minimapW - 10, (-transform.x / CANVAS_W) * minimapW));
  const mmVpTop = Math.max(0, Math.min(minimapH - 6, (-transform.y / CANVAS_H) * minimapH));
  const mmVpW = Math.min(minimapW, (vpSize.w / transform.scale / CANVAS_W) * minimapW);
  const mmVpH = Math.min(minimapH, (vpSize.h / transform.scale / CANVAS_H) * minimapH);

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

      {/* Zoom controls — links-beneden */}
      <div
        className="absolute bottom-4 left-4 z-10 flex flex-col gap-1"
        style={{ userSelect: "none" }}
      >
        {/* Tick labels */}
        <div
          className="flex justify-between text-[9px] font-medium"
          style={{
            width: 122,
            paddingLeft: 28,
            paddingRight: 4,
            color: "var(--text-tertiary, #666)",
          }}
        >
          <span>40%</span>
          <span style={{ color: "var(--ow-oranje-500, #ff6b00)" }}>64%</span>
          <span style={{ color: "var(--ow-oranje-500, #ff6b00)" }}>100%</span>
          <span>150%</span>
        </div>

        {/* Controls row */}
        <div
          className="flex items-center gap-1 rounded-lg px-1.5 py-1 shadow-sm"
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
          <input
            type="range"
            min={0.4}
            max={1.5}
            step={0.01}
            value={transform.scale}
            onChange={handleSliderChange}
            style={{ width: 90, accentColor: "var(--ow-oranje-500, #ff6b00)" }}
            title={`Zoom: ${zoomPct}%`}
          />
          <button
            onClick={zoomIn}
            className="hover:bg-surface-raised rounded px-1.5 py-1 text-xs font-bold transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="Zoom in"
          >
            +
          </button>
          <span
            className="min-w-[32px] text-center text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {zoomPct}%
          </span>
          <div className="mx-0.5 h-4 w-px" style={{ background: "var(--border-default)" }} />
          <button
            onClick={handleFit}
            className="hover:bg-surface-raised rounded px-2 py-1 text-xs font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="Fit — toon alle kaarten"
          >
            Fit
          </button>
          <div className="mx-0.5 h-4 w-px" style={{ background: "var(--border-default)" }} />
          <button
            onClick={toggleZoom}
            className="hover:bg-surface-raised rounded px-2 py-1 text-xs font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title={
              detailLevel === "detail"
                ? "Schakel naar compact"
                : detailLevel === "normaal"
                  ? "Schakel naar detail"
                  : "Schakel naar normaal"
            }
          >
            {detailLevel === "detail"
              ? "Compact"
              : detailLevel === "normaal"
                ? "Detail"
                : "Normaal"}
          </button>
        </div>
      </div>

      {/* Minimap — rechts-beneden */}
      <div
        className="absolute z-10 overflow-hidden rounded-lg border"
        style={{
          bottom: 16,
          right: 16,
          width: minimapW,
          height: minimapH,
          background: "var(--surface-card)",
          borderColor: "var(--border-default)",
          boxShadow: "0 2px 4px rgba(0,0,0,.5)",
        }}
      >
        {/* Viewport indicator */}
        <div
          className="absolute rounded-sm border"
          style={{
            top: mmVpTop,
            left: mmVpLeft,
            width: mmVpW,
            height: mmVpH,
            borderColor: "rgba(255,107,0,.4)",
            background: "rgba(255,107,0,.06)",
          }}
        />
        <span
          className="absolute right-1.5 bottom-1 text-[9px] font-semibold tracking-wide uppercase"
          style={{ color: "var(--text-tertiary, #666)" }}
        >
          Map
        </span>
      </div>
    </div>
  );
}
