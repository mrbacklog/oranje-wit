/**
 * Toetst de beleving dat jongens iets loyaler zijn dan meisjes, waardoor de
 * verhouding richting de senioren gelijker wordt.
 *
 * Drie toetsen, want een klein jaarlijks verschil valt weg in bandgemiddelden
 * maar telt over tien jaar wel op:
 *  1. retentie per losse leeftijdsovergang, M tegen V
 *  2. cumulatieve overleving vanaf leeftijd 8 — hoeveel is er nog over op 18 en op 23
 *  3. verschuiving van %M binnen hetzelfde geboortecohort tussen leeftijd 12 en 20
 *
 * Gebruik: node scripts/analyse-loyaliteit-per-geslacht.mjs
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

// ── 1. Retentie per losse leeftijd ──
const { rows: perLeeftijd } = await client.query(`
  SELECT leeftijd_vorig::int AS leeftijd, geslacht,
         COUNT(*) FILTER (WHERE status = 'behouden')::int AS behouden,
         COUNT(*) FILTER (WHERE status = 'uitgestroomd')::int AS uit
    FROM ledenverloop
   WHERE geslacht IN ('M','V') AND leeftijd_vorig BETWEEN 5 AND 30
   GROUP BY 1,2 ORDER BY 1,2
`);

const tabel = new Map(); // leeftijd -> {M:{b,u}, V:{b,u}}
for (const r of perLeeftijd) {
  if (!tabel.has(r.leeftijd)) tabel.set(r.leeftijd, {});
  tabel.get(r.leeftijd)[r.geslacht] = { b: r.behouden, u: r.uit };
}

out("## Retentie per leeftijdsovergang (alle seizoensparen)\n");
out("van→naar    M behouden/totaal   %      V behouden/totaal   %      verschil M-V");
for (const l of [...tabel.keys()].sort((a, b) => a - b)) {
  const t = tabel.get(l);
  const m = t.M,
    v = t.V;
  if (!m || !v) continue;
  const mTot = m.b + m.u,
    vTot = v.b + v.u;
  if (mTot < 15 || vTot < 15) continue;
  const mPct = (m.b / mTot) * 100,
    vPct = (v.b / vTot) * 100;
  const d = mPct - vPct;
  out(
    `${String(l).padStart(3)}→${String(l + 1).padEnd(4)}  ${String(m.b).padStart(5)}/${String(mTot).padEnd(5)} ${mPct.toFixed(1).padStart(5)}%   ` +
      `${String(v.b).padStart(5)}/${String(vTot).padEnd(5)} ${vPct.toFixed(1).padStart(5)}%   ` +
      `${(d > 0 ? "+" : "") + d.toFixed(1).padStart(5)}pp ${d > 0 ? "M loyaler" : "V loyaler"}`
  );
}

// ── 2. Cumulatieve overleving vanaf leeftijd 8 ──
out("\n## Cumulatieve overleving vanaf leeftijd 8 (product van de jaarlijkse retenties)\n");
out("leeftijd   M nog over   V nog over   verschil");
let cumM = 100,
  cumV = 100;
for (let l = 8; l <= 24; l++) {
  const t = tabel.get(l);
  if (!t?.M || !t?.V) continue;
  const mTot = t.M.b + t.M.u,
    vTot = t.V.b + t.V.u;
  if (mTot < 15 || vTot < 15) continue;
  cumM *= t.M.b / mTot;
  cumV *= t.V.b / vTot;
  out(
    `${String(l + 1).padStart(6)}    ${cumM.toFixed(1).padStart(7)}%    ${cumV.toFixed(1).padStart(7)}%    ${((cumM - cumV > 0 ? "+" : "") + (cumM - cumV).toFixed(1)).padStart(6)}pp`
  );
}

// ── 3. Verschuiving van %M binnen hetzelfde cohort ──
const { rows: cohortRijen } = await client.query(`
  SELECT l.geboortejaar,
         CAST(split_part(cp.seizoen,'-',1) AS INT) - l.geboortejaar AS leeftijd,
         COALESCE(cp.geslacht, l.geslacht) AS geslacht,
         COUNT(DISTINCT cp.rel_code)::int AS n
    FROM competitie_spelers cp
    JOIN leden l ON l.rel_code = cp.rel_code
   WHERE cp.competitie = 'veld_najaar' AND l.geboortejaar IS NOT NULL
     AND COALESCE(cp.geslacht, l.geslacht) IN ('M','V')
   GROUP BY 1,2,3
`);

const cohort = new Map();
for (const r of cohortRijen) {
  const key = `${r.geboortejaar}|${r.leeftijd}`;
  if (!cohort.has(key)) cohort.set(key, { M: 0, V: 0 });
  cohort.get(key)[r.geslacht] += r.n;
}

out("\n## Verschuiving %M binnen hetzelfde geboortecohort, leeftijd 12 → 20\n");
out("geb.jaar   %M op 12 (n)   %M op 20 (n)   verschuiving");
const verschuivingen = [];
for (let gj = 1985; gj <= 2010; gj++) {
  const a = cohort.get(`${gj}|12`);
  const b = cohort.get(`${gj}|20`);
  if (!a || !b) continue;
  const aTot = a.M + a.V,
    bTot = b.M + b.V;
  if (aTot < 10 || bTot < 8) continue;
  const aPct = (a.M / aTot) * 100,
    bPct = (b.M / bTot) * 100;
  verschuivingen.push(bPct - aPct);
  out(
    `  ${gj}      ${aPct.toFixed(0).padStart(3)}% (${String(aTot).padStart(2)})       ${bPct.toFixed(0).padStart(3)}% (${String(bTot).padStart(2)})       ${((bPct - aPct > 0 ? "+" : "") + (bPct - aPct).toFixed(0)).padStart(4)}pp`
  );
}
if (verschuivingen.length) {
  const gem = verschuivingen.reduce((s, x) => s + x, 0) / verschuivingen.length;
  const positief = verschuivingen.filter((x) => x > 0).length;
  out(
    `\n  Gemiddelde verschuiving: ${(gem > 0 ? "+" : "") + gem.toFixed(1)}pp over ${verschuivingen.length} cohorten ` +
      `(${positief} richting meer jongens, ${verschuivingen.length - positief} richting minder)`
  );
}

await client.end();
