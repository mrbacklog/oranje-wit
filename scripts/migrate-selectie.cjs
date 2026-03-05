require("dotenv/config");
const path = require("path");
const pg = require(path.resolve(__dirname, "../node_modules/.pnpm/pg@8.19.0/node_modules/pg"));

async function main() {
  const client = new pg.Client(process.env.DATABASE_URL);
  await client.connect();

  // Stap 1: Kolommen toevoegen
  await client.query(
    "ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_selectie BOOLEAN NOT NULL DEFAULT false"
  );
  await client.query("ALTER TABLE teams ADD COLUMN IF NOT EXISTS selectie_ow_code TEXT");
  console.log("Kolommen toegevoegd");

  // Stap 2: Markeer selectie-teams
  const r1 = await client.query(
    "UPDATE teams SET is_selectie = true WHERE ow_code IN ('S-selectie', 'U15-selectie', 'U17-selectie', 'U19-selectie')"
  );
  console.log("Selecties gemarkeerd:", r1.rowCount, "rijen");

  // Stap 3: Koppel teams aan selecties obv spelersdata
  const r2 = await client.query(`
    WITH selectie_team_links AS (
      SELECT DISTINCT ta_sel.ow_code AS selectie, ta_zaal.ow_code AS team, cp_veld.seizoen
      FROM competitie_spelers cp_veld
      JOIN team_aliases ta_sel ON ta_sel.seizoen = cp_veld.seizoen AND ta_sel.alias = cp_veld.team
      JOIN competitie_spelers cp_zaal ON cp_zaal.rel_code = cp_veld.rel_code
        AND cp_zaal.seizoen = cp_veld.seizoen AND cp_zaal.competitie = 'zaal'
      JOIN team_aliases ta_zaal ON ta_zaal.seizoen = cp_zaal.seizoen AND ta_zaal.alias = cp_zaal.team
      WHERE cp_veld.competitie = 'veld_najaar'
        AND ta_sel.ow_code IN ('S-selectie','U15-selectie','U17-selectie','U19-selectie')
    )
    UPDATE teams t
    SET selectie_ow_code = stl.selectie
    FROM selectie_team_links stl
    WHERE t.seizoen = stl.seizoen AND t.ow_code = stl.team
  `);
  console.log("Teams gekoppeld aan selecties:", r2.rowCount, "rijen");

  // Verificatie
  const r3 = await client.query(
    "SELECT seizoen, ow_code, naam, is_selectie, selectie_ow_code FROM teams WHERE is_selectie = true OR selectie_ow_code IS NOT NULL ORDER BY seizoen, ow_code"
  );
  console.log("\n=== Resultaat ===");
  for (const r of r3.rows) {
    console.log(
      r.seizoen,
      "|",
      r.ow_code,
      "|",
      r.naam,
      "| selectie:",
      r.is_selectie,
      "| hoort bij:",
      r.selectie_ow_code
    );
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
