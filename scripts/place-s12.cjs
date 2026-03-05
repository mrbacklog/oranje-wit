const { Client } = require("pg");
const crypto = require("crypto");
require("dotenv").config();

function cuid() {
  return crypto.randomBytes(12).toString("base64url").slice(0, 16);
}

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  const leiderId = "cmm5aupqb001n84t85hx8k3c9"; // Senioren 1 = leider

  const spelers = await c.query(
    `SELECT DISTINCT ON (l.roepnaam, l.achternaam)
       l.roepnaam, l.tussenvoegsel, l.achternaam, l.geboortejaar, l.geslacht, l.geboortedatum
     FROM competitie_spelers cp
     JOIN leden l ON cp.rel_code = l.rel_code
     WHERE cp.seizoen = '2025-2026' AND cp.team = 'S1/S2'
     ORDER BY l.roepnaam, l.achternaam`
  );

  console.log(`S1/S2: ${spelers.rows.length} spelers in competitie\n`);
  let geplaatst = 0;

  for (const sp of spelers.rows) {
    const volledigeAchternaam = sp.tussenvoegsel
      ? `${sp.tussenvoegsel} ${sp.achternaam}`
      : sp.achternaam;

    // Zoek Speler
    let s = await c.query(`SELECT id FROM "Speler" WHERE "roepnaam" = $1 AND "achternaam" = $2`, [
      sp.roepnaam,
      volledigeAchternaam,
    ]);
    let spelerId = s.rows[0]?.id;

    if (!spelerId) {
      // Zonder tussenvoegsel
      s = await c.query(`SELECT id FROM "Speler" WHERE "roepnaam" = $1 AND "achternaam" = $2`, [
        sp.roepnaam,
        sp.achternaam,
      ]);
      spelerId = s.rows[0]?.id;
    }

    if (!spelerId) {
      // Fuzzy
      const kern = sp.achternaam;
      const s2 = await c.query(
        `SELECT id, "roepnaam", "achternaam" FROM "Speler"
         WHERE "achternaam" ILIKE '%' || $1 || '%' AND "geboortejaar" = $2`,
        [kern, sp.geboortejaar]
      );
      if (s2.rows.length === 1) {
        spelerId = s2.rows[0].id;
        console.log(
          `  Match: ${sp.roepnaam} ${volledigeAchternaam} → ${s2.rows[0].roepnaam} ${s2.rows[0].achternaam}`
        );
      } else if (s2.rows.length > 1) {
        console.log(`  AMBIGUE: ${sp.roepnaam} ${volledigeAchternaam} (${s2.rows.length} matches)`);
        s2.rows.forEach((r) => console.log(`    - ${r.roepnaam} ${r.achternaam} (${r.id})`));
        continue;
      }
    }

    if (!spelerId) {
      spelerId = cuid();
      await c.query(
        `INSERT INTO "Speler" (id, "roepnaam", "achternaam", "geboortedatum", "geboortejaar", "geslacht", "status", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6::"Geslacht", 'BESCHIKBAAR'::"SpelerStatus", NOW())`,
        [spelerId, sp.roepnaam, volledigeAchternaam, sp.geboortedatum, sp.geboortejaar, sp.geslacht]
      );
      console.log(`  Aangemaakt: ${sp.roepnaam} ${volledigeAchternaam} (${sp.geboortejaar})`);
    }

    // Check of al in selectie-pool
    const exists = await c.query(
      `SELECT 1 FROM "TeamSpeler" WHERE "teamId" = $1 AND "spelerId" = $2`,
      [leiderId, spelerId]
    );
    if (exists.rows.length > 0) {
      console.log(`  ${sp.roepnaam} ${volledigeAchternaam} zit al in selectie`);
      continue;
    }

    // Check of in ander team
    const other = await c.query(
      `SELECT t.naam FROM "TeamSpeler" ts JOIN "Team" t ON t.id = ts."teamId" WHERE ts."spelerId" = $1`,
      [spelerId]
    );
    if (other.rows.length > 0) {
      console.log(
        `  ${sp.roepnaam} ${volledigeAchternaam} zit al in ${other.rows[0].naam} — overslaan`
      );
      continue;
    }

    const tsId = cuid();
    await c.query(
      `INSERT INTO "TeamSpeler" (id, "teamId", "spelerId") VALUES ($1, $2, $3)
       ON CONFLICT ("teamId", "spelerId") DO NOTHING`,
      [tsId, leiderId, spelerId]
    );
    geplaatst++;
    console.log(`  ${sp.roepnaam} ${volledigeAchternaam} → Senioren 1+2 pool`);
  }

  console.log(`\n${geplaatst} spelers geplaatst`);

  // Verify
  const check = await c.query(
    `SELECT s."roepnaam", s."achternaam", s."geboortejaar", s."geslacht"::text
     FROM "TeamSpeler" ts JOIN "Speler" s ON s.id = ts."spelerId"
     WHERE ts."teamId" = $1 ORDER BY s."geslacht", s."achternaam"`,
    [leiderId]
  );
  const m = check.rows.filter((r) => r.geslacht === "M").length;
  const v = check.rows.filter((r) => r.geslacht === "V").length;
  console.log(`\nSelectie Senioren 1+2 heeft nu ${check.rows.length} spelers (${m}M / ${v}V):`);
  check.rows.forEach((r) =>
    console.log(`  ${r.roepnaam} ${r.achternaam} (${r.geboortejaar}, ${r.geslacht})`)
  );

  await c.end();
}
main().catch(console.error);
