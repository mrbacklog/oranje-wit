"use client";

import WhatIfPanel from "./WhatIfPanel";

interface WhatIfSidebarProps {
  open: boolean;
  werkindelingId: string;
  panelKey: number;
  activeWhatIfId: string | null;
  onClose: () => void;
  onNieuw: () => void;
  onActiveer: (id: string) => Promise<void>;
}

export default function WhatIfSidebar({
  open,
  werkindelingId,
  panelKey,
  activeWhatIfId,
  onClose,
  onNieuw,
  onActiveer,
}: WhatIfSidebarProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l border-[var(--border-default)] shadow-xl" style={{ background: "var(--surface-card)" }}>
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border-default)] px-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">What-if</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          title="Sluit what-if paneel"
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
      <div className="flex-1 overflow-hidden">
        <WhatIfPanel
          key={panelKey}
          werkindelingId={werkindelingId}
          onNieuw={onNieuw}
          activeWhatIfId={activeWhatIfId}
          onActiveer={onActiveer}
        />
      </div>
    </div>
  );
}
