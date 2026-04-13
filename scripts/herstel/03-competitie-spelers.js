#!/usr/bin/env node
/**
 * Herstelscript 03 — competitie_spelers
 *
 * Bron 1: data/export/export-2026-2027.json — spelerspaden, competitie='veld_najaar'
 * Bron 2: data/leden/Leden 528 personen gevonden.csv — Sportlink, competitie='veld_voorjaar' voor 2025-2026
 *
 * ON CONFLICT (rel_code, seizoen, competitie) DO UPDATE → veilig herhaalbaar
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../apps/web/.env") });
const { Client } = require("pg");
const path = require("path");
const fs = require("fs");

const EXPORT_PATH = path.resolve(__dirname, "../../data/export/export-2026-2027.json");
const CSV_PATH = path.resolve(
  __dirname,
  "../../data/leden/Leden 528 personen gevonden.csv"
);

function parseCsvLine(line) {
  const vals = [];
  let current = "";
  let inQuote = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (ch === ";" && !inQuote) {
      vals.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  vals.push(current.trim());
  return vals;
}

const REL_CODE_RE = /^[A-Z]{2,3}\d{2,3}[A-Z]\d$/;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Verbonden met database");

  // ── Stap 1: Geslacht-lookup vanuit leden tabel ──────────────────────────────
  const geslachtMap = new Map();
  const ledenRows = await client.query("SELECT rel_code, geslacht FROM leden");
  for (const row of ledenRows.rows) {
    if (row.geslacht) geslachtMap.set(row.rel_code, row.geslacht);
  }
  console.log(`Geslacht-lookup geladen: ${geslachtMap.size} leden`);

  let totaalIngevoegd = 0;
  let totaalBijgewerkt = 0;
  let fkFouten = 0;
  const fkFoutenLog = [];
  const alleRelCodes = new Set();
  const alleSeizoenen = new Set();

  // ── INSERT helper ───────────────────────────────────────────────────────────
  async function upsertRecord({ rel_code, seizoen, competitie, team, geslacht, bron, betrouwbaar }) {
    try {
      const res = await client.query(
        `INSERT INTO competitie_spelers (rel_code, seizoen, competitie, team, geslacht, bron, betrouwbaar)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (rel_code, seizoen, competitie) DO UPDATE SET
           team       = EXCLUDED.team,
           geslacht   = EXCLUDED.geslacht,
           bron       = EXCLUDED.bron,
           betrouwbaar = EXCLUDED.betrouwbaar
         RETURNING xmax`,
        [rel_code, seizoen, competitie, team, geslacht, bron, betrouwbaar]
      );
      // xmax = 0 → INSERT, xmax != 0 → UPDATE
      if (res.rows[0].xmax === "0") {
        totaalIngevoegd++;
      } else {
        totaalBijgewerkt++;
      }
      alleRelCodes.add(rel_code);
      alleSeizoenen.add(seizoen);
    } catch (err) {
      if (err.code === "23503") {
        // FK violation
        fkFouten++;
        fkFoutenLog.push({ rel_code, seizoen, competitie, fout: err.detail });
        console.warn(`[WARN] FK-fout overgeslagen: ${rel_code} / ${seizoen} / ${competitie} — ${err.detail}`);
      } else {
        console.error(`[ERROR] Onverwachte fout bij ${rel_code}: ${err.message}`);
        throw err;
      }
    }
  }

  // ── Stap 2: Bron 1 — spelerspaden uit export JSON ──────────────────────────
  console.log("\nVerwerken Bron 1: export-2026-2027.json ...");
  const exportData = JSON.parse(fs.readFileSync(EXPORT_PATH, "utf-8"));
  const spelers = exportData.spelers || [];

  let bron1Verwerkt = 0;
  for (const speler of spelers) {
    const rel_code = speler.id;
    if (!rel_code) continue;

    const geslacht = speler.geslacht || geslachtMap.get(rel_code) || null;

    const pad = speler.spelerspad || [];
    for (const stap of pad) {
      if (!stap.seizoen || !stap.team) continue;

      await upsertRecord({
        rel_code,
        seizoen: stap.seizoen,
        competitie: "veld_najaar",
        team: stap.team,
        geslacht,
        bron: "export-spelerspad",
        betrouwbaar: true,
      });
      bron1Verwerkt++;
    }
  }
  console.log(`Bron 1 verwerkt: ${bron1Verwerkt} pad-stappen voor ${spelers.length} spelers`);

  // ── Stap 3: Bron 2 — Sportlink CSV voor seizoen 2025-2026 ──────────────────
  // Doel: aanvullende coverage voor spelende leden die NIET in de export staan.
  // "Lokale teams" kolom is leeg in deze export → we gebruiken betrouwbaar=false en team='onbekend'
  // voor leden waarbij we geen team kennen. Alleen leden met Bondslid/Recreatielid en spelactiviteiten.
  console.log("\nVerwerken Bron 2: Sportlink CSV ...");
  const csvRaw = fs.readFileSync(CSV_PATH, "utf-8");
  const csvLines = csvRaw.split(/\r?\n/);
  const headerLine = csvLines[0];
  const headers = parseCsvLine(headerLine);

  const idxLidsoort = headers.indexOf("Lidsoort");
  const idxRelCode = headers.indexOf("Rel. code");
  const idxGeslacht = headers.indexOf("Geslacht");
  const idxLokaleTeams = headers.indexOf("Lokale teams");
  const idxSpelBond = headers.indexOf("Spelactiviteiten (bond)");

  console.log(`CSV kolommen — Lidsoort: ${idxLidsoort}, Rel.code: ${idxRelCode}, Geslacht: ${idxGeslacht}, Lokale teams: ${idxLokaleTeams}, SpelBond: ${idxSpelBond}`);

  // Bouw set van rel_codes die al in competitie_spelers zitten voor 2025-2026
  const bestaandeRelCodes2025 = new Set();
  const bestaandeRes = await client.query(
    "SELECT DISTINCT rel_code FROM competitie_spelers WHERE seizoen = '2025-2026'"
  );
  for (const row of bestaandeRes.rows) {
    bestaandeRelCodes2025.add(row.rel_code);
  }
  console.log(`Al in DB voor 2025-2026: ${bestaandeRelCodes2025.size} spelers`);

  let bron2Verwerkt = 0;
  let bron2Overgeslagen = 0;

  for (let i = 1; i < csvLines.length; i++) {
    const line = csvLines[i].trim();
    if (!line) continue;

    const vals = parseCsvLine(line);
    const lidsoort = vals[idxLidsoort] || "";
    const rel_code = vals[idxRelCode] || "";
    const geslachtRaw = vals[idxGeslacht] || "";
    const lokaleTeamsRaw = (idxLokaleTeams >= 0 ? vals[idxLokaleTeams] : "") || "";
    const spelBond = (idxSpelBond >= 0 ? vals[idxSpelBond] : "") || "";

    // Filter op lidsoort
    if (!["Bondslid", "Recreatielid"].includes(lidsoort)) {
      bron2Overgeslagen++;
      continue;
    }

    // Valideer rel_code (Sportlink codes hebben soms koppelteken of afwijkend patroon)
    if (!rel_code || rel_code.length < 4) {
      bron2Overgeslagen++;
      continue;
    }

    // Skip als al in DB via export (veld_najaar) — aanvullende coverage is doel
    if (bestaandeRelCodes2025.has(rel_code)) {
      bron2Overgeslagen++;
      continue;
    }

    // Skip niet-spelende leden
    const isSpelend =
      spelBond &&
      !spelBond.toLowerCase().includes("niet spelend") &&
      spelBond.trim() !== "";
    if (!isSpelend) {
      bron2Overgeslagen++;
      continue;
    }

    // Geslacht normaliseren
    let geslacht = null;
    if (geslachtRaw === "Man") geslacht = "M";
    else if (geslachtRaw === "Vrouw") geslacht = "V";
    else geslacht = geslachtMap.get(rel_code) || null;

    // Team: gebruik eerste lokale team als beschikbaar, anders 'onbekend'
    let team = "onbekend";
    let betrouwbaar = false;
    if (lokaleTeamsRaw) {
      const teamsLijst = lokaleTeamsRaw.split(",").map((t) => t.trim()).filter(Boolean);
      if (teamsLijst.length > 0) {
        team = teamsLijst[0];
        betrouwbaar = true;
      }
    }

    await upsertRecord({
      rel_code,
      seizoen: "2025-2026",
      competitie: "veld_voorjaar",
      team,
      geslacht,
      bron: "sportlink-csv",
      betrouwbaar,
    });
    bron2Verwerkt++;
  }

  console.log(`Bron 2 verwerkt: ${bron2Verwerkt} records ingevoegd/bijgewerkt, ${bron2Overgeslagen} overgeslagen`);

  // ── Eindrapport ─────────────────────────────────────────────────────────────
  const totaalRecords = await client.query("SELECT COUNT(*) FROM competitie_spelers");
  const distinctStats = await client.query(
    "SELECT COUNT(DISTINCT rel_code) as spelers, COUNT(DISTINCT seizoen) as seizoenen FROM competitie_spelers"
  );

  console.log("\n=== EINDRAPPORT ===");
  console.log(`Nieuw ingevoegd:      ${totaalIngevoegd}`);
  console.log(`Bijgewerkt (UPDATE):  ${totaalBijgewerkt}`);
  console.log(`FK-fouten (skipped):  ${fkFouten}`);
  console.log(`Totaal in DB:         ${totaalRecords.rows[0].count}`);
  console.log(`Unieke spelers:       ${distinctStats.rows[0].spelers}`);
  console.log(`Unieke seizoenen:     ${distinctStats.rows[0].seizoenen}`);

  if (fkFouten > 0) {
    console.warn("\n[WARN] FK-fouten (rel_code niet in leden tabel):");
    for (const f of fkFoutenLog.slice(0, 20)) {
      console.warn(`  - ${f.rel_code} / ${f.seizoen} / ${f.competitie}: ${f.fout}`);
    }
    if (fkFoutenLog.length > 20) {
      console.warn(`  ... en nog ${fkFoutenLog.length - 20} meer`);
    }
  }

  await client.end();
  console.log("\nKlaar.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
