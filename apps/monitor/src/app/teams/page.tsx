export const dynamic = "force-dynamic";
import { getTeamsRegister, getSpelersPerTeam, getSpelersVanTeam } from "@/lib/queries/teams";
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

  const [register, stafMap, uitslagen, spelersVanTeam, tellingMap] = await Promise.all([
    getTeamsRegister(seizoen),
    getStafPerTeam(seizoen),
    getOWTeamsMetUitslagen(seizoen),
    getSpelersVanTeam(seizoen),
    getSpelersPerTeam(seizoen),
  ]);

  // Reguliere teams (zonder selectie-teams)
  const allTeams = register.teams.filter((t) => !t.isSelectie);

  // Selectie-groepen: selectie ow_code → { naam, teamCodes[] }
  // Alleen selecties met gekoppelde teams worden getoond
  const selectieGroepen: Record<string, { naam: string; teamCodes: string[] }> = {};
  for (const selTeam of register.teams.filter((t) => t.isSelectie)) {
    const teamCodes = allTeams
      .filter((t) => t.selectieOwCode === selTeam.ow_code)
      .map((t) => t.ow_code);
    if (teamCodes.length > 0) {
      selectieGroepen[selTeam.ow_code] = {
        naam: selTeam.naam || selTeam.ow_code,
        teamCodes,
      };
    }
  }

  // Senioren: numerieke ow_codes + MW-teams
  const senioren = allTeams
    .filter((t) => /^\d+$/.test(t.ow_code) || t.ow_code.startsWith("MW"))
    .sort((a, b) => {
      // Numerieke codes eerst, daarna MW
      const aIsNum = /^\d+$/.test(a.ow_code);
      const bIsNum = /^\d+$/.test(b.ow_code);
      if (aIsNum !== bIsNum) return aIsNum ? -1 : 1;
      return a.ow_code.localeCompare(b.ow_code, "nl", { numeric: true });
    });

  // A-categorie Jeugd: U-teams (niet selectie), gesorteerd U19 → U17 → U15, binnen groep -1 boven -2
  const aJeugd = allTeams
    .filter((t) => t.ow_code.startsWith("U") && !t.isSelectie)
    .sort((a, b) => {
      // Parse "U19-1" → leeftijd=19, sub=1
      const [aLeeftijd, aSub] = a.ow_code.replace("U", "").split("-").map(Number);
      const [bLeeftijd, bSub] = b.ow_code.replace("U", "").split("-").map(Number);
      // Hogere leeftijd eerst (U19 boven U17), dan lagere sub (U19-1 boven U19-2)
      if (aLeeftijd !== bLeeftijd) return bLeeftijd - aLeeftijd;
      return (aSub || 0) - (bSub || 0);
    });

  // B-categorie Jeugd: teams met kleur, gesorteerd op sort_order (fallback: kleur)
  const KLEUR_VOLGORDE: Record<string, number> = {
    Rood: 1,
    Oranje: 2,
    Geel: 3,
    Groen: 4,
    Blauw: 5,
  };
  const seniorenEnUCodes = new Set([
    ...senioren.map((t) => t.ow_code),
    ...aJeugd.map((t) => t.ow_code),
  ]);
  const bJeugd = allTeams
    .filter((t) => !seniorenEnUCodes.has(t.ow_code))
    .sort((a, b) => {
      // sort_order eerst, fallback op kleur + ow_code
      if (a.sortOrder != null && b.sortOrder != null) return a.sortOrder - b.sortOrder;
      if (a.sortOrder != null) return -1;
      if (b.sortOrder != null) return 1;
      const ka = KLEUR_VOLGORDE[a.kleur || ""] ?? 99;
      const kb = KLEUR_VOLGORDE[b.kleur || ""] ?? 99;
      return ka - kb || a.ow_code.localeCompare(b.ow_code, "nl", { numeric: true });
    });

  // Sorteer selecties: Senioren eerst, dan U-nummers aflopend (U19 > U17 > U15)
  const selectieCodes = Object.keys(selectieGroepen).sort((a, b) => {
    const aIsU = a.startsWith("U");
    const bIsU = b.startsWith("U");
    if (!aIsU && bIsU) return -1; // Senioren selectie eerst
    if (aIsU && !bIsU) return 1;
    if (aIsU && bIsU) return b.localeCompare(a, "nl", { numeric: true }); // U19 boven U17
    return a.localeCompare(b, "nl", { numeric: true });
  });

  const chipGroepen = [
    { label: "Selecties", codes: selectieCodes },
    { label: "Senioren", codes: senioren.map((t) => t.ow_code) },
    { label: "A-categorie Jeugd", codes: aJeugd.map((t) => t.ow_code) },
    { label: "B-categorie Jeugd", codes: bJeugd.map((t) => t.ow_code) },
  ].filter((g) => g.codes.length > 0);

  // Bouw mapping: J-nummer → ow_code (bijv. "J1" → "Rood")
  const jNrNaarOwCode = new Map<string, string>();
  for (const t of register.teams) {
    for (const p of Object.values(t.periodes)) {
      if (p?.j_nummer) {
        jNrNaarOwCode.set(p.j_nummer, t.ow_code);
      }
    }
  }

  // Bouw uitslagen lookup: ow_code → TeamUitslagen
  const uitslagenPerTeam: Record<string, (typeof uitslagen)[number]> = {};
  for (const tu of uitslagen) {
    // Probeer J-nummer mapping (bijv. "J1" → "Rood"), anders direct teamCode
    const owCode = jNrNaarOwCode.get(tu.teamCode) ?? tu.teamCode;
    uitslagenPerTeam[owCode] = tu;
  }

  // Converteer Maps naar Records voor serialisatie
  const stafRecord: Record<string, NonNullable<ReturnType<typeof stafMap.get>>> = {};
  for (const [k, v] of stafMap) stafRecord[k] = v;

  const spelersRecord: Record<string, NonNullable<ReturnType<typeof spelersVanTeam.get>>> = {};
  for (const [k, v] of spelersVanTeam) spelersRecord[k] = v;

  const tellingRecord: Record<string, NonNullable<ReturnType<typeof tellingMap.get>>> = {};
  for (const [k, v] of tellingMap) tellingRecord[k] = v;

  // Teams met displayNaam — reguliere teams + selectie-teams (voor klikbare sidebar)
  const selectieTeams = register.teams.filter((t) => t.isSelectie && selectieGroepen[t.ow_code]);
  const teamsMetNaam = [...allTeams, ...selectieTeams].map((t) => ({
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
      selectieGroepen={selectieGroepen}
    />
  );
}
