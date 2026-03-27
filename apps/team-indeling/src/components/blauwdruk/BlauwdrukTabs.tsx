"use client";

import { useState, useCallback, useTransition } from "react";
import type { LedenStatistieken, SpelerUitgebreid, PinMetNamen } from "@/app/blauwdruk/actions";
import { deletePin } from "@/app/pins/actions";
import type { CategorieKaders } from "@/app/blauwdruk/categorie-kaders";
import CategoriePanel from "./CategoriePanel";
import LedenDashboard from "./LedenDashboard";
import ToelichtingEditor from "./ToelichtingEditor";
import PinsOverzicht from "./PinsOverzicht";
import UitgangspositiePanel from "./UitgangspositiePanel";
import type { ReferentieTeamData, EvaluatieRondeData } from "./UitgangspositiePanel";
import WerkbordOverzicht from "@/components/werkbord/WerkbordOverzicht";
import BlockerChecklist from "@/components/werkbord/BlockerChecklist";
import GezienOverzicht from "./GezienOverzicht";
import BesluitenOverzicht from "./BesluitenOverzicht";

type BlockerWerkitem = {
  id: string;
  titel: string;
  type: string;
  auteur: { naam: string };
  createdAt: Date;
};

type WerkitemData = Parameters<typeof WerkbordOverzicht>[0]["initialWerkitems"][number];

interface BlauwdrukTabsProps {
  statistieken: LedenStatistieken;
  kaders: CategorieKaders;
  blauwdrukId: string;
  spelers: SpelerUitgebreid[];
  toelichting: string;
  blockers?: BlockerWerkitem[];
  werkitems: WerkitemData[];
  werkitemStats: { open: number; blockers: number; besluiten: number; afgerond: number };
  refreshWerkitems: () => Promise<{
    werkitems: WerkitemData[];
    stats: { open: number; blockers: number; besluiten: number; afgerond: number };
  }>;
  pins: PinMetNamen[];
  gezienRecords: Parameters<typeof GezienOverzicht>[0]["initialRecords"];
  gezienVoortgang: Parameters<typeof GezienOverzicht>[0]["initialVoortgang"];
  gezienUsers: Array<{ id: string; naam: string }>;
  besluitRecords: Parameters<typeof BesluitenOverzicht>[0]["initialBesluiten"];
  besluitStats: Parameters<typeof BesluitenOverzicht>[0]["initialStats"];
  referentieTeams: ReferentieTeamData[];
  seizoen: string;
  evaluatieRondes: EvaluatieRondeData[];
}

const TABS = [
  { id: "categorieen", label: "Categorieën" },
  { id: "gezien", label: "Gezien" },
  { id: "besluiten", label: "Besluiten" },
  { id: "uitgangspositie", label: "Uitgangspositie" },
  { id: "leden", label: "Leden" },
  { id: "toelichting", label: "Toelichting" },
  { id: "werkbord", label: "Werkbord" },
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
  werkitems,
  werkitemStats,
  refreshWerkitems,
  pins,
  gezienRecords,
  gezienVoortgang,
  gezienUsers,
  besluitRecords,
  besluitStats,
  referentieTeams,
  seizoen,
  evaluatieRondes,
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
            {tab.id === "besluiten" && besluitStats.onduidelijk > 0 && (
              <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                {besluitStats.onduidelijk}
              </span>
            )}
            {tab.id === "gezien" && gezienVoortgang.totaal > 0 && gezienVoortgang.gezien < gezienVoortgang.totaal && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                {gezienVoortgang.totaal - gezienVoortgang.gezien}
              </span>
            )}
            {tab.id === "werkbord" && werkitemStats.open > 0 && (
              <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
                {werkitemStats.open}
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

      {activeTab === "gezien" && (
        <GezienOverzicht
          blauwdrukId={blauwdrukId}
          initialRecords={gezienRecords}
          initialVoortgang={gezienVoortgang}
          users={gezienUsers}
        />
      )}

      {activeTab === "besluiten" && (
        <BesluitenOverzicht
          blauwdrukId={blauwdrukId}
          initialBesluiten={besluitRecords}
          initialStats={besluitStats}
        />
      )}

      {activeTab === "uitgangspositie" && (
        <UitgangspositiePanel
          initialTeams={referentieTeams}
          seizoen={seizoen}
          evaluatieRondes={evaluatieRondes}
        />
      )}

      {activeTab === "leden" && <LedenDashboard spelers={spelers} blauwdrukId={blauwdrukId} />}

      {activeTab === "toelichting" && (
        <ToelichtingEditor blauwdrukId={blauwdrukId} initieel={toelichting} />
      )}

      {activeTab === "werkbord" && (
        <WerkbordOverzicht
          blauwdrukId={blauwdrukId}
          initialWerkitems={werkitems}
          initialStats={werkitemStats}
          refreshAction={refreshWerkitems}
        />
      )}

      {activeTab === "pins" && <PinsOverzicht pins={localPins} onDeletePin={handleDeletePin} />}
    </div>
  );
}
