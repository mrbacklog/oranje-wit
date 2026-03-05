const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  const teamMapping = [
    { jNummer: "J1", teamId: "cmm5aupqb001i84t8nr20xeld", naam: "Rood-1" },
    { jNummer: "J2", teamId: "cmm5aupqb001j84t8t811ic4w", naam: "Rood-2" },
  ];

  for (const { jNummer, teamId, naam } of teamMapping) {
    console.log(`\n=== ${naam} (${jNummer}) ===`);

    // Haal spelers op uit competitie_spelers voor dit J-nummer
    const spelers = await c.query(
      `SELECT DISTINCT ON (l.rel_code)
         l.rel_code, l.roepnaam, l.tussenvoegsel, l.achternaam, l.geboortejaar, l.geslacht, l.geboortedatum
       FROM competitie_spelers cp
       JOIN leden l ON cp.rel_code = l.rel_code
       WHERE cp.seizoen = '2025-2026' AND cp.team = $1
       ORDER BY l.rel_code, l.achternaam`,
      [jNummer]
    );

    // Check ook OW J-nummer variant
    const owSpelers = await c.query(
      `SELECT DISTINCT ON (l.rel_code)
         l.rel_code, l.roepnaam, l.tussenvoegsel, l.achternaam, l.geboortejaar, l.geslacht, l.geboortedatum
       FROM competitie_spelers cp
       JOIN leden l ON cp.rel_code = l.rel_code
       WHERE cp.seizoen = '2025-2026' AND cp.team = $1
       AND l.rel_code NOT IN (SELECT rel_code FROM competitie_spelers WHERE seizoen = '2025-2026' AND team = $2)
       ORDER BY l.rel_code, l.achternaam`,
      [`OW ${jNummer}`, jNummer]
    );

    const alleSpelers = [...spelers.rows, ...owSpelers.rows];
    console.log(
      `${alleSpelers.length} spelers gevonden (${spelers.rows.length} ${jNummer} + ${owSpelers.rows.length} OW ${jNummer})`
    );

    let geplaatst = 0;
    let alInTeam = 0;
    let aangemaakt = 0;

    for (const sp of alleSpelers) {
      const volledigeAchternaam = sp.tussenvoegsel
        ? `${sp.tussenvoegsel} ${sp.achternaam}`
        : sp.achternaam;

      // Check of Speler record bestaat (op rel_code)
      let spelerRec = await c.query(`SELECT id FROM "Speler" WHERE id = $1`, [sp.rel_code]);

      if (spelerRec.rows.length === 0) {
        // Maak Speler aan met rel_code als ID
        await c.query(
          `INSERT INTO "Speler" (id, "roepnaam", "achternaam", "geboortedatum", "geboortejaar", "geslacht", "status", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6::"Geslacht", 'BESCHIKBAAR'::"SpelerStatus", NOW())`,
          [
            sp.rel_code,
            sp.roepnaam,
            volledigeAchternaam,
            sp.geboortedatum,
            sp.geboortejaar,
            sp.geslacht,
          ]
        );
        console.log(`  Aangemaakt: ${sp.roepnaam} ${volledigeAchternaam} (${sp.rel_code})`);
        aangemaakt++;
      }

      // Check of al in dit team
      const exists = await c.query(
        `SELECT 1 FROM "TeamSpeler" WHERE "teamId" = $1 AND "spelerId" = $2`,
        [teamId, sp.rel_code]
      );
      if (exists.rows.length > 0) {
        console.log(`  ${sp.roepnaam} ${volledigeAchternaam} zit al in ${naam}`);
        alInTeam++;
        continue;
      }

      // Check of in ander team
      const other = await c.query(
        `SELECT t.naam FROM "TeamSpeler" ts JOIN "Team" t ON t.id = ts."teamId" WHERE ts."spelerId" = $1`,
        [sp.rel_code]
      );
      if (other.rows.length > 0) {
        console.log(
          `  ${sp.roepnaam} ${volledigeAchternaam} zit in ${other.rows[0].naam} — overslaan`
        );
        continue;
      }

      await c.query(
        `INSERT INTO "TeamSpeler" (id, "teamId", "spelerId") VALUES (gen_random_uuid(), $1, $2)
         ON CONFLICT ("teamId", "spelerId") DO NOTHING`,
        [teamId, sp.rel_code]
      );
      geplaatst++;
      console.log(`  ${sp.roepnaam} ${volledigeAchternaam} → ${naam}`);
    }

    console.log(
      `\n${naam}: ${geplaatst} geplaatst, ${alInTeam} zaten er al, ${aangemaakt} nieuw aangemaakt`
    );

    // Verify
    const check = await c.query(
      `SELECT s."roepnaam", s."achternaam", s."geboortejaar", s."geslacht"::text
       FROM "TeamSpeler" ts JOIN "Speler" s ON s.id = ts."spelerId"
       WHERE ts."teamId" = $1 ORDER BY s."geslacht", s."achternaam"`,
      [teamId]
    );
    const m = check.rows.filter((r) => r.geslacht === "M").length;
    const v = check.rows.filter((r) => r.geslacht === "V").length;
    console.log(`${naam} heeft nu ${check.rows.length} spelers (${m}M / ${v}V)`);
  }

  await c.end();
}
main().catch(console.error);
