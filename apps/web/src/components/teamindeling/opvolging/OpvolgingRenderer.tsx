"use client";

import { useState } from "react";
import WerkbordOverzicht from "../werkbord/WerkbordOverzicht";
import VoorstellenInbox from "./VoorstellenInbox";
import type { WerkitemData } from "../werkbord/WerkitemKaart";
import type {
  VoorstelItem,
  GezienVoorstelItem,
} from "@/app/(teamindeling-studio)/ti-studio/opvolging/voorstel-actions";

interface OpvolgingRendererProps {
  kadersId: string;
  seizoen: string;
  initialWerkitems: WerkitemData[];
  initialStats: { open: number; blockers: number; besluiten: number; afgerond: number };
  refreshAction: () => Promise<{
    werkitems: WerkitemData[];
    stats: { open: number; blockers: number; besluiten: number; afgerond: number };
  }>;
  initialVoorstellen: VoorstelItem[];
  initialGezienVoorstellen: GezienVoorstelItem[];
  voorstellenBadge: number;
}

const TABS = [
  { id: "werkbord", label: "Werkbord" },
  { id: "voorstellen", label: "Voorstellen" },
] as const;

export default function OpvolgingRenderer({
  kadersId,
  seizoen,
  initialWerkitems,
  initialStats,
  refreshAction,
  initialVoorstellen,
  initialGezienVoorstellen,
  voorstellenBadge,
}: OpvolgingRendererProps) {
  const [activeTab, setActiveTab] = useState<"werkbord" | "voorstellen">("werkbord");

  const tabs = [
    { id: "werkbord", label: "Werkbord" },
    {
      id: "voorstellen",
      label: "Voorstellen",
      badge: voorstellenBadge > 0 ? voorstellenBadge : undefined,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Opvolging
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Acties en besluiten voor seizoen {seizoen}
        </p>
      </div>

      {/* Tab nav */}
      <div
        className="flex gap-1 rounded-lg p-1"
        style={{ background: "var(--bg-secondary, #141414)" }}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as "werkbord" | "voorstellen")}
            className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            style={{
              color:
                activeTab === tab.id ? "var(--text-primary, #fafafa)" : "var(--text-muted, #666)",
              background: activeTab === tab.id ? "var(--bg-tertiary, #1e1e1e)" : "transparent",
            }}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold"
                style={{ background: "var(--ow-accent, #FF6B00)", color: "#fff" }}
              >
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === "werkbord" && (
          <WerkbordOverzicht
            kadersId={kadersId}
            initialWerkitems={initialWerkitems}
            initialStats={initialStats}
            refreshAction={refreshAction}
          />
        )}
        {activeTab === "voorstellen" && (
          <VoorstellenInbox
            initialVoorstellen={initialVoorstellen}
            initialGezienVoorstellen={initialGezienVoorstellen}
          />
        )}
      </div>
    </div>
  );
}
