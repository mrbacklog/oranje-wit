const { Client } = require("pg");
const crypto = require("crypto");
require("dotenv").config();

function cuid() {
  return crypto.randomBytes(12).toString("base64url").slice(0, 16);
}

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  // ============================================
  // STAP 1: Fix Sen3 — check tussenvoegsels
  // ============================================
  console.log("=== STAP 1: Fix Sen3 tussenvoegsels ===\n");

  const sen3Nieuw = [
    ["Bart", "Brugge", 1995],
    ["Freek", "Peuter", 1996],
    ["Hanneke", "Batenburg", 1987],
    ["Mirthe", "Kalkeren-Verweij", 1994],
    ["Renske", "Visser", 1998],
  ];

  for (const [roepnaam, achternaam, geboortejaar] of sen3Nieuw) {
    // Check leden-tabel voor tussenvoegsel
    const lid = await c.query(
      `SELECT roepnaam, tussenvoegsel, achternaam FROM leden
       WHERE roepnaam = $1 AND geboortejaar = $2
       ORDER BY achternaam LIMIT 1`,
      [roepnaam, geboortejaar]
    );
    if (lid.rows.length === 0) {
      console.log(`  ${roepnaam} ${achternaam}: niet in leden-tabel`);
      continue;
    }
    const l = lid.rows[0];
    const volledigeNaam = l.tussenvoegsel ? `${l.tussenvoegsel} ${l.achternaam}` : l.achternaam;

    if (volledigeNaam !== achternaam) {
      // Update Speler achternaam
      const upd = await c.query(
        `UPDATE "Speler" SET "achternaam" = $1 WHERE "roepnaam" = $2 AND "achternaam" = $3 RETURNING id`,
        [volledigeNaam, roepnaam, achternaam]
      );
      if (upd.rows.length > 0) {
        console.log(`  ${roepnaam} ${achternaam} → ${roepnaam} ${volledigeNaam}`);
      }
    } else {
      console.log(`  ${roepnaam} ${achternaam}: naam klopt al`);
    }
  }

  // ============================================
  // STAP 2: Plaats S1 + S2 in Senioren 1+2 selectie
  // ============================================
  console.log("\n=== STAP 2: Plaats S1 + S2 ===\n");

  // Zoek Senioren 1 (= leider van selectie)
  const sen1 = await c.query(
    `SELECT id, naam, "selectieGroepId" FROM "Team" WHERE naam IN ('Senioren 1', 'Senioren 2') ORDER BY naam`
  );
  console.log("Teams:", sen1.rows);

  const leider = sen1.rows.find((t) => t.selectieGroepId === null);
  if (!leider) {
    console.log("FOUT: Geen leider-team gevonden voor Senioren selectie");
    await c.end();
    return;
  }
  console.log(`Leider: ${leider.naam} (${leider.id})\n`);

  for (const teamCode of ["S1", "S2"]) {
    const spelers = await c.query(
      `SELECT DISTINCT ON (l.roepnaam, l.achternaam)
         l.roepnaam, l.tussenvoegsel, l.achternaam, l.geboortejaar, l.geslacht, l.geboortedatum
       FROM competitie_spelers cp
       JOIN leden l ON cp.rel_code = l.rel_code
       WHERE cp.seizoen = '2025-2026' AND cp.team = $1
       ORDER BY l.roepnaam, l.achternaam`,
      [teamCode]
    );

    console.log(`${teamCode} (${spelers.rows.length} spelers):`);

    for (const sp of spelers.rows) {
      const volledigeAchternaam = sp.tussenvoegsel
        ? `${sp.tussenvoegsel} ${sp.achternaam}`
        : sp.achternaam;

      // Zoek Speler — probeer volledige naam eerst
      let s = await c.query(`SELECT id FROM "Speler" WHERE "roepnaam" = $1 AND "achternaam" = $2`, [
        sp.roepnaam,
        volledigeAchternaam,
      ]);
      let spelerId = s.rows[0]?.id;

      if (!spelerId) {
        // Probeer zonder tussenvoegsel
        s = await c.query(`SELECT id FROM "Speler" WHERE "roepnaam" = $1 AND "achternaam" = $2`, [
          sp.roepnaam,
          sp.achternaam,
        ]);
        spelerId = s.rows[0]?.id;
      }

      if (!spelerId) {
        // Fuzzy op achternaam kern + geboortejaar
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
          console.log(
            `  AMBIGUE: ${sp.roepnaam} ${volledigeAchternaam} (${s2.rows.length} matches)`
          );
          continue;
        }
      }

      if (!spelerId) {
        // Aanmaken met volledige achternaam
        spelerId = cuid();
        await c.query(
          `INSERT INTO "Speler" (id, "roepnaam", "achternaam", "geboortedatum", "geboortejaar", "geslacht", "status", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6::"Geslacht", 'BESCHIKBAAR'::"SpelerStatus", NOW())`,
          [
            spelerId,
            sp.roepnaam,
            volledigeAchternaam,
            sp.geboortedatum,
            sp.geboortejaar,
            sp.geslacht,
          ]
        );
        console.log(`  Aangemaakt: ${sp.roepnaam} ${volledigeAchternaam} (${sp.geboortejaar})`);
      }

      // Check of al in selectie-pool
      const exists = await c.query(
        `SELECT 1 FROM "TeamSpeler" WHERE "teamId" = $1 AND "spelerId" = $2`,
        [leider.id, spelerId]
      );
      if (exists.rows.length > 0) {
        console.log(`  ${sp.roepnaam} ${volledigeAchternaam} zit al in selectie`);
        continue;
      }

      // Check of in een ander team
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
        [tsId, leider.id, spelerId]
      );
      console.log(`  ${sp.roepnaam} ${volledigeAchternaam} → ${leider.naam} (pool)`);
    }
  }

  // Verify selectie
  const check = await c.query(
    `SELECT s."roepnaam", s."achternaam", s."geboortejaar", s."geslacht"::text
     FROM "TeamSpeler" ts JOIN "Speler" s ON s.id = ts."spelerId"
     WHERE ts."teamId" = $1 ORDER BY s."geslacht", s."achternaam"`,
    [leider.id]
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
