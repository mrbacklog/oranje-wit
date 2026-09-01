/**
 * Controleert het Sportlink-teamregister op fouten die in Sportlink zelf hersteld
 * moeten worden. Sportlink is de bron van waarheid; dit script corrigeert niets,
 * het levert een werklijst op.
 *
 * Regels:
 *  1. Een algemeen reserve mag nooit in een basisteam staan.
 *  2. Een oud-lid / afgemeld lid mag niet meer in een team staan.
 *  3. Een lid zonder spelactiviteiten hoort niet in een competitieteam.
 *  4. Iedereen in de vastgestelde indeling hoort in een Sportlink-team te staan.
 *
 * Gebruik: node scripts/controle-sportlink-teamregister.mjs [versieId]
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from "./sportlink-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const VERSIE_ID = process.argv[2];
const out = (s) => process.stdout.write(s + "\n");

const token = await sportlinkLogin();
const get = async (e, p = {}) => {
  const qs = new URLSearchParams(p).toString();
  return (
    await fetch(`${NAVAJO_BASE}/${e}${qs ? `?${qs}` : ""}`, { headers: navajoHeaders(e, token) })
  ).json();
};
const post = async (e, body) =>
  (
    await fetch(`${NAVAJO_BASE}/${e}`, {
      method: "POST",
      headers: navajoHeaders(e, token),
      body: JSON.stringify(body),
    })
  ).json();

// --- Teams ---
const teams = (await get("team/UnionTeams")).Team ?? [];
const bezetting = [];
const pauze = (ms) => new Promise((r) => setTimeout(r, ms));
for (const t of teams) {
  const data = await get("team/teamperson/UnionTeamPlayers", { PublicTeamId: t.PublicTeamId });
  const spelers = data.Person ?? data.TeamPerson ?? [];
  if (data.Error || spelers.length === 0) {
    process.stderr.write(
      `LET OP: geen spelers voor ${t.TeamCode} (${t.GameActivityDescription}): ${data.Message ?? "leeg antwoord"}\n`
    );
  }
  bezetting.push({ team: t, spelers });
  await pauze(250);
}
const opgehaald = bezetting.reduce((n, b) => n + b.spelers.length, 0);
if (opgehaald === 0) {
  process.stderr.write("Geen enkele teambezetting opgehaald — controle afgebroken.\n");
  process.exit(1);
}
out(`Teambezetting opgehaald: ${opgehaald} plaatsingen in ${teams.length} teams.\n`);

// --- Leden ---
const simple = await get("member/search/FilterMembersSimple");
const ext = await get("member/search/FilterMembersExtended");
for (const o of ext.MemberStatus?.Options ?? []) {
  o.Selected = true;
  o.IsSelected = true;
}
const leden =
  (
    await post("member/search/SearchMembers", {
      Filters: { InputExtended: ext, InputSimple: simple },
    })
  ).Members ?? [];
const lid = new Map(leden.map((m) => [m.PublicPersonId, m]));

const isAlgemeenReserve = (m) => /algemeen reserve/i.test(m?.ClubGameActivities ?? "");
const isOudLid = (m) => /oud/i.test(m?.TypeOfMemberDescription ?? "") || Boolean(m?.RelationEnd);
const heeftSpelactiviteit = (m) => Boolean(m?.KernelGameActivities);

const bevindingen = { reserve: [], oudLid: [], geenActiviteit: [] };

for (const { team, spelers } of bezetting) {
  for (const p of spelers) {
    const m = lid.get(p.PublicPersonId);
    const regel = {
      team: `${team.TeamCode} (${team.GameActivityDescription})`,
      naam: p.FullName,
      rc: p.PublicPersonId,
      basis: p.IsBasePlayer,
      speelstatus: p.PlayingStatusDescription ?? "-",
    };
    if (isAlgemeenReserve(m)) bevindingen.reserve.push(regel);
    if (isOudLid(m))
      bevindingen.oudLid.push({
        ...regel,
        eind: m?.RelationEnd ? new Date(m.RelationEnd).toISOString().slice(0, 10) : "?",
      });
    else if (!heeftSpelactiviteit(m)) bevindingen.geenActiviteit.push(regel);
  }
}

const alleSpelers = bezetting.flatMap((b) => b.spelers);
const basisTelling = new Map();
for (const p of alleSpelers) {
  const sleutel = `IsBasePlayer=${p.IsBasePlayer}  rol=${p.RoleDescription}  speelstatus=${p.PlayingStatusDescription ?? "-"}`;
  basisTelling.set(sleutel, (basisTelling.get(sleutel) ?? 0) + 1);
}
out("### Hoe markeert Sportlink de rollen?");
for (const [k, v] of [...basisTelling].sort((a, b) => b[1] - a[1])) out(`  ${k}: ${v}`);
out("");

out("## Te herstellen in Sportlink\n");

// Sportlink zet iedereen weg als "Teamspeler" met IsBasePlayer=false, dus er is geen
// reserve-markering binnen een team: wie in het team staat, staat in het basisteam.
const perPersoon = new Map();
for (const r of bevindingen.reserve) {
  if (!perPersoon.has(r.rc)) perPersoon.set(r.rc, { naam: r.naam, teams: [] });
  perPersoon.get(r.rc).teams.push(r.team);
}
out(`### 1. Algemeen reserve in een basisteam — mag niet (${perPersoon.size} personen)`);
for (const [rc, p] of perPersoon) out(`  ${p.naam.padEnd(34)} ${rc}   ${p.teams.join(", ")}`);

out(`\n### 2. Oud-lid nog in een team (${bevindingen.oudLid.length})`);
for (const r of bevindingen.oudLid) out(`  ${r.team.padEnd(16)} ${r.naam}  eind=${r.eind}`);

out(`\n### 3. Geen spelactiviteit maar wel in een team (${bevindingen.geenActiviteit.length})`);
for (const r of bevindingen.geenActiviteit) out(`  ${r.team.padEnd(16)} ${r.naam}  (${r.rc})`);

// --- 4. Indeling versus Sportlink ---
if (!VERSIE_ID) {
  out("\n(Geef een versieId mee voor regel 4: wie uit de indeling ontbreekt in Sportlink.)");
  process.exit(0);
}

const inTeam = new Set(bezetting.flatMap(({ spelers }) => spelers.map((p) => p.PublicPersonId)));

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();
const { rows } = await client.query(
  `SELECT t.naam AS groep, ts."spelerId" AS rc, s.roepnaam, s.achternaam
     FROM "Team" t
     JOIN "TeamSpeler" ts ON ts."teamId" = t.id
     JOIN "Speler" s ON s.id = ts."spelerId"
    WHERE t."versieId" = $1
   UNION ALL
   SELECT COALESCE(g.naam, 'Selectiegroep'), ss."spelerId", s.roepnaam, s.achternaam
     FROM "SelectieGroep" g
     JOIN "SelectieSpeler" ss ON ss."selectieGroepId" = g.id
     JOIN "Speler" s ON s.id = ss."spelerId"
    WHERE g."versieId" = $1`,
  [VERSIE_ID]
);
await client.end();

const ontbreekt = rows.filter((r) => {
  if (inTeam.has(r.rc)) return false;
  const m = lid.get(r.rc);
  // Kangoeroes en recreanten horen niet in een bondsteam.
  if (/kangoeroe|recreant/i.test(m?.KernelGameActivities ?? "")) return false;
  if (isOudLid(m)) return false;
  return true;
});

out(`\n### 4. Wel ingedeeld, nog geen Sportlink-team (${ontbreekt.length})`);
for (const r of ontbreekt) {
  const m = lid.get(r.rc);
  out(
    `  ${(r.groep ?? "").padEnd(24)} ${r.roepnaam} ${r.achternaam}  (${r.rc})  activiteiten=${m?.KernelGameActivities || "GEEN"}`
  );
}
