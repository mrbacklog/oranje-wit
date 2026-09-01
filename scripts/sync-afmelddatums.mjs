/**
 * Zet leden.afmelddatum gelijk aan RelationEnd uit Sportlink (MemberStatus INACTIVE +
 * ELIGABLE_FOR_REMOVE). Rapporteert alle verschillen; wijzigt pas met --apply.
 *
 * Gebruik: node scripts/sync-afmelddatums.mjs [--apply]
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from "./sportlink-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const APPLY = process.argv.includes("--apply");
const out = (s) => process.stdout.write(s + "\n");

const token = await sportlinkLogin();
const get = async (e) =>
  (await fetch(`${NAVAJO_BASE}/${e}`, { headers: navajoHeaders(e, token) })).json();
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
  const aan = ["INACTIVE", "ELIGABLE_FOR_REMOVE"].includes(o.Id);
  o.Selected = aan;
  o.IsSelected = aan;
}
const data = await post("member/search/SearchMembers", {
  Filters: { InputExtended: ext, InputSimple: simple },
});
const inactief = (data.Members ?? []).filter((m) => m.RelationEnd);
out(`Sportlink: ${inactief.length} leden met een afmelddatum (RelationEnd).`);

const datum = (d) => new Date(d).toISOString().slice(0, 10);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows } = await client.query(
  `SELECT rel_code, roepnaam, tussenvoegsel, achternaam, afmelddatum::text FROM leden`
);
const db = new Map(rows.map((r) => [r.rel_code, r]));

const verschillen = [];
const toekomstigeOpzeggingen = [];
const ontbrekend = [];
for (const m of inactief) {
  const r = db.get(m.PublicPersonId);
  const sl = datum(m.RelationEnd);
  if (!r) {
    ontbrekend.push({ rc: m.PublicPersonId, naam: m.FullName, sl });
    continue;
  }
  if (r.afmelddatum !== sl) {
    // Een RelationEnd in de toekomst betekent "opgezegd per", niet "al weg". Die zetten we
    // niet als afmelddatum — dan zou het lid nu al als inactief meetellen.
    const toekomstig = sl > new Date().toISOString().slice(0, 10);
    (toekomstig ? toekomstigeOpzeggingen : verschillen).push({
      rc: m.PublicPersonId,
      naam: m.FullName,
      db: r.afmelddatum,
      sl,
    });
  }
}

out(`\n### Afwijkende afmelddatums: ${verschillen.length}`);
for (const v of verschillen)
  out(`  ${v.rc}  ${v.naam}\n      database: ${v.db ?? "leeg"}  →  Sportlink: ${v.sl}`);

out(
  `\n### Opgezegd per een toekomstige datum (NIET als afmelding gezet): ${toekomstigeOpzeggingen.length}`
);
for (const v of toekomstigeOpzeggingen) out(`  ${v.rc}  ${v.naam}  per ${v.sl}`);

out(`\n### In Sportlink afgemeld, niet in de database: ${ontbrekend.length}`);
for (const o of ontbrekend.slice(0, 20)) out(`  ${o.rc}  ${o.naam}  eind=${o.sl}`);

if (APPLY && verschillen.length > 0) {
  await client.query("BEGIN");
  try {
    for (const v of verschillen) {
      await client.query(`UPDATE leden SET afmelddatum = $2 WHERE rel_code = $1`, [v.rc, v.sl]);
    }
    await client.query("COMMIT");
    out(`\nCOMMIT — ${verschillen.length} afmelddatums bijgewerkt.`);
  } catch (e) {
    await client.query("ROLLBACK");
    out(`\nFOUT — teruggedraaid: ${e.message}`);
  }
} else if (!APPLY) {
  out("\nDry-run. Draai met --apply om toe te passen.");
}

await client.end();
