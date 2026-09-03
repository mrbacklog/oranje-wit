/**
 * Op welke leeftijd is de vereniging het breedst?
 *
 * Twee manieren, want ze kunnen uit elkaar lopen:
 *  1. dwarsdoorsnede — hoeveel spelers per leeftijd, gemiddeld over de seizoenen
 *  2. longitudinaal — hoe groot is een jaargang op elke leeftijd, gevolgd door de tijd
 *
 * De eerste zegt hoe de vereniging er nu uitziet, de tweede wat er met een lichting
 * gebeurt. Als de eerste een piek toont die de tweede niet heeft, komt dat door
 * verschillen tussen jaargangen, niet door leeftijd.
 *
 * Gebruik: node scripts/analyse-breedste-leeftijd.mjs
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
  SELECT seizoen, geboortejaar, geslacht,
         CAST(split_part(seizoen,'-',1) AS INT) - geboortejaar AS leeftijd,
         COUNT(DISTINCT rel_code)::int AS n
    FROM ledenverloop
   WHERE status IN ('behouden','nieuw','herinschrijver')
     AND geboortejaar IS NOT NULL AND geslacht IN ('M','V')
   GROUP BY 1,2,3,4
`);

const seizoenen = [...new Set(rows.map((r) => r.seizoen))].sort();

// ── 1. Dwarsdoorsnede: gemiddeld aantal per leeftijd per seizoen ──
const perLeeftijd = new Map();
for (const r of rows) {
  if (r.leeftijd < 4 || r.leeftijd > 30) continue;
  if (!perLeeftijd.has(r.leeftijd)) perLeeftijd.set(r.leeftijd, 0);
  perLeeftijd.set(r.leeftijd, perLeeftijd.get(r.leeftijd) + r.n);
}

out(`## Gemiddelde bezetting per leeftijd, over ${seizoenen.length} seizoenen\n`);
const gemiddeld = [...perLeeftijd.entries()]
  .map(([l, tot]) => [l, tot / seizoenen.length])
  .sort((a, b) => a[0] - b[0]);
const max = Math.max(...gemiddeld.map(([, g]) => g));

out("leeftijd  gemiddeld per seizoen");
for (const [l, g] of gemiddeld) {
  out(
    `${String(l).padStart(6)}    ${g.toFixed(1).padStart(5)}  ${"█".repeat(Math.round((g / max) * 40))}`
  );
}
const piek = gemiddeld.reduce((a, b) => (b[1] > a[1] ? b : a));
out(`\n  Breedst op ${piek[0]} jaar: gemiddeld ${piek[1].toFixed(1)} spelers per seizoen`);

const op17 = gemiddeld.find(([l]) => l === 17)?.[1] ?? 0;
const op18 = gemiddeld.find(([l]) => l === 18)?.[1] ?? 0;
out(
  `  Op 17 jaar: ${op17.toFixed(1)} (${((op17 / piek[1]) * 100).toFixed(0)}% van de piek), ` +
    `op 18 jaar: ${op18.toFixed(1)} (${((op18 / piek[1]) * 100).toFixed(0)}%)`
);

// ── 2. Longitudinaal: dezelfde jaargang op elke leeftijd ──
const cohort = new Map(); // geboortejaar -> leeftijd -> n
for (const r of rows) {
  if (!cohort.has(r.geboortejaar)) cohort.set(r.geboortejaar, new Map());
  const c = cohort.get(r.geboortejaar);
  c.set(r.leeftijd, (c.get(r.leeftijd) ?? 0) + r.n);
}

out("\n## Waar piekt een jaargang zelf?\n");
out("Alleen jaargangen die minstens van 8 tot 16 gevolgd konden worden.\n");
out("geb.jaar   piek op   omvang    op 17    aandeel van de piek");
const piekLeeftijden = [];
for (const gj of [...cohort.keys()].sort()) {
  const c = cohort.get(gj);
  const gemeten = [...c.keys()].filter((l) => l >= 6 && l <= 20);
  if (!gemeten.includes(8) || !gemeten.includes(16)) continue;
  const relevant = gemeten.filter((l) => l >= 6 && l <= 18).sort((a, b) => c.get(b) - c.get(a));
  const piekL = relevant[0];
  const piekN = c.get(piekL);
  const n17 = c.get(17) ?? null;
  piekLeeftijden.push(piekL);
  out(
    `  ${gj}       ${String(piekL).padStart(2)}      ${String(piekN).padStart(3)}     ${String(n17 ?? "-").padStart(4)}     ${n17 ? ((n17 / piekN) * 100).toFixed(0) + "%" : "-"}`
  );
}
if (piekLeeftijden.length) {
  const gem = piekLeeftijden.reduce((s, x) => s + x, 0) / piekLeeftijden.length;
  const tel = new Map();
  for (const l of piekLeeftijden) tel.set(l, (tel.get(l) ?? 0) + 1);
  const vaakst = [...tel.entries()].sort((a, b) => b[1] - a[1])[0];
  out(
    `\n  Gemiddelde piekleeftijd: ${gem.toFixed(1)} jaar; vaakst op ${vaakst[0]} jaar (${vaakst[1]} van ${piekLeeftijden.length} jaargangen)`
  );
}

await client.end();
