#!/usr/bin/env node
/* eslint-disable no-console -- CLI-rapportagescript, console is de output */
/**
 * Importeert historisch geoogste competitieniveaus (klasse) in team_periodes.
 *
 * Bron: data/seizoenen/historie/team-niveaus.json (zie scripts/oogst-historische-niveaus.mjs)
 * Doel: team_periodes.klasse (+ klasse_bron, + pool voor de poulecode waar aanwezig)
 *
 * Koppeling teamnaam -> team_id verloopt via team_aliases (seizoen + alias), met een
 * fallback op de letterlijke ow_code. Er wordt NOOIT geraden: teams die niet gekoppeld
 * kunnen worden, worden gerapporteerd, niet overgeslagen met een gok.
 *
 * Gebruik:
 *   node scripts/import-historische-niveaus.mjs             # dry-run (standaard)
 *   node scripts/import-historische-niveaus.mjs --apply      # daadwerkelijk wegschrijven
 *   node scripts/import-historische-niveaus.mjs --bron=<pad> # ander databestand
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const bronArg = args.find((a) => a.startsWith("--bron="))?.split("=")[1];
const BRON = resolve(__dirname, bronArg ?? "../data/seizoenen/historie/team-niveaus.json");

const out = (s = "") => process.stdout.write(s + "\n");

/** "Oranje Wit A1" -> "A1", "Oranje Wit 3" -> "3" */
function teamCandidaat(team) {
  const m = team.match(/^Oranje Wit (.+)$/);
  return m ? m[1] : team;
}

/** Kandidaat-aliassen om te proberen, van specifiek naar generiek. Geen giswerk — alleen
 *  vormen die daadwerkelijk in de historische ow_code/alias-conventie voorkomen. */
function kandidaatAliassen(candidaat) {
  const lijst = [candidaat];
  if (/^\d+$/.test(candidaat)) lijst.push(`S${candidaat}`);
  return lijst;
}

async function zoekTeamId(client, cache, seizoen, teamNaam) {
  const candidaat = teamCandidaat(teamNaam);
  const cacheKey = `${seizoen}|${teamNaam}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  let gevonden = null;
  for (const alias of kandidaatAliassen(candidaat)) {
    const res = await client.query(
      `SELECT ow_team_id AS id, ow_code FROM team_aliases WHERE seizoen = $1 AND alias = $2`,
      [seizoen, alias]
    );
    if (res.rows.length === 1) {
      gevonden = { id: res.rows[0].id, owCode: res.rows[0].ow_code, via: `alias:${alias}` };
      break;
    }
    if (res.rows.length > 1) {
      gevonden = { ambigu: true, kandidaten: res.rows.map((r) => r.ow_code) };
      break;
    }
  }

  if (!gevonden) {
    // Fallback: letterlijke ow_code, voor het geval de alias-tabel dit team mist.
    for (const alias of kandidaatAliassen(candidaat)) {
      const owCode = `OW-${alias}`;
      const res = await client.query(`SELECT id FROM teams WHERE seizoen = $1 AND ow_code = $2`, [
        seizoen,
        owCode,
      ]);
      if (res.rows.length === 1) {
        gevonden = { id: res.rows[0].id, owCode, via: `ow_code:${owCode}` };
        break;
      }
    }
  }

  cache.set(cacheKey, gevonden);
  return gevonden;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL ontbreekt — kan niet koppelen zonder databaseverbinding.");
    process.exit(1);
  }

  const ruw = JSON.parse(readFileSync(BRON, "utf8"));
  const niveaus = ruw.niveaus ?? ruw;
  out(`Bron: ${BRON}`);
  out(`Ingelezen: ${niveaus.length} rijen (modus: ${APPLY ? "APPLY" : "DRY-RUN"})\n`);

  // Detecteer dubbele (seizoen, periode, team) combinaties -- kan niet in TeamPeriode
  // (unique op teamId+periode), dus deze vragen een handmatige keuze.
  const gezien = new Map();
  const dubbel = new Set();
  for (const r of niveaus) {
    const key = `${r.seizoen}|${r.periode}|${r.team}`;
    if (gezien.has(key)) dubbel.add(key);
    gezien.set(key, true);
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const kolomCheck = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'team_periodes' AND column_name IN ('klasse', 'klasse_bron')`
  );
  const migratieAanwezig = kolomCheck.rows.length === 2;
  if (!migratieAanwezig) {
    out(
      "LET OP: kolommen klasse/klasse_bron bestaan nog niet in team_periodes — migratie " +
        "20260904120000_team_periode_klasse is hier nog niet uitgevoerd. Koppeling wordt " +
        "getoond, conflictcheck en --apply worden overgeslagen.\n"
    );
  }

  const cache = new Map();
  const teKoppelen = [];
  const nietGekoppeld = [];
  const ambigu = [];
  const overgeslagenDubbel = [];

  for (const rij of niveaus) {
    const key = `${rij.seizoen}|${rij.periode}|${rij.team}`;
    if (dubbel.has(key)) {
      overgeslagenDubbel.push(rij);
      continue;
    }

    const match = await zoekTeamId(client, cache, rij.seizoen, rij.team);
    if (!match) {
      nietGekoppeld.push(rij);
    } else if (match.ambigu) {
      ambigu.push({ rij, kandidaten: match.kandidaten });
    } else {
      teKoppelen.push({ rij, teamId: match.id, owCode: match.owCode, via: match.via });
    }
  }

  out(`Gekoppeld:        ${teKoppelen.length}`);
  out(`Niet gekoppeld:   ${nietGekoppeld.length}`);
  out(`Ambigu (>1 team): ${ambigu.length}`);
  out(`Overgeslagen (dubbele seizoen+periode+team in bron): ${overgeslagenDubbel.length}\n`);

  if (nietGekoppeld.length > 0) {
    out("=== Niet gekoppeld (geen alias/ow_code gevonden — niet geraden) ===");
    for (const r of nietGekoppeld) {
      out(`  ${r.seizoen} ${r.periode.padEnd(13)} ${r.team.padEnd(16)} klasse="${r.klasse}"`);
    }
    out();
  }

  if (ambigu.length > 0) {
    out("=== Ambigu (meerdere teams matchen dezelfde alias) ===");
    for (const { rij, kandidaten } of ambigu) {
      out(`  ${rij.seizoen} ${rij.periode} ${rij.team} -> ${kandidaten.join(", ")}`);
    }
    out();
  }

  if (overgeslagenDubbel.length > 0) {
    out("=== Overgeslagen: dubbele (seizoen, periode, team) in de bron ===");
    for (const r of overgeslagenDubbel) {
      out(
        `  ${r.seizoen} ${r.periode} ${r.team}: klasse="${r.klasse}" (poule=${r.poulecode ?? "-"})`
      );
    }
    out(
      "  -> handmatig kiezen welke klasse leidend is, dan --bron met gecorrigeerd bestand draaien.\n"
    );
  }

  if (!migratieAanwezig) {
    await client.end();
    return;
  }

  // Conflictdetectie: bestaande klasse/pool die door deze import overschreven zou worden
  // met een afwijkende waarde.
  const conflicten = [];
  for (const { rij, teamId } of teKoppelen) {
    const res = await client.query(
      `SELECT klasse, pool FROM team_periodes WHERE team_id = $1 AND periode = $2`,
      [teamId, rij.periode]
    );
    if (res.rows.length === 1) {
      const bestaand = res.rows[0];
      if (bestaand.klasse && bestaand.klasse !== rij.klasse) {
        conflicten.push({ rij, teamId, veld: "klasse", was: bestaand.klasse, wordt: rij.klasse });
      }
      if (rij.poulecode && bestaand.pool && bestaand.pool !== rij.poulecode) {
        conflicten.push({ rij, teamId, veld: "pool", was: bestaand.pool, wordt: rij.poulecode });
      }
    }
  }

  if (conflicten.length > 0) {
    out("=== Conflicten: bestaande waarde wijkt af van de bron ===");
    for (const c of conflicten) {
      out(
        `  ${c.rij.seizoen} ${c.rij.periode} ${c.rij.team} [${c.veld}]: "${c.was}" -> "${c.wordt}"`
      );
    }
    out();
  }

  if (!APPLY) {
    out("Dry-run — geen wijzigingen weggeschreven. Draai met --apply om toe te passen.");
    await client.end();
    return;
  }

  let aangemaakt = 0;
  let bijgewerkt = 0;

  await client.query("BEGIN");
  try {
    for (const { rij, teamId } of teKoppelen) {
      const res = await client.query(
        `INSERT INTO team_periodes (team_id, periode, klasse, klasse_bron, pool)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (team_id, periode)
         DO UPDATE SET
           klasse = EXCLUDED.klasse,
           klasse_bron = EXCLUDED.klasse_bron,
           pool = COALESCE(EXCLUDED.pool, team_periodes.pool)
         RETURNING (xmax = 0) AS inserted`,
        [teamId, rij.periode, rij.klasse, rij.bron, rij.poulecode]
      );
      if (res.rows[0].inserted) aangemaakt++;
      else bijgewerkt++;
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Import mislukt, transactie teruggedraaid:", err);
    await client.end();
    process.exit(1);
  }

  out(`Toegepast: ${aangemaakt} nieuw, ${bijgewerkt} bijgewerkt.`);
  await client.end();
}

main().catch((err) => {
  console.error("Onverwachte fout:", err);
  process.exit(1);
});
