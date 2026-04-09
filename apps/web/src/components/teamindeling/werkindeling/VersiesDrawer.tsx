"use client";

import VersiesPanel from "./VersiesPanel";

export interface VersieRij {
  id: string;
  nummer: number;
  naam: string | null;
  auteur: string;
  createdAt: string;
  isHuidig: boolean;
}

interface VersiesDrawerProps {
  open: boolean;
  versies: VersieRij[];
  gebruikerEmail: string;
  onClose: () => void;
}

/** Rechter overlay-drawer voor versiegeschiedenis. */
export default function VersiesDrawer({
  open,
  versies,
  gebruikerEmail,
  onClose,
}: VersiesDrawerProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col shadow-xl"
      style={{
        borderLeft: "1px solid var(--border-default)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      <div
        className="flex h-12 shrink-0 items-center justify-between px-4"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Versiegeschiedenis
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          title="Sluit versies"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <VersiesPanel versies={versies} gebruikerEmail={gebruikerEmail} />
      </div>
    </div>
  );
}
