import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const { rows: oud } = await pool.query(`
    SELECT seizoen, COUNT(*)::int AS totaal
    FROM speler_seizoenen
    WHERE bron = 'telling'
    GROUP BY seizoen ORDER BY seizoen`);

  const { rows: nieuw } = await pool.query(`
    SELECT seizoen, COUNT(DISTINCT rel_code)::int AS totaal
    FROM speler_seizoenen
    GROUP BY seizoen ORDER BY seizoen`);

  console.log("Seizoen        | Telling | Alle bronnen (distinct) | Verschil");
  console.log("---------------|---------|-------------------------|--------");
  for (const n of nieuw) {
    const o = oud.find((r: any) => r.seizoen === n.seizoen);
    const diff = n.totaal - (o?.totaal || 0);
    console.log(
      `${n.seizoen}  | ${String(o?.totaal || 0).padStart(5)}   | ${String(n.totaal).padStart(5)}                   | ${diff >= 0 ? "+" : ""}${diff}`
    );
  }
  await pool.end();
}
main();
