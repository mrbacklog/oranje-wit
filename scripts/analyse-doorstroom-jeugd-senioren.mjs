/**
 * Toetst: haalt een speler die in de jeugd nooit verder kwam dan A2 of U19-2 later
 * nog het eerste of tweede seniorenteam?
 *
 * Groepen op basis van het hoogste jeugdteam in de oudste jeugdcategorie:
 *   - A1  : ooit A1 of U19-1
 *   - A2  : ooit A2 of U19-2, maar nooit A1/U19-1
 *   - rest: wel oudste jeugd gespeeld, maar nooit A1/A2/U19-1/U19-2
 *
 * Alleen geboortejaren die zowel hun jeugdjaren als een aantal seniorenjaren binnen
 * de meetperiode hebben: wie in 1992 is geboren was 18 in 2010, wie in 2005 is geboren
 * is nu 21.
 *
 * Gebruik: node scripts/analyse-doorstroom-jeugd-senioren.mjs
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const GEBOORTE_VAN = 1992;
const GEBOORTE_TOT = 2005;

const TOP_JEUGD = ["OW-A1", "OW-U19-1"];
const TWEEDE_JEUGD = ["OW-A2", "OW-U19-2"];

const out = (s) => process.stdout.write(s + "\n");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows } = await client.query(
  `SELECT cp.rel_code, t.ow_code, l.geboortejaar,
          COALESCE(cp.geslacht, l.geslacht) AS geslacht,
          CAST(split_part(cp.seizoen,'-',1) AS INT) - l.geboortejaar AS leeftijd
     FROM competitie_spelers cp
     JOIN leden l ON l.rel_code = cp.rel_code
     JOIN teams t ON t.id = cp.ow_team_id
    WHERE cp.competitie = 'veld_najaar'
      AND l.geboortejaar BETWEEN $1 AND $2`,
  [GEBOORTE_VAN, GEBOORTE_TOT]
);

const speler = new Map();
for (const r of rows) {
  if (!speler.has(r.rel_code)) {
    speler.set(r.rel_code, {
      geslacht: r.geslacht,
      geboortejaar: r.geboortejaar,
      jeugd: new Set(),
      senior: new Set(),
      maxLeeftijd: 0,
    });
  }
  const s = speler.get(r.rel_code);
  s.maxLeeftijd = Math.max(s.maxLeeftijd, r.leeftijd);
  if (r.leeftijd <= 18) s.jeugd.add(r.ow_code);
  if (r.leeftijd >= 19) s.senior.add(r.ow_code);
}

/** Laagste seniorennummer dat iemand ooit haalde; lager is hoger spelend. */
function hoogsteSenior(codes) {
  let beste = null;
  for (const c of codes) {
    const m = /^OW-S(\d+)$/.exec(c);
    if (m) {
      const n = Number(m[1]);
      if (beste == null || n < beste) beste = n;
    }
  }
  return beste;
}

// Alleen spelers die de oudste jeugd bereikten én de seniorenleeftijd haalden.
const kandidaten = [...speler.values()].filter(
  (s) => s.jeugd.size > 0 && [...s.jeugd].some((c) => /A1|A2|U19/.test(c))
);

const groepen = { A1: [], A2: [], rest: [] };
for (const s of kandidaten) {
  const j = [...s.jeugd];
  if (j.some((c) => TOP_JEUGD.includes(c))) groepen.A1.push(s);
  else if (j.some((c) => TWEEDE_JEUGD.includes(c))) groepen.A2.push(s);
  else groepen.rest.push(s);
}

out(`Geboortejaren ${GEBOORTE_VAN} t/m ${GEBOORTE_TOT}, gespeeld in de oudste jeugd.\n`);

out("## Waar komen ze terecht bij de senioren?\n");
out("jeugdniveau   n    S1     S2   S1 of S2    S3+    nooit senior   gestopt vóór 19");
for (const [label, groep] of Object.entries(groepen)) {
  if (groep.length === 0) continue;
  const bereiktSenioren = groep.filter((s) => s.maxLeeftijd >= 19);
  const s1 = groep.filter((s) => hoogsteSenior(s.senior) === 1).length;
  const s2 = groep.filter((s) => hoogsteSenior(s.senior) === 2).length;
  const s3plus = groep.filter(
    (s) => (hoogsteSenior(s.senior) ?? 99) >= 3 && s.senior.size > 0
  ).length;
  const geenSenior = groep.filter((s) => s.senior.size === 0 && s.maxLeeftijd >= 19).length;
  const gestopt = groep.length - bereiktSenioren.length;
  const pct = (n) => `${n} (${((n / groep.length) * 100).toFixed(0)}%)`;
  out(
    `${label.padEnd(12)} ${String(groep.length).padStart(3)}  ${pct(s1).padStart(8)} ${pct(s2).padStart(8)} ${pct(s1 + s2).padStart(10)} ${pct(s3plus).padStart(8)} ${pct(geenSenior).padStart(12)} ${pct(gestopt).padStart(12)}`
  );
}

out("\n## Wie speelde er ooit in S1?\n");
const alleS1 = kandidaten.filter((s) => hoogsteSenior(s.senior) === 1);
const uitA1 = alleS1.filter((s) => [...s.jeugd].some((c) => TOP_JEUGD.includes(c))).length;
const uitA2 = alleS1.filter(
  (s) =>
    ![...s.jeugd].some((c) => TOP_JEUGD.includes(c)) &&
    [...s.jeugd].some((c) => TWEEDE_JEUGD.includes(c))
).length;
out(`  Totaal uit deze jaargangen in S1: ${alleS1.length}`);
out(`    kwam uit A1/U19-1: ${uitA1} (${((uitA1 / alleS1.length) * 100).toFixed(0)}%)`);
out(`    kwam uit A2/U19-2: ${uitA2} (${((uitA2 / alleS1.length) * 100).toFixed(0)}%)`);
out(`    overig:            ${alleS1.length - uitA1 - uitA2}`);

out("\n## Idem voor S2\n");
const alleS2 = kandidaten.filter((s) => hoogsteSenior(s.senior) === 2);
const s2uitA1 = alleS2.filter((s) => [...s.jeugd].some((c) => TOP_JEUGD.includes(c))).length;
const s2uitA2 = alleS2.filter(
  (s) =>
    ![...s.jeugd].some((c) => TOP_JEUGD.includes(c)) &&
    [...s.jeugd].some((c) => TWEEDE_JEUGD.includes(c))
).length;
out(`  Totaal in S2 (en niet hoger): ${alleS2.length}`);
out(`    kwam uit A1/U19-1: ${s2uitA1}`);
out(`    kwam uit A2/U19-2: ${s2uitA2}`);

// De uitzonderingen bij naam, want die wil je kunnen nakijken.
out("\n## De uitzonderingen: via A2/U19-2 toch in S1 of S2\n");
const { rows: namen } = await client.query(
  `SELECT rel_code, roepnaam, tussenvoegsel, achternaam FROM leden`
);
const naamVan = new Map(
  namen.map((r) => [
    r.rel_code,
    [r.roepnaam, r.tussenvoegsel, r.achternaam].filter(Boolean).join(" "),
  ])
);
for (const [rel, s] of speler) {
  if (!kandidaten.includes(s)) continue;
  const j = [...s.jeugd];
  if (j.some((c) => TOP_JEUGD.includes(c))) continue;
  if (!j.some((c) => TWEEDE_JEUGD.includes(c))) continue;
  const h = hoogsteSenior(s.senior);
  if (h === 1 || h === 2) {
    out(`  ${naamVan.get(rel) ?? rel} (${s.geboortejaar}, ${s.geslacht}) → S${h}`);
  }
}

await client.end();
