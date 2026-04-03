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

type TeamGroup = {
  label: string;
  teams: TeamRegisterEntry[];
};

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="mt-8 mb-3 flex items-center gap-3 first:mt-0">
      <h2 className="text-text-tertiary text-xs font-semibold tracking-wide uppercase">{label}</h2>
      <div className="bg-border-default h-px flex-1" />
      <span className="text-text-tertiary text-xs tabular-nums">{count}</span>
    </div>
  );
}

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  const [register, stafMap, tellingMap] = await Promise.all([
    getTeamsRegister(seizoen),
    getStafPerTeam(seizoen),
    getSpelersPerTeam(seizoen),
  ]);

  // --- Groeperen ---

  const KLEUR_VOLGORDE: Record<string, number> = {
    // 2025-2026+: uppercase kleuren
    ROOD: 1,
    ORANJE: 2,
    GEEL: 3,
    GROEN: 4,
    BLAUW: 5,
    // historisch: lowercase
    rood: 1,
    oranje: 2,
    geel: 3,
    groen: 4,
    blauw: 5,
  };

  // Gebruik teamType wanneer beschikbaar (2025-2026+), anders val terug op ow_code patronen
  const hasTeamType = register.teams.some((t) => t.teamType != null);

  let selecties: TeamRegisterEntry[];
  let senioren: TeamRegisterEntry[];
  let aJeugd: TeamRegisterEntry[];
  let bJeugd: TeamRegisterEntry[];

  if (hasTeamType) {
    selecties = register.teams
      .filter((t) => t.teamType === "SELECTIE" || t.isSelectie)
      .sort((a, b) => (a.naam ?? "").localeCompare(b.naam ?? "", "nl", { numeric: true }));

    senioren = register.teams
      .filter((t) => t.teamType === "SENIOREN" || t.teamType === "OVERIG")
      .sort((a, b) => (a.naam ?? "").localeCompare(b.naam ?? "", "nl", { numeric: true }));

    aJeugd = [];

    bJeugd = register.teams
      .filter((t) => t.teamType === "JEUGD")
      .sort((a, b) => {
        const ka = KLEUR_VOLGORDE[a.kleur ?? ""] ?? 99;
        const kb = KLEUR_VOLGORDE[b.kleur ?? ""] ?? 99;
        return ka - kb || (a.naam ?? "").localeCompare(b.naam ?? "", "nl", { numeric: true });
      });
  } else {
    // Historische seizoenen: groepeer op ow_code patronen
    selecties = register.teams.filter((t) => t.isSelectie);

    const regularTeams = register.teams.filter((t) => !t.isSelectie);

    senioren = regularTeams
      .filter((t) => /^\d+$/.test(t.ow_code) || t.ow_code.startsWith("MW"))
      .sort((a, b) => {
        const aIsNum = /^\d+$/.test(a.ow_code);
        const bIsNum = /^\d+$/.test(b.ow_code);
        if (aIsNum !== bIsNum) return aIsNum ? -1 : 1;
        return a.ow_code.localeCompare(b.ow_code, "nl", { numeric: true });
      });

    aJeugd = regularTeams
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

    bJeugd = regularTeams
      .filter((t) => !seniorenEnUCodes.has(t.ow_code))
      .sort((a, b) => {
        if (a.sortOrder != null && b.sortOrder != null) return a.sortOrder - b.sortOrder;
        if (a.sortOrder != null) return -1;
        if (b.sortOrder != null) return 1;
        const ka = KLEUR_VOLGORDE[a.kleur ?? ""] ?? 99;
        const kb = KLEUR_VOLGORDE[b.kleur ?? ""] ?? 99;
        return ka - kb || a.ow_code.localeCompare(b.ow_code, "nl", { numeric: true });
      });
  }

  const groups: TeamGroup[] = [
    { label: "Senioren", teams: senioren },
    { label: "A-categorie Jeugd", teams: aJeugd },
    { label: "Jeugd", teams: bJeugd },
    { label: "Selecties", teams: selecties },
  ].filter((g) => g.teams.length > 0);

  // Maps → Records voor serialisatie
  const stafRecord: Record<string, NonNullable<ReturnType<typeof stafMap.get>>> = {};
  for (const [k, v] of stafMap) stafRecord[k] = v;

  const tellingRecord: Record<string, NonNullable<ReturnType<typeof tellingMap.get>>> = {};
  for (const [k, v] of tellingMap) tellingRecord[k] = v;

  return (
    <PageContainer animated>
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-text-primary text-2xl font-bold">Teams</h1>
        <SeizoenSelect seizoen={seizoen} seizoenen={SEIZOENEN} />
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
