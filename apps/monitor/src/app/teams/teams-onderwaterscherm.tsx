"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { logger } from "@oranje-wit/types";
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
  arrayMove,
} from "@dnd-kit/sortable";

import type { Props, Tab } from "./teams-types";
import { BAND_DOT, getJCode } from "./teams-types";
import { TeamButton, SortableTeamButton } from "./team-sidebar";
import { TeamTab } from "./team-tab";
import { SelectieTab } from "./selectie-tab";
import { ResultatenTab } from "./resultaten-tab";

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
