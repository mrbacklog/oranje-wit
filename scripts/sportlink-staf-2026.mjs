/**
 * Haalt de staf per veldteam op uit Sportlink (UnionTeamNonPlayers) en vergelijkt
 * die met de staftoewijzingen in de teamindeling.
 *
 * Gebruik: node scripts/sportlink-staf-2026.mjs [versieId] [--json <pad>]
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from "./sportlink-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const args = process.argv.slice(2);
const VERSIE_ID = args.find((a) => !a.startsWith("--"));
const jsonIdx = args.indexOf("--json");
const JSON_PAD = jsonIdx > -1 ? args[jsonIdx + 1] : null;

const out = (s) => process.stdout.write(s + "\n");
const token = await sportlinkLogin();

const get = async (e, p = {}) => {
  const qs = new URLSearchParams(p).toString();
  return (
    await fetch(`${NAVAJO_BASE}/${e}${qs ? `?${qs}` : ""}`, { headers: navajoHeaders(e, token) })
  ).json();
};

const teams = (await get("team/UnionTeams")).Team ?? [];
const veld = teams.filter((t) => (t.GameActivityDescription ?? "").toLowerCase() === "veld");

const pauze = (ms) => new Promise((r) => setTimeout(r, ms));
const resultaat = [];

for (const t of veld) {
  const data = await get("team/teamperson/UnionTeamNonPlayers", { PublicTeamId: t.PublicTeamId });
  const staf = data.Person ?? data.TeamPerson ?? [];
  if (data.Error) {
    process.stderr.write(`LET OP: ${t.TeamCode}: ${data.Message}\n`);
  }
  resultaat.push({
    code: t.TeamCode,
    publicTeamId: t.PublicTeamId,
    staf: staf.map((p) => ({
      relCode: p.PublicPersonId,
      naam: p.FullName,
      rol: p.RoleFunctionDescription || p.FunctionDescription || p.RoleDescription || "?",
    })),
  });
  await pauze(200);
}

const totaal = resultaat.reduce((n, r) => n + r.staf.length, 0);
out(`Staf in veldteams: ${totaal} toewijzingen over ${veld.length} teams\n`);

for (const r of resultaat) {
  out(`### ${r.code} — ${r.staf.length}`);
  for (const s of r.staf) out(`    ${s.relCode ?? "-"}  ${s.naam}  [${s.rol}]`);
}

if (JSON_PAD) {
  writeFileSync(JSON_PAD, JSON.stringify(resultaat, null, 2), "utf8");
  out(`\nWeggeschreven: ${JSON_PAD}`);
}

if (!VERSIE_ID) process.exit(0);

// --- Vergelijk met de staftoewijzingen in de indeling ---
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows } = await client.query(
  `SELECT t.naam AS team, st."stafId", sf.naam AS staf, st.rol::text AS rol
     FROM "Team" t
     JOIN "TeamStaf" st ON st."teamId" = t.id
     JOIN "Staf" sf ON sf.id = st."stafId"
    WHERE t."versieId" = $1
   UNION ALL
   SELECT COALESCE(g.naam, 'Selectiegroep'), ss."stafId", sf.naam, ss.rol::text
     FROM "SelectieGroep" g
     JOIN "SelectieStaf" ss ON ss."selectieGroepId" = g.id
     JOIN "Staf" sf ON sf.id = ss."stafId"
    WHERE g."versieId" = $1
   ORDER BY 1`,
  [VERSIE_ID]
);
await client.end();

out(`\n### Staf in de indeling: ${rows.length}`);
for (const r of rows) out(`  ${(r.team ?? "").padEnd(24)} ${r.staf}  [${r.rol}]`);
