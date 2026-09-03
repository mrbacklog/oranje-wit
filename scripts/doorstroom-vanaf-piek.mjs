/**
 * Wat houdt een jaargang over op 17-jarige leeftijd als hij op 11 jaar met 25 spelers
 * begint — gerekend met de laatste vijf seizoenen, omdat de trend verandert.
 *
 * Leeftijd 11 is de piek: daar is de vereniging het breedst (zie
 * analyse-breedste-leeftijd.mjs). Het is ook de groep die dan in groep 8 zit.
 *
 * Gebruik: node scripts/doorstroom-vanaf-piek.mjs [--venster=5] [--start=25] [--vanaf=11]
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const arg = (naam, standaard) => {
  const v = process.argv.find((a) => a.startsWith(`--${naam}=`))?.split("=")[1];
  return v == null ? standaard : Number(v);
};

const VENSTER = arg("venster", 5);
const START = arg("start", 25);
const VANAF = arg("vanaf", 11);
const TOT = arg("tot", 17);

const out = (s) => process.stdout.write(s + "\n");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows } = await client.query(`
  SELECT seizoen, geslacht,
         CAST(split_part(seizoen,'-',1) AS INT) - geboortejaar AS leeftijd,
         COUNT(DISTINCT rel_code)::int AS n
    FROM ledenverloop
   WHERE status IN ('behouden','nieuw','herinschrijver')
     AND geboortejaar IS NOT NULL AND geslacht IN ('M','V')
   GROUP BY 1,2,3
`);

const actief = new Map();
for (const r of rows) actief.set(`${r.seizoen}|${r.leeftijd}|${r.geslacht}`, r.n);
const seizoenen = [...new Set(rows.map((r) => r.seizoen))].sort();

/**
 * Netto factor per leeftijdsovergang over de laatste `aantalParen` seizoensparen.
 * Netto, dus inclusief zij-instroom op die leeftijd — dat is wat er feitelijk in de
 * teams staat, en daar gaat het om.
 */
function factoren(aantalParen) {
  const paren = [];
  for (let i = 0; i < seizoenen.length - 1; i++) paren.push([seizoenen[i], seizoenen[i + 1]]);
  const gekozen = aantalParen ? paren.slice(-aantalParen) : paren;

  const teller = new Map();
  for (const [s, volgend] of gekozen) {
    for (let l = 5; l <= 22; l++) {
      for (const g of ["M", "V"]) {
        const van = actief.get(`${s}|${l}|${g}`) ?? 0;
        const naar = actief.get(`${volgend}|${l + 1}|${g}`) ?? 0;
        if (van === 0) continue;
        const key = `${l}|${g}`;
        if (!teller.has(key)) teller.set(key, { van: 0, naar: 0 });
        teller.get(key).van += van;
        teller.get(key).naar += naar;
      }
    }
  }
  const f = new Map();
  for (const [key, t] of teller) f.set(key, t.naar / t.van);
  return { f, gekozen };
}

const { f: recent, gekozen } = factoren(VENSTER);
const { f: allesTijd } = factoren(null);

out(`## Grondslag\n`);
out(`Laatste ${VENSTER} seizoensovergangen: ${gekozen.map(([, n]) => n).join(", ")}\n`);

out("## Netto factor per leeftijdsovergang\n");
out("van→naar   laatste 5 jaar        hele historie        verschil");
out("           jongens  meisjes      jongens  meisjes");
for (let l = VANAF; l < TOT; l++) {
  const rm = recent.get(`${l}|M`),
    rv = recent.get(`${l}|V`);
  const am = allesTijd.get(`${l}|M`),
    av = allesTijd.get(`${l}|V`);
  if (rm == null || rv == null) continue;
  const gemR = (rm + rv) / 2,
    gemA = (am + av) / 2;
  out(
    `${String(l).padStart(3)}→${String(l + 1).padEnd(4)}    ${rm.toFixed(3)}   ${rv.toFixed(3)}       ` +
      `${am.toFixed(3)}   ${av.toFixed(3)}       ${((gemR - gemA >= 0 ? "+" : "") + (gemR - gemA).toFixed(3)).padStart(6)}`
  );
}

// ── Doorrekenen van een jaargang ──
function looptDoor(startAantal, verdeling, f) {
  // verdeling: aandeel jongens in de startgroep
  let m = startAantal * verdeling;
  let v = startAantal * (1 - verdeling);
  const stappen = [{ leeftijd: VANAF, m, v }];
  for (let l = VANAF; l < TOT; l++) {
    m *= f.get(`${l}|M`) ?? 0.9;
    v *= f.get(`${l}|V`) ?? 0.9;
    stappen.push({ leeftijd: l + 1, m, v });
  }
  return stappen;
}

// Startverdeling: het werkelijke aandeel jongens op leeftijd 11 in de laatste seizoenen
let m11 = 0,
  v11 = 0;
for (const s of seizoenen.slice(-VENSTER)) {
  m11 += actief.get(`${s}|${VANAF}|M`) ?? 0;
  v11 += actief.get(`${s}|${VANAF}|V`) ?? 0;
}
const aandeelM = m11 / (m11 + v11);

out(`\n## Een jaargang van ${START} spelers op ${VANAF} jaar (groep 8)\n`);
out(
  `Startverdeling ${(aandeelM * 100).toFixed(0)}% jongens — het gemiddelde op ${VANAF} jaar in de laatste ${VENSTER} seizoenen.\n`
);

for (const [label, f] of [
  [`laatste ${VENSTER} seizoenen`, recent],
  ["hele historie", allesTijd],
]) {
  const stappen = looptDoor(START, aandeelM, f);
  out(`### Gerekend met ${label}\n`);
  out("leeftijd   jongens  meisjes  totaal   behouden t.o.v. start");
  for (const s of stappen) {
    const tot = s.m + s.v;
    out(
      `${String(s.leeftijd).padStart(6)}     ${s.m.toFixed(1).padStart(6)}  ${s.v.toFixed(1).padStart(6)}  ${tot.toFixed(1).padStart(6)}   ${((tot / START) * 100).toFixed(0).padStart(3)}%`
    );
  }
  const eind = stappen[stappen.length - 1];
  out(
    `\n  Op ${TOT} jaar: ${(eind.m + eind.v).toFixed(0)} spelers (${eind.m.toFixed(0)} jongens, ${eind.v.toFixed(0)} meisjes)\n`
  );
}

// ── Omgekeerd: hoeveel op 11 nodig voor 25 op 17? ──
let overlevingM = 1,
  overlevingV = 1;
for (let l = VANAF; l < TOT; l++) {
  overlevingM *= recent.get(`${l}|M`) ?? 0.9;
  overlevingV *= recent.get(`${l}|V`) ?? 0.9;
}
const gemiddeldeOverleving = aandeelM * overlevingM + (1 - aandeelM) * overlevingV;

out("## Omgekeerd gerekend\n");
out(
  `  Behoud van ${VANAF} naar ${TOT} jaar: jongens ${(overlevingM * 100).toFixed(0)}%, ` +
    `meisjes ${(overlevingV * 100).toFixed(0)}%, gewogen ${(gemiddeldeOverleving * 100).toFixed(0)}%`
);
for (const doel of [20, 25, 30]) {
  out(
    `  Voor ${doel} spelers op ${TOT} jaar: ${(doel / gemiddeldeOverleving).toFixed(0)} nodig op ${VANAF} jaar`
  );
}

await client.end();
