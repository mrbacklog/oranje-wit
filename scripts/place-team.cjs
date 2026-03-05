const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const jNummer = process.argv[2];
  const teamId = process.argv[3];
  const teamNaam = process.argv[4];
  if (!jNummer || !teamId || !teamNaam) {
    console.error("Usage: node place-team.cjs <J-nummer> <teamId> <teamNaam>");
    process.exit(1);
  }

  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  // Haal spelers op uit zaal-competitie
  const spelers = await c.query(
    `
    SELECT DISTINCT ON (l.rel_code)
      l.rel_code, l.roepnaam, l.tussenvoegsel, l.achternaam, l.geboortejaar, l.geslacht
    FROM competitie_spelers cp
    JOIN leden l ON cp.rel_code = l.rel_code
    WHERE cp.seizoen = '2025-2026' AND cp.competitie = 'zaal' AND cp.team = $1
    ORDER BY l.rel_code
  `,
    [jNummer]
  );

  console.log(`${teamNaam} (${jNummer}): ${spelers.rows.length} spelers in zaalcompetitie\n`);

  let geplaatst = 0,
    alInTeam = 0,
    inAnderTeam = 0;

  for (const sp of spelers.rows) {
    const naam = sp.tussenvoegsel ? `${sp.tussenvoegsel} ${sp.achternaam}` : sp.achternaam;

    const exists = await c.query(
      `SELECT 1 FROM "TeamSpeler" WHERE "teamId" = $1 AND "spelerId" = $2`,
      [teamId, sp.rel_code]
    );
    if (exists.rows.length > 0) {
      console.log(`  ${sp.roepnaam} ${naam} — zit al in ${teamNaam}`);
      alInTeam++;
      continue;
    }

    const other = await c.query(
      `SELECT t.naam FROM "TeamSpeler" ts JOIN "Team" t ON t.id = ts."teamId" WHERE ts."spelerId" = $1`,
      [sp.rel_code]
    );
    if (other.rows.length > 0) {
      console.log(`  ${sp.roepnaam} ${naam} — zit in ${other.rows[0].naam}, overslaan`);
      inAnderTeam++;
      continue;
    }

    await c.query(
      `INSERT INTO "TeamSpeler" (id, "teamId", "spelerId") VALUES (gen_random_uuid(), $1, $2)
       ON CONFLICT ("teamId", "spelerId") DO NOTHING`,
      [teamId, sp.rel_code]
    );
    geplaatst++;
    console.log(`  ${sp.roepnaam} ${naam} → ${teamNaam}`);
  }

  // Verify
  const check = await c.query(
    `SELECT s."roepnaam", s."achternaam", s."geboortejaar", s."geslacht"::text
     FROM "TeamSpeler" ts JOIN "Speler" s ON s.id = ts."spelerId"
     WHERE ts."teamId" = $1 ORDER BY s."geslacht", s."achternaam"`,
    [teamId]
  );
  const m = check.rows.filter((r) => r.geslacht === "M").length;
  const v = check.rows.filter((r) => r.geslacht === "V").length;
  console.log(
    `\n${teamNaam}: ${geplaatst} geplaatst, ${alInTeam} zaten er al, ${inAnderTeam} in ander team`
  );
  console.log(`${teamNaam} heeft nu ${check.rows.length} spelers (${m}M / ${v}V)`);

  await c.end();
}
main().catch(console.error);
