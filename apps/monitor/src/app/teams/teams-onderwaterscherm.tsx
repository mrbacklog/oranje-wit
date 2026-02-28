"use client";

import { useState, useRef, useEffect } from "react";
import { logger } from "@oranje-wit/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BandPill } from "@oranje-wit/ui";
import type { TeamRegisterEntry, TeamSpeler, TeamSpelerTelling } from "@/lib/queries/teams";
import type { StafLid } from "@/lib/queries/staf";
import type { TeamUitslagen } from "@/lib/queries/uitslagen";

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
  selectieTeams: Record<string, string>;
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
  selectieTeams,
}: Props) {
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("team");
  const [editingNaam, setEditingNaam] = useState(false);
  const [teamNamen, setTeamNamen] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const t of teams) m[t.ow_code] = t.displayNaam;
    return m;
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const params = useSearchParams();
  const qs = params.get("seizoen") ? `?seizoen=${params.get("seizoen")}` : "";

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
            {chipGroepen.map((groep, gi) => (
              <div key={groep.label}>
                {gi > 0 && <div className="mx-3 border-t border-gray-100" />}
                <div className="py-1">
                  {groep.codes.map((code) => {
                    const team = teamsMap.get(code);
                    if (!team) return null;
                    const isSelected = code === selectedCode;
                    const jCode = getJCode(team);
                    return (
                      <button
                        key={code}
                        onClick={() => handleSelect(code)}
                        className={`mx-0 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-left text-[13px] transition-colors ${
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
                        <span className="flex-1 truncate font-medium">
                          {teamNamen[code] || code}
                        </span>
                        {jCode && (
                          <span
                            className={`shrink-0 text-[11px] tabular-nums ${isSelected ? "text-white/60" : "text-gray-400"}`}
                          >
                            {jCode}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 px-3 py-2 text-center">
            <span className="text-[11px] text-gray-400">{teams.length} teams</span>
          </div>
        </div>

        {/* Mobiel: horizontale chips */}
        <div className="space-y-2 md:hidden">
          {chipGroepen.map((groep) => (
            <div key={groep.label} className="flex flex-wrap gap-1.5">
              {groep.codes.map((code) => {
                const team = teamsMap.get(code);
                if (!team) return null;
                const isSelected = code === selectedCode;
                return (
                  <button
                    key={code}
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
            <div className="flex">
              {(
                [
                  ["team", "Spelers & Staf"],
                  ["resultaten", "Resultaten"],
                ] as [Tab, string][]
              ).map(([tab, label]) => (
                <button
                  key={tab}
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
                <TeamTab
                  spelers={spelersPerTeam[selected.ow_code]}
                  telling={tellingPerTeam[selected.ow_code]}
                  staf={stafPerTeam[selected.ow_code]}
                  selectieLabel={selectieTeams[selected.ow_code]}
                  qs={qs}
                />
              )}
              {activeTab === "resultaten" && (
                <ResultatenTab uitslagen={uitslagenPerTeam[selected.ow_code]} />
              )}
            </div>
          </div>
        )}
      </div>
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
  selectieLabel,
  qs,
}: {
  spelers?: TeamSpeler[];
  telling?: TeamSpelerTelling;
  staf?: StafLid[];
  selectieLabel?: string;
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
      {selectieLabel && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <span className="text-xs text-amber-600">ℹ</span>
          <p className="text-xs text-amber-700">
            Getoonde spelers zijn van de <strong>{selectieLabel}</strong> — individuele teamindeling
            niet beschikbaar voor dit seizoen.
          </p>
        </div>
      )}
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
  const naam = [speler.roepnaam, speler.tussenvoegsel, speler.achternaam].filter(Boolean).join(" ");
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
