/**
 * genereer-signalering.js
 *
 * Task 6: Genereert alerts op basis van cohortdata en streefmodel.
 *
 * Alert types:
 * - retentie: retentie per leeftijdsgroep onder drempel
 * - instroom: kern-instroom (6-9 jaar) dalend vs vorige seizoenen
 * - genderdisbalans: M/V ratio in geboortejaar wijkt >60/40 af
 * - trendbreuk: plotselinge verandering vs geleidelijke trend
 *
 * Output: data/ledenverloop/signalering/2025-2026-alerts.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COHORTEN_FILE = path.join(ROOT, 'data', 'ledenverloop', 'cohorten', 'totaal-cohorten.json');
const STREEF_FILE = path.join(ROOT, 'data', 'modellen', 'streef-ledenboog.json');
const OUTPUT_DIR = path.join(ROOT, 'data', 'ledenverloop', 'signalering');

const SEIZOEN = '2025-2026';

// Thresholds per age group
const THRESHOLDS = {
  '6-12':  { streef: 95, aandacht: 85, kritiek: 70 },
  '13-14': { streef: 90, aandacht: 80, kritiek: 65 },
  '15-16': { streef: 88, aandacht: 78, kritiek: 63 },
  '17-18': { streef: 90, aandacht: 80, kritiek: 65 },
  '19-23': { streef: 75, aandacht: 65, kritiek: 50 },
  '24+':   { streef: 80, aandacht: 70, kritiek: 55 },
};

function getAgeGroup(leeftijd) {
  if (leeftijd >= 6 && leeftijd <= 12) return '6-12';
  if (leeftijd >= 13 && leeftijd <= 14) return '13-14';
  if (leeftijd >= 15 && leeftijd <= 16) return '15-16';
  if (leeftijd >= 17 && leeftijd <= 18) return '17-18';
  if (leeftijd >= 19 && leeftijd <= 23) return '19-23';
  if (leeftijd >= 24) return '24+';
  return null;
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const cohortData = JSON.parse(fs.readFileSync(COHORTEN_FILE, 'utf8'));
  const streefData = JSON.parse(fs.readFileSync(STREEF_FILE, 'utf8'));

  const alerts = [];

  // ===== 1. RETENTIE ALERTS =====
  // Check retention per age group for latest season
  const latestAgeGroupData = {};
  for (const lg of cohortData._totalen.per_leeftijdsgroep) {
    const seasonData = lg.per_seizoen[SEIZOEN];
    if (seasonData && seasonData.retentie_pct !== null) {
      latestAgeGroupData[lg.groep] = seasonData;
    }
  }

  for (const [groep, threshold] of Object.entries(THRESHOLDS)) {
    const data = latestAgeGroupData[groep];
    if (!data || data.retentie_pct === null) continue;

    const retentie = data.retentie_pct;

    if (retentie < threshold.kritiek) {
      alerts.push({
        type: 'retentie',
        ernst: 'kritiek',
        leeftijdsgroep: groep,
        geslacht: null,
        waarde: retentie,
        drempel: threshold.kritiek,
        streef: threshold.streef,
        beschrijving: `Retentie ${groep} jaar (${retentie}%) is kritiek laag (streef: ${threshold.streef}%)`,
      });
    } else if (retentie < threshold.aandacht) {
      alerts.push({
        type: 'retentie',
        ernst: 'aandacht',
        leeftijdsgroep: groep,
        geslacht: null,
        waarde: retentie,
        drempel: threshold.aandacht,
        streef: threshold.streef,
        beschrijving: `Retentie ${groep} jaar (${retentie}%) verdient aandacht (streef: ${threshold.streef}%)`,
      });
    }
  }

  // ===== 2. INSTROOM ALERTS =====
  // Check if core inflow (ages 6-9) is declining vs previous seasons
  const instroomData = cohortData._totalen.instroom_leeftijd;

  // Calculate core inflow (ages 5-9, the typical start ages) per season
  const coreInflowPerSeason = instroomData.map(s => {
    const verdeling = s.verdeling;
    let coreCount = 0;
    for (const [age, count] of Object.entries(verdeling)) {
      const ageNum = parseInt(age);
      if (!isNaN(ageNum) && ageNum >= 5 && ageNum <= 9) {
        coreCount += count;
      }
    }
    return { seizoen: s.seizoen, core_instroom: coreCount, totaal_instroom: s.totaal_instroom };
  });

  // Check if latest season has lower core inflow than average of previous seasons
  const latestCore = coreInflowPerSeason[coreInflowPerSeason.length - 1];
  const previousCores = coreInflowPerSeason.slice(0, -1);
  const avgPreviousCore = previousCores.reduce((sum, s) => sum + s.core_instroom, 0) / previousCores.length;

  if (latestCore.core_instroom < avgPreviousCore * 0.8) {
    alerts.push({
      type: 'instroom',
      ernst: 'kritiek',
      leeftijdsgroep: '5-9',
      geslacht: null,
      waarde: latestCore.core_instroom,
      drempel: Math.round(avgPreviousCore * 0.8),
      streef: Math.round(avgPreviousCore),
      beschrijving: `Kern-instroom 5-9 jaar (${latestCore.core_instroom}) is >20% lager dan gemiddelde voorgaande seizoenen (${Math.round(avgPreviousCore)})`,
    });
  } else if (latestCore.core_instroom < avgPreviousCore * 0.9) {
    alerts.push({
      type: 'instroom',
      ernst: 'aandacht',
      leeftijdsgroep: '5-9',
      geslacht: null,
      waarde: latestCore.core_instroom,
      drempel: Math.round(avgPreviousCore * 0.9),
      streef: Math.round(avgPreviousCore),
      beschrijving: `Kern-instroom 5-9 jaar (${latestCore.core_instroom}) is 10-20% lager dan gemiddelde voorgaande seizoenen (${Math.round(avgPreviousCore)})`,
    });
  }

  // ===== 3. GENDERDISBALANS ALERTS =====
  // Check M/V ratio per birth year in latest season
  // Only for cohorts with enough members (>= 5) to be meaningful
  const genderPerYear = {}; // geboortejaar -> { M: n, V: n }

  for (const cohort of cohortData.per_cohort) {
    const seasonData = cohort.seizoenen[SEIZOEN];
    if (!seasonData || seasonData.actief === 0) continue;

    const year = cohort.geboortejaar;
    const leeftijd = seasonData.leeftijd;

    // Only check jeugd ages (6-18)
    if (leeftijd < 6 || leeftijd > 18) continue;

    if (!genderPerYear[year]) {
      genderPerYear[year] = { M: 0, V: 0, leeftijd };
    }
    genderPerYear[year][cohort.geslacht] += seasonData.actief;
  }

  for (const [year, counts] of Object.entries(genderPerYear)) {
    const total = counts.M + counts.V;
    if (total < 5) continue; // Not enough members to judge

    const mRatio = counts.M / total;
    const vRatio = counts.V / total;

    if (mRatio > 0.6 || vRatio > 0.6) {
      const dominant = mRatio > vRatio ? 'M' : 'V';
      const ratio = Math.round(Math.max(mRatio, vRatio) * 100);
      const band = getBandForAge(counts.leeftijd);

      alerts.push({
        type: 'genderdisbalans',
        ernst: ratio >= 75 ? 'kritiek' : 'aandacht',
        leeftijdsgroep: `geboortejaar ${year} (${band}, leeftijd ${counts.leeftijd})`,
        geslacht: dominant,
        waarde: ratio,
        drempel: 60,
        streef: 50,
        beschrijving: `Geboortejaar ${year} (${band}): ${ratio}% ${dominant} (${counts.M}M/${counts.V}V) — streef ~50/50`,
      });
    }
  }

  // ===== 4. TRENDBREUK ALERTS =====
  // Check for sudden changes in retention vs gradual trend
  const seizoenen = cohortData._totalen.per_seizoen;

  if (seizoenen.length >= 3) {
    const latest = seizoenen[seizoenen.length - 1];
    const prev = seizoenen[seizoenen.length - 2];
    const prevPrev = seizoenen[seizoenen.length - 3];

    // Check retention trend
    const retentionTrend = prev.retentie_pct - prevPrev.retentie_pct;
    const retentionChange = latest.retentie_pct - prev.retentie_pct;

    // If direction changed and magnitude is significant (>5pp)
    if (Math.abs(retentionChange) > 5 && Math.sign(retentionChange) !== Math.sign(retentionTrend)) {
      alerts.push({
        type: 'trendbreuk',
        ernst: Math.abs(retentionChange) > 10 ? 'kritiek' : 'aandacht',
        leeftijdsgroep: 'alle',
        geslacht: null,
        waarde: latest.retentie_pct,
        drempel: null,
        streef: null,
        beschrijving: `Trendbreuk retentie: ${prev.retentie_pct}% → ${latest.retentie_pct}% (${retentionChange > 0 ? '+' : ''}${retentionChange.toFixed(1)}pp) na trend ${prevPrev.retentie_pct}% → ${prev.retentie_pct}%`,
      });
    }

    // Check net growth trend
    const growthTrend = prev.netto_groei - prevPrev.netto_groei;
    const growthChange = latest.netto_groei - prev.netto_groei;

    if (Math.abs(growthChange) > 20 && Math.sign(growthChange) !== Math.sign(growthTrend)) {
      alerts.push({
        type: 'trendbreuk',
        ernst: Math.abs(growthChange) > 40 ? 'kritiek' : 'aandacht',
        leeftijdsgroep: 'alle',
        geslacht: null,
        waarde: latest.netto_groei,
        drempel: null,
        streef: null,
        beschrijving: `Trendbreuk netto groei: ${prev.netto_groei > 0 ? '+' : ''}${prev.netto_groei} → ${latest.netto_groei > 0 ? '+' : ''}${latest.netto_groei} na trend ${prevPrev.netto_groei > 0 ? '+' : ''}${prevPrev.netto_groei} → ${prev.netto_groei > 0 ? '+' : ''}${prev.netto_groei}`,
      });
    }

    // Check "niet_spelend_geworden" spike (new phenomenon in 2025-2026 due to Sportlink data)
    if (latest.niet_spelend_geworden > 0) {
      const prevNietSpelend = seizoenen.slice(0, -1).reduce((sum, s) => sum + s.niet_spelend_geworden, 0);
      if (latest.niet_spelend_geworden > 10 && prevNietSpelend === 0) {
        alerts.push({
          type: 'trendbreuk',
          ernst: 'aandacht',
          leeftijdsgroep: 'alle',
          geslacht: null,
          waarde: latest.niet_spelend_geworden,
          drempel: null,
          streef: null,
          beschrijving: `${latest.niet_spelend_geworden} leden van spelactiviteit korfbal naar niet-spelend/biljart gewisseld (nieuw patroon, mogelijk door Sportlink-datamigratie)`,
        });
      }
    }
  }

  // Sort alerts: kritiek first, then aandacht
  alerts.sort((a, b) => {
    if (a.ernst !== b.ernst) return a.ernst === 'kritiek' ? -1 : 1;
    return a.type.localeCompare(b.type);
  });

  const kritiekCount = alerts.filter(a => a.ernst === 'kritiek').length;
  const aandachtCount = alerts.filter(a => a.ernst === 'aandacht').length;

  const output = {
    _meta: {
      seizoen: SEIZOEN,
      gegenereerd: '2026-02-24',
      totaal_alerts: alerts.length,
      kritiek: kritiekCount,
      aandacht: aandachtCount,
    },
    alerts,
  };

  const outputPath = path.join(OUTPUT_DIR, `${SEIZOEN}-alerts.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(`Written: ${outputPath}`);
  console.log(`Total alerts: ${alerts.length} (${kritiekCount} kritiek, ${aandachtCount} aandacht)`);
  console.log('\nAlerts:');
  alerts.forEach(a => {
    console.log(`  [${a.ernst}] ${a.type}: ${a.beschrijving}`);
  });
}

function getBandForAge(leeftijd) {
  if (leeftijd >= 6 && leeftijd <= 7) return 'Blauw';
  if (leeftijd >= 8 && leeftijd <= 9) return 'Groen';
  if (leeftijd >= 10 && leeftijd <= 12) return 'Geel';
  if (leeftijd >= 13 && leeftijd <= 15) return 'Oranje';
  if (leeftijd >= 16 && leeftijd <= 18) return 'Rood';
  return 'Senioren';
}

main();
