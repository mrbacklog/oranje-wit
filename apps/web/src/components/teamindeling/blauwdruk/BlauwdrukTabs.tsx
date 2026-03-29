"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { EmptyState } from "@oranje-wit/ui";
import type {
  LedenStatistieken,
  SpelerUitgebreid,
  PinMetNamen,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import { deletePin } from "@/app/(teamindeling-studio)/ti-studio/pins/actions";
import type { CategorieKaders } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/categorie-kaders";
import CategoriePanel from "./CategoriePanel";
import ToelichtingEditor from "./ToelichtingEditor";
import PinsOverzicht from "./PinsOverzicht";
import UitgangspositiePanel from "./UitgangspositiePanel";
import type { ReferentieTeamData, EvaluatieRondeData } from "./UitgangspositiePanel";
import WerkbordOverzicht from "@/components/teamindeling/werkbord/WerkbordOverzicht";
import BlockerChecklist from "@/components/teamindeling/werkbord/BlockerChecklist";
import GezienOverzicht from "./GezienOverzicht";
import BesluitenOverzicht from "./BesluitenOverzicht";
import BlauwdrukVoortgang from "./BlauwdrukVoortgang";

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
  { id: "kaders", label: "Kaders" },
  { id: "spelers", label: "Spelers" },
  { id: "staf", label: "Staf" },
  { id: "teams", label: "Teams" },
  { id: "scenarios", label: "Scenario\u2019s" },
  { id: "werkbord", label: "Werkbord" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const tabVariants = {
  enter: { opacity: 0, y: 8 },
  active: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function ArrowUpRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M4 10L10 4M10 4H5M10 4v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RocketIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BlauwdrukTabs({
  statistieken,
  kaders,
  blauwdrukId,
  spelers: _spelers,
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
  const [activeTab, setActiveTab] = useState<TabId>("kaders");
  const [localPins, setLocalPins] = useState(pins);
  const [, startTransition] = useTransition();
  const tabContentRef = useRef<HTMLDivElement>(null);

  const handleDeletePin = useCallback((pinId: string) => {
    setLocalPins((prev) => prev.filter((p) => p.id !== pinId));
    startTransition(() => {
      deletePin(pinId);
    });
  }, []);

  const navigeerNaarTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
    tabContentRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  function getBadge(
    tabId: TabId
  ): { count: number; variant: "rood" | "amber" | "oranje" | "blauw" } | null {
    if (tabId === "kaders" && besluitStats.onduidelijk > 0) {
      return { count: besluitStats.onduidelijk, variant: "rood" };
    }
    if (
      tabId === "spelers" &&
      gezienVoortgang.totaal > 0 &&
      gezienVoortgang.gezien < gezienVoortgang.totaal
    ) {
      return { count: gezienVoortgang.totaal - gezienVoortgang.gezien, variant: "amber" };
    }
    if (tabId === "werkbord" && werkitemStats.open > 0) {
      return { count: werkitemStats.open, variant: "oranje" };
    }
    if (tabId === "teams" && localPins.length > 0) {
      return { count: localPins.length, variant: "blauw" };
    }
    return null;
  }

  const badgeStyles: Record<string, React.CSSProperties> = {
    rood: { backgroundColor: "rgba(220, 38, 38, 0.2)", color: "#f87171" },
    amber: { backgroundColor: "rgba(217, 119, 6, 0.2)", color: "#fbbf24" },
    oranje: { backgroundColor: "rgba(255, 107, 0, 0.2)", color: "var(--ow-oranje-400)" },
    blauw: { backgroundColor: "rgba(59, 130, 246, 0.2)", color: "#60a5fa" },
  };

  return (
    <div>
      <BlauwdrukVoortgang
        besluitStats={besluitStats}
        gezienVoortgang={gezienVoortgang}
        onNavigeerNaarTab={navigeerNaarTab}
      />

      {blockers && blockers.length > 0 && (
        <div className="mb-4">
          <BlockerChecklist blockers={blockers} />
        </div>
      )}

      <div
        className="mb-6 flex gap-1 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--border-default)" }}
        role="tablist"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const badge = getBadge(tab.id);

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className="relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: isActive ? "var(--ow-oranje-500)" : "var(--text-secondary)",
                marginBottom: isActive ? "-1px" : undefined,
                borderBottom: isActive ? "2px solid var(--ow-oranje-500)" : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              {tab.label}
              {badge && (
                <span
                  className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
                  style={badgeStyles[badge.variant]}
                >
                  {badge.count}
                </span>
              )}
              {isActive && (
                <motion.div
                  className="absolute inset-x-0 -bottom-px h-0.5"
                  style={{ backgroundColor: "var(--ow-oranje-500)" }}
                  layoutId="blauwdruk-tab-indicator"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div ref={tabContentRef} role="tabpanel">
        <AnimatePresence mode="wait">
          {activeTab === "kaders" && (
            <motion.div
              key="kaders"
              variants={tabVariants}
              initial="enter"
              animate="active"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <BesluitenOverzicht
                blauwdrukId={blauwdrukId}
                initialBesluiten={besluitRecords}
                initialStats={besluitStats}
              />
            </motion.div>
          )}

          {activeTab === "spelers" && (
            <motion.div
              key="spelers"
              variants={tabVariants}
              initial="enter"
              animate="active"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <GezienOverzicht
                blauwdrukId={blauwdrukId}
                initialRecords={gezienRecords}
                initialVoortgang={gezienVoortgang}
                users={gezienUsers}
              />
            </motion.div>
          )}

          {activeTab === "staf" && (
            <motion.div
              key="staf"
              variants={tabVariants}
              initial="enter"
              animate="active"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <EmptyState
                title="Staf-module"
                description="De staf-module komt in fase 3. Hier kun je straks coaches en trainers toewijzen aan teams."
              />
            </motion.div>
          )}

          {activeTab === "teams" && (
            <motion.div
              key="teams"
              variants={tabVariants}
              initial="enter"
              animate="active"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="space-y-8">
                <CategoriePanel
                  statistieken={statistieken}
                  kaders={kaders}
                  blauwdrukId={blauwdrukId}
                />

                {localPins.length > 0 && (
                  <div>
                    <h3
                      className="mb-3 text-sm font-semibold tracking-wider uppercase"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Pins
                    </h3>
                    <PinsOverzicht pins={localPins} onDeletePin={handleDeletePin} />
                  </div>
                )}

                <div>
                  <h3
                    className="mb-3 text-sm font-semibold tracking-wider uppercase"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Uitgangspositie
                  </h3>
                  <UitgangspositiePanel
                    initialTeams={referentieTeams}
                    seizoen={seizoen}
                    evaluatieRondes={evaluatieRondes}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "scenarios" && (
            <motion.div
              key="scenarios"
              variants={tabVariants}
              initial="enter"
              animate="active"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <div
                className="rounded-xl p-6"
                style={{
                  backgroundColor: "var(--surface-card)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: "rgba(255, 107, 0, 0.1)",
                      color: "var(--ow-oranje-500)",
                    }}
                  >
                    <RocketIcon />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                      Scenario&apos;s
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                      Vergelijk meerdere indelingsscenario&apos;s en kies de beste optie.
                    </p>
                  </div>
                  <Link
                    href="/ti-studio/indeling"
                    className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--ow-oranje-500), var(--ow-oranje-600))",
                      boxShadow: "0 0 16px rgba(255, 133, 51, 0.2), var(--shadow-sm)",
                    }}
                  >
                    Naar scenario&apos;s
                    <ArrowUpRightIcon />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "werkbord" && (
            <motion.div
              key="werkbord"
              variants={tabVariants}
              initial="enter"
              animate="active"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="space-y-8">
                <WerkbordOverzicht
                  blauwdrukId={blauwdrukId}
                  initialWerkitems={werkitems}
                  initialStats={werkitemStats}
                  refreshAction={refreshWerkitems}
                />

                <div>
                  <h3
                    className="mb-3 text-sm font-semibold tracking-wider uppercase"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Toelichting
                  </h3>
                  <ToelichtingEditor blauwdrukId={blauwdrukId} initieel={toelichting} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
