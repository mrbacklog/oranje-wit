/**
 * Doelmodel U19: hoeveel spelers van 17 en 18 jaar levert elke huidige jaargang op,
 * en wat zou de instroom moeten zijn om op termijn 50 te halen (25 jongens, 25 meisjes).
 *
 * De 50 is een ambitie, geen ondergrens. Daarom rekent dit script ook uit hoeveel
 * teams een lagere waarde oplevert — 30 spelers is geen tekort van 40%, het is drie
 * teams in plaats van vijf.
 *
 * Projectie gebeurt met netto groeifactoren per leeftijd en geslacht: actief op
 * leeftijd L+1 in seizoen S+1 gedeeld door actief op leeftijd L in seizoen S. Daar
 * zit zowel behoud als latere instroom in, want beide bepalen wat er op je zeventiende
 * overblijft.
 *
 * Gebruik: node scripts/doelmodel-u19.mjs
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const HUIDIG = "2026-2027";
const DOEL_PER_GESLACHT = 25;
const TEAMGROOTTE = 10;

/**
 * Breedte-schaal voor de U19-groep (17 + 18 jaar samen). Werktermen — de bedoeling is
 * dat deze uiteindelijk overal hetzelfde heten, dus ze horen op termijn in
 * rules/oranje-draad.md thuis en niet alleen hier.
 */
const NIVEAUS = [
  [50, "heel breed"],
  [45, "breed"],
  [40, "ruim"],
  [35, "voldoende"],
  [30, "smal"],
  [25, "heel smal"],
  [0, "te smal"],
];

const niveauVan = (n) => NIVEAUS.find(([grens]) => n >= grens)?.[1] ?? "te smal";

const out = (s) => process.stdout.write(s + "\n");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

// Actief per seizoen × leeftijd × geslacht, uit dezelfde bron als het verloop.
const { rows } = await client.query(`
  SELECT seizoen, geboortejaar, geslacht,
         CAST(split_part(seizoen,'-',1) AS INT) - geboortejaar AS leeftijd,
         COUNT(DISTINCT rel_code)::int AS n
    FROM ledenverloop
   WHERE status IN ('behouden','nieuw','herinschrijver')
     AND geboortejaar IS NOT NULL AND geslacht IN ('M','V')
   GROUP BY 1,2,3,4
`);

const actief = new Map(); // "seizoen|leeftijd|geslacht" -> n
for (const r of rows) actief.set(`${r.seizoen}|${r.leeftijd}|${r.geslacht}`, r.n);

const seizoenen = [...new Set(rows.map((r) => r.seizoen))].sort();

/** Netto groeifactor per leeftijdsovergang en geslacht, over alle seizoensparen. */
function groeiFactoren() {
  const teller = new Map(); // "leeftijd|geslacht" -> {van, naar}
  for (let i = 0; i < seizoenen.length - 1; i++) {
    const s = seizoenen[i],
      volgend = seizoenen[i + 1];
    for (let l = 5; l <= 20; l++) {
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
  const factoren = new Map();
  for (const [key, t] of teller) factoren.set(key, t.naar / t.van);
  return factoren;
}

const factor = groeiFactoren();

out("## Netto groeifactor per leeftijdsovergang\n");
out("Inclusief latere instroom, dus een factor boven 1 betekent aanwas.\n");
out("van→naar    jongens   meisjes");
for (let l = 5; l <= 18; l++) {
  const m = factor.get(`${l}|M`),
    v = factor.get(`${l}|V`);
  if (m == null || v == null) continue;
  out(`${String(l).padStart(3)}→${String(l + 1).padEnd(4)}    ${m.toFixed(3)}     ${v.toFixed(3)}`);
}

/** Projecteer een aantal van leeftijd `van` naar leeftijd `naar`. */
function projecteer(aantal, van, naar, geslacht) {
  let n = aantal;
  for (let l = van; l < naar; l++) n *= factor.get(`${l}|${geslacht}`) ?? 0.9;
  return n;
}

// ── Wat leveren de huidige jaargangen op? ──
out(`\n## Projectie: de U19-groep (17 + 18 jaar) per seizoen\n`);
out("Gebaseerd op de bezetting van dit seizoen, doorgerekend met bovenstaande factoren.\n");
out("seizoen      jongens  meisjes  totaal   teams van 10   breedte");

const startJaar = Number(HUIDIG.split("-")[0]);
const rijen = [];

for (let offset = 0; offset <= 9; offset++) {
  const doelSeizoen = startJaar + offset;
  let m = 0,
    v = 0;
  let volledigGemeten = true;

  for (const leeftijdDoel of [17, 18]) {
    const geboortejaar = doelSeizoen - leeftijdDoel;
    const leeftijdNu = startJaar - geboortejaar;
    if (leeftijdNu < 5) {
      volledigGemeten = false; // deze jaargang is nog niet binnen
      continue;
    }
    if (leeftijdNu > 18) continue;
    const nuM = actief.get(`${HUIDIG}|${leeftijdNu}|M`) ?? 0;
    const nuV = actief.get(`${HUIDIG}|${leeftijdNu}|V`) ?? 0;
    m += leeftijdNu >= leeftijdDoel ? nuM : projecteer(nuM, leeftijdNu, leeftijdDoel, "M");
    v += leeftijdNu >= leeftijdDoel ? nuV : projecteer(nuV, leeftijdNu, leeftijdDoel, "V");
  }

  const totaal = m + v;
  const teams = Math.floor(totaal / TEAMGROOTTE);
  rijen.push({ seizoen: `${doelSeizoen}-${doelSeizoen + 1}`, m, v, totaal, teams });
  out(
    `${doelSeizoen}-${doelSeizoen + 1}   ${m.toFixed(0).padStart(6)}   ${v.toFixed(0).padStart(6)}  ${totaal.toFixed(0).padStart(6)}   ${String(teams).padStart(11)}   ${niveauVan(totaal).padEnd(11)}${volledigGemeten ? "" : "(jaargang nog niet compleet)"}`
  );
}

// ── Wat is er nodig om 25 + 25 te halen? ──
out(`\n## Wat de ambitie vraagt van de instroom\n`);

// De 50 verdeelt zich over twee geboortejaren (17 én 18), dus per jaargang de helft.
const perJaargang = DOEL_PER_GESLACHT / 2;
let nodigTotaal = 0;

for (const g of ["M", "V"]) {
  let overleving = 1;
  for (let l = 8; l < 17; l++) overleving *= factor.get(`${l}|${g}`) ?? 0.9;
  const nodig = perJaargang / overleving;
  nodigTotaal += nodig;
  out(
    `  ${g === "M" ? "jongens" : "meisjes"}: van 8 naar 17 blijft ${(overleving * 100).toFixed(0)}% over ` +
      `→ ${nodig.toFixed(0)} per geboortejaar nodig op 8-jarige leeftijd`
  );
}
out(`\n  Samen: ${nodigTotaal.toFixed(0)} kinderen per geboortejaar op 8-jarige leeftijd.`);
out(
  `  De instroom tussen 8 en 12 compenseert de uitstroom daarna vrijwel precies, dus de\n` +
    `  omvang van een jaargang op 8-jarige leeftijd is ruwweg de omvang op 17-jarige leeftijd.`
);

out(`\n  Huidige jaargangen op jonge leeftijd:`);
for (let l = 6; l <= 12; l++) {
  const m = actief.get(`${HUIDIG}|${l}|M`) ?? 0;
  const v = actief.get(`${HUIDIG}|${l}|V`) ?? 0;
  const tot = m + v;
  const vergelijk =
    tot >= nodigTotaal ? "op koers" : `${(nodigTotaal - tot).toFixed(0)} onder de ambitie`;
  out(`    ${String(l).padStart(2)} jaar: ${String(tot).padStart(2)} (${m}M/${v}V)   ${vergelijk}`);
}

// ── Referentieniveaus in plaats van één harde lat ──
out(`\n## Wat elk niveau betekent\n`);
for (const [n, label] of NIVEAUS) {
  out(`  ${String(n).padStart(3)}+  ${label}`);
}

const huidig = rijen[0];
out(
  `\n  Dit seizoen: ${huidig.totaal.toFixed(0)} spelers van 17 en 18 ` +
    `(${huidig.m.toFixed(0)} jongens, ${huidig.v.toFixed(0)} meisjes) — ${huidig.teams} teams`
);

await client.end();
