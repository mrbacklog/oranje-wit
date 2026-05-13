"use client";

import type { SaveState } from "./werkbord-types";

function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

interface SaveIndicatorProps {
  state: SaveState;
}

export function SaveIndicator({ state }: SaveIndicatorProps) {
  const visible = state !== "idle";

  return (
    <div
      className={cx(
        "save-indicator",
        visible && "visible",
        state === "saving" && "saving",
        state === "error" && "error"
      )}
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
