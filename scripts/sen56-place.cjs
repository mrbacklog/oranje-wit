const { Client } = require("pg");
const crypto = require("crypto");
require("dotenv").config();

function cuid() {
  return crypto.randomBytes(12).toString("base64url").slice(0, 16);
}

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  // Huidig seizoen spelers van Senioren 5 en 6
  for (const teamNaam of ["Senioren 4", "Senioren 5", "Senioren 6"]) {
    // Zoek het scenario-team ID
    const team = await c.query(`SELECT id FROM "Team" WHERE naam = $1`, [teamNaam]);
    const teamId = team.rows[0]?.id;
    if (!teamId) {
      console.log(`${teamNaam} niet gevonden in scenario!`);
      continue;
    }

    // Huidig seizoen spelers uit competitie (S4, S5, S6 in competitie-data)
    const knkvNaam = "S" + teamNaam.split(" ")[1];
    const spelers = await c.query(
      `SELECT DISTINCT ON (l.roepnaam, l.achternaam)
         l.roepnaam, l.achternaam, l.geboortejaar, l.geslacht, cp.team
       FROM competitie_spelers cp
       JOIN leden l ON cp.rel_code = l.rel_code
       WHERE cp.seizoen = '2025-2026' AND cp.team = $1
       ORDER BY l.roepnaam, l.achternaam`,
      [knkvNaam]
    );

    if (spelers.rows.length === 0) {
      // Probeer andere naamvarianten
      const alt = await c.query(
        `SELECT DISTINCT team FROM competitie_spelers
         WHERE seizoen = '2025-2026' AND team ILIKE $1`,
        [`%${teamNaam.split(" ")[1]}%`]
      );
      console.log(
        `${teamNaam}: geen spelers gevonden met team="${knkvNaam}". Alternatieven:`,
        alt.rows
      );
      continue;
    }

    console.log(`\n${teamNaam} (${spelers.rows.length} spelers in competitie):`);

    let geplaatst = 0;
    for (const sp of spelers.rows) {
      // Zoek Speler ID
      const s = await c.query(
        `SELECT id FROM "Speler" WHERE "roepnaam" = $1 AND "achternaam" = $2`,
        [sp.roepnaam, sp.achternaam]
      );
      let spelerId = s.rows[0]?.id;

      if (!spelerId) {
        // Probeer fuzzy (achternaam only)
        const s2 = await c.query(
          `SELECT id, "roepnaam", "achternaam" FROM "Speler"
           WHERE "achternaam" ILIKE $1 AND "geboortejaar" = $2`,
          [`%${sp.achternaam}%`, sp.geboortejaar]
        );
        if (s2.rows.length === 1) {
          spelerId = s2.rows[0].id;
          console.log(
            `  Match: ${sp.roepnaam} ${sp.achternaam} → ${s2.rows[0].roepnaam} ${s2.rows[0].achternaam}`
          );
        } else if (s2.rows.length > 1) {
          console.log(`  AMBIGUE: ${sp.roepnaam} ${sp.achternaam} → ${s2.rows.length} matches`);
          continue;
        } else {
          // Aanmaken
          spelerId = cuid();
          const lid = await c.query(
            `SELECT geboortedatum FROM leden WHERE roepnaam = $1 AND achternaam = $2 LIMIT 1`,
            [sp.roepnaam, sp.achternaam]
          );
          await c.query(
            `INSERT INTO "Speler" (id, "roepnaam", "achternaam", "geboortedatum", "geboortejaar", "geslacht", "status", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6::"Geslacht", 'BESCHIKBAAR'::"SpelerStatus", NOW())`,
            [
              spelerId,
              sp.roepnaam,
              sp.achternaam,
              lid.rows[0]?.geboortedatum,
              sp.geboortejaar,
              sp.geslacht,
            ]
          );
          console.log(`  Aangemaakt: ${sp.roepnaam} ${sp.achternaam} (${spelerId})`);
        }
      }

      // Check of al in dit team
      const exists = await c.query(
        `SELECT 1 FROM "TeamSpeler" WHERE "teamId" = $1 AND "spelerId" = $2`,
        [teamId, spelerId]
      );
      if (exists.rows.length > 0) {
        console.log(`  ${sp.roepnaam} ${sp.achternaam} zit al in ${teamNaam}`);
        continue;
      }

      // Check of in een ander team
      const other = await c.query(
        `SELECT t.naam FROM "TeamSpeler" ts JOIN "Team" t ON t.id = ts."teamId" WHERE ts."spelerId" = $1`,
        [spelerId]
      );
      if (other.rows.length > 0) {
        console.log(
          `  ${sp.roepnaam} ${sp.achternaam} zit al in ${other.rows[0].naam} — overslaan`
        );
        continue;
      }

      const tsId = cuid();
      await c.query(
        `INSERT INTO "TeamSpeler" (id, "teamId", "spelerId") VALUES ($1, $2, $3)
         ON CONFLICT ("teamId", "spelerId") DO NOTHING`,
        [tsId, teamId, spelerId]
      );
      geplaatst++;
      console.log(`  ${sp.roepnaam} ${sp.achternaam} → ${teamNaam}`);
    }
    console.log(`${teamNaam}: ${geplaatst} spelers geplaatst`);
  }

  // Verify
  for (const naam of ["Senioren 4", "Senioren 5", "Senioren 6"]) {
    const check = await c.query(
      `SELECT s."roepnaam", s."achternaam", s."geboortejaar", s."geslacht"::text
       FROM "TeamSpeler" ts JOIN "Speler" s ON s.id = ts."spelerId"
       JOIN "Team" t ON t.id = ts."teamId"
       WHERE t.naam = $1 ORDER BY s."achternaam"`,
      [naam]
    );
    console.log(`\n${naam} heeft nu ${check.rows.length} spelers:`);
    check.rows.forEach((r) =>
      console.log(`  ${r.roepnaam} ${r.achternaam} (${r.geboortejaar}, ${r.geslacht})`)
    );
  }

  await c.end();
}
main().catch(console.error);
