/**
 * Controle op de eerdere conclusie dat het aandeel jongens met de leeftijd stijgt.
 *
 * Die conclusie kwam uit een dwarsdoorsnede: alle seizoenen op één hoop, %M per leeftijd.
 * Dat verwart drie dingen die niet uit elkaar te houden zijn in zo'n tabel — leeftijd,
 * geboortejaar en kalenderjaar. Als de vereniging vroeger mannelijker was en de laatste
 * jaren meer meisjes werft, dan lijkt "ouder = mannelijker" terwijl het in werkelijkheid
 * "vroeger = mannelijker" is.
 *
 * Dit script volgt daarom geboortecohorten in de tijd, en splitst de instroom bij 24+
 * uit naar echt nieuw versus herinschrijver.
 *
 * Gebruik: node scripts/analyse-gender-cohort-longitudinaal.mjs
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
         l.geboortejaar,
         CAST(split_part(cp.seizoen, '-', 1) AS INT) - l.geboortejaar AS leeftijd,
         COALESCE(cp.geslacht, l.geslacht) AS geslacht,
         COUNT(DISTINCT cp.rel_code)::int AS n
    FROM competitie_spelers cp
    JOIN leden l ON l.rel_code = cp.rel_code
   WHERE cp.competitie = 'veld_najaar' AND l.geboortejaar IS NOT NULL
     AND COALESCE(cp.geslacht, l.geslacht) IN ('M','V')
   GROUP BY 1,2,3,4
`);

// ── 1. Per kalenderjaar: is de vereniging als geheel vermeisjeslijkt? ──
const perSeizoen = new Map();
for (const r of rows) {
  if (!perSeizoen.has(r.seizoen)) perSeizoen.set(r.seizoen, { M: 0, V: 0, jeugdM: 0, jeugdV: 0 });
  const s = perSeizoen.get(r.seizoen);
  s[r.geslacht] += r.n;
  if (r.leeftijd <= 18) s[r.geslacht === "M" ? "jeugdM" : "jeugdV"] += r.n;
}

out("## Aandeel jongens per seizoen — hele vereniging en alleen de jeugd\n");
out("seizoen      totaal  %M    jeugd(≤18)  %M jeugd");
for (const s of [...perSeizoen.keys()].sort()) {
  const t = perSeizoen.get(s);
  const tot = t.M + t.V;
  const jTot = t.jeugdM + t.jeugdV;
  out(
    `${s}   ${String(tot).padStart(5)}  ${((t.M / tot) * 100).toFixed(0).padStart(3)}%   ${String(jTot).padStart(8)}     ${jTot ? ((t.jeugdM / jTot) * 100).toFixed(0).padStart(3) : " - "}%`
  );
}

// ── 2. Volg geboortecohorten: blijft %M binnen een cohort stabiel? ──
const perCohort = new Map(); // geboortejaar -> leeftijd -> {M,V}
for (const r of rows) {
  if (!perCohort.has(r.geboortejaar)) perCohort.set(r.geboortejaar, new Map());
  const c = perCohort.get(r.geboortejaar);
  if (!c.has(r.leeftijd)) c.set(r.leeftijd, { M: 0, V: 0 });
  c.get(r.leeftijd)[r.geslacht] += r.n;
}

out("\n## Geboortecohorten gevolgd door de tijd — %M op elke leeftijd\n");
out("Alleen cohorten met minstens 6 gemeten leeftijden en 10+ spelers op de eerste meting.\n");
out("geb.jaar  leeftijd → %M (aantal)");
for (const gj of [...perCohort.keys()].sort()) {
  const c = perCohort.get(gj);
  const leeftijden = [...c.keys()].sort((a, b) => a - b).filter((l) => l >= 5 && l <= 40);
  if (leeftijden.length < 6) continue;
  const eerste = c.get(leeftijden[0]);
  if (eerste.M + eerste.V < 10) continue;
  const reeks = leeftijden
    .map((l) => {
      const t = c.get(l);
      const tot = t.M + t.V;
      return `${l}:${((t.M / tot) * 100).toFixed(0)}%(${tot})`;
    })
    .join("  ");
  out(`  ${gj}    ${reeks}`);
}

// ── 3. Instroom 24+: echt nieuw of terugkeerder? ──
const { rows: instroom } = await client.query(`
  SELECT status, geslacht, COUNT(*)::int AS n,
         MIN(leeftijd_nieuw)::int AS jongste, MAX(leeftijd_nieuw)::int AS oudste
    FROM ledenverloop
   WHERE status IN ('nieuw','herinschrijver') AND leeftijd_nieuw >= 24
     AND geslacht IN ('M','V')
   GROUP BY 1,2 ORDER BY 1,2
`);
out("\n## Instroom vanaf 24 jaar — nieuw versus herinschrijver\n");
out("status            geslacht    n   leeftijdsbereik");
for (const r of instroom) {
  out(
    `${r.status.padEnd(18)} ${r.geslacht.padEnd(8)} ${String(r.n).padStart(4)}   ${r.jongste}-${r.oudste}`
  );
}

// In welke teams landen die 24-plussers?
const { rows: teams } = await client.query(`
  SELECT lv.geslacht, lv.team_nieuw, COUNT(*)::int AS n
    FROM ledenverloop lv
   WHERE lv.status IN ('nieuw','herinschrijver') AND lv.leeftijd_nieuw >= 24
     AND lv.geslacht IN ('M','V') AND lv.team_nieuw IS NOT NULL
   GROUP BY 1,2 HAVING COUNT(*) >= 3 ORDER BY 3 DESC LIMIT 15
`);
out("\n## Waar landen die 24-plussers? (teams met 3+ instromers)\n");
for (const r of teams) out(`  ${r.geslacht}  ${String(r.team_nieuw).padEnd(10)} ${r.n}`);

await client.end();
