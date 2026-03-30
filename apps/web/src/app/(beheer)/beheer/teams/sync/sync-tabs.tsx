"use client";

import { useState } from "react";
import { LedenSyncPanel } from "@/components/beheer/leden-sync-panel";
import { TeamsSnapshotPanel } from "@/components/beheer/teams-snapshot-panel";

interface Props {
  seizoenOpties: string[];
  huidigSeizoen: string;
}

const TABS = [
  { id: "leden" as const, label: "Leden" },
  { id: "teams" as const, label: "Teams" },
];

export function SyncTabs({ seizoenOpties, huidigSeizoen }: Props) {
  const [actieveTab, setActieveTab] = useState<"leden" | "teams">("leden");

  return (
    <div>
      {/* Tab headers */}
      <div
        className="mb-4 flex gap-1 rounded-lg p-1"
        style={{ backgroundColor: "var(--surface-sunken)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActieveTab(tab.id)}
            className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: actieveTab === tab.id ? "var(--surface-card)" : "transparent",
              color: actieveTab === tab.id ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: actieveTab === tab.id ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {actieveTab === "leden" && <LedenSyncPanel />}
      {actieveTab === "teams" && (
        <TeamsSnapshotPanel seizoenOpties={seizoenOpties} huidigSeizoen={huidigSeizoen} />
      )}
    </div>
  );
}
