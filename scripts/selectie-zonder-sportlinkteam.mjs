/**
 * Toont de spelers die wél in een selectiegroep of team van de indeling zitten,
 * maar in geen enkel Sportlink-veldteam staan — verrijkt met hun Sportlink-gegevens
 * (lidstatus, spelactiviteiten, eventueel zaalteam).
 *
 * Gebruik: node scripts/selectie-zonder-sportlinkteam.mjs <versieId>
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from "./sportlink-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const VERSIE_ID = process.argv[2];
if (!VERSIE_ID) {
  process.stderr.write("Geef een versieId mee.\n");
  process.exit(1);
}

const out = (s) => process.stdout.write(s + "\n");

const veldteams = JSON.parse(
  readFileSync(resolve(__dirname, "../data/seizoenen/2026-2027/teams-sportlink.json"), "utf8")
);
const inVeldteam = new Set(veldteams.flatMap((t) => t.spelers.map((s) => s.relCode)));

// --- Sportlink: leden + alle teams (veld én zaal) ---
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
const slLeden = new Map(leden.map((m) => [m.PublicPersonId, m]));

// Alle teams (ook zaal) om te zien of iemand ergens anders wél staat
const alleTeams = (await get("team/UnionTeams")).Team ?? [];
const teamVan = new Map();
for (const t of alleTeams) {
  // Let op: Sportlink levert de bezetting in het veld `Person`, niet `TeamPerson`.
  const spelers =
    (await get("team/teamperson/UnionTeamPlayers", { PublicTeamId: t.PublicTeamId })).Person ?? [];
  for (const p of spelers) {
    if (!teamVan.has(p.PublicPersonId)) teamVan.set(p.PublicPersonId, []);
    teamVan.get(p.PublicPersonId).push(`${t.TeamCode} (${t.GameActivityDescription})`);
  }
}

// --- Database: indeling ---
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows } = await client.query(
  `SELECT t.naam AS groep, ts."spelerId" AS rel_code, s.roepnaam, s.achternaam, s.geboortejaar
     FROM "Team" t
     JOIN "TeamSpeler" ts ON ts."teamId" = t.id
     JOIN "Speler" s ON s.id = ts."spelerId"
    WHERE t."versieId" = $1
   UNION ALL
   SELECT COALESCE(g.naam, 'Selectiegroep'), ss."spelerId", s.roepnaam, s.achternaam, s.geboortejaar
     FROM "SelectieGroep" g
     JOIN "SelectieSpeler" ss ON ss."selectieGroepId" = g.id
     JOIN "Speler" s ON s.id = ss."spelerId"
    WHERE g."versieId" = $1
   ORDER BY 1, 4`,
  [VERSIE_ID]
);

const zonder = rows.filter((r) => !inVeldteam.has(r.rel_code));

out(`### Ingedeeld zonder Sportlink-veldteam: ${zonder.length}\n`);
for (const r of zonder) {
  const m = slLeden.get(r.rel_code);
  const leeftijd = r.geboortejaar ? 2026 - r.geboortejaar : "?";
  const andereTeams = teamVan.get(r.rel_code) ?? [];
  out(`${r.roepnaam} ${r.achternaam}  (${r.rel_code}, ${leeftijd} jr) — ${r.groep}`);
  if (!m) {
    out("    niet gevonden in Sportlink");
  } else {
    out(
      `    Sportlink: status=${m.MemberStatusDescription ?? m.MemberStatus ?? "?"}` +
        `  type=${m.TypeOfMemberDescription ?? m.TypeOfMember ?? "?"}` +
        `${m.RelationEnd ? `  eind=${new Date(m.RelationEnd).toISOString().slice(0, 10)}` : ""}`
    );
    out(`    spelactiviteiten: ${m.KernelGameActivities || "GEEN"}`);
  }
  out(`    teams in Sportlink: ${andereTeams.length ? andereTeams.join(", ") : "geen"}`);
  out("");
}

await client.end();
