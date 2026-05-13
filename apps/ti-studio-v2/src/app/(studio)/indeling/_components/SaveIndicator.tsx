"use client";

import type { SaveState } from "./werkbord-types";

interface SaveIndicatorProps {
  state: SaveState;
}

export function SaveIndicator({ state }: SaveIndicatorProps) {
  const visible = state !== "idle";

  return (
    <div
      className={`save-indicator${visible ? "visible" : ""}${state === "saving" ? "saving" : ""}${state === "error" ? "error" : ""}`}
    >
      <span className="save-dot" />
      {state === "saving"
        ? "Opslaan..."
        : state === "saved"
          ? "Opgeslagen"
          : state === "error"
            ? "Fout bij opslaan"
            : "Opgeslagen"}
    </div>
  );
}
