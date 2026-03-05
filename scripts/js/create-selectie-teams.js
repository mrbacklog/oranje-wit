/**
 * create-selectie-teams.js
 *
 * Maakt selectiegroepen aan als echte OWTeam records.
 * Selectiegroepen zijn tijdelijke groepen aan het begin van een seizoen
 * voordat de definitieve teamindeling valt (bijv. S1/S2, U17-selectie, U19-selectie).
 *
 * Gebruik:
 *   node -r dotenv/config scripts/js/create-selectie-teams.js 2025-2026
 */

const { Client } = require("pg");

const SELECTIE_TEAMS = [
  {
    ow_code: "S-selectie",
    naam: "Senioren selectie",
    categorie: "a",
    kleur: null,
    leeftijdsgroep: "Senioren",
    spelvorm: "8-tal",
    aliases: ["S1/S2", "S1S2"],
  },
  {
    ow_code: "U19-selectie",
    naam: "U19 selectie",
    categorie: "a",
    kleur: null,
    leeftijdsgroep: "U19",
    spelvorm: "8-tal",
    aliases: ["U19"],
  },
  {
    ow_code: "U17-selectie",
    naam: "U17 selectie",
    categorie: "a",
    kleur: null,
    leeftijdsgroep: "U17",
    spelvorm: "8-tal",
    aliases: ["U17"],
  },
  {
    ow_code: "U15-selectie",
    naam: "U15 selectie",
    categorie: "a",
    kleur: null,
    leeftijdsgroep: "U15",
    spelvorm: "8-tal",
    aliases: ["U15"],
  },
];

async function main() {
  const seizoen = process.argv[2];
  if (!seizoen) {
    console.error("Gebruik: node scripts/js/create-selectie-teams.js <seizoen>");
    process.exit(1);
  }

  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  // Stap 1: Selectie-teams aanmaken met is_selectie = true
  for (const st of SELECTIE_TEAMS) {
    const res = await c.query(
      `INSERT INTO teams (seizoen, ow_code, naam, categorie, kleur, leeftijdsgroep, spelvorm, is_selectie)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (seizoen, ow_code) DO UPDATE SET naam = EXCLUDED.naam, is_selectie = true
       RETURNING id`,
      [seizoen, st.ow_code, st.naam, st.categorie, st.kleur, st.leeftijdsgroep, st.spelvorm]
    );
    console.log(`  ${st.naam} [${st.ow_code}] → id ${res.rows[0].id}`);
  }

  // Stap 2: Koppel teams aan selecties obv spelersdata
  // Spelers die in veld_najaar in een selectie zaten EN in zaal in een team →
  // dat team hoort bij die selectie
  const linkResult = await c.query(
    `
    WITH selectie_team_counts AS (
      SELECT ta_sel.ow_code AS selectie, ta_zaal.ow_code AS team,
             COUNT(DISTINCT cp_veld.rel_code) AS speler_count
      FROM competitie_spelers cp_veld
      JOIN team_aliases ta_sel ON ta_sel.seizoen = cp_veld.seizoen AND ta_sel.alias = cp_veld.team
      JOIN competitie_spelers cp_zaal ON cp_zaal.rel_code = cp_veld.rel_code
        AND cp_zaal.seizoen = cp_veld.seizoen AND cp_zaal.competitie = 'zaal'
      JOIN team_aliases ta_zaal ON ta_zaal.seizoen = cp_zaal.seizoen AND ta_zaal.alias = cp_zaal.team
      WHERE cp_veld.seizoen = $1 AND cp_veld.competitie = 'veld_najaar'
        AND ta_sel.ow_code IN ('S-selectie','U15-selectie','U17-selectie','U19-selectie')
      GROUP BY ta_sel.ow_code, ta_zaal.ow_code
      HAVING COUNT(DISTINCT cp_veld.rel_code) >= 3
    )
    UPDATE teams t
    SET selectie_ow_code = stc.selectie
    FROM selectie_team_counts stc
    WHERE t.seizoen = $1 AND t.ow_code = stc.team
  `,
    [seizoen]
  );
  console.log(`  Teams gekoppeld aan selecties: ${linkResult.rowCount} rijen`);

  await c.end();
  console.log(`\nSelectie-teams aangemaakt voor ${seizoen}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
