/**
 * bereken-cohorten.js
 *
 * Task 5: Aggregeert individueel ledenverloop per geboortejaar-cohort.
 *
 * Leest:
 * - Alle ledensnapshots (voor actief-tellingen)
 * - Alle verloop-bestanden (voor classificaties)
 *
 * Schrijft:
 * - data/ledenverloop/cohorten/totaal-cohorten.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOTS_DIR = path.join(ROOT, 'data', 'leden', 'snapshots');
const VERLOOP_DIR = path.join(ROOT, 'data', 'ledenverloop', 'individueel');
const OUTPUT_DIR = path.join(ROOT, 'data', 'ledenverloop', 'cohorten');

// Auto-discover snapshots and verloop files
function discoverData() {
  // Discover snapshots -> season mapping
  const snapshotSeasonMap = {};
  const snapshotYears = {};
  const snapshotFiles = fs.readdirSync(SNAPSHOTS_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('.'))
    .sort();

  for (const file of snapshotFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(SNAPSHOTS_DIR, file), 'utf8'));
    const seizoen = data._meta && data._meta.seizoen;
    if (seizoen) {
      snapshotSeasonMap[file] = seizoen;
      const year = parseInt((data._meta.snapshot_datum || file).substring(0, 4), 10);
      snapshotYears[seizoen] = year;
    }
  }

  // Build ALL_SEASONS from snapshots (unique, sorted)
  const allSeasons = [...new Set(Object.values(snapshotSeasonMap))].sort();

  // Discover verloop files
  const verloopSeasons = [];
  if (fs.existsSync(VERLOOP_DIR)) {
    const verloopFiles = fs.readdirSync(VERLOOP_DIR)
      .filter(f => f.endsWith('-verloop.json'))
      .sort();
    for (const f of verloopFiles) {
      verloopSeasons.push(f.replace('-verloop.json', ''));
    }
  }

  return { snapshotSeasonMap, snapshotYears, allSeasons, verloopSeasons };
}

// Band mapping based on leeftijd
function getBand(leeftijd) {
  if (leeftijd >= 6 && leeftijd <= 7) return 'Blauw';
  if (leeftijd >= 8 && leeftijd <= 9) return 'Groen';
  if (leeftijd >= 10 && leeftijd <= 12) return 'Geel';
  if (leeftijd >= 13 && leeftijd <= 15) return 'Oranje';
  if (leeftijd >= 16 && leeftijd <= 18) return 'Rood';
  if (leeftijd >= 19) return 'Senioren';
  return 'pre-Blauw';
}

// Age group mapping for KPIs
function getAgeGroup(leeftijd) {
  if (leeftijd >= 6 && leeftijd <= 12) return '6-12';
  if (leeftijd >= 13 && leeftijd <= 14) return '13-14';
  if (leeftijd >= 15 && leeftijd <= 16) return '15-16';
  if (leeftijd >= 17 && leeftijd <= 18) return '17-18';
  if (leeftijd >= 19 && leeftijd <= 23) return '19-23';
  if (leeftijd >= 24) return '24+';
  return 'overig';
}

function loadSnapshot(filename) {
  const filepath = path.join(SNAPSHOTS_DIR, filename);
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function loadVerloop(season) {
  const filepath = path.join(VERLOOP_DIR, `${season}-verloop.json`);
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function median(arr) {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Discover all data files dynamically
  const { snapshotSeasonMap, snapshotYears, allSeasons, verloopSeasons } = discoverData();
  const ALL_SEASONS = allSeasons;
  const VERLOOP_SEASONS = verloopSeasons;
  const SNAPSHOT_SEASON_MAP = snapshotSeasonMap;
  const SNAPSHOT_YEARS = snapshotYears;

  console.log(`Discovered ${ALL_SEASONS.length} seasons, ${VERLOOP_SEASONS.length} verloop files`);
  console.log(`Seasons: ${ALL_SEASONS[0]} ... ${ALL_SEASONS[ALL_SEASONS.length - 1]}`);

  // Step 1: Build actief counts per season from snapshots
  // For each snapshot, count unique korfbal members per (geboortejaar, geslacht)
  // Use the FIRST (earliest) snapshot per season = start-of-season count
  const actiefPerSeason = {}; // season -> Map of "geboortejaar|geslacht" -> count

  for (const [filename, season] of Object.entries(SNAPSHOT_SEASON_MAP)) {
    // Skip if we already have data for this season (keep earliest = start-of-season)
    if (actiefPerSeason[season]) {
      console.log(`  Skipping ${filename} for ${season} (already have start-of-season snapshot)`);
      continue;
    }

    const snapshot = loadSnapshot(filename);
    const korfbal = snapshot.leden.filter(l => l.spelactiviteit === 'korfbal' || l.spelactiviteit === 'kangoeroe');
    // Deduplicate by rel_code
    const seen = new Set();
    const deduped = [];
    for (const m of korfbal) {
      if (!seen.has(m.rel_code)) {
        seen.add(m.rel_code);
        deduped.push(m);
      }
    }

    const counts = new Map();
    for (const m of deduped) {
      const key = `${m.geboortejaar}|${m.geslacht}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    actiefPerSeason[season] = counts;
    console.log(`  Using ${filename} for ${season} (${deduped.length} spelers)`);
  }

  // Step 2: Build verloop counts per season per cohort from verloop files
  const verloopPerSeason = {}; // season -> Map of "geboortejaar|geslacht" -> { behouden, nieuw, herinschrijver, uitgestroomd }

  for (const season of VERLOOP_SEASONS) {
    const vData = loadVerloop(season);
    const counts = new Map();

    for (const entry of vData.verloop) {
      const key = `${entry.geboortejaar}|${entry.geslacht}`;
      if (!counts.has(key)) {
        counts.set(key, { behouden: 0, nieuw: 0, herinschrijver: 0, uitgestroomd: 0, niet_spelend_geworden: 0 });
      }
      const c = counts.get(key);
      c[entry.status]++;
    }

    verloopPerSeason[season] = counts;
  }

  // Step 3: Collect all cohort keys across all seasons
  const allCohortKeys = new Set();
  for (const season of ALL_SEASONS) {
    if (actiefPerSeason[season]) {
      for (const key of actiefPerSeason[season].keys()) {
        allCohortKeys.add(key);
      }
    }
  }
  for (const season of VERLOOP_SEASONS) {
    for (const key of verloopPerSeason[season].keys()) {
      allCohortKeys.add(key);
    }
  }

  // Step 4: Build per_cohort array
  const perCohort = [];

  for (const key of allCohortKeys) {
    const [geboortejaarStr, geslacht] = key.split('|');
    const geboortejaar = parseInt(geboortejaarStr);

    const seizoenen = {};

    for (const season of ALL_SEASONS) {
      const snapshotYear = SNAPSHOT_YEARS[season];
      const leeftijd = snapshotYear - geboortejaar;
      const band = getBand(leeftijd);
      const actief = actiefPerSeason[season] ? (actiefPerSeason[season].get(key) || 0) : 0;

      if (season === '2020-2021') {
        // Base season: no verloop data
        if (actief > 0) {
          seizoenen[season] = {
            leeftijd,
            band,
            actief,
            behouden: null,
            nieuw: null,
            herinschrijver: null,
            uitgestroomd: null,
            retentie_pct: null,
          };
        }
      } else {
        const vCounts = verloopPerSeason[season] ? verloopPerSeason[season].get(key) : null;

        if (actief > 0 || (vCounts && (vCounts.behouden > 0 || vCounts.uitgestroomd > 0 || vCounts.niet_spelend_geworden > 0))) {
          const behouden = vCounts ? vCounts.behouden : 0;
          const nieuw = vCounts ? vCounts.nieuw : 0;
          const herinschrijver = vCounts ? vCounts.herinschrijver : 0;
          const uitgestroomd = vCounts ? vCounts.uitgestroomd : 0;
          const nietSpelend = vCounts ? vCounts.niet_spelend_geworden : 0;

          // Retentie: behouden / (behouden + uitgestroomd + niet_spelend_geworden)
          // This is the fraction of previous-season members that stayed
          const prevTotal = behouden + uitgestroomd + nietSpelend;
          const retentie_pct = prevTotal > 0 ? round1((behouden / prevTotal) * 100) : null;

          seizoenen[season] = {
            leeftijd,
            band,
            actief,
            behouden,
            nieuw,
            herinschrijver,
            uitgestroomd,
            retentie_pct,
          };
        }
      }
    }

    // Only include cohort if it has at least one season with data
    if (Object.keys(seizoenen).length > 0) {
      perCohort.push({
        geboortejaar,
        geslacht,
        seizoenen,
      });
    }
  }

  // Sort by geboortejaar desc, then geslacht
  perCohort.sort((a, b) => {
    if (a.geboortejaar !== b.geboortejaar) return b.geboortejaar - a.geboortejaar;
    return a.geslacht.localeCompare(b.geslacht);
  });

  // Step 5: Calculate _totalen

  // 5a: Per seizoen totals
  const perSeizoen = [];
  for (const season of VERLOOP_SEASONS) {
    const vData = loadVerloop(season);
    const meta = vData._meta;
    const s = meta.samenvatting;
    const totaalVorig = meta.totaal_vorig;
    const totaalNieuw = meta.totaal_nieuw;
    const retentiePct = totaalVorig > 0 ? round1((s.behouden / totaalVorig) * 100) : null;
    const nettoGroei = totaalNieuw - totaalVorig;
    const nettoGroeiPct = totaalVorig > 0 ? round1((nettoGroei / totaalVorig) * 100) : null;

    perSeizoen.push({
      seizoen: season,
      totaal_vorig: totaalVorig,
      totaal_nieuw: totaalNieuw,
      behouden: s.behouden,
      nieuw: s.nieuw,
      herinschrijver: s.herinschrijver,
      uitgestroomd: s.uitgestroomd,
      niet_spelend_geworden: s.niet_spelend_geworden,
      retentie_pct: retentiePct,
      netto_groei: nettoGroei,
      netto_groei_pct: nettoGroeiPct,
    });
  }

  // 5b: Per leeftijdsgroep retention
  const AGE_GROUPS = ['6-12', '13-14', '15-16', '17-18', '19-23', '24+'];
  const perLeeftijdsgroep = [];

  for (const groep of AGE_GROUPS) {
    const perSeason = {};

    for (const season of VERLOOP_SEASONS) {
      const vData = loadVerloop(season);
      const snapshotYearVorig = SNAPSHOT_YEARS[ALL_SEASONS[ALL_SEASONS.indexOf(season) - 1]];

      let behouden = 0;
      let uitgestroomd = 0;
      let nietSpelend = 0;
      let instroom = 0; // nieuw + herinschrijver

      for (const entry of vData.verloop) {
        // Use leeftijd_vorig for retention/uitstroom (they were that age in vorig season)
        // Use leeftijd_nieuw for instroom (they are that age in new season)
        const leeftijdVorig = entry.leeftijd_vorig != null ? entry.leeftijd_vorig : null;
        const leeftijdNieuw = entry.leeftijd_nieuw != null ? entry.leeftijd_nieuw : null;

        if (entry.status === 'behouden' && leeftijdVorig != null && getAgeGroup(leeftijdVorig) === groep) {
          behouden++;
        }
        if (entry.status === 'uitgestroomd' && leeftijdVorig != null && getAgeGroup(leeftijdVorig) === groep) {
          uitgestroomd++;
        }
        if (entry.status === 'niet_spelend_geworden' && leeftijdVorig != null && getAgeGroup(leeftijdVorig) === groep) {
          nietSpelend++;
        }
        if ((entry.status === 'nieuw' || entry.status === 'herinschrijver') && leeftijdNieuw != null && getAgeGroup(leeftijdNieuw) === groep) {
          instroom++;
        }
      }

      const prevTotal = behouden + uitgestroomd + nietSpelend;
      const retentiePct = prevTotal > 0 ? round1((behouden / prevTotal) * 100) : null;

      perSeason[season] = {
        retentie_pct: retentiePct,
        instroom,
        uitstroom: uitgestroomd + nietSpelend,
      };
    }

    perLeeftijdsgroep.push({
      groep,
      per_seizoen: perSeason,
    });
  }

  // 5c: Instroom leeftijd (average, median, distribution)
  const instroomLeeftijd = [];

  for (const season of VERLOOP_SEASONS) {
    const vData = loadVerloop(season);
    const instroomAges = [];

    for (const entry of vData.verloop) {
      if (entry.status === 'nieuw' || entry.status === 'herinschrijver') {
        if (entry.leeftijd_nieuw != null) {
          instroomAges.push(entry.leeftijd_nieuw);
        }
      }
    }

    const gemiddelde = instroomAges.length > 0 ? round1(instroomAges.reduce((a, b) => a + b, 0) / instroomAges.length) : null;
    const med = median(instroomAges);

    // Build distribution
    const verdeling = {};
    const buckets = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15+'];
    for (const b of buckets) {
      verdeling[b] = 0;
    }

    for (const age of instroomAges) {
      if (age < 5) {
        // Skip or add to a catch-all
        if (!verdeling['<5']) verdeling['<5'] = 0;
        verdeling['<5']++;
      } else if (age <= 14) {
        verdeling[String(age)]++;
      } else {
        verdeling['15+']++;
      }
    }

    // Clean up: remove 0 buckets for <5 if not used
    if (verdeling['<5'] === 0) delete verdeling['<5'];

    instroomLeeftijd.push({
      seizoen: season,
      totaal_instroom: instroomAges.length,
      gemiddelde,
      mediaan: med,
      verdeling,
    });
  }

  // Build final output
  const output = {
    _meta: {
      beschrijving: 'Ledenverloop per geboortejaar-cohort over alle seizoenen',
      datakwaliteit: 'Oudere snapshots (2021-2024, supersheet) bevatten ~25% foutieve geboortejaren. Cohort-trajecten voor individuele jaargroepen kunnen daardoor afwijken. Totalen per seizoen zijn betrouwbaar.',
      seizoenen: ALL_SEASONS,
      gegenereerd: '2026-02-24',
    },
    per_cohort: perCohort,
    _totalen: {
      per_seizoen: perSeizoen,
      per_leeftijdsgroep: perLeeftijdsgroep,
      instroom_leeftijd: instroomLeeftijd,
    },
  };

  const outputPath = path.join(OUTPUT_DIR, 'totaal-cohorten.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(`Written: ${outputPath}`);
  console.log(`Cohorts: ${perCohort.length}`);
  console.log('\nPer seizoen totalen:');
  perSeizoen.forEach(s => {
    console.log(`  ${s.seizoen}: vorig=${s.totaal_vorig} nieuw=${s.totaal_nieuw} retentie=${s.retentie_pct}% netto=${s.netto_groei} (${s.netto_groei_pct}%)`);
  });
  console.log('\nPer leeftijdsgroep retentie (laatste seizoen):');
  perLeeftijdsgroep.forEach(g => {
    const latest = g.per_seizoen['2025-2026'];
    console.log(`  ${g.groep}: retentie=${latest.retentie_pct}% instroom=${latest.instroom} uitstroom=${latest.uitstroom}`);
  });
  console.log('\nInstroom leeftijd (laatste seizoen):');
  const latestInstroom = instroomLeeftijd[instroomLeeftijd.length - 1];
  console.log(`  gemiddelde=${latestInstroom.gemiddelde} mediaan=${latestInstroom.mediaan}`);
  console.log(`  verdeling:`, latestInstroom.verdeling);
}

main();
