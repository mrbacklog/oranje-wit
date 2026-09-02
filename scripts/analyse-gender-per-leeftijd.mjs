/**
 * Toetst de hypothese: de jeugd telt meer meisjes dan jongens, maar richting de
 * seniorenleeftijd trekt dat gelijk.
 *
 * Grondslag: veld_najaar per seizoen (zie bereken-verloop.js). Korfballeeftijd is de
 * leeftijd op de peildatum 31 december van het startjaar, dus startjaar - geboortejaar.
 *
 * Gebruik: node scripts/analyse-gender-per-leeftijd.mjs
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const out = (s) => process.stdout.write(s + "\n");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows } = await client.query(`
  SELECT cp.seizoen,
         CAST(split_part(cp.seizoen, '-', 1) AS INT) - l.geboortejaar AS leeftijd,
         COALESCE(cp.geslacht, l.geslacht) AS geslacht,
         COUNT(DISTINCT cp.rel_code)::int AS n
    FROM competitie_spelers cp
    JOIN leden l ON l.rel_code = cp.rel_code
   WHERE cp.competitie = 'veld_najaar' AND l.geboortejaar IS NOT NULL
   GROUP BY 1, 2, 3
`);

const perLeeftijd = new Map(); // leeftijd -> {M, V}
const perLeeftijdHuidig = new Map();
const HUIDIG = "2026-2027";

for (const r of rows) {
  if (r.leeftijd == null || r.leeftijd < 4 || r.leeftijd > 60) continue;
  if (r.geslacht !== "M" && r.geslacht !== "V") continue;
  for (const [kaart, actief] of [
    [perLeeftijd, true],
    [perLeeftijdHuidig, r.seizoen === HUIDIG],
  ]) {
    if (!actief) continue;
    if (!kaart.has(r.leeftijd)) kaart.set(r.leeftijd, { M: 0, V: 0 });
    kaart.get(r.leeftijd)[r.geslacht] += r.n;
  }
}

function pctM(t) {
  const tot = t.M + t.V;
  return tot ? (t.M / tot) * 100 : null;
}

out("## M/V per korfballeeftijd — alle seizoenen samen (veld_najaar)\n");
out("leeftijd    M     V   totaal   %M    balk (M-aandeel)");
for (const leeftijd of [...perLeeftijd.keys()].sort((a, b) => a - b)) {
  const t = perLeeftijd.get(leeftijd);
  const tot = t.M + t.V;
  if (tot < 10) continue; // te weinig om iets over te zeggen
  const p = pctM(t);
  const blokken = Math.round(p / 5);
  out(
    `${String(leeftijd).padStart(6)}  ${String(t.M).padStart(4)}  ${String(t.V).padStart(4)}   ${String(tot).padStart(5)}  ${p.toFixed(0).padStart(3)}%   ` +
      "█".repeat(blokken) +
      "·".repeat(20 - blokken)
  );
}

out("\n## Samengevat per leeftijdsband — alle seizoenen\n");
const banden = [
  ["Blauw/Groen 5-9", 5, 9],
  ["Geel 10-12", 10, 12],
  ["Oranje 13-15", 13, 15],
  ["Rood 16-18", 16, 18],
  ["Jong senior 19-23", 19, 23],
  ["Senior 24-34", 24, 34],
  ["Senior 35+", 35, 60],
];
out("band                    M     V   totaal   %M");
for (const [naam, van, tot] of banden) {
  let M = 0,
    V = 0;
  for (const [l, t] of perLeeftijd) {
    if (l >= van && l <= tot) {
      M += t.M;
      V += t.V;
    }
  }
  const totaal = M + V;
  out(
    `${naam.padEnd(20)} ${String(M).padStart(4)}  ${String(V).padStart(4)}   ${String(totaal).padStart(5)}  ${totaal ? ((M / totaal) * 100).toFixed(0) : "-"}%`
  );
}

out(`\n## Idem, alleen ${HUIDIG}\n`);
out("band                    M     V   totaal   %M");
for (const [naam, van, tot] of banden) {
  let M = 0,
    V = 0;
  for (const [l, t] of perLeeftijdHuidig) {
    if (l >= van && l <= tot) {
      M += t.M;
      V += t.V;
    }
  }
  const totaal = M + V;
  out(
    `${naam.padEnd(20)} ${String(M).padStart(4)}  ${String(V).padStart(4)}   ${String(totaal).padStart(5)}  ${totaal ? ((M / totaal) * 100).toFixed(0) : "-"}%`
  );
}

// Retentie per geslacht per leeftijd: verlaten jongens of meisjes eerder?
const { rows: ret } = await client.query(`
  SELECT geslacht,
         CASE WHEN leeftijd_vorig BETWEEN 5 AND 9 THEN '05-09'
              WHEN leeftijd_vorig BETWEEN 10 AND 12 THEN '10-12'
              WHEN leeftijd_vorig BETWEEN 13 AND 15 THEN '13-15'
              WHEN leeftijd_vorig BETWEEN 16 AND 18 THEN '16-18'
              WHEN leeftijd_vorig BETWEEN 19 AND 23 THEN '19-23'
              WHEN leeftijd_vorig >= 24 THEN '24+' END AS band,
         COUNT(*) FILTER (WHERE status = 'behouden')::int AS behouden,
         COUNT(*) FILTER (WHERE status = 'uitgestroomd')::int AS uit
    FROM ledenverloop
   WHERE geslacht IN ('M','V') AND leeftijd_vorig IS NOT NULL
   GROUP BY 1, 2 ORDER BY 2, 1
`);

out("\n## Retentie per geslacht per leeftijdsband (alle seizoensparen)\n");
out("band     geslacht  behouden   uit   retentie");
for (const r of ret) {
  if (!r.band) continue;
  const tot = r.behouden + r.uit;
  out(
    `${r.band.padEnd(8)} ${r.geslacht.padEnd(8)} ${String(r.behouden).padStart(8)}  ${String(r.uit).padStart(4)}   ${tot ? ((r.behouden / tot) * 100).toFixed(1) : "-"}%`
  );
}

// Als het aandeel jongens met de leeftijd stijgt terwijl de retentie gelijk is,
// moet het verschil uit de instroom komen. Daarom instroom per geslacht per band.
const { rows: instroom } = await client.query(`
  SELECT geslacht,
         CASE WHEN leeftijd_nieuw BETWEEN 5 AND 9 THEN '05-09'
              WHEN leeftijd_nieuw BETWEEN 10 AND 12 THEN '10-12'
              WHEN leeftijd_nieuw BETWEEN 13 AND 15 THEN '13-15'
              WHEN leeftijd_nieuw BETWEEN 16 AND 18 THEN '16-18'
              WHEN leeftijd_nieuw BETWEEN 19 AND 23 THEN '19-23'
              WHEN leeftijd_nieuw >= 24 THEN '24+' END AS band,
         COUNT(*)::int AS n
    FROM ledenverloop
   WHERE status IN ('nieuw', 'herinschrijver')
     AND geslacht IN ('M','V') AND leeftijd_nieuw IS NOT NULL
   GROUP BY 1, 2 ORDER BY 2, 1
`);

out("\n## Instroom per geslacht per leeftijdsband (nieuw + herinschrijvers)\n");
out("band          M     V   totaal   %M");
const perBand = new Map();
for (const r of instroom) {
  if (!r.band) continue;
  if (!perBand.has(r.band)) perBand.set(r.band, { M: 0, V: 0 });
  perBand.get(r.band)[r.geslacht] += r.n;
}
for (const [band, t] of [...perBand.entries()].sort()) {
  const tot = t.M + t.V;
  out(
    `${band.padEnd(10)} ${String(t.M).padStart(4)}  ${String(t.V).padStart(4)}   ${String(tot).padStart(5)}  ${((t.M / tot) * 100).toFixed(0)}%`
  );
}

await client.end();
