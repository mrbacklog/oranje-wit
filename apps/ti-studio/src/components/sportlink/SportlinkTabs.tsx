"use client";

import { useState, useEffect } from "react";
import { LedenSync } from "./LedenSync";
import { TeamSync } from "./TeamSync";
import { WijzigingsSignalen } from "./WijzigingsSignalen";
import { SportlinkSync } from "./SportlinkSync";
import { SportlinkAuthGate, useSportlinkLogout } from "./SportlinkAuth";
import type { WijzigingsSignaal } from "@oranje-wit/sportlink";

type Tab = "leden" | "teams" | "wijzigingen" | "spelers";

const TABS: { id: Tab; label: string }[] = [
  { id: "leden", label: "Leden" },
  { id: "teams", label: "Teams" },
  { id: "wijzigingen", label: "Wijzigingen" },
  { id: "spelers", label: "Spelers" },
];

export function SportlinkTabs() {
  return (
    <SportlinkAuthGate>
      <TabsInnerContent />
    </SportlinkAuthGate>
  );
}

function TabsInnerContent() {
  const [activeTab, setActiveTab] = useState<Tab>("leden");
  const [signalen, setSignalen] = useState<WijzigingsSignaal[]>([]);
  const [signalenLoading, setSignalenLoading] = useState(false);
  const logout = useSportlinkLogout();

  useEffect(() => {
    if (activeTab === "wijzigingen" && signalen.length === 0 && !signalenLoading) {
      setSignalenLoading(true);
      fetch("/api/sportlink/wijzigingen", { credentials: "same-origin" })
        .then((r) => r.json())
        .then((data) => {
          if (data.data?.signalen) setSignalen(data.data.signalen);
        })
        .finally(() => setSignalenLoading(false));
    }
  }, [activeTab]);

  return (
    <div>
      {/* Tab navigatie */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--border-1, #3a3a3a)",
          marginBottom: 24,
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--text-1, #fafafa)" : "var(--text-3, #666)",
                  background: "none",
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid var(--accent, #ff6b00)"
                    : "2px solid transparent",
                  marginBottom: -1,
                  cursor: "pointer",
                  transition: "color .15s",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={logout}
          style={{
            padding: "6px 12px",
            marginBottom: 6,
            fontSize: 12,
            color: "var(--text-3, #666)",
            background: "none",
            border: "1px solid var(--border-1, #3a3a3a)",
            borderRadius: 6,
            cursor: "pointer",
          }}
          title="Wist credentials uit het geheugen"
        >
          Uitloggen
        </button>
      </div>

      {/* Tab inhoud */}
      {activeTab === "leden" && <LedenSync />}
      {activeTab === "teams" && <TeamSync />}
      {activeTab === "wijzigingen" && <WijzigingsSignalen signalen={signalen} />}
      {activeTab === "spelers" && <SportlinkSync />}
    </div>
  );
}
