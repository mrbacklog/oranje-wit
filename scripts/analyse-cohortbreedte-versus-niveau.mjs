/**
 * Leidt een bredere jaargang tot een hoger niveau?
 *
 * De beleidsredenering: meer kinderen in een geboortejaar geeft meer onderlinge
 * concurrentie en differentiatie, en daardoor een hoger eindniveau. Als dat klopt,
 * levert een brede jaargang niet alleen méér spelers in de top, maar ook een groter
 * áándeel.
 *
 * Onderscheid dus twee dingen:
 *   - absoluut: hoeveel spelers uit deze jaargang haalden U19-1 of S1
 *   - relatief: welk deel van de jaargang haalde dat
 *
 * Alleen het tweede is bewijs voor de concurrentie-redenering. Het eerste zou ook
 * gelden als breedte alleen maar meer lootjes in dezelfde trekking betekent.
 *
 * Gebruik: node scripts/analyse-cohortbreedte-versus-niveau.mjs
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const TOP = ["OW-A1", "OW-U19-1", "OW-S1"];
const BREED = ["OW-A1", "OW-A2", "OW-U19-1", "OW-U19-2", "OW-S1", "OW-S2"];

const out = (s) => process.stdout.write(s + "\n");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows } = await client.query(`
  SELECT cp.rel_code, t.ow_code, l.geboortejaar,
         CAST(split_part(cp.seizoen,'-',1) AS INT) - l.geboortejaar AS leeftijd
    FROM competitie_spelers cp
    JOIN leden l ON l.rel_code = cp.rel_code
    LEFT JOIN teams t ON t.id = cp.ow_team_id
   WHERE cp.competitie = 'veld_najaar' AND l.geboortejaar IS NOT NULL
`);

const speler = new Map();
for (const r of rows) {
  if (!speler.has(r.rel_code)) {
    speler.set(r.rel_code, {
      geboortejaar: r.geboortejaar,
      teams: new Set(),
      leeftijden: new Set(),
    });
  }
  const s = speler.get(r.rel_code);
  s.teams.add(r.ow_code);
  s.leeftijden.add(r.leeftijd);
}

// Omvang van een jaargang op elf jaar — de piekleeftijd.
const omvang11 = new Map();
for (const [, s] of speler) {
  if (!s.leeftijden.has(11)) continue;
  omvang11.set(s.geboortejaar, (omvang11.get(s.geboortejaar) ?? 0) + 1);
}

out("## Jaargangbreedte tegen bereikt niveau\n");
out(
  "Alleen jaargangen die op 11-jarige leeftijd én op 17-jarige leeftijd binnen de\n" +
    "meetperiode vallen: geboren 1999 t/m 2009.\n"
);
out("geb.jaar   op 11 jaar   haalde A1/U19-1/S1        haalde top-2 teams");
const rijen = [];
for (let gj = 1999; gj <= 2009; gj++) {
  const n11 = omvang11.get(gj);
  if (!n11) continue;
  const jaargang = [...speler.values()].filter(
    (s) => s.geboortejaar === gj && Math.max(...s.leeftijden) >= 17
  );
  if (jaargang.length === 0) continue;
  const top = jaargang.filter((s) => [...s.teams].some((c) => TOP.includes(c))).length;
  const breed = jaargang.filter((s) => [...s.teams].some((c) => BREED.includes(c))).length;
  rijen.push({ gj, n11, top, breed, pctTop: top / n11, pctBreed: breed / n11 });
  out(
    `  ${gj}     ${String(n11).padStart(6)}      ${String(top).padStart(3)} (${((top / n11) * 100).toFixed(0).padStart(3)}%)              ${String(breed).padStart(3)} (${((breed / n11) * 100).toFixed(0).padStart(3)}%)`
  );
}

// Correlatie tussen breedte en aandeel — met alle voorbehoud bij deze aantallen.
function correlatie(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let teller = 0,
    sx = 0,
    sy = 0;
  for (let i = 0; i < n; i++) {
    teller += (xs[i] - mx) * (ys[i] - my);
    sx += (xs[i] - mx) ** 2;
    sy += (ys[i] - my) ** 2;
  }
  return teller / Math.sqrt(sx * sy);
}

const breedtes = rijen.map((r) => r.n11);
out(`\n## Samenhang\n`);
out(
  `  breedte ↔ aantal in de top:   r = ${correlatie(
    breedtes,
    rijen.map((r) => r.top)
  ).toFixed(2)}`
);
out(
  `  breedte ↔ aandeel in de top:  r = ${correlatie(
    breedtes,
    rijen.map((r) => r.pctTop)
  ).toFixed(2)}`
);
out(
  `  breedte ↔ aandeel top-2:      r = ${correlatie(
    breedtes,
    rijen.map((r) => r.pctBreed)
  ).toFixed(2)}`
);
out(`\n  ${rijen.length} jaargangen — te weinig voor hard bewijs, genoeg voor een richting.`);

// Splits in brede en smalle helft, dat leest makkelijker dan een correlatie.
const gesorteerd = [...rijen].sort((a, b) => b.n11 - a.n11);
const helft = Math.floor(gesorteerd.length / 2);
const breedGroep = gesorteerd.slice(0, helft);
const smalGroep = gesorteerd.slice(-helft);
const gem = (g, veld) => g.reduce((a, r) => a + r[veld], 0) / g.length;

out(`\n## Breedste helft tegen smalste helft\n`);
out(
  `  breedste ${breedGroep.length} jaargangen: gemiddeld ${gem(breedGroep, "n11").toFixed(1)} op 11 jaar, ` +
    `${(gem(breedGroep, "pctTop") * 100).toFixed(0)}% haalde de top, ${(gem(breedGroep, "pctBreed") * 100).toFixed(0)}% de top-2`
);
out(
  `  smalste  ${smalGroep.length} jaargangen: gemiddeld ${gem(smalGroep, "n11").toFixed(1)} op 11 jaar, ` +
    `${(gem(smalGroep, "pctTop") * 100).toFixed(0)}% haalde de top, ${(gem(smalGroep, "pctBreed") * 100).toFixed(0)}% de top-2`
);

await client.end();
