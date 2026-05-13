"use client";

interface ZoomControlsProps {
  zoom: "compact" | "detail";
  onZoomChange: (zoom: "compact" | "detail") => void;
  onReset: () => void;
}

export function ZoomControls({ zoom, onZoomChange, onReset }: ZoomControlsProps) {
  return (
    <div className="zoom-controls">
      <button
        className={`zoom-btn${zoom === "compact" ? "active" : ""}`}
        onClick={() => onZoomChange("compact")}
      >
        Compact
      </button>
      <button
        className={`zoom-btn${zoom === "detail" ? "active" : ""}`}
        onClick={() => onZoomChange("detail")}
      >
        Detail
      </button>
      <button className="zoom-btn" onClick={onReset} title="Terug naar beginpositie">
        ⌂
      </button>
    </div>
  );
}
