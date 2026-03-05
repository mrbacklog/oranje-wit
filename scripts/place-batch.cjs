const { Client } = require("pg");
require("dotenv").config();

async function plaatsTeam(c, jNummer, teamId, teamNaam) {
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

  console.log(`\n${teamNaam} (${jNummer}): ${spelers.rows.length} spelers`);
  let geplaatst = 0;

  for (const sp of spelers.rows) {
    const naam = sp.tussenvoegsel ? `${sp.tussenvoegsel} ${sp.achternaam}` : sp.achternaam;

    const exists = await c.query(
      `SELECT 1 FROM "TeamSpeler" WHERE "teamId" = $1 AND "spelerId" = $2`,
      [teamId, sp.rel_code]
    );
    if (exists.rows.length > 0) {
      console.log(`  ${sp.roepnaam} ${naam} — zit al`);
      continue;
    }

    const other = await c.query(
      `SELECT t.naam FROM "TeamSpeler" ts JOIN "Team" t ON t.id = ts."teamId" WHERE ts."spelerId" = $1`,
      [sp.rel_code]
    );
    if (other.rows.length > 0) {
      console.log(`  ${sp.roepnaam} ${naam} — in ${other.rows[0].naam}, skip`);
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

  const check = await c.query(
    `SELECT COUNT(*) FILTER (WHERE s."geslacht"::text = 'M') as m,
            COUNT(*) FILTER (WHERE s."geslacht"::text = 'V') as v,
            COUNT(*) as totaal
     FROM "TeamSpeler" ts JOIN "Speler" s ON s.id = ts."spelerId"
     WHERE ts."teamId" = $1`,
    [teamId]
  );
  const r = check.rows[0];
  console.log(`${teamNaam}: ${geplaatst} geplaatst → nu ${r.totaal} spelers (${r.m}M / ${r.v}V)`);
}

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  const u15Id = "25848017-29b3-4014-ba76-1a8c293eae34";
  const u17Id = "c1cad35e93ea07d2f6cf6634a";
  const rood4Id = "cmm5aupqb001l84t85leaywlv";
  const britt = "NLM86V5";

  // 1. Plaats J6 in U15-1
  await plaatsTeam(c, "J6", u15Id, "U15-1");

  // 2. Verplaats Britt van U15-1 naar U17-1
  console.log("\n--- Britt Vaartmans: U15-1 → U17-1 ---");
  await c.query(`DELETE FROM "TeamSpeler" WHERE "teamId" = $1 AND "spelerId" = $2`, [u15Id, britt]);
  await c.query(
    `INSERT INTO "TeamSpeler" (id, "teamId", "spelerId") VALUES (gen_random_uuid(), $1, $2)
     ON CONFLICT ("teamId", "spelerId") DO NOTHING`,
    [u17Id, britt]
  );
  console.log("  Britt Vaartmans verplaatst naar U17-1");

  // 3. Plaats J4 in Rood-4 (Britt zit nu in U17, dus wordt overgeslagen)
  await plaatsTeam(c, "J4", rood4Id, "Rood-4");

  await c.end();
}
main().catch(console.error);
