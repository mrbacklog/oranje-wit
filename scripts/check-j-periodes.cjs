const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  const periodes = await c.query(
    "SELECT DISTINCT competitie FROM competitie_spelers WHERE seizoen = '2025-2026' ORDER BY competitie"
  );
  console.log(
    "Beschikbare periodes:",
    periodes.rows.map((r) => r.competitie)
  );

  for (const jt of ["J12", "J13", "J14"]) {
    console.log(`\n=== ${jt} ===`);
    for (const p of periodes.rows) {
      // Check J-nummer en OW J-nummer
      for (const team of [jt, `OW ${jt}`]) {
        const r = await c.query(
          `SELECT l.rel_code, l.roepnaam, l.tussenvoegsel, l.achternaam, l.geboortejaar, l.geslacht
           FROM competitie_spelers cp JOIN leden l ON cp.rel_code = l.rel_code
           WHERE cp.seizoen = $1 AND cp.competitie = $2 AND cp.team = $3
           ORDER BY l.achternaam`,
          ["2025-2026", p.competitie, team]
        );
        if (r.rows.length > 0) {
          const m = r.rows.filter((x) => x.geslacht === "M").length;
          const v = r.rows.filter((x) => x.geslacht === "V").length;
          console.log(`  ${p.competitie} / ${team}: ${r.rows.length} spelers (${m}M/${v}V)`);
          r.rows.forEach((s) => {
            const naam = s.tussenvoegsel ? `${s.tussenvoegsel} ${s.achternaam}` : s.achternaam;
            console.log(`    ${s.roepnaam} ${naam} (${s.geboortejaar}, ${s.geslacht})`);
          });
        }
      }
    }
  }

  await c.end();
}
main().catch(console.error);
