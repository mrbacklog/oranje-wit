/**
 * Historische backfill: team_aliases + ontbrekende teams voor 2010-2011 t/m 2024-2025.
 *
 * Stap 1: Maak ontbrekende teams aan op basis van team-namen in competitie_spelers.
 * Stap 2: Maak aliases aan (team-naam → ow_team_id).
 * Stap 3: Backfill ow_team_id in competitie_spelers.
 *
 * Gebruik:
 *   npx tsx scripts/migrate-teams-historisch.ts
 */

// eslint-disable-next-line no-console — migration script, intentional console output
import "dotenv/config";
import { Client } from "pg";

function categorize(naam: string): { categorie: string; teamType: string } {
  if (/^A[\d/]/.test(naam) || naam.startsWith("A1A") || naam === "AM5")
    return { categorie: "a", teamType: "SELECTIE" };
  if (/^[BCDEF][\d/]/.test(naam) || /^[BCM][A-Z]\d/.test(naam))
    return { categorie: "b", teamType: "JEUGD" };
  if (/^S[\d/]/.test(naam)) return { categorie: "a", teamType: "SENIOREN" };
  if (/^MW\d/.test(naam)) return { categorie: "b", teamType: "OVERIG" };
  if (naam === "Kangoeroes") return { categorie: "b", teamType: "OVERIG" };
  return { categorie: "b", teamType: "OVERIG" };
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log("=== Historische alias-backfill ===\n");

  // Stap 1: Vind alle team+seizoen combos zonder alias
  const missing = await client.query(`
    SELECT DISTINCT cs.seizoen, cs.team
    FROM competitie_spelers cs
    LEFT JOIN team_aliases ta ON ta.seizoen = cs.seizoen AND ta.alias = cs.team
    WHERE cs.seizoen < '2025-2026'
      AND ta.id IS NULL
    ORDER BY cs.seizoen, cs.team
  `);

  console.log(`${missing.rows.length} ontbrekende team+seizoen combos`);

  let teamsAangemaakt = 0;
  let aliasesAangemaakt = 0;

  for (const { seizoen, team } of missing.rows as { seizoen: string; team: string }[]) {
    const { categorie, teamType } = categorize(team);
    const owCode = `OW-${team.replace(/\//g, "-")}`;

    const ins = await client.query(
      `INSERT INTO teams (seizoen, ow_code, naam, categorie, team_type)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (seizoen, ow_code) DO UPDATE SET naam = EXCLUDED.naam
       RETURNING id`,
      [seizoen, owCode, team, categorie, teamType]
    );
    const teamId = ins.rows[0].id;
    if (ins.rowCount > 0) teamsAangemaakt++;

    const aliasIns = await client.query(
      `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (seizoen, alias) DO NOTHING`,
      [seizoen, team, teamId, owCode]
    );
    if (aliasIns.rowCount > 0) aliasesAangemaakt++;
  }

  // Stap 2: Alias ook voor bestaande teams (ow_code zonder OW- prefix)
  const bestaand = await client.query(
    `SELECT id, seizoen, ow_code, naam FROM teams WHERE seizoen != '2025-2026' ORDER BY seizoen, ow_code`
  );
  let bestaandAliases = 0;
  for (const team of bestaand.rows as {
    id: number;
    seizoen: string;
    ow_code: string;
    naam: string;
  }[]) {
    const knkvNaam = team.ow_code.replace(/^OW-/, "");
    const res = await client.query(
      `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (seizoen, alias) DO NOTHING`,
      [team.seizoen, knkvNaam, team.id, team.ow_code]
    );
    if (res.rowCount > 0) bestaandAliases++;
  }

  console.log(`✓ ${teamsAangemaakt} ontbrekende teams aangemaakt`);
  console.log(`✓ ${aliasesAangemaakt} nieuwe aliases aangemaakt`);
  console.log(`✓ ${bestaandAliases} extra ow_code-aliases aangemaakt`);

  // Stap 3: Backfill ow_team_id
  const backfill = await client.query(`
    UPDATE competitie_spelers cs
    SET ow_team_id = a.ow_team_id
    FROM team_aliases a
    WHERE a.seizoen = cs.seizoen
      AND a.alias = cs.team
      AND cs.seizoen != '2025-2026'
      AND cs.ow_team_id IS NULL
  `);
  console.log(`✓ ${backfill.rowCount} historische competitie_spelers rijen gekoppeld`);

  const nullCheck = await client.query(
    `SELECT seizoen, COUNT(*)::int as null_count
     FROM competitie_spelers
     WHERE seizoen != '2025-2026' AND ow_team_id IS NULL
     GROUP BY seizoen ORDER BY seizoen DESC`
  );
  if (nullCheck.rows.length > 0) {
    console.log("⚠ Nog ontkoppelde rijen per seizoen:");
    nullCheck.rows.forEach((r: any) => console.log(`  ${r.seizoen}: ${r.null_count} rijen`));
  } else {
    console.log("✓ Alle historische rijen volledig gekoppeld");
  }

  await client.end();
  console.log("\n=== Klaar ===");
}

main().catch((err) => {
  console.error("Mislukt:", err);
  process.exit(1);
});
