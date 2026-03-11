"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { logger, PEILJAAR } from "@oranje-wit/types";
import { korfbalLeeftijd, kleurIndicatie, KLEUR_DOT, STATUS_KLEUREN } from "../scenario/types";
import RankingBadge from "../scenario/RankingBadge";
import Spinner from "@/components/ui/Spinner";
import VervresDialoog from "./VervresDialoog";
import HerberekenDialoog from "./HerberekenDialoog";

export type ReferentieTeamData = {
  id: string;
  naam: string;
  seizoen: string;
  teamType: string | null;
  niveau: string | null;
  poolVeld: string | null;
  teamscore: number | null;
  spelerIds: string[];
};

export type EvaluatieRondeData = {
  id: string;
  seizoen: string;
  ronde: number;
  naam: string;
  status: string;
};

type TeamSpelerData = {
  id: string;
  roepnaam: string;
  achternaam: string;
  geslacht: string;
  geboortejaar: number;
  geboortedatum: string | null;
  rating: number | null;
  ratingBerekend: number | null;
  status: string;
  huidig: any;
};

interface UitgangspositivePanelProps {
  initialTeams: ReferentieTeamData[];
  seizoen: string;
  evaluatieRondes: EvaluatieRondeData[];
}

/** Sorteer teams: senioren (numeriek) eerst, dan U-teams, dan J-teams, dan rest */
function sorteerTeams(teams: ReferentieTeamData[]): ReferentieTeamData[] {
  return [...teams].sort((a, b) => {
    const aNum = a.naam.match(/^(\d+)$/);
    const bNum = b.naam.match(/^(\d+)$/);
    const aJ = a.naam.match(/^J(\d+)/);
    const bJ = b.naam.match(/^J(\d+)/);
    const aU = a.naam.match(/^U(\d+)/);
    const bU = b.naam.match(/^U(\d+)/);

    if (aNum && bNum) return (b.teamscore ?? 0) - (a.teamscore ?? 0);
    if (aNum) return -1;
    if (bNum) return 1;

    if (aU && bU) return a.naam.localeCompare(b.naam);
    if (aU) return -1;
    if (bU) return 1;

    if (aJ && bJ) return (b.teamscore ?? 0) - (a.teamscore ?? 0);
    if (aJ) return -1;
    if (bJ) return 1;

    return a.naam.localeCompare(b.naam);
  });
}

export default function UitgangspositiePanel({
  initialTeams,
  seizoen,
  evaluatieRondes,
}: UitgangspositivePanelProps) {
  const router = useRouter();
  const [teams, setTeams] = useState(() => sorteerTeams(initialTeams));
  const [saving, setSaving] = useState<string | null>(null);
  const [herberekening, setHerberekening] = useState(false);
  const [vervresOpen, setVervresOpen] = useState(false);
  const [herberekenTeam, setHerberekenTeam] = useState<{
    id: string;
    naam: string;
    teamscore: number;
  } | null>(null);
  const [bevestigTeam, setBevestigTeam] = useState<{
    id: string;
    naam: string;
    teamscore: number;
  } | null>(null);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Accordion: welk team is open
  const [openTeam, setOpenTeam] = useState<string | null>(null);

  // Cache voor geladen spelers per team
  const [spelerCache, setSpelerCache] = useState<Record<string, TeamSpelerData[]>>({});
  const [spelerLoading, setSpelerLoading] = useState<string | null>(null);

  const handleToggleTeam = useCallback(
    async (teamId: string) => {
      if (openTeam === teamId) {
        setOpenTeam(null);
        return;
      }
      setOpenTeam(teamId);

      // Lazy fetch als niet in cache
      if (!spelerCache[teamId]) {
        setSpelerLoading(teamId);
        try {
          const res = await fetch(`/api/referentie-teams/${teamId}/spelers`);
          if (res.ok) {
            const { data } = await res.json();
            setSpelerCache((prev) => ({ ...prev, [teamId]: data.spelers }));
          }
        } catch (error) {
          logger.warn("Spelers ophalen mislukt:", error);
        } finally {
          setSpelerLoading(null);
        }
      }
    },
    [openTeam, spelerCache]
  );

  const handleScoreChange = useCallback(
    (teamId: string, value: string) => {
      const num = value === "" ? null : parseInt(value, 10);
      if (num !== null && isNaN(num)) return;

      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, teamscore: num } : t)));

      if (debounceRef.current[teamId]) clearTimeout(debounceRef.current[teamId]);
      debounceRef.current[teamId] = setTimeout(async () => {
        if (num === null) return;
        setSaving(teamId);
        try {
          const res = await fetch(`/api/referentie-teams/${teamId}/teamscore`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamscore: num }),
          });
          if (!res.ok) {
            logger.warn("Teamscore opslaan mislukt:", await res.text());
          } else {
            const team = teams.find((t) => t.id === teamId);
            if (team) {
              setBevestigTeam({ id: teamId, naam: team.naam, teamscore: num });
            }
          }
        } catch (error) {
          logger.warn("Teamscore opslaan mislukt:", error);
        } finally {
          setSaving(null);
        }
      }, 600);
    },
    [teams]
  );

  const handleHerbereken = useCallback(async () => {
    setHerberekening(true);
    try {
      const res = await fetch("/api/ratings/herbereken", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        logger.info("Ratings herberekend:", data);
      }
    } catch (error) {
      logger.warn("Herberekening mislukt:", error);
    } finally {
      setHerberekening(false);
    }
  }, []);

  const handleVervers = useCallback(() => {
    const teamsMetScore = teams.filter((t) => t.teamscore != null);
    if (teamsMetScore.length > 0) {
      setVervresOpen(true);
    } else {
      router.refresh();
    }
  }, [teams, router]);

  const handleVervresBevestig = useCallback(
    async (keuzes: Record<string, "behoud" | "reset">) => {
      try {
        const teamSeizoen = teams[0]?.seizoen;
        if (!teamSeizoen) return;

        const res = await fetch("/api/referentie-teams/ververs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seizoen: teamSeizoen, scoreKeuzes: keuzes }),
        });
        if (res.ok) {
          const { data } = await res.json();
          setTeams(sorteerTeams(data.teams));
        }
      } catch (error) {
        logger.warn("Verversen mislukt:", error);
      } finally {
        setVervresOpen(false);
      }
    },
    [teams]
  );

  const aantalMetScore = teams.filter((t) => t.teamscore != null).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {aantalMetScore} van {teams.length} teams hebben een teamscore
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleVervers}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Ververs teams
          </button>
          <button
            onClick={handleHerbereken}
            disabled={herberekening}
            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            {herberekening ? "Herberekenen..." : "Herbereken alle ratings"}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
              <th className="w-8 px-2 py-2" />
              <th className="px-4 py-2 font-medium">Team</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Niveau</th>
              <th className="px-4 py-2 font-medium">Poule</th>
              <th className="px-4 py-2 text-center font-medium">Spelers</th>
              <th className="w-28 px-4 py-2 text-right font-medium">Teamscore</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const isOpen = openTeam === team.id;
              const spelers = spelerCache[team.id];
              const isLoading = spelerLoading === team.id;

              return (
                <TeamRij
                  key={team.id}
                  team={team}
                  isOpen={isOpen}
                  spelers={spelers}
                  isLoading={isLoading}
                  saving={saving === team.id}
                  onToggle={() => handleToggleTeam(team.id)}
                  onScoreChange={(v) => handleScoreChange(team.id, v)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bevestigingsprompt na score-wijziging */}
      {bevestigTeam && (
        <div className="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-lg border border-orange-200 bg-white px-4 py-3 shadow-lg">
          <p className="text-sm text-gray-700">
            Spelersratings herberekenen voor{" "}
            <span className="font-medium">{bevestigTeam.naam}</span>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setBevestigTeam(null)}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            >
              Nee
            </button>
            <button
              onClick={() => {
                setHerberekenTeam(bevestigTeam);
                setBevestigTeam(null);
              }}
              className="rounded bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600"
            >
              Ja, herbereken
            </button>
          </div>
        </div>
      )}

      {/* Dialogen */}
      <VervresDialoog
        open={vervresOpen}
        onClose={() => setVervresOpen(false)}
        onBevestig={handleVervresBevestig}
        teams={teams.filter((t) => t.teamscore != null)}
      />

      {herberekenTeam && (
        <HerberekenDialoog
          open={true}
          onClose={() => setHerberekenTeam(null)}
          teamId={herberekenTeam.id}
          teamNaam={herberekenTeam.naam}
          teamscore={herberekenTeam.teamscore}
          seizoen={seizoen}
          evaluatieRondes={evaluatieRondes}
        />
      )}
    </div>
  );
}

/* ─── Team-rij met accordion ─── */

function TeamRij({
  team,
  isOpen,
  spelers,
  isLoading,
  saving,
  onToggle,
  onScoreChange,
}: {
  team: ReferentieTeamData;
  isOpen: boolean;
  spelers: TeamSpelerData[] | undefined;
  isLoading: boolean;
  saving: boolean;
  onToggle: () => void;
  onScoreChange: (value: string) => void;
}) {
  return (
    <>
      <tr
        className={`cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50 ${isOpen ? "bg-gray-50" : ""}`}
        onClick={onToggle}
      >
        <td className="px-2 py-2 text-center text-gray-400">
          <svg
            className={`h-3 w-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
          </svg>
        </td>
        <td className="px-4 py-2 font-medium text-gray-900">{team.naam}</td>
        <td className="px-4 py-2 text-gray-500">{team.teamType ?? "—"}</td>
        <td className="px-4 py-2 text-gray-500">{team.niveau ?? "—"}</td>
        <td className="px-4 py-2 font-mono text-xs text-gray-400">{team.poolVeld ?? "—"}</td>
        <td className="px-4 py-2 text-center text-xs text-gray-400">{team.spelerIds.length}</td>
        <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            {saving && <span className="text-[10px] text-orange-400">opslaan...</span>}
            <input
              type="number"
              min={0}
              max={300}
              value={team.teamscore ?? ""}
              onChange={(e) => onScoreChange(e.target.value)}
              placeholder="—"
              className="w-20 rounded border border-gray-200 px-2 py-1 text-right text-sm text-gray-900 tabular-nums placeholder:text-gray-300 focus:border-orange-300 focus:ring-1 focus:ring-orange-300 focus:outline-none"
            />
          </div>
        </td>
      </tr>

      {/* Accordion: spelers */}
      {isOpen && (
        <tr>
          <td colSpan={7} className="bg-gray-50/50 px-0 py-0">
            {isLoading ? (
              <div className="flex items-center gap-2 px-10 py-3">
                <Spinner size="sm" className="text-orange-500" />
                <span className="text-xs text-gray-400">Spelers laden...</span>
              </div>
            ) : spelers && spelers.length > 0 ? (
              <div className="divide-y divide-gray-100 px-4 py-1">
                {spelers.map((speler) => (
                  <SpelerSubRij key={speler.id} speler={speler} />
                ))}
              </div>
            ) : (
              <p className="px-10 py-3 text-xs text-gray-400">Geen spelers gevonden.</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Speler sub-rij ─── */

function SpelerSubRij({ speler }: { speler: TeamSpelerData }) {
  const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
  const kleur = kleurIndicatie(leeftijd);
  const isJeugd = PEILJAAR - speler.geboortejaar < 20;

  return (
    <div className="flex items-center gap-3 py-1.5 pr-4 pl-8">
      {/* Status dot */}
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${(STATUS_KLEUREN as Record<string, string>)[speler.status] ?? "bg-gray-300"}`}
      />

      {/* Naam */}
      <span className="min-w-0 flex-1 truncate text-xs text-gray-800">
        {speler.roepnaam} {speler.achternaam}
      </span>

      {/* Geslacht */}
      <span className="shrink-0 text-[10px] text-gray-400">{speler.geslacht}</span>

      {/* Leeftijd met kleur-dot */}
      <span className="flex shrink-0 items-center gap-1 text-[10px] text-gray-500 tabular-nums">
        {kleur && <span className={`h-1.5 w-1.5 rounded-full ${KLEUR_DOT[kleur]}`} />}
        {leeftijd.toFixed(1)}
      </span>

      {/* Rating badge (alleen jeugd) */}
      <span className="w-10 shrink-0 text-right">
        {isJeugd && <RankingBadge rating={speler.rating} size="compact" />}
      </span>
    </div>
  );
}
