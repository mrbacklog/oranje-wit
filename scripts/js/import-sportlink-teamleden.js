/**
 * import-sportlink-teamleden.js
 *
 * Importeert Sportlink bondsteam CSV naar competitie_spelers en competitie_staf.
 * De CSV bevat spelers én staf voor zowel veld als zaal (records staan dubbel).
 *
 * Gebruik:
 *   node -r dotenv/config scripts/js/import-sportlink-teamleden.js <csv-path> [seizoen] [--dry-run]
 *   Default csv: docs/sportlink/Teams 642 personen gevonden.csv
 *   Default seizoen: 2025-2026
 */

const { Client } = require("pg");
const { readFileSync } = require("fs");
const { join } = require("path");

const ROOT = join(__dirname, "..", "..");
const DEFAULT_CSV = join(ROOT, "docs", "sportlink", "Teams 642 personen gevonden.csv");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const CSV_PATH = args.find((a) => a.endsWith(".csv") && !a.startsWith("--")) || DEFAULT_CSV;
const SEIZOEN = args.find((a) => /^\d{4}-\d{4}$/.test(a)) || "2025-2026";

// Welke competities krijgen spelers toegewezen vanuit deze CSV?
// De CSV onderscheidt niet tussen veld en zaal — beide krijgen dezelfde team.
const COMPETITIES = ["zaal", "veld_voorjaar"];

function parseCsvLine(line) {
  const vals = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (c === ";" && !inQuote) {
      vals.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  vals.push(cur);
  return vals;
}

async function main() {
  console.log(`\n🔄 Import Sportlink teamleden`);
  console.log(`   CSV:     ${CSV_PATH}`);
  console.log(`   Seizoen: ${SEIZOEN}`);
  console.log(`   Mode:    ${DRY_RUN ? "DRY-RUN" : "LIVE"}\n`);

  const raw = readFileSync(CSV_PATH, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const header = parseCsvLine(lines[0]);

  const idx = {
    team: header.indexOf("Team"),
    teamrol: header.indexOf("Teamrol"),
    roepnaam: header.indexOf("Roepnaam"),
    voorletters: header.indexOf("Voorletter(s)"),
    tussenvoegsel: header.indexOf("Tussenvoegsel(s)"),
    achternaam: header.indexOf("Achternaam"),
    lidsoort: header.indexOf("Lidsoort"),
    relCode: header.indexOf("Rel. code"),
    geslacht: header.indexOf("Geslacht"),
    gebDat: header.indexOf("Geb.dat."),
    email: header.indexOf("E-mailadres"),
  };
  for (const [k, v] of Object.entries(idx)) {
    if (v < 0) throw new Error(`Kolom ontbreekt: ${k}`);
  }

  // Parse alle rows, dedup op (relCode, team, teamrol)
  const seen = new Set();
  const spelers = []; // { relCode, team, geslacht }
  const staf = []; // { relCode, team, rol }
  // Houd ledengegevens bij per relCode (voor eventuele insert in leden-tabel)
  const ledenData = new Map(); // relCode → { roepnaam, voorletters, tussenvoegsel, achternaam, geslacht, gebDat, email, lidsoort }

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const team = cols[idx.team].trim();
    const rol = cols[idx.teamrol].trim();
    const relCode = cols[idx.relCode].trim();
    const geslachtRaw = cols[idx.geslacht].trim();
    if (!team || !relCode || !rol) continue;

    const key = `${relCode}|${team}|${rol}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const geslacht = geslachtRaw === "Male" ? "M" : geslachtRaw === "Female" ? "V" : null;

    if (!ledenData.has(relCode)) {
      ledenData.set(relCode, {
        relCode,
        roepnaam: cols[idx.roepnaam].trim(),
        voorletters: cols[idx.voorletters].trim() || null,
        tussenvoegsel: cols[idx.tussenvoegsel].trim() || null,
        achternaam: cols[idx.achternaam].trim(),
        geslacht,
        gebDat: cols[idx.gebDat].trim() || null,
        email: cols[idx.email].trim() || null,
        lidsoort: cols[idx.lidsoort].trim() || null,
      });
    }

    if (rol === "Teamspeler") {
      spelers.push({ relCode, team, geslacht });
    } else {
      // Technische staf, Overige staf, Medische staf
      staf.push({ relCode, team, rol });
    }
  }

  console.log(`📋 Parse resultaat:`);
  console.log(`   ${spelers.length} unieke speler-team koppelingen`);
  console.log(`   ${staf.length} unieke staf-team koppelingen`);
  console.log(`   ${seen.size} totaal na dedupe (van ${lines.length - 1} rijen in CSV)\n`);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Laad team_aliases voor mapping
  const { rows: aliasRows } = await client.query(
    `SELECT alias, ow_team_id, ow_code FROM team_aliases WHERE seizoen = $1`,
    [SEIZOEN]
  );
  const aliasMap = new Map();
  for (const r of aliasRows) aliasMap.set(r.alias, r);
  console.log(`📚 ${aliasMap.size} aliases geladen voor ${SEIZOEN}\n`);

  // Laad bestaande leden om te checken of rel_codes bestaan
  const alleRelCodes = [...new Set([...spelers.map((s) => s.relCode), ...staf.map((s) => s.relCode)])];
  const { rows: ledenRows } = await client.query(
    `SELECT rel_code FROM leden WHERE rel_code = ANY($1)`,
    [alleRelCodes]
  );
  const bekendeLeden = new Set(ledenRows.map((r) => r.rel_code));
  const onbekendeLeden = alleRelCodes.filter((rc) => !bekendeLeden.has(rc));
  if (onbekendeLeden.length > 0) {
    console.log(`⚠️  ${onbekendeLeden.length} rel_codes niet in leden-tabel — worden toegevoegd uit CSV:`);
    for (const rc of onbekendeLeden) {
      const l = ledenData.get(rc);
      if (!l) continue;
      const geboortejaar = l.gebDat ? parseInt(l.gebDat.slice(0, 4), 10) : null;
      console.log(`   + ${rc} — ${l.roepnaam} ${l.achternaam} (${l.geslacht}, ${geboortejaar})`);
      if (!DRY_RUN) {
        await client.query(
          `INSERT INTO leden (rel_code, roepnaam, voorletters, tussenvoegsel, achternaam, geslacht, geboortejaar, geboortedatum, email, lidsoort)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (rel_code) DO NOTHING`,
          [rc, l.roepnaam, l.voorletters, l.tussenvoegsel, l.achternaam, l.geslacht, geboortejaar, l.gebDat, l.email, l.lidsoort]
        );
        bekendeLeden.add(rc);
      }
    }
  }

  // Check onbekende teams
  const onbekendeTeams = new Set();
  for (const s of [...spelers, ...staf]) {
    if (!aliasMap.has(s.team)) onbekendeTeams.add(s.team);
  }
  if (onbekendeTeams.size > 0) {
    console.log(`⚠️  ${onbekendeTeams.size} onbekende teams (geen alias):`, [...onbekendeTeams].join(", "));
  }

  // ─── Spelers verwerken ────────────────────────────────────────
  console.log(`\n── Spelers ──`);
  const teamTelling = new Map();
  const spelerRijen = []; // {relCode, seizoen, competitie, team, owTeamId, geslacht}
  for (const s of spelers) {
    if (!bekendeLeden.has(s.relCode)) continue;
    const alias = aliasMap.get(s.team);
    const owTeamId = alias?.ow_team_id ?? null;
    for (const comp of COMPETITIES) {
      spelerRijen.push({
        relCode: s.relCode,
        competitie: comp,
        team: s.team,
        owTeamId,
        geslacht: s.geslacht,
      });
    }
    teamTelling.set(s.team, (teamTelling.get(s.team) || 0) + 1);
  }

  // Tel per team
  const teamTellingSorted = [...teamTelling.entries()].sort((a, b) => {
    if (a[0].length !== b[0].length) return a[0].length - b[0].length;
    return a[0].localeCompare(b[0]);
  });
  for (const [team, cnt] of teamTellingSorted) {
    const alias = aliasMap.get(team);
    console.log(`  ${team.padEnd(6)} → ${alias?.ow_code ?? "(onbekend)"}: ${cnt} spelers`);
  }

  // ─── Staf verwerken ───────────────────────────────────────────
  console.log(`\n── Staf ──`);
  const stafTelling = new Map();
  const stafRijen = [];
  for (const s of staf) {
    if (!bekendeLeden.has(s.relCode)) continue;
    const alias = aliasMap.get(s.team);
    const owTeamId = alias?.ow_team_id ?? null;
    stafRijen.push({
      relCode: s.relCode,
      team: s.team,
      owTeamId,
      rol: s.rol,
    });
    stafTelling.set(s.team, (stafTelling.get(s.team) || 0) + 1);
  }
  for (const [team, cnt] of [...stafTelling.entries()].sort()) {
    const alias = aliasMap.get(team);
    console.log(`  ${team.padEnd(6)} → ${alias?.ow_code ?? "(onbekend)"}: ${cnt} staf`);
  }

  console.log(`\n📊 Totaal:`);
  console.log(`   ${spelerRijen.length} competitie_spelers rijen (${COMPETITIES.join(" + ")})`);
  console.log(`   ${stafRijen.length} competitie_staf rijen`);

  if (DRY_RUN) {
    console.log("\n✋ DRY-RUN: geen writes uitgevoerd.");
    await client.end();
    return;
  }

  // Check of competitie_staf tabel bestaat, zo niet maken
  const { rows: tableCheck } = await client.query(
    `SELECT to_regclass('public.competitie_staf') as t`
  );
  if (!tableCheck[0].t) {
    console.log("\n📐 Maak tabel competitie_staf aan...");
    await client.query(`
      CREATE TABLE competitie_staf (
        id SERIAL PRIMARY KEY,
        rel_code TEXT NOT NULL,
        seizoen TEXT NOT NULL,
        team TEXT NOT NULL,
        ow_team_id INTEGER REFERENCES teams(id),
        rol TEXT NOT NULL,
        bron TEXT DEFAULT 'sportlink',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(rel_code, seizoen, team, rol)
      )
    `);
    console.log("  ✓ tabel aangemaakt");
  }

  await client.query("BEGIN");
  try {
    // Delete bestaande spelers voor deze competities+seizoen (alleen bondsteams, bron=sportlink)
    const delRes = await client.query(
      `DELETE FROM competitie_spelers
       WHERE seizoen = $1 AND competitie = ANY($2) AND bron = 'sportlink'`,
      [SEIZOEN, COMPETITIES]
    );
    console.log(`\n🗑️  ${delRes.rowCount} bestaande speler-rijen verwijderd (bron=sportlink, competities=${COMPETITIES.join(",")})`);

    for (const r of spelerRijen) {
      await client.query(
        `INSERT INTO competitie_spelers (rel_code, seizoen, competitie, team, geslacht, bron, betrouwbaar, ow_team_id)
         VALUES ($1, $2, $3, $4, $5, 'sportlink', true, $6)
         ON CONFLICT (rel_code, seizoen, competitie) DO UPDATE SET
           team = EXCLUDED.team,
           geslacht = EXCLUDED.geslacht,
           bron = EXCLUDED.bron,
           ow_team_id = EXCLUDED.ow_team_id`,
        [r.relCode, SEIZOEN, r.competitie, r.team, r.geslacht, r.owTeamId]
      );
    }
    console.log(`✅ ${spelerRijen.length} speler-rijen weggeschreven`);

    // Staf — vervang alles voor dit seizoen
    const delStaf = await client.query(
      `DELETE FROM competitie_staf WHERE seizoen = $1 AND bron = 'sportlink'`,
      [SEIZOEN]
    );
    console.log(`🗑️  ${delStaf.rowCount} bestaande staf-rijen verwijderd`);

    for (const r of stafRijen) {
      await client.query(
        `INSERT INTO competitie_staf (rel_code, seizoen, team, ow_team_id, rol, bron)
         VALUES ($1, $2, $3, $4, $5, 'sportlink')
         ON CONFLICT (rel_code, seizoen, team, rol) DO UPDATE SET
           ow_team_id = EXCLUDED.ow_team_id`,
        [r.relCode, SEIZOEN, r.team, r.owTeamId, r.rol]
      );
    }
    console.log(`✅ ${stafRijen.length} staf-rijen weggeschreven`);

    await client.query("COMMIT");
    console.log("\n🎉 Import klaar");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Fout, rollback:", err.message);
    throw err;
  }

  await client.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
