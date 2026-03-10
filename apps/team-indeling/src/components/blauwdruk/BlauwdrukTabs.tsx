"use client";

import { useState, useCallback, useTransition } from "react";
import type { LedenStatistieken, SpelerUitgebreid, PinMetNamen } from "@/app/blauwdruk/actions";
import { deletePin } from "@/app/pins/actions";
import type { CategorieKaders } from "@/app/blauwdruk/categorie-kaders";
import CategoriePanel from "./CategoriePanel";
import LedenDashboard from "./LedenDashboard";
import ToelichtingEditor from "./ToelichtingEditor";
import PinsOverzicht from "./PinsOverzicht";
import NotitieOverzicht from "@/components/notities/NotitieOverzicht";
import BlockerChecklist from "@/components/notities/BlockerChecklist";

type BlockerNotitie = {
  id: string;
  titel: string;
  categorie: string;
  auteur: { naam: string };
  createdAt: Date;
};

type NotitieData = Parameters<typeof NotitieOverzicht>[0]["initialNotities"][number];

interface BlauwdrukTabsProps {
  statistieken: LedenStatistieken;
  kaders: CategorieKaders;
  blauwdrukId: string;
  spelers: SpelerUitgebreid[];
  toelichting: string;
  blockers?: BlockerNotitie[];
  notities: NotitieData[];
  notitieStats: { open: number; blockers: number; afgerond: number };
  refreshNotities: () => Promise<{
    notities: NotitieData[];
    stats: { open: number; blockers: number; afgerond: number };
  }>;
  pins: PinMetNamen[];
}

const TABS = [
  { id: "categorieen", label: "Categorieën" },
  { id: "leden", label: "Leden" },
  { id: "toelichting", label: "Toelichting" },
  { id: "actiepunten", label: "Actiepunten" },
  { id: "pins", label: "Pins" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function BlauwdrukTabs({
  statistieken,
  kaders,
  blauwdrukId,
  spelers,
  toelichting,
  blockers,
  notities,
  notitieStats,
  refreshNotities,
  pins,
}: BlauwdrukTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("categorieen");
  const [localPins, setLocalPins] = useState(pins);
  const [, startTransition] = useTransition();

  const handleDeletePin = useCallback((pinId: string) => {
    setLocalPins((prev) => prev.filter((p) => p.id !== pinId));
    startTransition(() => {
      deletePin(pinId);
    });
  }, []);

  return (
    <div>
      {/* Blocker-banner */}
      {blockers && blockers.length > 0 && (
        <div className="mb-4">
          <BlockerChecklist blockers={blockers} />
        </div>
      )}

      {/* Tab-balk */}
      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-ow-oranje text-ow-oranje -mb-px border-b-2"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.id === "actiepunten" && notitieStats.open > 0 && (
              <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
                {notitieStats.open}
              </span>
            )}
            {tab.id === "pins" && localPins.length > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                {localPins.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab-inhoud */}
      {activeTab === "categorieen" && (
        <CategoriePanel statistieken={statistieken} kaders={kaders} blauwdrukId={blauwdrukId} />
      )}

      {activeTab === "leden" && <LedenDashboard spelers={spelers} />}

      {activeTab === "toelichting" && (
        <ToelichtingEditor blauwdrukId={blauwdrukId} initieel={toelichting} />
      )}

      {activeTab === "actiepunten" && (
        <NotitieOverzicht
          blauwdrukId={blauwdrukId}
          initialNotities={notities}
          initialStats={notitieStats}
          refreshAction={refreshNotities}
        />
      )}

      {activeTab === "pins" && <PinsOverzicht pins={localPins} onDeletePin={handleDeletePin} />}
    </div>
  );
}
