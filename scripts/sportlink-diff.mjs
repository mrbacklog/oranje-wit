/**
 * Vergelijkt de actuele Sportlink-ledenlijst met de leden-tabel in de database.
 * Rapporteert nieuwe leden, afgemelde leden en de teamverdeling voor 2026-2027.
 *
 * Toont geen geboortedatum of adres (privacy).
 *
 * Gebruik: node scripts/sportlink-diff.mjs
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from "./sportlink-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const out = (s) => process.stdout.write(s + "\n");

// --- Sportlink ---
const token = await sportlinkLogin();

const [extRes, simpleRes] = await Promise.all([
  fetch(`${NAVAJO_BASE}/member/search/FilterMembersExtended`, {
    headers: navajoHeaders("member/search/FilterMembersExtended", token),
  }),
  fetch(`${NAVAJO_BASE}/member/search/FilterMembersSimple`, {
    headers: navajoHeaders("member/search/FilterMembersSimple", token),
  }),
]);

const inputExtended = await extRes.json();
const inputSimple = await simpleRes.json();
if (inputExtended.Error) throw new Error(`Filter-fout: ${inputExtended.Message}`);
if (inputExtended.MemberStatus?.Options) {
  for (const opt of inputExtended.MemberStatus.Options) opt.Selected = true;
}

const searchRes = await fetch(`${NAVAJO_BASE}/member/search/SearchMembers`, {
  method: "POST",
  headers: navajoHeaders("member/search/SearchMembers", token),
  body: JSON.stringify({ Filters: { InputExtended: inputExtended, InputSimple: inputSimple } }),
});
const data = await searchRes.json();
if (data.Error) throw new Error(`SearchMembers fout: ${data.Message}`);

const sportlink = data.Members ?? [];
out(`Sportlink: ${sportlink.length} leden opgehaald.`);

const slMap = new Map(sportlink.map((m) => [m.PublicPersonId, m]));

// --- Database ---
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows: dbLeden } = await client.query(
  `SELECT rel_code, roepnaam, tussenvoegsel, achternaam, afmelddatum FROM leden`
);
const dbActief = new Map(dbLeden.filter((r) => r.afmelddatum === null).map((r) => [r.rel_code, r]));
const dbAlle = new Map(dbLeden.map((r) => [r.rel_code, r]));

const naam = (r) => [r.roepnaam, r.tussenvoegsel, r.achternaam].filter(Boolean).join(" ");

// --- Diff ---
const nieuw = [...slMap.keys()].filter((k) => !dbAlle.has(k));
const heringeschreven = [...slMap.keys()].filter((k) => dbAlle.has(k) && !dbActief.has(k));
const verdwenen = [...dbActief.keys()].filter((k) => !slMap.has(k));

out(`\n### Nieuw in Sportlink, niet in database (${nieuw.length})`);
for (const k of nieuw) out(`  ${k}  ${slMap.get(k).FullName ?? ""}`);

out(`\n### Weer actief (stond afgemeld in database) (${heringeschreven.length})`);
for (const k of heringeschreven) out(`  ${k}  ${slMap.get(k).FullName ?? ""}`);

out(`\n### Actief in database, niet meer in Sportlink (${verdwenen.length})`);
for (const k of verdwenen) out(`  ${k}  ${naam(dbAlle.get(k))}`);

// --- Teams uit Sportlink ---
const teamTeller = new Map();
for (const m of sportlink) {
  const teams = (m.ClubTeams ?? m.UnionTeams ?? "")
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
  for (const t of teams) teamTeller.set(t, (teamTeller.get(t) ?? 0) + 1);
}

out(`\n### Teams volgens Sportlink (${teamTeller.size})`);
for (const [t, n] of [...teamTeller.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  out(`  ${t}: ${n}`);
}

await client.end();
