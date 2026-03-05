/**
 * Eenmalig script: maak Speler-records aan voor alle actieve korfballeden
 * die nog geen Speler-record hebben.
 *
 * - Gebruikt rel_code als Speler.id (de enige sleutel)
 * - Achternaam = tussenvoegsel + achternaam uit leden-tabel
 * - Alleen voor seizoen 2025-2026, spelactiviteit = korfbal
 * - GEEN duplicaten: skipt als Speler.id al bestaat
 */

const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  // 1. Inventariseer: wie mist er?
  const missing = await c.query(`
    SELECT DISTINCT ON (l.rel_code)
      l.rel_code, l.roepnaam, l.tussenvoegsel, l.achternaam,
      l.geboortejaar, l.geslacht, l.geboortedatum
    FROM competitie_spelers cp
    JOIN leden l ON cp.rel_code = l.rel_code
    LEFT JOIN "Speler" s ON s.id = cp.rel_code
    WHERE cp.seizoen = '2025-2026'
      AND s.id IS NULL
    ORDER BY l.rel_code
  `);

  const totaalActief = await c.query(`
    SELECT COUNT(DISTINCT cp.rel_code) as n
    FROM competitie_spelers cp
    JOIN leden l ON cp.rel_code = l.rel_code
    WHERE cp.seizoen = '2025-2026'
  `);

  const bestaand = await c.query(`
    SELECT COUNT(DISTINCT s.id) as n
    FROM "Speler" s
    JOIN competitie_spelers cp ON cp.rel_code = s.id
    WHERE cp.seizoen = '2025-2026'
  `);

  console.log(`Actieve korfballeden 2025-2026: ${totaalActief.rows[0].n}`);
  console.log(`Hebben al Speler-record:        ${bestaand.rows[0].n}`);
  console.log(`Ontbrekend:                     ${missing.rows.length}`);
  console.log("");

  if (missing.rows.length === 0) {
    console.log("Niets te doen — alle actieve leden hebben een Speler-record.");
    await c.end();
    return;
  }

  // 2. Validatie: check dat elke rel_code echt in leden staat
  let fouten = 0;
  for (const r of missing.rows) {
    if (!r.rel_code || !r.roepnaam || !r.achternaam || !r.geboortejaar || !r.geslacht) {
      console.log(`  SKIP (onvolledig): ${r.rel_code} ${r.roepnaam} ${r.achternaam}`);
      fouten++;
    }
  }

  // 3. DRY RUN: toon wat er aangemaakt gaat worden
  console.log("Aan te maken Speler-records:\n");
  const teVerwerken = missing.rows.filter(
    (r) => r.rel_code && r.roepnaam && r.achternaam && r.geboortejaar && r.geslacht
  );
  for (const r of teVerwerken) {
    const naam = r.tussenvoegsel ? `${r.tussenvoegsel} ${r.achternaam}` : r.achternaam;
    console.log(`  ${r.rel_code} | ${r.roepnaam} ${naam} (${r.geboortejaar}, ${r.geslacht})`);
  }

  console.log(`\n${teVerwerken.length} records aan te maken, ${fouten} overgeslagen\n`);

  // 4. Uitvoeren in een transactie
  await c.query("BEGIN");
  try {
    let aangemaakt = 0;
    for (const r of teVerwerken) {
      const volledigeAchternaam = r.tussenvoegsel
        ? `${r.tussenvoegsel} ${r.achternaam}`
        : r.achternaam;

      // Dubbele check: bestaat er echt geen Speler met dit id?
      const check = await c.query(`SELECT id FROM "Speler" WHERE id = $1`, [r.rel_code]);
      if (check.rows.length > 0) {
        console.log(`  BESTAAT AL (race condition?): ${r.rel_code} — skip`);
        continue;
      }

      await c.query(
        `INSERT INTO "Speler" (id, "roepnaam", "achternaam", "geboortedatum", "geboortejaar", "geslacht", "status", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6::"Geslacht", 'BESCHIKBAAR'::"SpelerStatus", NOW())`,
        [r.rel_code, r.roepnaam, volledigeAchternaam, r.geboortedatum, r.geboortejaar, r.geslacht]
      );
      aangemaakt++;
    }

    await c.query("COMMIT");
    console.log(`\n${aangemaakt} Speler-records aangemaakt.`);
  } catch (err) {
    await c.query("ROLLBACK");
    console.error("ROLLBACK:", err.message);
  }

  // 5. Verificatie
  const naCheck = await c.query(`
    SELECT COUNT(DISTINCT cp.rel_code) as actief,
           COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN cp.rel_code END) as heeft_speler,
           COUNT(DISTINCT CASE WHEN s.id IS NULL THEN cp.rel_code END) as mist_speler
    FROM competitie_spelers cp
    JOIN leden l ON cp.rel_code = l.rel_code
    LEFT JOIN "Speler" s ON s.id = cp.rel_code
    WHERE cp.seizoen = '2025-2026'
  `);
  const r = naCheck.rows[0];
  console.log(
    `\nVerificatie: ${r.actief} actief, ${r.heeft_speler} met Speler, ${r.mist_speler} zonder`
  );

  await c.end();
}
main().catch(console.error);
