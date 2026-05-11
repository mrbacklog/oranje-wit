/**
 * ARCHIEF (2026-05-11): Dit script werd eenmalig in mei 2026 gedraaid om rel_codes
 * te herstellen in Speler/TeamSpeler/Evaluatie/Pin records.
 * Pin-tabel is verwijderd (migratie 20260415000000_drop_pin).
 * Bestand blijft voor historische referentie; niet opnieuw draaien.
 */
const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  // Alle Speler records zonder geldige rel_code
  const wezen = await c.query(
    `SELECT s.id, s."roepnaam", s."achternaam", s."geboortejaar", s."geslacht"::text,
            s."geboortedatum", s."lidSinds", s.huidig, s.spelerspad, s."volgendSeizoen",
            s.retentie, s."teamgenotenHistorie", s."seizoenenActief", s."instroomLeeftijd",
            s.status::text, s.notitie
     FROM "Speler" s
     WHERE NOT EXISTS (SELECT 1 FROM leden l WHERE l.rel_code = s.id)
     ORDER BY s."achternaam"`
  );

  console.log(`${wezen.rows.length} spelers met cuid-ID te fixen:\n`);

  let gefixed = 0;
  for (const sp of wezen.rows) {
    // Zoek rel_code in leden
    const kern = sp.achternaam
      .replace(/^(van der |van de |van den |van |de |den |het )/i, "")
      .split("-")[0];

    const lid = await c.query(
      `SELECT rel_code, roepnaam, tussenvoegsel, achternaam, geboortejaar FROM leden
       WHERE roepnaam = $1 AND achternaam ILIKE '%' || $2 || '%' AND geboortejaar = $3
       LIMIT 3`,
      [sp.roepnaam, kern, sp.geboortejaar]
    );

    if (lid.rows.length === 0) {
      // Probeer breder
      const lid2 = await c.query(
        `SELECT rel_code, roepnaam, tussenvoegsel, achternaam, geboortejaar FROM leden
         WHERE roepnaam = $1 AND geboortejaar = $2`,
        [sp.roepnaam, sp.geboortejaar]
      );
      if (lid2.rows.length === 1) {
        lid.rows = lid2.rows;
      } else {
        console.log(
          `  SKIP: ${sp.roepnaam} ${sp.achternaam} — geen match in leden (${lid2.rows.length} kandidaten)`
        );
        continue;
      }
    }

    if (lid.rows.length > 1) {
      console.log(`  AMBIGUE: ${sp.roepnaam} ${sp.achternaam} — ${lid.rows.length} matches`);
      lid.rows.forEach((l) =>
        console.log(`    ${l.rel_code} ${l.roepnaam} ${l.tussenvoegsel || ""} ${l.achternaam}`)
      );
      continue;
    }

    const l = lid.rows[0];
    const relCode = l.rel_code;
    const volledigeAchternaam = l.tussenvoegsel
      ? `${l.tussenvoegsel} ${l.achternaam}`
      : l.achternaam;

    // Check of er al een Speler met deze rel_code bestaat
    const bestaand = await c.query(`SELECT id FROM "Speler" WHERE id = $1`, [relCode]);
    if (bestaand.rows.length > 0) {
      console.log(
        `  CONFLICT: ${sp.roepnaam} ${sp.achternaam} — rel_code ${relCode} bestaat al als Speler`
      );
      // Verwijder het dubbele cuid-record en update TeamSpeler
      await c.query(`UPDATE "TeamSpeler" SET "spelerId" = $1 WHERE "spelerId" = $2`, [
        relCode,
        sp.id,
      ]);
      // Verwijder ook Evaluatie/Pin referenties als die er zijn
      await c.query(`UPDATE "Evaluatie" SET "spelerId" = $1 WHERE "spelerId" = $2`, [
        relCode,
        sp.id,
      ]);
      await c.query(`UPDATE "Pin" SET "spelerId" = $1 WHERE "spelerId" = $2`, [relCode, sp.id]);
      await c.query(`DELETE FROM "Speler" WHERE id = $1`, [sp.id]);
      console.log(`    → Verwijderd ${sp.id}, TeamSpeler verwijst nu naar ${relCode}`);
      gefixed++;
      continue;
    }

    // Geen conflict: hernoem het ID
    // PostgreSQL: We moeten een nieuw record maken, referenties updaten, oud verwijderen
    // (Primary key wijzigen kan niet direct bij foreign key constraints)

    await c.query("BEGIN");
    try {
      // 1. Maak nieuw Speler record met rel_code als ID
      await c.query(
        `INSERT INTO "Speler" (id, "roepnaam", "achternaam", "geboortejaar", "geboortedatum",
         "geslacht", "lidSinds", huidig, spelerspad, "volgendSeizoen", retentie,
         "teamgenotenHistorie", "seizoenenActief", "instroomLeeftijd", status, notitie,
         "createdAt", "updatedAt")
         SELECT $1, $2, $3, "geboortejaar", "geboortedatum", "geslacht", "lidSinds",
                huidig, spelerspad, "volgendSeizoen", retentie, "teamgenotenHistorie",
                "seizoenenActief", "instroomLeeftijd", status, notitie, "createdAt", NOW()
         FROM "Speler" WHERE id = $4`,
        [relCode, sp.roepnaam, volledigeAchternaam, sp.id]
      );

      // 2. Update alle referenties
      await c.query(`UPDATE "TeamSpeler" SET "spelerId" = $1 WHERE "spelerId" = $2`, [
        relCode,
        sp.id,
      ]);
      await c.query(`UPDATE "Evaluatie" SET "spelerId" = $1 WHERE "spelerId" = $2`, [
        relCode,
        sp.id,
      ]);
      await c.query(`UPDATE "Pin" SET "spelerId" = $1 WHERE "spelerId" = $2`, [relCode, sp.id]);

      // 3. Verwijder oud record
      await c.query(`DELETE FROM "Speler" WHERE id = $1`, [sp.id]);

      await c.query("COMMIT");
      console.log(
        `  ${sp.roepnaam} ${sp.achternaam}: ${sp.id} → ${relCode} (${volledigeAchternaam})`
      );
      gefixed++;
    } catch (err) {
      await c.query("ROLLBACK");
      console.log(`  FOUT: ${sp.roepnaam} ${sp.achternaam}: ${err.message}`);
    }
  }

  console.log(`\n${gefixed}/${wezen.rows.length} spelers gefixed`);

  // Verify
  const rest = await c.query(
    `SELECT COUNT(*) FROM "Speler" s WHERE NOT EXISTS (SELECT 1 FROM leden l WHERE l.rel_code = s.id)`
  );
  console.log(`Resterende spelers zonder rel_code: ${rest.rows[0].count}`);

  await c.end();
}
main().catch(console.error);
