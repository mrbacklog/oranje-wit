import {
  getTeamsRegister,
  getSpelersPerTeam,
  getSpelersVanTeam,
  getSelectieTeams,
} from "@/lib/queries/teams";
import { getStafPerTeam } from "@/lib/queries/staf";
import { getOWTeamsMetUitslagen } from "@/lib/queries/uitslagen";
import { syncStandenIfStale } from "@/lib/sync/standen-knkv";
import { getSeizoen, SEIZOENEN } from "@/lib/utils/seizoen";
import { TeamsOnderwaterscherm } from "./teams-onderwaterscherm";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  // Ververs standen als ze niet meer van vandaag zijn
  await syncStandenIfStale(seizoen);

  const [register, stafMap, uitslagen, spelersVanTeam, tellingMap, selectieCheck] =
    await Promise.all([
      getTeamsRegister(seizoen),
      getStafPerTeam(seizoen),
      getOWTeamsMetUitslagen(seizoen),
      getSpelersVanTeam(seizoen),
      getSpelersPerTeam(seizoen),
      getSelectieTeams(seizoen),
    ]);

  // Bouw chipgroepen: Senioren+MW, U-teams, Jeugd (op kleur)
  const allTeams = register.teams;
  const senioren = allTeams
    .filter((t) => /^\d+$/.test(t.ow_code))
    .sort((a, b) => a.ow_code.localeCompare(b.ow_code, "nl", { numeric: true }));
  const mw = allTeams
    .filter((t) => t.ow_code.startsWith("MW"))
    .sort((a, b) => a.ow_code.localeCompare(b.ow_code, "nl", { numeric: true }));
  const uTeams = allTeams
    .filter((t) => t.ow_code.startsWith("U"))
    .sort((a, b) => b.ow_code.localeCompare(a.ow_code, "nl", { numeric: true }));

  // Jeugd: teams met kleur, niet al in senioren/mw/u-teams
  const KLEUR_VOLGORDE: Record<string, number> = {
    Rood: 1,
    Oranje: 2,
    Geel: 3,
    Groen: 4,
    Blauw: 5,
  };
  const gebruikteCodes = new Set([
    ...senioren.map((t) => t.ow_code),
    ...mw.map((t) => t.ow_code),
    ...uTeams.map((t) => t.ow_code),
  ]);
  const jeugd = allTeams
    .filter((t) => !gebruikteCodes.has(t.ow_code))
    .sort((a, b) => {
      const ka = KLEUR_VOLGORDE[a.kleur || ""] ?? 99;
      const kb = KLEUR_VOLGORDE[b.kleur || ""] ?? 99;
      return ka - kb || a.ow_code.localeCompare(b.ow_code, "nl", { numeric: true });
    });

  const chipGroepen = [
    { label: "Senioren", codes: [...senioren, ...mw].map((t) => t.ow_code) },
    { label: "U-teams", codes: uTeams.map((t) => t.ow_code) },
    { label: "Jeugd", codes: jeugd.map((t) => t.ow_code) },
  ].filter((g) => g.codes.length > 0);

  // Bouw uitslagen lookup: ow_code → TeamUitslagen
  const uitslagenPerTeam: Record<string, (typeof uitslagen)[number]> = {};
  for (const tu of uitslagen) {
    uitslagenPerTeam[tu.teamCode] = tu;
  }

  // Converteer Maps naar Records voor serialisatie
  const stafRecord: Record<string, NonNullable<ReturnType<typeof stafMap.get>>> = {};
  for (const [k, v] of stafMap) stafRecord[k] = v;

  const spelersRecord: Record<string, NonNullable<ReturnType<typeof spelersVanTeam.get>>> = {};
  for (const [k, v] of spelersVanTeam) spelersRecord[k] = v;

  const tellingRecord: Record<string, NonNullable<ReturnType<typeof tellingMap.get>>> = {};
  for (const [k, v] of tellingMap) tellingRecord[k] = v;

  // Teams met displayNaam
  const teamsMetNaam = register.teams.map((t) => ({
    ...t,
    displayNaam: t.naam || t.ow_code,
  }));

  return (
    <TeamsOnderwaterscherm
      seizoen={seizoen}
      seizoenen={SEIZOENEN}
      teams={teamsMetNaam}
      chipGroepen={chipGroepen}
      stafPerTeam={stafRecord}
      uitslagenPerTeam={uitslagenPerTeam}
      spelersPerTeam={spelersRecord}
      tellingPerTeam={tellingRecord}
      selectieTeams={selectieCheck}
    />
  );
}
