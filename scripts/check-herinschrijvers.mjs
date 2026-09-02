/**
 * Controleert of de status 'herinschrijver' echt terugkeerders telt.
 *
 * bereken-verloop.js noemt iemand herinschrijver als hij in het nieuwe seizoen speelt,
 * niet in het vorige, maar wel in een eerder seizoen. Sinds de grondslag op veld_najaar
 * staat, kan iemand die één najaar mist — blessure, of alleen zaal gespeeld — onterecht
 * als uitstromer én daarna als herinschrijver geteld worden.
 *
 * Gebruik: node scripts/check-herinschrijvers.mjs
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

// Alle najaar-deelnames per speler, om gaten te kunnen meten
const { rows: deelnames } = await client.query(`
  SELECT rel_code, seizoen FROM competitie_spelers WHERE competitie = 'veld_najaar'
`);
const najaarVan = new Map();
for (const r of deelnames) {
  if (!najaarVan.has(r.rel_code)) najaarVan.set(r.rel_code, new Set());
  najaarVan.get(r.rel_code).add(r.seizoen);
}

// Deelname aan ANDERE competities, om te zien of het gat echt leeg was
const { rows: andere } = await client.query(`
  SELECT rel_code, seizoen, competitie FROM competitie_spelers WHERE competitie <> 'veld_najaar'
`);
const andersVan = new Map();
for (const r of andere) {
  if (!andersVan.has(r.rel_code)) andersVan.set(r.rel_code, new Map());
  andersVan.get(r.rel_code).set(r.seizoen, r.competitie);
}

const { rows: her } = await client.query(`
  SELECT seizoen, rel_code, geslacht, leeftijd_nieuw
    FROM ledenverloop WHERE status = 'herinschrijver' ORDER BY seizoen
`);

const jaar = (s) => Number(s.split("-")[0]);

const gaten = new Map(); // gatlengte in seizoenen -> aantal
let gatMetAndereCompetitie = 0;
const voorbeelden = [];

for (const h of her) {
  const seizoenen = [...(najaarVan.get(h.rel_code) ?? [])].map(jaar).sort((a, b) => a - b);
  const dit = jaar(h.seizoen);
  const vorige = seizoenen.filter((j) => j < dit).pop();
  if (vorige == null) continue;
  const gat = dit - vorige; // 1 = aaneengesloten (kan niet), 2 = één seizoen gemist
  const gemist = gat - 1;
  gaten.set(gemist, (gaten.get(gemist) ?? 0) + 1);

  // Speelde deze persoon in het gemiste seizoen wél zaal of voorjaar?
  let speeldeAnders = false;
  for (let j = vorige + 1; j < dit; j++) {
    const seizoenLabel = `${j}-${j + 1}`;
    if (andersVan.get(h.rel_code)?.has(seizoenLabel)) speeldeAnders = true;
  }
  if (speeldeAnders) {
    gatMetAndereCompetitie++;
    if (voorbeelden.length < 12) {
      voorbeelden.push({ ...h, vorige: `${vorige}-${vorige + 1}`, gemist });
    }
  }
}

out(`Herinschrijvers in ledenverloop: ${her.length}\n`);
out("## Hoeveel najaren zaten er tussen?\n");
out("gemiste najaren   aantal");
for (const [g, n] of [...gaten.entries()].sort((a, b) => a[0] - b[0])) {
  out(`${String(g).padStart(13)}   ${String(n).padStart(5)}   ${"█".repeat(Math.round(n / 3))}`);
}

const eenSeizoen = gaten.get(1) ?? 0;
out(
  `\n  Eén najaar gemist: ${eenSeizoen} van ${her.length} (${((eenSeizoen / her.length) * 100).toFixed(0)}%)`
);
out(`  Daarvan speelde in het gemiste seizoen wél zaal of voorjaar: ${gatMetAndereCompetitie}`);

if (voorbeelden.length) {
  out("\n## Voorbeelden: geteld als terugkeerder, maar speelde gewoon door\n");
  for (const v of voorbeelden) {
    const rijen = [...(andersVan.get(v.rel_code)?.entries() ?? [])]
      .filter(([s]) => jaar(s) > jaar(v.vorige) && jaar(s) < jaar(v.seizoen))
      .map(([s, c]) => `${s} ${c}`)
      .join(", ");
    out(`  ${v.rel_code}  ${v.seizoen}  laatste najaar ${v.vorige}  →  tussendoor: ${rijen}`);
  }
}

// Per seizoen: hoeveel herinschrijvers, en hoeveel daarvan met een gat van één najaar
out("\n## Herinschrijvers per seizoen\n");
const perSeizoen = new Map();
for (const h of her) {
  const seizoenen = [...(najaarVan.get(h.rel_code) ?? [])].map(jaar).sort((a, b) => a - b);
  const dit = jaar(h.seizoen);
  const vorige = seizoenen.filter((j) => j < dit).pop();
  const gemist = vorige == null ? null : dit - vorige - 1;
  if (!perSeizoen.has(h.seizoen)) perSeizoen.set(h.seizoen, { totaal: 0, kort: 0 });
  const s = perSeizoen.get(h.seizoen);
  s.totaal++;
  if (gemist === 1) s.kort++;
}
out("seizoen      herinschrijvers   waarvan één najaar gemist");
for (const s of [...perSeizoen.keys()].sort()) {
  const t = perSeizoen.get(s);
  out(`${s}   ${String(t.totaal).padStart(13)}   ${String(t.kort).padStart(22)}`);
}

await client.end();
