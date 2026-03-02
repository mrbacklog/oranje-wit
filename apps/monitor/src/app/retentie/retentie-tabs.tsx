"use client";

import { useState, type ReactNode } from "react";

const TABS = ["Retentie", "Instroom", "Uitstroom", "Cohorten"] as const;
type Tab = (typeof TABS)[number];

const TAB_BESCHRIJVING: Record<Tab, string> = {
  Retentie:
    "Welk percentage leden keert seizoen na seizoen terug? De retentiecurve toont per leeftijd hoeveel spelers het volgende seizoen weer meedoen.",
  Instroom:
    "Hoeveel nieuwe spelers komen erbij? Instroom omvat zowel volledig nieuwe leden als herinschrijvers die na een onderbreking terugkeren.",
  Uitstroom:
    "Hoeveel spelers stoppen er? Uitstroom laat per leeftijd zien wanneer leden de vereniging verlaten \u2014 en of dat bij jongens of meisjes vaker voorkomt.",
  Cohorten:
    "Hoe presteren instroom-jaargangen over de jaren? Volg elk cohort van binnenkomst tot nu \u2014 en zie welke jaargangen het best vasthouden.",
};

interface RetentieTabsProps {
  retentieContent: ReactNode;
  instroomContent: ReactNode;
  uitstroomContent: ReactNode;
  cohortenContent: ReactNode;
}

export function RetentieTabs({
  retentieContent,
  instroomContent,
  uitstroomContent,
  cohortenContent,
}: RetentieTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Retentie");

  const content: Record<Tab, ReactNode> = {
    Retentie: retentieContent,
    Instroom: instroomContent,
    Uitstroom: uitstroomContent,
    Cohorten: cohortenContent,
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
