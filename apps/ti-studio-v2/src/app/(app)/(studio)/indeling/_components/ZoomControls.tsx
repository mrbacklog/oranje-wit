"use client";

function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

interface ZoomControlsProps {
  zoom: "compact" | "detail";
  onZoomChange: (zoom: "compact" | "detail") => void;
  onReset: () => void;
}

export function ZoomControls({ zoom, onZoomChange, onReset }: ZoomControlsProps) {
  return (
    <div className="zoom-controls">
      <button
        className={cx("zoom-btn", zoom === "compact" && "active")}
        onClick={() => onZoomChange("compact")}
      >
        Compact
      </button>
      <button
        className={cx("zoom-btn", zoom === "detail" && "active")}
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
