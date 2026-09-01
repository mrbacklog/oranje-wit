/**
 * Haalt de teamindeling voor de veldcompetitie op uit Sportlink (UnionTeams + spelers per team)
 * en vergelijkt die met de voorlopige teamindeling in de database (Team-Indeling versie).
 *
 * Gebruik: node scripts/sportlink-teamleden-2026.mjs [--json <pad>]
 */

import { writeFileSync } from "node:fs";
import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from "./sportlink-auth.mjs";

const out = (s) => process.stdout.write(s + "\n");
const jsonIdx = process.argv.indexOf("--json");
const JSON_PAD = jsonIdx > -1 ? process.argv[jsonIdx + 1] : null;

const token = await sportlinkLogin();

async function apiGet(entity, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${NAVAJO_BASE}/${entity}?${qs}` : `${NAVAJO_BASE}/${entity}`;
  return (await fetch(url, { headers: navajoHeaders(entity, token) })).json();
}

const teamsData = await apiGet("team/UnionTeams");
const alle = teamsData.Team ?? [];
const veld = alle.filter((t) => (t.GameActivityDescription ?? "").toLowerCase() === "veld");

out(`Teams totaal: ${alle.length} — waarvan veld: ${veld.length}`);

const ENDPOINTS = [
  "team/teamperson/UnionTeamPlayers",
  "team/teamperson/ClubTeamPlayers",
  "team/teamperson/WorkingSetKernelTeamPersons",
];

// Zoek eerst uit welk endpoint werkt
let werkend = null;
for (const ep of ENDPOINTS) {
  const data = await apiGet(ep, { PublicTeamId: veld[0].PublicTeamId });
  const spelers = data.TeamPerson ?? data.Person ?? data.Players ?? null;
  if (!data.Error && spelers) {
    werkend = ep;
    out(`Spelers-endpoint: ${ep} (velden: ${Object.keys(spelers[0] ?? {}).join(", ")})`);
    break;
  }
  out(`  ${ep}: ${data.Error ? data.Message : "geen spelerslijst in respons"}`);
}

if (!werkend) {
  out("Geen werkend spelers-endpoint gevonden.");
  process.exit(1);
}

const resultaat = [];
for (const t of veld) {
  const data = await apiGet(werkend, { PublicTeamId: t.PublicTeamId });
  const spelers = data.TeamPerson ?? data.Person ?? data.Players ?? [];
  resultaat.push({
    team: t.TeamName,
    code: t.TeamCode,
    publicTeamId: t.PublicTeamId,
    geslacht: t.Gender,
    aantalVolgensTeam: t.PlayerCount,
    spelers: spelers.map((p) => ({
      relCode: p.PublicPersonId,
      naam: p.FullName ?? `${p.FirstName ?? ""} ${p.LastName ?? ""}`.trim(),
      rol: p.TeamPersonTypeDescription ?? p.RoleDescription ?? null,
    })),
  });
}

out("");
for (const r of resultaat) {
  out(`### ${r.code} (${r.geslacht}) — ${r.spelers.length} van ${r.aantalVolgensTeam} opgehaald`);
  for (const s of r.spelers)
    out(`    ${s.relCode ?? "?"}  ${s.naam}${s.rol ? `  [${s.rol}]` : ""}`);
}

const totaal = resultaat.reduce((n, r) => n + r.spelers.length, 0);
out(`\nTotaal spelers in veldteams: ${totaal}`);

if (JSON_PAD) {
  writeFileSync(JSON_PAD, JSON.stringify(resultaat, null, 2), "utf8");
  out(`Weggeschreven: ${JSON_PAD}`);
}
