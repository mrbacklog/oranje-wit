"use client";

import { useCallback, useEffect } from "react";

interface BevestigDialoogProps {
  open: boolean;
  titel: string;
  bericht: string;
  bevestigTekst?: string;
  annuleerTekst?: string;
  variant?: "danger" | "warning";
  onBevestig: () => void;
  onAnnuleer: () => void;
}

export default function BevestigDialoog({
  open,
  titel,
  bericht,
  bevestigTekst = "Bevestig",
  annuleerTekst = "Annuleer",
  variant = "danger",
  onBevestig,
  onAnnuleer,
}: BevestigDialoogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onAnnuleer();
    },
    [onAnnuleer]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onAnnuleer}>
      <div
        className="dialog-panel w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="bevestig-titel"
        aria-describedby="bevestig-bericht"
      >
        <div className="dialog-header">
          <h3 id="bevestig-titel" className="text-lg font-bold text-gray-900">
            {titel}
          </h3>
        </div>
        <div className="dialog-body">
          <p id="bevestig-bericht" className="text-sm text-gray-600">
            {bericht}
          </p>
        </div>
        <div className="dialog-footer">
          <button onClick={onAnnuleer} className="btn-ghost">
            {annuleerTekst}
          </button>
          <button
            onClick={onBevestig}
            className={variant === "danger" ? "btn btn-danger" : "btn btn-primary"}
            autoFocus
          >
            {bevestigTekst}
          </button>
        </div>
      </div>
    </div>
  );
}
