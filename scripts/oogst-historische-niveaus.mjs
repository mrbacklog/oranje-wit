/**
 * Oogst het competitieniveau per team per fase uit de gearchiveerde standenpagina's
 * van ckvoranjewit.nl in de Wayback Machine.
 *
 * De club draaide jarenlang een plugin die de standen server-side rende, dus de
 * complete tabel met klassekop staat in het archief. Dat is de enige bron die klasse
 * én poule geeft voor álle teams, inclusief jeugd — KNKV en Antilopen hebben dit voor
 * onze vereniging niet bewaard.
 *
 * Let op: veld-najaar, zaal en veld-voorjaar zijn drie aparte competities met een
 * eigen indeling. Een pagina kan meerdere fases bevatten; de klassekop draagt dan een
 * (najaar)- of (voorjaar)-label. Bij de seniorentop ontbreekt dat label vaak omdat die
 * klassen het hele veldjaar als één competitie speelden.
 *
 * Gebruik: node scripts/oogst-historische-niveaus.mjs [--uit=<pad>]
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uitArg = process.argv.find((a) => a.startsWith("--uit="))?.split("=")[1];
const UITVOER = resolve(__dirname, uitArg ?? "../data/seizoenen/historie/team-niveaus.json");

const out = (s) => process.stdout.write(s + "\n");

/** Gearchiveerde standenpagina's, met het seizoen en de fase die erop staat. */
const PAGINAS = [
  {
    ts: "20130807181743",
    pad: "http://ckvoranjewit.nl/content/standen",
    seizoen: "2012-2013",
    periode: "veld_voorjaar",
  },
  {
    ts: "20130821085327",
    pad: "http://ckvoranjewit.nl/content/standen",
    seizoen: "2013-2014",
    periode: "veld_najaar",
  },
  {
    ts: "20141003174252",
    pad: "http://ckvoranjewit.nl/content/standen",
    seizoen: "2014-2015",
    periode: "veld_najaar",
  },
  {
    ts: "20150215235359",
    pad: "http://ckvoranjewit.nl/content/standen",
    seizoen: "2014-2015",
    periode: "zaal",
  },
  {
    ts: "20150702192743",
    pad: "http://ckvoranjewit.nl/standen/",
    seizoen: "2014-2015",
    periode: "veld_voorjaar",
  },
  {
    ts: "20160218101629",
    pad: "http://ckvoranjewit.nl/standen/",
    seizoen: "2015-2016",
    periode: "zaal",
  },
  {
    ts: "20160407013228",
    pad: "http://ckvoranjewit.nl/standen/",
    seizoen: "2015-2016",
    periode: "veld_voorjaar",
  },
  {
    ts: "20161018085746",
    pad: "http://ckvoranjewit.nl/standen/",
    seizoen: "2016-2017",
    periode: "veld_najaar",
  },
  {
    ts: "20190719055321",
    pad: "https://ckvoranjewit.nl/standen/",
    seizoen: "2018-2019",
    periode: "veld_voorjaar",
  },
  {
    ts: "20190921023535",
    pad: "https://ckvoranjewit.nl/standen/",
    seizoen: "2019-2020",
    periode: "veld_najaar",
  },
  {
    ts: "20191113042355",
    pad: "https://ckvoranjewit.nl/standen/",
    seizoen: "2019-2020",
    periode: "zaal",
  },
  {
    ts: "20200928212813",
    pad: "https://ckvoranjewit.nl/standen/",
    seizoen: "2020-2021",
    periode: "veld_najaar",
  },
];

const pauze = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Een lege respons van web.archive.org betekent vaak rate limiting (429), niet
 * "niets gevonden". Zonder die controle trek je een vals-negatieve conclusie.
 */
async function haal(url, pogingen = 4) {
  for (let p = 1; p <= pogingen; p++) {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (oranje-wit archiefoogst)" },
    });
    if (res.status === 429 || res.status === 503) {
      const wacht = 5000 * p;
      out(
        `    HTTP ${res.status} — rate limit, ${wacht / 1000}s wachten (poging ${p}/${pogingen})`
      );
      await pauze(wacht);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }
  throw new Error("rate limit hield aan");
}

const ontsnap = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Leidt de fase af uit een klassekop die zelf een label draagt. */
function periodeUitKop(kop, standaard) {
  if (/\(\s*najaar\s*\)/i.test(kop)) return "veld_najaar";
  if (/\(\s*voorjaar\s*\)/i.test(kop)) return "veld_voorjaar";
  return standaard;
}

const rijen = [];

for (const p of PAGINAS) {
  const url = `https://web.archive.org/web/${p.ts}/${p.pad}`;
  out(`\n${p.seizoen} ${p.periode}`);
  let html;
  try {
    html = await haal(url);
  } catch (e) {
    out(`  MISLUKT: ${e.message}`);
    continue;
  }

  // Twee opmaakvarianten: de oude Drupal-versie zet elke poule in een eigen tabel,
  // de latere WordPress-versie zet alles in één tabel met de klassekop als scheidingsrij
  // en een extra kolom voor de poulecode. Daarom lopen we alle rijen op volgorde af en
  // onthouden we de laatst geziene kop.
  let klasseNu = null;
  let periodeNu = p.periode;
  let poulegrootte = 0;
  let gevonden = 0;
  let poules = 0;

  const alleRijen = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
  const teamsPerPoule = [];

  for (const rij of alleRijen) {
    const kop = rij.match(/<td[^>]*class="kco_kop"[^>]*>([\s\S]*?)<\/td>/i);
    if (kop) {
      const klasse = ontsnap(kop[1]);
      if (klasse) {
        klasseNu = klasse.replace(/\s*\((najaar|voorjaar)\)\s*/i, "").trim();
        periodeNu = periodeUitKop(klasse, p.periode);
        poulegrootte = 0;
        poules++;
      }
      continue;
    }
    if (!klasseNu) continue;

    const cellen = [...rij.matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/gi)].map((m) => ({
      numeriek: /kco_num/.test(m[1]),
      tekst: ontsnap(m[2]),
    }));
    if (cellen.length < 3) continue;

    const positie = Number(cellen[0].tekst);
    if (!Number.isFinite(positie)) continue;
    poulegrootte = Math.max(poulegrootte, positie);

    // De teamnaam is de laatste cel zonder kco_num; in de nieuwe opmaak staat daar
    // een poulecode vóór (bijvoorbeeld "HKA").
    const tekstCellen = cellen.filter((c) => !c.numeriek && c.tekst);
    const team = tekstCellen[tekstCellen.length - 1]?.tekst;
    const poulecode = tekstCellen.length > 1 ? tekstCellen[0].tekst : null;
    if (!team || !/^Oranje[- ]Wit\b/i.test(team)) continue;

    teamsPerPoule.push({
      seizoen: p.seizoen,
      periode: periodeNu,
      team,
      klasse: klasseNu,
      poulecode,
      positie,
      bron: url,
    });
    gevonden++;
  }

  rijen.push(...teamsPerPoule);
  out(`  ${poules} poules, ${gevonden} Oranje Wit-teams`);
  await pauze(2000);
}

// Sommige pagina's dekken twee fases, waardoor een team twee keer geoogst wordt.
// Exacte duplicaten vallen weg; verschilt de klasse, dan blijven beide staan — dat is
// dan geen fout maar een tweede competitie, zoals een play-off.
const gezien = new Set();
const ontdubbeld = [];
let duplicaten = 0;
for (const r of rijen) {
  const sleutel = `${r.seizoen}|${r.periode}|${r.team}|${r.klasse}`;
  if (gezien.has(sleutel)) {
    duplicaten++;
    continue;
  }
  gezien.add(sleutel);
  ontdubbeld.push(r);
}
rijen.length = 0;
rijen.push(...ontdubbeld);
out(`\n${duplicaten} exacte duplicaten samengevoegd.`);

mkdirSync(dirname(UITVOER), { recursive: true });
writeFileSync(
  UITVOER,
  JSON.stringify(
    {
      _meta: {
        beschrijving:
          "Competitieniveau per Oranje Wit-team per seizoen en competitiefase, geoogst " +
          "uit gearchiveerde standenpagina's van ckvoranjewit.nl.",
        geoogst_op: new Date().toISOString().slice(0, 10),
        let_op:
          "Veld-najaar, zaal en veld-voorjaar zijn aparte competities; vergelijk alleen " +
          "dezelfde fase met zichzelf. Klassenamen wisselen over de jaren: vanaf 2019 " +
          "gaat de breedtejeugd over op poulenummers in plaats van klassenamen.",
        positie_waarschuwing:
          "De klasse is betrouwbaar, de positie niet. Elke pagina is een momentopname " +
          "van de datum waarop het archief hem ophaalde — soms halverwege het seizoen. " +
          "Gebruik `positie` niet als eindstand zonder controle.",
        dekking:
          "Alleen fases waarvan een standenpagina gearchiveerd is. Niet gedekt: " +
          "2009-2010 t/m 2011-2012, 2013-2014 zaal en voorjaar, 2016-2017 zaal en " +
          "voorjaar, heel 2017-2018, en 2018-2019 najaar.",
        aantal: rijen.length,
      },
      niveaus: rijen,
    },
    null,
    2
  ),
  "utf8"
);

out(`\nGeschreven: ${UITVOER} (${rijen.length} rijen)`);

const perSeizoen = new Map();
for (const r of rijen) {
  const k = `${r.seizoen} ${r.periode}`;
  perSeizoen.set(k, (perSeizoen.get(k) ?? 0) + 1);
}
out("\nteams per fase:");
for (const [k, n] of [...perSeizoen.entries()].sort()) out(`  ${k.padEnd(28)} ${n}`);
