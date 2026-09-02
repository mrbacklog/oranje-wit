/**
 * Vergelijkt het ledenverloop op hetzelfde moment in het seizoen: veld_najaar tegen
 * veld_najaar. De bestaande pipeline gebruikt de VIEW speler_seizoenen, die per seizoen
 * álle competities samenvoegt — daardoor telt een afgerond seizoen ook spelers mee die
 * pas in de zaal of het voorjaar instroomden, en dat vertekent de vergelijking met een
 * seizoen dat net begonnen is.
 *
 * Gebruik: node scripts/verloop-veld-najaar.mjs
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

const { rows: seizoenen } = await client.query(
  `SELECT DISTINCT seizoen FROM competitie_spelers WHERE competitie = 'veld_najaar'
    ORDER BY seizoen`
);

const spelersVan = new Map();
for (const { seizoen } of seizoenen) {
  const { rows } = await client.query(
    `SELECT rel_code FROM competitie_spelers WHERE seizoen = $1 AND competitie = 'veld_najaar'`,
    [seizoen]
  );
  spelersVan.set(seizoen, new Set(rows.map((r) => r.rel_code)));
}

// Ter vergelijking: wat de huidige pipeline gebruikt (alle competities samen).
const { rows: alleRijen } = await client.query(
  `SELECT seizoen, COUNT(DISTINCT rel_code)::int AS n FROM competitie_spelers GROUP BY seizoen`
);
const alleVan = new Map(alleRijen.map((r) => [r.seizoen, r.n]));

out("Verloop op veld_najaar → veld_najaar\n");
out("seizoen      najaar  (alle)   behouden  nieuw  terug  uit    retentie");

const lijst = [...spelersVan.keys()];
const ooitEerder = new Set();

for (let i = 0; i < lijst.length; i++) {
  const s = lijst[i];
  const nu = spelersVan.get(s);
  const vorigSeizoen = i > 0 ? lijst[i - 1] : null;
  const vorig = vorigSeizoen ? spelersVan.get(vorigSeizoen) : new Set();

  const behouden = [...nu].filter((r) => vorig.has(r)).length;
  const terug = [...nu].filter((r) => !vorig.has(r) && ooitEerder.has(r)).length;
  const nieuw = nu.size - behouden - terug;
  const uit = [...vorig].filter((r) => !nu.has(r)).length;
  const retentie = vorig.size ? ((behouden / vorig.size) * 100).toFixed(1) : "-";

  out(
    `${s}   ${String(nu.size).padStart(4)}   ${String(alleVan.get(s) ?? "-").padStart(5)}   ` +
      `${String(vorigSeizoen ? behouden : "-").padStart(7)}  ${String(vorigSeizoen ? nieuw : "-").padStart(5)}  ` +
      `${String(vorigSeizoen ? terug : "-").padStart(5)}  ${String(vorigSeizoen ? uit : "-").padStart(4)}   ${retentie}%`
  );

  for (const r of nu) ooitEerder.add(r);
}

// Instroom per leeftijd voor het laatste seizoen, op dezelfde grondslag.
const laatste = lijst[lijst.length - 1];
const vorigeVanLaatste = lijst[lijst.length - 2];
const nieuweCodes = [...spelersVan.get(laatste)].filter(
  (r) => !spelersVan.get(vorigeVanLaatste).has(r)
);

const { rows: leeftijden } = await client.query(
  `SELECT geboortejaar, COUNT(*)::int AS n FROM leden
    WHERE rel_code = ANY($1) GROUP BY 1 ORDER BY 1 DESC`,
  [nieuweCodes]
);
const startJaar = Number(laatste.split("-")[0]);
out(`\nInstroom ${laatste} (nieuw + herinschrijvers = ${nieuweCodes.length}) per korfballeeftijd:`);
let kern = 0;
for (const r of leeftijden) {
  const leeftijd = r.geboortejaar ? startJaar - r.geboortejaar : null;
  if (leeftijd !== null && leeftijd >= 5 && leeftijd <= 9) kern += r.n;
  out(`  ${leeftijd ?? "?"} jaar: ${r.n}`);
}
out(`  → kern-instroom 5 t/m 9 jaar: ${kern}`);

await client.end();
