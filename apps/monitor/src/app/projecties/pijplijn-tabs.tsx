"use client";

import { useState, type ReactNode } from "react";

const TABS = ["Pijplijn", "Projectie"] as const;
type Tab = (typeof TABS)[number];

const TAB_BESCHRIJVING: Record<Tab, string> = {
  Pijplijn:
    "Hoeveel spelers hebben we per leeftijd? Waar zitten de gaten en knelpunten ten opzichte van het streefmodel?",
  Projectie:
    "Hoe stromen spelers door naar senioren? Projectie op basis van historische doorstroompercentages.",
};

interface PijplijnTabsProps {
  pijplijnContent: ReactNode;
  projectieContent: ReactNode;
}

export function PijplijnTabs({ pijplijnContent, projectieContent }: PijplijnTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Pijplijn");

  const content: Record<Tab, ReactNode> = {
    Pijplijn: pijplijnContent,
    Projectie: projectieContent,
  };

  return (
    <>
      <div role="tablist" className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            id={`tab-${tab.toLowerCase()}`}
            role="tab"
            type="button"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <p className="mb-6 text-sm text-gray-500">{TAB_BESCHRIJVING[activeTab]}</p>

      <div role="tabpanel" aria-labelledby={`tab-${activeTab.toLowerCase()}`}>
        {content[activeTab]}
      </div>
    </>
  );
}
