const { Client } = require("pg");
const crypto = require("crypto");
require("dotenv").config();

function cuid() {
  return crypto.randomBytes(12).toString("base64url").slice(0, 16);
}

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  const GEEL1_ID = "cmm5aupqb001884t8l05rfa74";

  // Mapping: J7 spelers → Speler IDs (handmatig gematcht incl. tussenvoegsels)
  const spelers = [
    { roepnaam: "Benthe", achternaam: "van Dijl", id: "NMZ00X1" },
    { roepnaam: "Sterre", achternaam: "Falter", id: "NMV92T0" },
    { roepnaam: "Joep", achternaam: "Jongkind", id: "NMN66T9" },
    { roepnaam: "Sepp", achternaam: "Jongkind", id: "NMN65C7" },
    { roepnaam: "Mayson", achternaam: "Josefina", id: "NMX73J5" },
    { roepnaam: "Collin", achternaam: "Koppelaar", id: "NMX53X3" },
    { roepnaam: "Lukas", achternaam: "van der Weijde", id: "NMX35P3" },
    { roepnaam: "Elske", achternaam: "Niehof", id: "NMY80F4" },
    { roepnaam: "Emma", achternaam: "Schot", id: "NMQ40P6" },
    // Ontbrekend — moeten aangemaakt worden:
    { roepnaam: "Nurefsan", achternaam: "Kombe", id: null, geboortejaar: 2013, geslacht: "V" },
    { roepnaam: "Esther", achternaam: "Oosse", id: null, geboortejaar: 2013, geslacht: "V" },
  ];

  for (const sp of spelers) {
    let spelerId = sp.id;

    // Maak Speler aan als die niet bestaat
    if (!spelerId) {
      spelerId = cuid();
      // Haal extra info uit leden
      const lid = await c.query(
        `SELECT geboortedatum, tussenvoegsel, rel_code FROM leden
         WHERE roepnaam = $1 AND achternaam = $2 AND geboortejaar = $3 LIMIT 1`,
        [sp.roepnaam, sp.achternaam, sp.geboortejaar]
      );
      const l = lid.rows[0];
      if (!l) {
        console.log(`WAARSCHUWING: ${sp.roepnaam} ${sp.achternaam} niet gevonden in leden!`);
        continue;
      }
      await c.query(
        `INSERT INTO "Speler" (id, "roepnaam", "achternaam", "tussenvoegsel", "geboortedatum", "geboortejaar", "geslacht", "status", "relCode")
         VALUES ($1, $2, $3, $4, $5, $6, $7::"Geslacht", 'BESCHIKBAAR'::"SpelerStatus", $8)`,
        [
          spelerId,
          sp.roepnaam,
          sp.achternaam,
          l.tussenvoegsel,
          l.geboortedatum,
          sp.geboortejaar,
          sp.geslacht,
          l.rel_code,
        ]
      );
      console.log(`Speler aangemaakt: ${sp.roepnaam} ${sp.achternaam} (${spelerId})`);
    }

    // Voeg toe aan Geel-1
    const tsId = cuid();
    await c.query(
      `INSERT INTO "TeamSpeler" (id, "teamId", "spelerId") VALUES ($1, $2, $3)
       ON CONFLICT ("teamId", "spelerId") DO NOTHING`,
      [tsId, GEEL1_ID, spelerId]
    );
    console.log(`  ${sp.roepnaam} ${sp.achternaam} → Geel-1`);
  }

  // Verify
  const check = await c.query(
    `SELECT s."roepnaam", s."achternaam", s."geboortejaar", s."geslacht"::text
     FROM "TeamSpeler" ts JOIN "Speler" s ON s.id = ts."spelerId"
     WHERE ts."teamId" = $1 ORDER BY s."achternaam"`,
    [GEEL1_ID]
  );
  console.log(`\nGeel-1 heeft nu ${check.rows.length} spelers:`);
  check.rows.forEach((r) =>
    console.log(`  ${r.roepnaam} ${r.achternaam} (${r.geboortejaar}, ${r.geslacht})`)
  );

  await c.end();
}
main().catch(console.error);
