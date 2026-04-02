"use client";

import { useState } from "react";
import { TeamTab } from "../team-tab";
import { ResultatenTab } from "../resultaten-tab";
import type { TeamSpeler, TeamSpelerTelling } from "@/lib/monitor/queries/teams";
import type { StafLid } from "@/lib/monitor/queries/staf";
import type { TeamUitslagen } from "@/lib/monitor/queries/uitslagen";

type Tab = "spelers" | "standen";

type Props = {
  spelers?: TeamSpeler[];
  telling?: TeamSpelerTelling;
  staf?: StafLid[];
  uitslagen?: TeamUitslagen;
  qs: string;
};

const TABS: [Tab, string][] = [
  ["spelers", "Spelers & Staf"],
  ["standen", "Standen"],
];

export function TeamDetailTabs({ spelers, telling, staf, uitslagen, qs }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("spelers");

  return (
    <>
      <div role="tablist" className="flex">
        {TABS.map(([tab, label]) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            role="tab"
            type="button"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`-mb-px cursor-pointer rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-border-default border-b-surface-card bg-surface-card text-text-primary z-10 border"
                : "bg-surface-raised text-text-muted hover:text-text-secondary border border-transparent"
            } `}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="border-border-default bg-surface-card rounded-tr-lg rounded-b-lg border p-6">
        {activeTab === "spelers" && (
          <div role="tabpanel" aria-labelledby="tab-spelers">
            <TeamTab spelers={spelers} telling={telling} staf={staf} qs={qs} />
          </div>
        )}
        {activeTab === "standen" && (
          <div role="tabpanel" aria-labelledby="tab-standen">
            <ResultatenTab uitslagen={uitslagen} />
          </div>
        )}
      </div>
    </>
  );
}
