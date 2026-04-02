/**
 * Datamigratescript: OW-teams 2025-2026 opschonen en opnieuw aanmaken.
 *
 * Gebruik:
 *   npx tsx scripts/migrate-teams-2025-2026.ts
 *
 * Wat dit doet:
 * 1. Verwijdert verouderde OW-teams voor 2025-2026 (A1-A3, B1-B3, C1-C3)
 * 2. Maakt 31 correcte OW-teams aan met naam, kleur, teamType
 * 3. Vult TeamPeriode met j_nummer per fase voor jeugdteams
 * 4. Vult team_aliases voor 2025-2026
 * 5. Backfilt ow_team_id in competitie_spelers via aliases
 */

import "dotenv/config";
import { Client } from "pg";

const SEIZOEN = "2025-2026";

const JEUGD_TEAMS: {
  naam: string;
  kleur: string;
  owCode: string;
  aliases: { fase: string; knkvNaam: string }[];
}[] = [
  {
    naam: "Rood-1",
    kleur: "ROOD",
    owCode: "OW-ROOD-1",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J1" },
      { fase: "zaal", knkvNaam: "J1" },
    ],
  },
  {
    naam: "Rood-2",
    kleur: "ROOD",
    owCode: "OW-ROOD-2",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J2" },
      { fase: "zaal", knkvNaam: "J2" },
    ],
  },
  {
    naam: "Oranje-1",
    kleur: "ORANJE",
    owCode: "OW-ORANJE-1",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J4" },
      { fase: "zaal", knkvNaam: "J4" },
    ],
  },
  {
    naam: "Oranje-2",
    kleur: "ORANJE",
    owCode: "OW-ORANJE-2",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J3" },
      { fase: "zaal", knkvNaam: "J3" },
    ],
  },
  {
    naam: "Oranje-3",
    kleur: "ORANJE",
    owCode: "OW-ORANJE-3",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J5" },
      { fase: "zaal", knkvNaam: "J5" },
    ],
  },
  {
    naam: "Oranje-4",
    kleur: "ORANJE",
    owCode: "OW-ORANJE-4",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J6" },
      { fase: "zaal", knkvNaam: "J6" },
    ],
  },
  {
    naam: "Geel-1",
    kleur: "GEEL",
    owCode: "OW-GEEL-1",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J7" },
      { fase: "zaal", knkvNaam: "J7" },
    ],
  },
  {
    naam: "Geel-2",
    kleur: "GEEL",
    owCode: "OW-GEEL-2",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J8" },
      { fase: "zaal", knkvNaam: "J8" },
    ],
  },
  {
    naam: "Geel-3",
    kleur: "GEEL",
    owCode: "OW-GEEL-3",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J9" },
      { fase: "zaal", knkvNaam: "J9" },
    ],
  },
  {
    naam: "Geel-4",
    kleur: "GEEL",
    owCode: "OW-GEEL-4",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J10" },
      { fase: "zaal", knkvNaam: "J10" },
    ],
  },
  {
    naam: "Groen-1",
    kleur: "GROEN",
    owCode: "OW-GROEN-1",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J11" },
      { fase: "zaal", knkvNaam: "J11" },
    ],
  },
  {
    naam: "Groen-2",
    kleur: "GROEN",
    owCode: "OW-GROEN-2",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J12" },
      { fase: "zaal", knkvNaam: "J12" },
    ],
  },
  {
    naam: "Groen-3",
    kleur: "GROEN",
    owCode: "OW-GROEN-3",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J13" },
      { fase: "zaal", knkvNaam: "J13" },
    ],
  },
  {
    naam: "Groen-4",
    kleur: "GROEN",
    owCode: "OW-GROEN-4",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J14" },
      { fase: "zaal", knkvNaam: "J14" },
    ],
  },
  {
    naam: "Blauw-1",
    kleur: "BLAUW",
    owCode: "OW-BLAUW-1",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J15" },
      { fase: "zaal", knkvNaam: "J15" },
    ],
  },
  {
    naam: "Blauw-2",
    kleur: "BLAUW",
    owCode: "OW-BLAUW-2",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J17" },
      { fase: "zaal", knkvNaam: "J17" },
    ],
  },
  {
    naam: "Blauw-3",
    kleur: "BLAUW",
    owCode: "OW-BLAUW-3",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J16" },
      { fase: "zaal", knkvNaam: "J16" },
    ],
  },
  {
    naam: "Blauw-4",
    kleur: "BLAUW",
    owCode: "OW-BLAUW-4",
    aliases: [
      { fase: "veld_najaar", knkvNaam: "OW J18" },
      { fase: "zaal", knkvNaam: "J18" },
    ],
  },
];

const SELECTIE_TEAMS: { naam: string; owCode: string; aliasNamen: string[] }[] = [
  { naam: "U15-1", owCode: "OW-U15-1", aliasNamen: ["U15-1"] },
  { naam: "U17-1", owCode: "OW-U17-1", aliasNamen: ["U17-1"] },
  { naam: "U17-2", owCode: "OW-U17-2", aliasNamen: ["U17-2", "U17"] },
  { naam: "U19-1", owCode: "OW-U19-1", aliasNamen: ["U19-1"] },
  { naam: "U19-2", owCode: "OW-U19-2", aliasNamen: ["U19-2", "U19"] },
];

const SENIOREN_TEAMS: { naam: string; owCode: string; aliasNamen: string[] }[] = [
  { naam: "Senioren 1", owCode: "OW-S1", aliasNamen: ["S1", "1"] },
  { naam: "Senioren 2", owCode: "OW-S2", aliasNamen: ["S2", "2"] },
  { naam: "Senioren 3", owCode: "OW-S3", aliasNamen: ["S3", "3"] },
  { naam: "Senioren 4", owCode: "OW-S4", aliasNamen: ["S4", "4"] },
  { naam: "Senioren 5", owCode: "OW-S5", aliasNamen: ["S5", "5"] },
  { naam: "Senioren 6", owCode: "OW-S6", aliasNamen: ["S6", "6"] },
];

const OVERIG_TEAMS: { naam: string; owCode: string; aliasNamen: string[] }[] = [
  { naam: "MW1", owCode: "OW-MW1", aliasNamen: ["MW1"] },
  { naam: "Kangoeroes", owCode: "OW-KANGOEROES", aliasNamen: ["Kangoeroes"] },
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log("=== Migratie OW-teams 2025-2026 ===\n");

  // Stap 1: Verwijder verouderde jeugdteams (A1-A3, B1-B3, C1-C3)
  const verouderd = [
    "OW-A1",
    "OW-A2",
    "OW-A3",
    "OW-B1",
    "OW-B2",
    "OW-B3",
    "OW-C1",
    "OW-C2",
    "OW-C3",
  ];
  const res = await client.query(`SELECT id FROM teams WHERE seizoen = $1 AND ow_code = ANY($2)`, [
    SEIZOEN,
    verouderd,
  ]);
  const verouderdIds = res.rows.map((r: { id: string }) => r.id);
  if (verouderdIds.length > 0) {
    await client.query(`DELETE FROM team_periodes WHERE team_id = ANY($1)`, [verouderdIds]);
    await client.query(`DELETE FROM team_aliases WHERE ow_team_id = ANY($1)`, [verouderdIds]);
    await client.query(`DELETE FROM teams WHERE id = ANY($1)`, [verouderdIds]);
    console.log(`✓ ${verouderdIds.length} verouderde teams verwijderd`);
  }

  // Stap 2: Maak jeugdteams aan
  for (const team of JEUGD_TEAMS) {
    const ins = await client.query(
      `INSERT INTO teams (seizoen, ow_code, naam, categorie, kleur, team_type)
       VALUES ($1, $2, $3, 'b', $4, 'JEUGD')
       ON CONFLICT (seizoen, ow_code) DO UPDATE SET naam = EXCLUDED.naam, kleur = EXCLUDED.kleur, team_type = EXCLUDED.team_type
       RETURNING id`,
      [SEIZOEN, team.owCode, team.naam, team.kleur]
    );
    const teamId = ins.rows[0].id;

    for (const alias of team.aliases) {
      await client.query(
        `INSERT INTO team_periodes (team_id, periode, j_nummer)
         VALUES ($1, $2, $3)
         ON CONFLICT (team_id, periode) DO UPDATE SET j_nummer = EXCLUDED.j_nummer`,
        [teamId, alias.fase, alias.knkvNaam.replace("OW ", "")]
      );
      await client.query(
        `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (seizoen, alias) DO UPDATE SET ow_team_id = EXCLUDED.ow_team_id, ow_code = EXCLUDED.ow_code`,
        [SEIZOEN, alias.knkvNaam, teamId, team.owCode]
      );
    }
    console.log(`  ✓ ${team.naam} (${team.owCode})`);
  }

  // Stap 3: Selectieteams
  for (const team of SELECTIE_TEAMS) {
    const ins = await client.query(
      `INSERT INTO teams (seizoen, ow_code, naam, categorie, team_type)
       VALUES ($1, $2, $3, 'a', 'SELECTIE')
       ON CONFLICT (seizoen, ow_code) DO UPDATE SET naam = EXCLUDED.naam, team_type = EXCLUDED.team_type
       RETURNING id`,
      [SEIZOEN, team.owCode, team.naam]
    );
    const teamId = ins.rows[0].id;
    for (const alias of team.aliasNamen) {
      await client.query(
        `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (seizoen, alias) DO UPDATE SET ow_team_id = EXCLUDED.ow_team_id, ow_code = EXCLUDED.ow_code`,
        [SEIZOEN, alias, teamId, team.owCode]
      );
    }
    console.log(`  ✓ ${team.naam} (SELECTIE)`);
  }

  // Stap 4: Senioren
  for (const team of SENIOREN_TEAMS) {
    const ins = await client.query(
      `INSERT INTO teams (seizoen, ow_code, naam, categorie, team_type)
       VALUES ($1, $2, $3, 'a', 'SENIOREN')
       ON CONFLICT (seizoen, ow_code) DO UPDATE SET naam = EXCLUDED.naam, team_type = EXCLUDED.team_type
       RETURNING id`,
      [SEIZOEN, team.owCode, team.naam]
    );
    const teamId = ins.rows[0].id;
    for (const alias of team.aliasNamen) {
      await client.query(
        `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (seizoen, alias) DO UPDATE SET ow_team_id = EXCLUDED.ow_team_id, ow_code = EXCLUDED.ow_code`,
        [SEIZOEN, alias, teamId, team.owCode]
      );
    }
    console.log(`  ✓ ${team.naam} (SENIOREN)`);
  }

  // Stap 5: Overig
  for (const team of OVERIG_TEAMS) {
    const ins = await client.query(
      `INSERT INTO teams (seizoen, ow_code, naam, categorie, team_type)
       VALUES ($1, $2, $3, 'b', 'OVERIG')
       ON CONFLICT (seizoen, ow_code) DO UPDATE SET naam = EXCLUDED.naam, team_type = EXCLUDED.team_type
       RETURNING id`,
      [SEIZOEN, team.owCode, team.naam]
    );
    const teamId = ins.rows[0].id;
    for (const alias of team.aliasNamen) {
      await client.query(
        `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (seizoen, alias) DO UPDATE SET ow_team_id = EXCLUDED.ow_team_id, ow_code = EXCLUDED.ow_code`,
        [SEIZOEN, alias, teamId, team.owCode]
      );
    }
    console.log(`  ✓ ${team.naam} (OVERIG)`);
  }

  // Stap 6: Backfill ow_team_id in competitie_spelers
  const backfill = await client.query(
    `
    UPDATE competitie_spelers cs
    SET ow_team_id = a.ow_team_id
    FROM team_aliases a
    WHERE a.seizoen = cs.seizoen
      AND a.alias = cs.team
      AND cs.seizoen = $1
      AND cs.ow_team_id IS NULL
  `,
    [SEIZOEN]
  );
  console.log(`\n✓ ${backfill.rowCount} competitie_spelers rijen gekoppeld (ow_team_id)`);

  const nullCheck = await client.query(
    `SELECT COUNT(*)::int as null_count FROM competitie_spelers WHERE seizoen = $1 AND ow_team_id IS NULL`,
    [SEIZOEN]
  );
  console.log(
    `⚠ ${nullCheck.rows[0].null_count} rijen zonder ow_team_id (onbekende KNKV-teamnamen)`
  );

  await client.end();
  console.log("\n=== Klaar ===");
}

main().catch((err) => {
  console.error("Migratie mislukt:", err);
  process.exit(1);
});
