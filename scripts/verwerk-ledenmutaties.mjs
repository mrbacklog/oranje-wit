/**
 * Verwerkt de ledenmutaties van de seizoensovergang 2025-2026 → 2026-2027.
 *
 * - 9 nieuwe leden toevoegen uit Sportlink
 * - 2 heringeschreven leden heractiveren
 * - 3 afmeldingen registreren
 * - 1 foutieve rel_code corrigeren (Daan Mans)
 *
 * Draait standaard als DRY-RUN. Pas toe met:  node scripts/verwerk-ledenmutaties.mjs --apply
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

/** Einde seizoen 2025-2026: beste schatting voor afmeldingen die tussen de syncs vielen. */
const AFMELDDATUM = "2026-06-30";

const NIEUW = [
  "NMZ88Z9",
  "NJY07J2",
  "NNK87Z8",
  "NJZ05M8",
  "NNK88B3",
  "NNK89Y7",
  "NKL26W4",
  "NNK88C0",
  "TH-1104",
];
const HERACTIVEREN = ["NKR88F7", "NJQ72J4"];
const AFMELDEN = ["NLX00H0", "NMN23M1", "NMZ29T0"];
/** Daan Mans staat dubbel: NNJ36T7 (fout, wel ingedeeld) en NNJ36W8 (juist, in Sportlink). */
const MERGE = { van: "NNJ36T7", naar: "NNJ36W8" };

// --- Sportlink ophalen ---
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
if (inputExtended.MemberStatus?.Options) {
  for (const opt of inputExtended.MemberStatus.Options) opt.Selected = true;
}
const searchRes = await fetch(`${NAVAJO_BASE}/member/search/SearchMembers`, {
  method: "POST",
  headers: navajoHeaders("member/search/SearchMembers", token),
  body: JSON.stringify({ Filters: { InputExtended: inputExtended, InputSimple: inputSimple } }),
});
const sportlink = (await searchRes.json()).Members ?? [];
const slMap = new Map(sportlink.map((m) => [m.PublicPersonId, m]));

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

out(APPLY ? "=== TOEPASSEN ===" : "=== DRY-RUN (niets wordt gewijzigd) ===");

if (APPLY) await client.query("BEGIN");

try {
  // 1. Nieuwe leden
  out(`\n### Nieuwe leden (${NIEUW.length})`);
  for (const rc of NIEUW) {
    const m = slMap.get(rc);
    if (!m) {
      out(`  ${rc}: NIET GEVONDEN in Sportlink — overgeslagen`);
      continue;
    }
    const geboortejaar = m.DateOfBirth ? new Date(m.DateOfBirth).getFullYear() : null;
    const geslacht = m.GenderCode === "M" || m.GenderDescription === "Man" ? "M" : "V";
    const rij = {
      rel_code: rc,
      roepnaam: m.NickName ?? m.FirstName ?? "",
      voorletters: m.Initials ?? null,
      tussenvoegsel: m.Infix || null,
      achternaam: m.LastName ?? "",
      lidsoort: m.TypeOfMemberDescription ?? null,
      geslacht,
      geboortedatum: m.DateOfBirth ? new Date(m.DateOfBirth).toISOString().slice(0, 10) : null,
      geboortejaar,
      lid_sinds: m.MemberSince ? new Date(m.MemberSince).toISOString().slice(0, 10) : null,
    };
    out(
      `  ${rc}  ${rij.roepnaam} ${rij.tussenvoegsel ?? ""} ${rij.achternaam}  ${rij.geslacht}  ${geboortejaar}  sinds ${rij.lid_sinds}`
    );
    if (APPLY) {
      await client.query(
        `INSERT INTO leden (rel_code, roepnaam, voorletters, tussenvoegsel, achternaam,
                            lidsoort, geslacht, geboortedatum, geboortejaar, lid_sinds, registratie_datum)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
         ON CONFLICT (rel_code) DO NOTHING`,
        [
          rij.rel_code,
          rij.roepnaam,
          rij.voorletters,
          rij.tussenvoegsel,
          rij.achternaam,
          rij.lidsoort,
          rij.geslacht,
          rij.geboortedatum,
          rij.geboortejaar,
          rij.lid_sinds,
        ]
      );
    }
  }

  // 2. Heractiveren
  out(`\n### Heractiveren (${HERACTIVEREN.length})`);
  for (const rc of HERACTIVEREN) {
    const { rows } = await client.query(
      `SELECT roepnaam, achternaam, afmelddatum::text FROM leden WHERE rel_code = $1`,
      [rc]
    );
    out(
      `  ${rc}  ${rows[0]?.roepnaam} ${rows[0]?.achternaam}  afmelddatum ${rows[0]?.afmelddatum} → NULL`
    );
    if (APPLY) await client.query(`UPDATE leden SET afmelddatum = NULL WHERE rel_code = $1`, [rc]);
  }

  // 3. Afmelden
  out(`\n### Afmelden per ${AFMELDDATUM} (${AFMELDEN.length})`);
  for (const rc of AFMELDEN) {
    const { rows } = await client.query(
      `SELECT roepnaam, tussenvoegsel, achternaam FROM leden WHERE rel_code = $1`,
      [rc]
    );
    const r = rows[0];
    out(`  ${rc}  ${[r?.roepnaam, r?.tussenvoegsel, r?.achternaam].filter(Boolean).join(" ")}`);
    if (APPLY)
      await client.query(`UPDATE leden SET afmelddatum = $2 WHERE rel_code = $1`, [
        rc,
        AFMELDDATUM,
      ]);
  }

  // 4. Duplicaat samenvoegen: Daan Mans staat twee keer in de database.
  //    NNJ36T7 is het foutieve record (naam omgedraaid, niet in Sportlink) maar heeft
  //    wel de teamplaatsing; NNJ36W8 is het juiste record. Verwijzingen verhuizen,
  //    daarna het duplicaat verwijderen.
  const { van, naar } = MERGE;
  out(`\n### Duplicaat samenvoegen: ${van} → ${naar}`);

  const { rows: fks } = await client.query(`
    SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND ccu.table_name IN ('leden', 'Speler')
  `);

  for (const fk of fks) {
    const { rows } = await client.query(
      `SELECT COUNT(*)::int AS n FROM "${fk.table_name}" WHERE "${fk.column_name}" = $1`,
      [van]
    );
    if (rows[0].n === 0) continue;
    out(`  ${fk.table_name}.${fk.column_name}: ${rows[0].n} rij(en) verhuizen`);
    if (APPLY) {
      await client.query(
        `UPDATE "${fk.table_name}" SET "${fk.column_name}" = $2 WHERE "${fk.column_name}" = $1`,
        [van, naar]
      );
    }
  }

  out(`  Speler ${van} verwijderen`);
  out(`  leden ${van} verwijderen`);
  if (APPLY) {
    await client.query(`DELETE FROM "Speler" WHERE id = $1`, [van]);
    await client.query(`DELETE FROM leden WHERE rel_code = $1`, [van]);
  }

  if (APPLY) {
    await client.query("COMMIT");
    out("\nCOMMIT — mutaties doorgevoerd.");
  } else {
    out("\nDry-run klaar. Draai met --apply om toe te passen.");
  }
} catch (e) {
  if (APPLY) await client.query("ROLLBACK");
  out(`\nFOUT — teruggedraaid: ${e.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
