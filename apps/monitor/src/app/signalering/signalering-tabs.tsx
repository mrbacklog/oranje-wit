"use client";

import { useState, type ReactNode } from "react";

const TABS = ["Overzicht", "Werving", "Retentie", "Pijplijn"] as const;
type Tab = (typeof TABS)[number];

const TAB_BESCHRIJVING: Record<Tab, string> = {
  Overzicht: "Samenvatting van alle signaleringen en strategisch advies per thema.",
  Werving: "Signaleringen over instroom en de vulgraad van de jeugdpijplijn.",
  Retentie: "Signaleringen over ledenbehoud en trendbreuken.",
  Pijplijn: "Signaleringen over doorstroom naar senioren en genderbalans.",
};

interface SignaleringTabsProps {
  overzichtContent: ReactNode;
  wervingContent: ReactNode;
  retentieContent: ReactNode;
  pijplijnContent: ReactNode;
}

export function SignaleringTabs({
  overzichtContent,
  wervingContent,
  retentieContent,
  pijplijnContent,
}: SignaleringTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Overzicht");

  const content: Record<Tab, ReactNode> = {
    Overzicht: overzichtContent,
    Werving: wervingContent,
    Retentie: retentieContent,
    Pijplijn: pijplijnContent,
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
