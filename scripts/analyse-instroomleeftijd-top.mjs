/**
 * Toetst de stelling dat je vóór je twaalfde al minstens twee jaar moet korfballen
 * om de A-categorie te halen.
 *
 * "Top bereikt" = ooit gespeeld in het eerste of tweede team van de oudste jeugd
 * (A1/A2, U19-1/U19-2) of in Senioren 1/2. De historische kolom `categorie` is hier
 * niet bruikbaar: die volgt de oude A/B/C-jeugdindeling en niet wedstrijd- versus
 * breedtekorfbal.
 *
 * Vergeleken wordt met spelers die wél de leeftijd haalden maar die teams nooit
 * bereikten — anders vergelijk je toppers met kinderen die simpelweg te jong zijn.
 *
 * Gebruik: node scripts/analyse-instroomleeftijd-top.mjs
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const TOP_CODES = (
  process.argv.find((a) => a.startsWith("--top=")) ??
  "--top=OW-A1,OW-A2,OW-U19-1,OW-U19-2,OW-S1,OW-S2"
)
  .split("=")[1]
  .split(",");

/**
 * Alleen geboortejaren waarvan de hele jeugdperiode in de data zit.
 * De reeks begint in 2010-2011, dus wie in 2002 is geboren was toen 8. Wie later dan
 * 2009 geboren is, is nu nog geen 17 en heeft de top dus niet kunnen bereiken.
 *
 * Zonder deze grens meet je vooral wie er vóór 2010 al lid was — en dan lijkt laat
 * instromen gunstig, omdat volwassen zij-instromers juist voor S1 en S2 komen.
 */
const GEBOORTE_VAN = 2002;
const GEBOORTE_TOT = 2009;

const out = (s) => process.stdout.write(s + "\n");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows } = await client.query(
  `SELECT cp.rel_code, cp.seizoen, t.ow_code, l.geboortejaar,
          COALESCE(cp.geslacht, l.geslacht) AS geslacht,
          CAST(split_part(cp.seizoen,'-',1) AS INT) - l.geboortejaar AS leeftijd
     FROM competitie_spelers cp
     JOIN leden l ON l.rel_code = cp.rel_code
     LEFT JOIN teams t ON t.id = cp.ow_team_id
    WHERE cp.competitie = 'veld_najaar' AND l.geboortejaar IS NOT NULL
      AND l.geboortejaar BETWEEN $1 AND $2`,
  [GEBOORTE_VAN, GEBOORTE_TOT]
);

const speler = new Map(); // rel_code -> { leeftijden:Set, top:bool, geslacht }
for (const r of rows) {
  if (!speler.has(r.rel_code)) {
    speler.set(r.rel_code, { leeftijden: new Set(), top: false, geslacht: r.geslacht });
  }
  const s = speler.get(r.rel_code);
  s.leeftijden.add(r.leeftijd);
  if (TOP_CODES.includes(r.ow_code)) s.top = true;
}

// Alleen spelers die de leeftijd haalden waarop de top bereikbaar is.
const kandidaten = [...speler.entries()].filter(([, s]) => Math.max(...s.leeftijden) >= 17);
out(`Geboortejaren ${GEBOORTE_VAN} t/m ${GEBOORTE_TOT} — hele jeugd binnen de meetperiode.
`);

const top = kandidaten.filter(([, s]) => s.top);
const rest = kandidaten.filter(([, s]) => !s.top);

out(
  `Spelers die minstens 17 werden: ${kandidaten.length} — waarvan top bereikt: ${top.length}, niet: ${rest.length}\n`
);

function verdeel(groep, veld) {
  const t = new Map();
  for (const [, s] of groep) {
    const w = veld(s);
    t.set(w, (t.get(w) ?? 0) + 1);
  }
  return t;
}

const instroom = (s) => Math.min(...s.leeftijden);
const jarenVoor12 = (s) => [...s.leeftijden].filter((l) => l < 12).length;

out("## Instroomleeftijd (eerste seizoen in de competitie)\n");
out("leeftijd   top bereikt        top niet bereikt");
const vTop = verdeel(top, instroom);
const vRest = verdeel(rest, instroom);
const leeftijden = [...new Set([...vTop.keys(), ...vRest.keys()])].sort((a, b) => a - b);
for (const l of leeftijden) {
  if (l > 25) continue;
  const a = vTop.get(l) ?? 0;
  const b = vRest.get(l) ?? 0;
  out(
    `${String(l).padStart(6)}    ${String(a).padStart(3)} (${((a / top.length) * 100).toFixed(0).padStart(2)}%)  ${"█".repeat(Math.round((a / top.length) * 60))}` +
      `\n           ${String(b).padStart(3)} (${((b / rest.length) * 100).toFixed(0).padStart(2)}%)  ${"·".repeat(Math.round((b / rest.length) * 60))}`
  );
}

const mediaan = (groep) => {
  const w = groep.map(([, s]) => instroom(s)).sort((a, b) => a - b);
  return w[Math.floor(w.length / 2)];
};
out(`\n  Mediane instroomleeftijd — top: ${mediaan(top)} jaar, overig: ${mediaan(rest)} jaar`);

out("\n## Aantal seizoenen gekorfbald vóór het twaalfde jaar\n");
out("seizoenen   top bereikt       top niet bereikt");
const jTop = verdeel(top, jarenVoor12);
const jRest = verdeel(rest, jarenVoor12);
for (const j of [...new Set([...jTop.keys(), ...jRest.keys()])].sort((a, b) => a - b)) {
  const a = jTop.get(j) ?? 0;
  const b = jRest.get(j) ?? 0;
  out(
    `${String(j).padStart(7)}     ${String(a).padStart(3)} (${((a / top.length) * 100).toFixed(0).padStart(2)}%)      ${String(b).padStart(3)} (${((b / rest.length) * 100).toFixed(0).padStart(2)}%)`
  );
}

const minstens2 = (groep) => groep.filter(([, s]) => jarenVoor12(s) >= 2).length;
out(
  `\n  Minstens 2 seizoenen vóór hun twaalfde: top ${minstens2(top)}/${top.length} ` +
    `(${((minstens2(top) / top.length) * 100).toFixed(0)}%), overig ${minstens2(rest)}/${rest.length} ` +
    `(${((minstens2(rest) / rest.length) * 100).toFixed(0)}%)`
);

// Omgekeerd: van wie laat instroomde, hoeveel haalden de top?
out("\n## Kans op de top, per instroomleeftijd\n");
out("instroom   aantal   haalde top   kans");
const perInstroom = new Map();
for (const [, s] of kandidaten) {
  const l = instroom(s);
  if (!perInstroom.has(l)) perInstroom.set(l, { n: 0, top: 0 });
  perInstroom.get(l).n++;
  if (s.top) perInstroom.get(l).top++;
}
for (const l of [...perInstroom.keys()].sort((a, b) => a - b)) {
  const t = perInstroom.get(l);
  if (t.n < 5 || l > 20) continue;
  out(
    `${String(l).padStart(6)}   ${String(t.n).padStart(6)}   ${String(t.top).padStart(10)}   ${((t.top / t.n) * 100).toFixed(0).padStart(3)}%`
  );
}

await client.end();
