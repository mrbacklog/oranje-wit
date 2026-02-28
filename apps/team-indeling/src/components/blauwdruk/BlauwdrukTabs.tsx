"use client";

import { useState } from "react";
import type { LedenStatistieken, SpelerUitgebreid } from "@/app/blauwdruk/actions";
import type { CategorieKaders } from "@/app/blauwdruk/categorie-kaders";
import CategoriePanel from "./CategoriePanel";
import LedenDashboard from "./LedenDashboard";
import ToelichtingEditor from "./ToelichtingEditor";

interface BlauwdrukTabsProps {
  statistieken: LedenStatistieken;
  kaders: CategorieKaders;
  blauwdrukId: string;
  spelers: SpelerUitgebreid[];
  toelichting: string;
}

const TABS = [
  { id: "categorieen", label: "Categorieën" },
  { id: "leden", label: "Leden" },
  { id: "notities", label: "Notities" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function BlauwdrukTabs({
  statistieken,
  kaders,
  blauwdrukId,
  spelers,
  toelichting,
}: BlauwdrukTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("categorieen");

  return (
    <div>
      {/* Tab-balk */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-orange-700 border-b-2 border-orange-500 -mb-px"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab-inhoud */}
      {activeTab === "categorieen" && (
        <CategoriePanel
          statistieken={statistieken}
          kaders={kaders}
          blauwdrukId={blauwdrukId}
        />
      )}

      {activeTab === "leden" && <LedenDashboard spelers={spelers} />}

      {activeTab === "notities" && (
        <ToelichtingEditor
          blauwdrukId={blauwdrukId}
          initieel={toelichting}
        />
      )}
    </div>
  );
}
