export const dynamic = "force-dynamic";
import { PageContainer } from "@oranje-wit/ui";
import {
  getTeamsRegister,
  getSpelersPerTeam,
  type TeamRegisterEntry,
} from "@/lib/monitor/queries/teams";
import { getStafPerTeam } from "@/lib/monitor/queries/staf";
import { getSeizoen, SEIZOENEN } from "@/lib/monitor/utils/seizoen";
import { TeamCard } from "@/components/monitor/teams/team-card";
import { TeamsGrid, TeamsGridItem } from "@/components/monitor/teams/teams-grid";
import { SeizoenSelect } from "@/components/monitor/teams/seizoen-select";
import { SortToggle } from "@/components/monitor/teams/sort-toggle";

type SortMode = "categorie" | "volgorde";
type TeamGroup = { label: string; teams: TeamRegisterEntry[] };

// ---------------------------------------------------------------------------
// Sorteer-helpers
// ---------------------------------------------------------------------------

const KLEUR_VOLGORDE: Record<string, number> = {
  ROOD: 1,
  rood: 1,
  ORANJE: 2,
  oranje: 2,
  GEEL: 3,
  geel: 3,
  GROEN: 4,
  groen: 4,
  BLAUW: 5,
  blauw: 5,
};

function kleurSort(a: TeamRegisterEntry, b: TeamRegisterEntry): number {
  const ka = KLEUR_VOLGORDE[a.kleur ?? ""] ?? 99;
  const kb = KLEUR_VOLGORDE[b.kleur ?? ""] ?? 99;
  return ka - kb || (a.naam ?? "").localeCompare(b.naam ?? "", "nl", { numeric: true });
}

function uTeamSortKey(owCode: string): [number, number] {
  // OW-U19-1 → [19, 1] — hoog getal = hoog (U19 voor U15)
  const m = owCode.match(/U(\d+)-(\d+)/i);
  return m ? [parseInt(m[1]), parseInt(m[2])] : [0, 0];
}

function sortUTeams(teams: TeamRegisterEntry[]): TeamRegisterEntry[] {
  return [...teams].sort((a, b) => {
    const [aL, aV] = uTeamSortKey(a.ow_code);
    const [bL, bV] = uTeamSortKey(b.ow_code);
    if (aL !== bL) return bL - aL; // hogere leeftijdsgroep eerst
    return aV - bV; // lagere volgnummer eerst
  });
}

function seniorenNummer(t: TeamRegisterEntry): number {
  const m = t.ow_code.match(/S(\d+)/i);
  return m ? parseInt(m[1]) : 99;
}

function isUTeam(t: TeamRegisterEntry): boolean {
  return /^OW-U\d/i.test(t.ow_code) || t.teamType === "SELECTIE";
}

function isKleurTeam(t: TeamRegisterEntry): boolean {
  return t.teamType === "JEUGD" && !isUTeam(t);
}

// ---------------------------------------------------------------------------
// Groeperingslogica — 2025-2026+ (hasTeamType)
// ---------------------------------------------------------------------------

function groepenCategorie(teams: TeamRegisterEntry[]): TeamGroup[] {
  // A-categorie: senioren + overig + U-selecties
  const aTeams = teams.filter(
    (t) => t.teamType === "SENIOREN" || t.teamType === "OVERIG" || isUTeam(t)
  );
  const senioren = aTeams
    .filter((t) => t.teamType === "SENIOREN" || t.teamType === "OVERIG")
    .sort(
      (a, b) =>
        seniorenNummer(a) - seniorenNummer(b) || (a.naam ?? "").localeCompare(b.naam ?? "", "nl")
    );
  const uTeams = sortUTeams(aTeams.filter(isUTeam));
  const aCategorie = [...senioren, ...uTeams];

  // B-categorie: kleurteams
  const bCategorie = [...teams.filter(isKleurTeam)].sort(kleurSort);

  return [
    { label: "A-categorie", teams: aCategorie },
    { label: "B-categorie", teams: bCategorie },
  ].filter((g) => g.teams.length > 0);
}

function groepenVolgorde(teams: TeamRegisterEntry[]): TeamGroup[] {
  const senioren = teams
    .filter((t) => t.teamType === "SENIOREN" || t.teamType === "OVERIG")
    .sort(
      (a, b) =>
        seniorenNummer(a) - seniorenNummer(b) || (a.naam ?? "").localeCompare(b.naam ?? "", "nl")
    );

  const uTeamsGroep = sortUTeams(teams.filter(isUTeam));
  const jeugd = [...teams.filter(isKleurTeam)].sort(kleurSort);

  return [
    { label: "Senioren", teams: senioren },
    { label: "U-teams", teams: uTeamsGroep },
    { label: "Jeugd", teams: jeugd },
  ].filter((g) => g.teams.length > 0);
}

// ---------------------------------------------------------------------------
// Groeperingslogica — historisch (geen teamType)
// ---------------------------------------------------------------------------

function groepenHistorisch(teams: TeamRegisterEntry[], sort: SortMode): TeamGroup[] {
  const selecties = teams.filter((t) => t.isSelectie);
  const regular = teams.filter((t) => !t.isSelectie);

  const senioren = regular
    .filter((t) => /^\d+$/.test(t.ow_code) || t.ow_code.startsWith("MW"))
    .sort((a, b) => {
      const aIsNum = /^\d+$/.test(a.ow_code);
      const bIsNum = /^\d+$/.test(b.ow_code);
      if (aIsNum !== bIsNum) return aIsNum ? -1 : 1;
      return a.ow_code.localeCompare(b.ow_code, "nl", { numeric: true });
    });

  const aJeugd = regular
    .filter((t) => t.ow_code.startsWith("U"))
    .sort((a, b) => {
      const [aL, aS] = a.ow_code.replace("U", "").split("-").map(Number);
      const [bL, bS] = b.ow_code.replace("U", "").split("-").map(Number);
      if (aL !== bL) return bL - aL;
      return (aS || 0) - (bS || 0);
    });

  const seniorenEnUCodes = new Set([
    ...senioren.map((t) => t.ow_code),
    ...aJeugd.map((t) => t.ow_code),
  ]);
  const bJeugd = regular
    .filter((t) => !seniorenEnUCodes.has(t.ow_code))
    .sort((a, b) => {
      if (a.sortOrder != null && b.sortOrder != null) return a.sortOrder - b.sortOrder;
      if (a.sortOrder != null) return -1;
      if (b.sortOrder != null) return 1;
      return kleurSort(a, b);
    });

  if (sort === "categorie") {
    return [
      { label: "A-categorie", teams: [...senioren, ...aJeugd] },
      { label: "B-categorie", teams: bJeugd },
      { label: "Selecties", teams: selecties },
    ].filter((g) => g.teams.length > 0);
  }

  return [
    { label: "Senioren", teams: senioren },
    { label: "U-teams", teams: aJeugd },
    { label: "Jeugd", teams: bJeugd },
    { label: "Selecties", teams: selecties },
  ].filter((g) => g.teams.length > 0);
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="mt-8 mb-3 flex items-center gap-3 first:mt-0">
      <h2 className="text-text-tertiary text-xs font-semibold tracking-wide uppercase">{label}</h2>
      <div className="bg-border-default h-px flex-1" />
      <span className="text-text-tertiary text-xs tabular-nums">{count}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);
  const sort: SortMode = params.sort === "volgorde" ? "volgorde" : "categorie";

  const [register, stafMap, tellingMap] = await Promise.all([
    getTeamsRegister(seizoen),
    getStafPerTeam(seizoen),
    getSpelersPerTeam(seizoen),
  ]);

  const hasTeamType = register.teams.some((t) => t.teamType != null);

  let groups: TeamGroup[];
  if (hasTeamType) {
    groups =
      sort === "volgorde" ? groepenVolgorde(register.teams) : groepenCategorie(register.teams);
  } else {
    groups = groepenHistorisch(register.teams, sort);
  }

  const stafRecord: Record<string, NonNullable<ReturnType<typeof stafMap.get>>> = {};
  for (const [k, v] of stafMap) stafRecord[k] = v;

  const tellingRecord: Record<string, NonNullable<ReturnType<typeof tellingMap.get>>> = {};
  for (const [k, v] of tellingMap) tellingRecord[k] = v;

  return (
    <PageContainer animated>
      <div className="mb-6 flex flex-wrap items-baseline gap-3">
        <h1 className="text-text-primary text-2xl font-bold">Teams</h1>
        <SeizoenSelect seizoen={seizoen} seizoenen={SEIZOENEN} />
        <div className="ml-auto">
          <SortToggle seizoen={seizoen} sort={sort} />
        </div>
      </div>

      {groups.map((group) => (
        <section key={group.label}>
          <SectionHeader label={group.label} count={group.teams.length} />
          <TeamsGrid>
            {group.teams.map((team) => (
              <TeamsGridItem key={team.ow_code}>
                <TeamCard
                  owCode={team.ow_code}
                  naam={team.naam || team.ow_code}
                  bondNaam={team.alias}
                  kleur={team.kleur}
                  leeftijdsgroep={team.leeftijdsgroep}
                  spelvorm={team.spelvorm}
                  telling={tellingRecord[team.ow_code]}
                  staf={stafRecord[team.ow_code]}
                />
              </TeamsGridItem>
            ))}
          </TeamsGrid>
        </section>
      ))}
    </PageContainer>
  );
}
