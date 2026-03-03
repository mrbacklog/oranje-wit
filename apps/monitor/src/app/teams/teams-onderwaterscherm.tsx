/* eslint-disable max-lines */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { logger } from "@oranje-wit/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BandPill, InfoButton, InfoDrawer } from "@oranje-wit/ui";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TeamRegisterEntry, TeamSpeler, TeamSpelerTelling } from "@/lib/queries/teams";
import type { StafLid } from "@/lib/queries/staf";
import type { TeamUitslagen } from "@/lib/queries/uitslagen";
import { formatNaam } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TeamData = TeamRegisterEntry & { displayNaam: string };
type ChipGroep = { label: string; codes: string[] };

type Props = {
  seizoen: string;
  seizoenen: string[];
  teams: TeamData[];
  chipGroepen: ChipGroep[];
  stafPerTeam: Record<string, StafLid[]>;
  uitslagenPerTeam: Record<string, TeamUitslagen>;
  spelersPerTeam: Record<string, TeamSpeler[]>;
  tellingPerTeam: Record<string, TeamSpelerTelling>;
  selectieGroepen: Record<string, { naam: string; teamCodes: string[] }>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BAND_DOT: Record<string, string> = {
  Blauw: "bg-band-blauw",
  Groen: "bg-band-groen",
  Geel: "bg-band-geel",
  Oranje: "bg-band-oranje",
  Rood: "bg-band-rood",
};

const PERIODE_LABELS: Record<string, string> = {
  veld_najaar: "Veld najaar",
  zaal: "Zaal",
  veld_voorjaar: "Veld voorjaar",
};

const PERIODE_VOLGORDE = ["veld_najaar", "zaal", "veld_voorjaar"];

const STAF_ROL_VOLGORDE: Record<string, number> = {
  "Trainer/Coach": 1,
  Teammanager: 2,
  Fysio: 3,
  Analist: 4,
  Verzorger: 5,
};

type Tab = "team" | "resultaten";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PERIODE_PRIO_ZAAL = ["zaal_deel1", "zaal_deel2", "veld_najaar", "veld_voorjaar"] as const;
const PERIODE_PRIO_VELD = ["veld_najaar", "veld_voorjaar", "zaal_deel1", "zaal_deel2"] as const;

function getJCode(team: TeamData): string | null {
  const prio = team.ow_code.startsWith("MW") ? PERIODE_PRIO_VELD : PERIODE_PRIO_ZAAL;
  for (const p of prio) {
    const pd = team.periodes[p];
    if (pd?.j_nummer) return pd.j_nummer;
  }
  return null;
}

// ---------------------------------------------------------------------------
// TeamButton (sidebar)
// ---------------------------------------------------------------------------

function TeamButton({
  code,
  team,
  isSelected,
  jCode,
  naam,
  onSelect,
  indent,
}: {
  code: string;
  team: TeamData;
  isSelected: boolean;
  jCode: string | null;
  naam: string;
  onSelect: (code: string) => void;
  indent?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(code)}
      className={`mx-0 flex w-full cursor-pointer items-center gap-2 rounded-md py-1.5 text-left text-[13px] transition-colors ${indent ? "pr-3 pl-5" : "px-3"} ${
        isSelected ? "bg-ow-oranje text-white" : "text-gray-700 hover:bg-gray-50"
      } `}
    >
      {team.kleur && (
        <span
          className={`inline-block h-2 w-2 shrink-0 rounded-full ${
            isSelected ? "bg-white/50" : BAND_DOT[team.kleur] || "bg-gray-300"
          }`}
        />
      )}
      <span className="flex-1 truncate font-medium">{naam}</span>
      {jCode && (
        <span
          className={`shrink-0 text-[11px] tabular-nums ${isSelected ? "text-white/60" : "text-gray-400"}`}
        >
          {jCode}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// SortableTeamButton (drag-and-drop wrapper)
// ---------------------------------------------------------------------------

function DragHandle({ isSelected }: { isSelected: boolean }) {
  return (
    <span
      className={`flex cursor-grab touch-none flex-col gap-[2px] opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing ${
        isSelected ? "opacity-100" : ""
      }`}
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span key={i} className={`flex gap-[2px]`}>
          <span
            className={`block h-[3px] w-[3px] rounded-full ${isSelected ? "bg-white/40" : "bg-gray-300"}`}
          />
          <span
            className={`block h-[3px] w-[3px] rounded-full ${isSelected ? "bg-white/40" : "bg-gray-300"}`}
          />
        </span>
      ))}
    </span>
  );
}

function SortableTeamButton({
  code,
  team,
  isSelected,
  jCode,
  naam,
  onSelect,
}: {
  code: string;
  team: TeamData;
  isSelected: boolean;
  jCode: string | null;
  naam: string;
  onSelect: (code: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: code,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(code)}
        className={`mx-0 flex w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-[13px] transition-colors ${
          isSelected ? "bg-ow-oranje text-white" : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <span {...attributes} {...listeners}>
          <DragHandle isSelected={isSelected} />
        </span>
        {team.kleur && (
          <span
            className={`inline-block h-2 w-2 shrink-0 rounded-full ${
              isSelected ? "bg-white/50" : BAND_DOT[team.kleur] || "bg-gray-300"
            }`}
          />
        )}
        <span className="flex-1 truncate font-medium">{naam}</span>
        {jCode && (
          <span
            className={`shrink-0 text-[11px] tabular-nums ${isSelected ? "text-white/60" : "text-gray-400"}`}
          >
            {jCode}
          </span>
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TeamsOnderwaterscherm({
  seizoen,
  seizoenen,
  teams,
  chipGroepen,
  stafPerTeam,
  uitslagenPerTeam,
  spelersPerTeam,
  tellingPerTeam,
  selectieGroepen,
}: Props) {
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("team");
  const [infoOpen, setInfoOpen] = useState(false);
  const [editingNaam, setEditingNaam] = useState(false);
  const [teamNamen, setTeamNamen] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const t of teams) m[t.ow_code] = t.displayNaam;
    return m;
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const params = useSearchParams();
  const qs = params.get("seizoen") ? `?seizoen=${params.get("seizoen")}` : "";

  // B-categorie volgorde (draggable)
  const bCategorie = chipGroepen.find((g) => g.label === "B-categorie Jeugd");
  const [bVolgorde, setBVolgorde] = useState<string[]>(bCategorie?.codes || []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setBVolgorde((prev) => {
        const oldIdx = prev.indexOf(active.id as string);
        const newIdx = prev.indexOf(over.id as string);
        const next = arrayMove(prev, oldIdx, newIdx);

        // Persist naar API (fire-and-forget, rollback bij fout)
        fetch("/api/teams/sort-order", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seizoen, codes: next }),
        }).catch((err) => {
          logger.warn("Sort order opslaan mislukt:", err);
          setBVolgorde(prev);
        });

        return next;
      });
    },
    [seizoen]
  );

  const teamsMap = new Map(teams.map((t) => [t.ow_code, t]));
  const selected = selectedCode ? teamsMap.get(selectedCode) : null;

  useEffect(() => {
    if (editingNaam && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingNaam]);

  function handleSelect(code: string) {
    if (code === selectedCode) {
      setSelectedCode(null);
    } else {
      setSelectedCode(code);
      setActiveTab("team");
      setEditingNaam(false);
    }
  }

  function handleSeizoenChange(s: string) {
    setSelectedCode(null);
    const url = new URL(window.location.href);
    url.searchParams.set("seizoen", s);
    router.push(url.pathname + url.search);
  }

  async function saveNaam(teamId: number, owCode: string, naam: string) {
    setEditingNaam(false);
    const trimmed = naam.trim();
    setTeamNamen((prev) => ({ ...prev, [owCode]: trimmed || owCode }));
    try {
      await fetch(`/api/teams/${teamId}/naam`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naam: trimmed }),
      });
    } catch (error) {
      logger.warn("Teamnaam opslaan mislukt:", error);
      const original = teamsMap.get(owCode)?.displayNaam || owCode;
      setTeamNamen((prev) => ({ ...prev, [owCode]: original }));
    }
  }

  return (
    <div className="flex flex-col gap-6 md:h-[calc(100vh-4rem)] md:flex-row">
      {/* ── Links: Teamlijst ── */}
      <div className="flex shrink-0 flex-col md:w-56">
        {/* Header met seizoenskeuze */}
        <div className="mb-3 flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-gray-900">Teams</h1>
          <InfoButton onClick={() => setInfoOpen(true)} />
          <select
            value={seizoen}
            onChange={(e) => handleSeizoenChange(e.target.value)}
            className="hover:text-ow-oranje cursor-pointer border-none bg-transparent text-xs text-gray-500 focus:outline-none"
          >
            {seizoenen.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop: verticale lijst */}
        <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white md:flex">
          <div className="flex-1 overflow-y-auto">
            {chipGroepen.map((groep, gi) => {
              const isBCategorie = groep.label === "B-categorie Jeugd";
              const codes = isBCategorie ? bVolgorde : groep.codes;

              return (
                <div key={groep.label}>
                  {gi > 0 && <div className="mx-3 border-t border-gray-100" />}
                  <div className="px-3 pt-2 pb-0.5 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
                    {groep.label}
                  </div>
                  {isBCategorie ? (
                    <DndContext
                      id="b-categorie-sort"
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={codes} strategy={verticalListSortingStrategy}>
                        <div className="pb-1">
                          {codes.map((code) => {
                            const team = teamsMap.get(code);
                            if (!team) return null;
                            return (
                              <SortableTeamButton
                                key={code}
                                code={code}
                                team={team}
                                isSelected={code === selectedCode}
                                jCode={getJCode(team)}
                                naam={teamNamen[code] || code}
                                onSelect={handleSelect}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="pb-1">
                      {codes.map((code) => {
                        const team = teamsMap.get(code);
                        if (!team) return null;
                        return (
                          <TeamButton
                            key={code}
                            code={code}
                            team={team}
                            isSelected={code === selectedCode}
                            jCode={getJCode(team)}
                            naam={teamNamen[code] || code}
                            onSelect={handleSelect}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-100 px-3 py-2 text-center">
            <span className="text-[11px] text-gray-400">
              {teams.filter((t) => !t.isSelectie).length} teams
            </span>
          </div>
        </div>

        {/* Mobiel: horizontale chips */}
        <div className="space-y-2 md:hidden">
          {chipGroepen.map((groep) => (
            <div key={groep.label}>
              <div className="mb-1 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
                {groep.label}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {groep.codes.map((code) => {
                  const team = teamsMap.get(code);
                  if (!team) return null;
                  const isSelected = code === selectedCode;
                  return (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleSelect(code)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-ow-oranje text-white shadow-sm"
                          : "hover:border-ow-oranje hover:text-ow-oranje border border-gray-200 bg-white text-gray-700"
                      } `}
                    >
                      {team.kleur && (
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            isSelected ? "bg-white/60" : BAND_DOT[team.kleur] || "bg-gray-300"
                          }`}
                        />
                      )}
                      {teamNamen[code] || code}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rechts: Detailpaneel ── */}
      <div className="min-w-0 flex-1 md:overflow-y-auto">
        {!selected ? (
          <div className="hidden h-full items-center justify-center rounded-lg border border-dashed border-gray-200 md:flex">
            <p className="text-sm text-gray-400">Selecteer een team</p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="rounded-t-lg border border-b-0 border-gray-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                {editingNaam ? (
                  <input
                    ref={inputRef}
                    defaultValue={teamNamen[selected.ow_code] || selected.ow_code}
                    onBlur={(e) => saveNaam(selected.id, selected.ow_code, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        saveNaam(
                          selected.id,
                          selected.ow_code,
                          (e.target as HTMLInputElement).value
                        );
                      if (e.key === "Escape") setEditingNaam(false);
                    }}
                    className="border-ow-oranje focus:ring-ow-oranje rounded border bg-white px-2 py-0.5 text-lg font-bold text-gray-900 focus:ring-1 focus:outline-none"
                  />
                ) : (
                  <h2 className="text-lg font-bold text-gray-900">
                    {teamNamen[selected.ow_code] || selected.ow_code}
                  </h2>
                )}
                {!editingNaam && (
                  <button
                    onClick={() => setEditingNaam(true)}
                    className="hover:text-ow-oranje cursor-pointer text-gray-400 transition-colors"
                    title="Naam bewerken"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                    </svg>
                  </button>
                )}
                {selected.kleur && <BandPill band={selected.kleur} />}
                <span className="text-sm text-gray-400">
                  {[selected.spelvorm, selected.leeftijdsgroep].filter(Boolean).join(" · ")}
                </span>
              </div>
            </div>

            {/* Bladtabs */}
            <div role="tablist" className="flex">
              {(
                [
                  ["team", "Spelers & Staf"],
                  ["resultaten", "Resultaten"],
                ] as [Tab, string][]
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  id={`tab-${tab}`}
                  role="tab"
                  type="button"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`-mb-px cursor-pointer rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "z-10 border border-gray-200 border-b-white bg-white text-gray-900"
                      : "border border-transparent bg-gray-50 text-gray-400 hover:text-gray-600"
                  } `}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="rounded-tr-lg rounded-b-lg border border-gray-200 bg-white p-6">
              {activeTab === "team" && (
                <div role="tabpanel" aria-labelledby="tab-team">
                  {selected.isSelectie ? (
                    <SelectieTab
                      selectieGroep={selectieGroepen[selected.ow_code]}
                      spelersPerTeam={spelersPerTeam}
                      tellingPerTeam={tellingPerTeam}
                      stafPerTeam={stafPerTeam}
                      teamNamen={teamNamen}
                      qs={qs}
                    />
                  ) : (
                    <TeamTab
                      spelers={spelersPerTeam[selected.ow_code]}
                      telling={tellingPerTeam[selected.ow_code]}
                      staf={stafPerTeam[selected.ow_code]}
                      qs={qs}
                    />
                  )}
                </div>
              )}
              {activeTab === "resultaten" && (
                <div role="tabpanel" aria-labelledby="tab-resultaten">
                  <ResultatenTab uitslagen={uitslagenPerTeam[selected.ow_code]} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <InfoDrawer open={infoOpen} onClose={() => setInfoOpen(false)} title="Over Teams">
        <div className="space-y-4">
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Wat zie je?
            </h4>
            <p>Alle teams van het geselecteerde seizoen, gegroepeerd op categorie.</p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Doorklikken
            </h4>
            <p>
              <strong>Klik op een team</strong> om de spelers, staf en wedstrijdresultaten te
              bekijken.
            </p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Tabbladen
            </h4>
            <p>
              <strong>Spelers &amp; Staf:</strong> toont de samenstelling met heren en dames apart.
            </p>
            <p className="mt-1">
              <strong>Resultaten:</strong> de uitslagen van het seizoen.
            </p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Tip
            </h4>
            <p>De teamnaam kun je bewerken via het potlood-icoon.</p>
          </section>
        </div>
      </InfoDrawer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spelers & Staf Tab (gecombineerd)
// ---------------------------------------------------------------------------

function TeamTab({
  spelers,
  telling,
  staf,
  qs,
}: {
  spelers?: TeamSpeler[];
  telling?: TeamSpelerTelling;
  staf?: StafLid[];
  qs: string;
}) {
  const dames = spelers?.filter((s) => s.geslacht === "V") || [];
  const heren = spelers?.filter((s) => s.geslacht === "M") || [];

  const gesorteerdeStaf = staf
    ? [...staf].sort((a, b) => {
        const va = STAF_ROL_VOLGORDE[a.rol] ?? 99;
        const vb = STAF_ROL_VOLGORDE[b.rol] ?? 99;
        return va - vb || a.naam.localeCompare(b.naam, "nl");
      })
    : [];

  return (
    <div className="space-y-6">
      {telling && (
        <p className="text-sm text-gray-500">
          {telling.totaal} spelers (
          <span className="text-blue-500">
            {"\u2642"} {telling.heren}
          </span>
          {" / "}
          <span className="text-pink-500">
            {"\u2640"} {telling.dames}
          </span>
          )
        </p>
      )}

      {!spelers || spelers.length === 0 ? (
        <p className="text-sm text-gray-400">Geen spelers gevonden voor dit team.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-pink-400 uppercase">
              {"\u2640"} Dames ({dames.length})
            </h4>
            <div className="space-y-0.5">
              {dames.map((s) => (
                <SpelerRij key={s.relCode} speler={s} qs={qs} />
              ))}
              {dames.length === 0 && <p className="text-xs text-gray-400">-</p>}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-blue-400 uppercase">
              {"\u2642"} Heren ({heren.length})
            </h4>
            <div className="space-y-0.5">
              {heren.map((s) => (
                <SpelerRij key={s.relCode} speler={s} qs={qs} />
              ))}
              {heren.length === 0 && <p className="text-xs text-gray-400">-</p>}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">Staf</h4>
        {gesorteerdeStaf.length > 0 ? (
          <div className="space-y-1">
            {gesorteerdeStaf.map((s) => (
              <div key={s.stafCode} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{s.naam}</span>
                <span className="text-gray-400">{s.rol}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Geen staf toegewezen.</p>
        )}
      </div>
    </div>
  );
}

function SpelerRij({ speler, qs }: { speler: TeamSpeler; qs: string }) {
  const naam = formatNaam(speler);
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <Link href={`/spelers/${speler.relCode}${qs}`} className="hover:text-ow-oranje text-gray-900">
        {naam}
      </Link>
      <span className="text-xs text-gray-400">{speler.geboortejaar || "-"}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selectie Tab (gecombineerde spelers van onderliggende teams)
// ---------------------------------------------------------------------------

function SelectieTab({
  selectieGroep,
  spelersPerTeam,
  tellingPerTeam,
  stafPerTeam,
  teamNamen,
  qs,
}: {
  selectieGroep: { naam: string; teamCodes: string[] };
  spelersPerTeam: Record<string, TeamSpeler[]>;
  tellingPerTeam: Record<string, TeamSpelerTelling>;
  stafPerTeam: Record<string, StafLid[]>;
  teamNamen: Record<string, string>;
  qs: string;
}) {
  // Combineer spelers en tellingen van alle onderliggende teams
  const alleSpelers: (TeamSpeler & { teamLabel: string })[] = [];
  let totaalHeren = 0;
  let totaalDames = 0;

  for (const code of selectieGroep.teamCodes) {
    const label = teamNamen[code] || code;
    const spelers = spelersPerTeam[code] || [];
    const telling = tellingPerTeam[code];
    if (telling) {
      totaalHeren += telling.heren;
      totaalDames += telling.dames;
    }
    for (const s of spelers) {
      alleSpelers.push({ ...s, teamLabel: label });
    }
  }

  const dames = alleSpelers.filter((s) => s.geslacht === "V");
  const heren = alleSpelers.filter((s) => s.geslacht === "M");
  const totaal = totaalHeren + totaalDames;

  // Combineer staf
  const stafSet = new Map<string, StafLid>();
  for (const code of selectieGroep.teamCodes) {
    for (const s of stafPerTeam[code] || []) {
      stafSet.set(s.stafCode, s);
    }
  }
  const gesorteerdeStaf = [...stafSet.values()].sort((a, b) => {
    const va = STAF_ROL_VOLGORDE[a.rol] ?? 99;
    const vb = STAF_ROL_VOLGORDE[b.rol] ?? 99;
    return va - vb || a.naam.localeCompare(b.naam, "nl");
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          {totaal} spelers (
          <span className="text-blue-500">
            {"\u2642"} {totaalHeren}
          </span>
          {" / "}
          <span className="text-pink-500">
            {"\u2640"} {totaalDames}
          </span>
          ) in {selectieGroep.teamCodes.length} teams
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {selectieGroep.teamCodes.map((c) => teamNamen[c] || c).join(" + ")}
        </p>
      </div>

      {alleSpelers.length === 0 ? (
        <p className="text-sm text-gray-400">Geen spelers gevonden.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-pink-400 uppercase">
              {"\u2640"} Dames ({dames.length})
            </h4>
            <div className="space-y-0.5">
              {dames.map((s) => (
                <div key={s.relCode} className="flex items-center justify-between py-0.5 text-sm">
                  <Link
                    href={`/spelers/${s.relCode}${qs}`}
                    className="hover:text-ow-oranje text-gray-900"
                  >
                    {formatNaam(s)}
                  </Link>
                  <span className="text-[11px] text-gray-400">{s.teamLabel}</span>
                </div>
              ))}
              {dames.length === 0 && <p className="text-xs text-gray-400">-</p>}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-blue-400 uppercase">
              {"\u2642"} Heren ({heren.length})
            </h4>
            <div className="space-y-0.5">
              {heren.map((s) => (
                <div key={s.relCode} className="flex items-center justify-between py-0.5 text-sm">
                  <Link
                    href={`/spelers/${s.relCode}${qs}`}
                    className="hover:text-ow-oranje text-gray-900"
                  >
                    {formatNaam(s)}
                  </Link>
                  <span className="text-[11px] text-gray-400">{s.teamLabel}</span>
                </div>
              ))}
              {heren.length === 0 && <p className="text-xs text-gray-400">-</p>}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">Staf</h4>
        {gesorteerdeStaf.length > 0 ? (
          <div className="space-y-1">
            {gesorteerdeStaf.map((s) => (
              <div key={s.stafCode} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{s.naam}</span>
                <span className="text-gray-400">{s.rol}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Geen staf toegewezen.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resultaten Tab
// ---------------------------------------------------------------------------

function ResultatenTab({ uitslagen }: { uitslagen?: TeamUitslagen }) {
  const perPeriode = new Map<string, NonNullable<typeof uitslagen>["poules"]>();
  if (uitslagen) {
    for (const poule of uitslagen.poules) {
      if (!perPeriode.has(poule.periode)) perPeriode.set(poule.periode, []);
      perPeriode.get(poule.periode)!.push(poule);
    }
  }

  if (!uitslagen || uitslagen.poules.length === 0) {
    return <p className="text-sm text-gray-400">Geen competitieresultaten beschikbaar.</p>;
  }

  return (
    <div className="space-y-4">
      {PERIODE_VOLGORDE.filter((p) => perPeriode.has(p)).map((periode) => (
        <div key={periode}>
          <h5 className="mb-2 text-xs font-medium tracking-wide text-gray-400 uppercase">
            {PERIODE_LABELS[periode] || periode}
          </h5>
          {perPeriode.get(periode)!.map((poule) => (
            <div
              key={`${poule.pool}-${poule.niveau}`}
              className="mb-3 overflow-hidden rounded-lg border border-gray-100"
            >
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
                <span className="text-sm font-medium text-gray-700">
                  {poule.niveau || poule.pool}
                </span>
                {poule.niveau && (
                  <span className="ml-2 text-xs text-gray-400">Poule {poule.pool}</span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-500">
                      <th className="w-8 px-2 py-1.5 text-center font-medium">#</th>
                      <th className="px-2 py-1.5 text-left font-medium">Team</th>
                      <th className="w-8 px-1.5 py-1.5 text-center font-medium">GS</th>
                      <th className="w-8 px-1.5 py-1.5 text-center font-medium">W</th>
                      <th className="w-8 px-1.5 py-1.5 text-center font-medium">G</th>
                      <th className="w-8 px-1.5 py-1.5 text-center font-medium">V</th>
                      <th className="w-8 px-1.5 py-1.5 text-center font-medium">VR</th>
                      <th className="w-8 px-1.5 py-1.5 text-center font-medium">TG</th>
                      <th className="w-10 px-1.5 py-1.5 text-center font-semibold">Pt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poule.regels.map((r) => (
                      <tr
                        key={r.positie}
                        className={`border-t border-gray-50 ${
                          r.isOW ? "bg-ow-oranje-bg text-ow-oranje font-semibold" : "text-gray-700"
                        }`}
                      >
                        <td className="px-2 py-1.5 text-center">{r.positie}</td>
                        <td className="px-2 py-1.5">{r.teamNaam}</td>
                        <td className="px-1.5 py-1.5 text-center">{r.gespeeld}</td>
                        <td className="px-1.5 py-1.5 text-center">{r.gewonnen}</td>
                        <td className="px-1.5 py-1.5 text-center">{r.gelijk}</td>
                        <td className="px-1.5 py-1.5 text-center">{r.verloren}</td>
                        <td className="px-1.5 py-1.5 text-center">{r.doelpuntenVoor}</td>
                        <td className="px-1.5 py-1.5 text-center">{r.doelpuntenTegen}</td>
                        <td className="px-1.5 py-1.5 text-center font-bold">{r.punten}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
