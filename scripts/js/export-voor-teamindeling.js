#!/usr/bin/env node
/**
 * Export-script: genereert één JSON-bestand met alle data die de
 * Team-Indeling tool nodig heeft voor een nieuw seizoen.
 *
 * Gebruik:
 *   node scripts/export-voor-teamindeling.js [seizoen]
 *   node scripts/export-voor-teamindeling.js 2026-2027
 *
 * Output:
 *   data/export/export-YYYY-YYYY.json
 */

const fs = require('fs');
const path = require('path');

// --- Configuratie ---
const ROOT = path.resolve(__dirname, '..');
const seizoenArg = process.argv[2]; // optioneel: "2026-2027"

// Bepaal seizoenen
const huidigSeizoen = '2025-2026';
const nieuwSeizoen = seizoenArg || '2026-2027';
const seizoenJaar = parseInt(nieuwSeizoen.split('-')[0]); // 2026

// Laatste 5 seizoenen voor spelerspaden
const RELEVANTE_SEIZOENEN = [
  '2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026'
];

// --- Helpers ---

function leesJSON(relatief) {
  const volledig = path.join(ROOT, relatief);
  if (!fs.existsSync(volledig)) {
    console.warn(`  ⚠ Bestand niet gevonden: ${relatief}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(volledig, 'utf-8'));
}

function vindMeestRecenteSnapshot() {
  const dir = path.join(ROOT, 'data', 'leden', 'snapshots');
  const bestanden = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && !f.includes('raw'))
    .sort()
    .reverse();
  if (bestanden.length === 0) throw new Error('Geen snapshots gevonden');
  return bestanden[0];
}

function vindRawTeamsCSV(snapshotDatum) {
  const csvPad = path.join(ROOT, 'data', 'leden', 'snapshots', 'raw', `${snapshotDatum}-sportlink-teams.csv`);
  if (!fs.existsSync(csvPad)) {
    console.warn(`  ⚠ Sportlink teams CSV niet gevonden: ${csvPad}`);
    return null;
  }
  return fs.readFileSync(csvPad, 'utf-8');
}

function parseCSV(csv) {
  const regels = csv.trim().split('\n');
  const headers = regels[0].split(';').map(h => h.replace(/"/g, '').trim());
  return regels.slice(1).map(regel => {
    const waarden = regel.split(';').map(v => v.replace(/"/g, '').trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = waarden[i] || null; });
    return obj;
  });
}

function parseYAML(relatief) {
  // Simpele YAML-parser voor het jeugdmodel (platte key-value structuur)
  const volledig = path.join(ROOT, relatief);
  if (!fs.existsSync(volledig)) return null;
  const tekst = fs.readFileSync(volledig, 'utf-8');
  return tekst;
}

function extractRetentieUitYAML(yamlTekst) {
  const resultaat = { per_leeftijd: {}, per_leeftijd_M: {}, per_leeftijd_V: {} };
  let huidigeSectie = null;

  for (const regel of yamlTekst.split('\n')) {
    const trimmed = regel.trim();
    if (trimmed.startsWith('per_leeftijd_M:')) { huidigeSectie = 'per_leeftijd_M'; continue; }
    if (trimmed.startsWith('per_leeftijd_V:')) { huidigeSectie = 'per_leeftijd_V'; continue; }
    if (trimmed.startsWith('per_leeftijd:')) { huidigeSectie = 'per_leeftijd'; continue; }
    if (trimmed.startsWith('samenvatting:') || trimmed.startsWith('vergelijking')) { huidigeSectie = null; continue; }

    if (huidigeSectie && /^\d+:\s*[\d.]+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+):\s*([\d.]+)/);
      if (match) {
        resultaat[huidigeSectie][parseInt(match[1])] = parseFloat(match[2]);
      }
    }
  }
  return resultaat;
}

function extractInstroomUitYAML(yamlTekst) {
  const resultaat = {};
  let inSectie = false;

  for (const regel of yamlTekst.split('\n')) {
    const trimmed = regel.trim();
    if (trimmed.startsWith('verdeling_per_leeftijd:')) { inSectie = true; continue; }
    if (inSectie && trimmed.startsWith('gemiddeld_per_seizoen:')) { inSectie = false; continue; }

    if (inSectie && /^\d+:\s*[\d.]+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+):\s*([\d.]+)/);
      if (match) {
        resultaat[parseInt(match[1])] = parseFloat(match[2]);
      }
    }
  }
  return resultaat;
}

// --- Teams KNKV per seizoen laden ---

function laadAlleTeamsKNKV() {
  const seizoenenDir = path.join(ROOT, 'data', 'seizoenen');
  const result = new Map(); // seizoen → teams[]

  if (!fs.existsSync(seizoenenDir)) return result;

  for (const entry of fs.readdirSync(seizoenenDir)) {
    const knkvPad = path.join(seizoenenDir, entry, 'teams-knkv.json');
    if (fs.existsSync(knkvPad)) {
      try {
        const data = JSON.parse(fs.readFileSync(knkvPad, 'utf-8'));
        if (data?.teams) {
          result.set(entry, data.teams);
        }
      } catch { /* skip onleesbare bestanden */ }
    }
  }

  return result;
}

function zoekTeamInfo(teamsPerSeizoen, seizoen, teamNaam) {
  const teams = teamsPerSeizoen.get(seizoen);
  if (!teams || !teamNaam) return { kleur: null, niveau: null, spelvorm: null };

  // Exacte match op teamnaam
  const match = teams.find(t => t.team === teamNaam);
  if (match) {
    return {
      kleur: match.kleur || null,
      niveau: match.niveau || null,
      spelvorm: match.spelvorm || (match.kleur && ['Blauw', 'Groen'].includes(match.kleur) ? '4-tal' : '8-tal')
    };
  }

  return { kleur: null, niveau: null, spelvorm: null };
}

// --- Volgend seizoen berekening ---

function bepaalACategorieVolgendSeizoen(geboortejaar) {
  // Peildatum: 31 dec van seizoenjaar
  const leeftijd = seizoenJaar - geboortejaar;

  if (leeftijd >= 13 && leeftijd <= 14) return { a_categorie: 'U15', a_jaars: leeftijd === 13 ? '1e-jaars' : '2e-jaars' };
  if (leeftijd >= 15 && leeftijd <= 16) return { a_categorie: 'U17', a_jaars: leeftijd === 15 ? '1e-jaars' : '2e-jaars' };
  if (leeftijd >= 17 && leeftijd <= 18) return { a_categorie: 'U19', a_jaars: leeftijd === 17 ? '1e-jaars' : '2e-jaars' };
  if (leeftijd >= 19) return { a_categorie: 'Senioren', a_jaars: null };
  return { a_categorie: null, a_jaars: null };
}

function bepaalKleurBand(leeftijd) {
  if (leeftijd >= 5 && leeftijd <= 7) return 'Blauw';
  if (leeftijd >= 8 && leeftijd <= 9) return 'Groen';
  if (leeftijd >= 10 && leeftijd <= 12) return 'Geel';
  if (leeftijd >= 13 && leeftijd <= 15) return 'Oranje';
  if (leeftijd >= 16 && leeftijd <= 18) return 'Rood';
  return null;
}

function bepaalVolgendSeizoen(speler) {
  const leeftijd = seizoenJaar - speler.geboortejaar;
  const aCat = bepaalACategorieVolgendSeizoen(speler.geboortejaar);
  const bandB = bepaalKleurBand(leeftijd);

  let opmerking = null;
  // Doorstroom-opmerkingen
  if (speler.huidig && speler.huidig.a_categorie && aCat.a_categorie !== speler.huidig.a_categorie) {
    opmerking = `Doorstroom ${speler.huidig.a_categorie} → ${aCat.a_categorie || 'Senioren'}`;
  }
  if (leeftijd === 13 && !speler.huidig?.a_categorie) {
    opmerking = 'Eerste jaar A-categorie beschikbaar (U15)';
  }
  if (leeftijd >= 19 && speler.huidig?.a_categorie !== 'Senioren') {
    opmerking = 'Doorstroom naar Senioren';
  }

  return {
    leeftijd,
    a_categorie: aCat.a_categorie,
    a_jaars: aCat.a_jaars,
    band_b: bandB,
    opmerking
  };
}

// --- Retentie-risico berekening ---

function berekenRetentie(speler, retentieData, seizoenenActief) {
  const leeftijd = seizoenJaar - speler.geboortejaar;
  const geslacht = speler.geslacht;

  // Pak de gender-specifieke retentiekans, fallback naar totaal
  const geslachtKey = geslacht === 'M' ? 'per_leeftijd_M' : 'per_leeftijd_V';
  let kansBehoud = retentieData[geslachtKey]?.[leeftijd]
    || retentieData.per_leeftijd?.[leeftijd]
    || 0.90; // default

  const factoren = [];

  // Leeftijdsfactoren
  if (leeftijd === 17) factoren.push('leeftijd_17_cliff');
  if (leeftijd === 6 || leeftijd === 7) factoren.push('instap_fragiel');
  if (leeftijd === 12) factoren.push('transitiejaar_b_naar_a');

  // Binding-factoren
  if (seizoenenActief >= 6) factoren.push(`${seizoenenActief}e_seizoen_hoge_binding`);
  if (seizoenenActief <= 1) factoren.push('nieuw_lid_laag_gebonden');

  // Risico-label
  let risico;
  if (kansBehoud >= 0.90) risico = 'laag';
  else if (kansBehoud >= 0.85) risico = 'gemiddeld';
  else risico = 'hoog';

  return { risico, kans_behoud: kansBehoud, factoren };
}

// --- Teamgenoten-historie berekening ---

function berekenTeamgenotenHistorie(spelerId, spelerspaden, spelerPadLookup) {
  const eigenPad = spelerPadLookup.get(spelerId);
  if (!eigenPad) return [];

  // Bouw per seizoen een set van teamgenoten
  const teller = new Map(); // speler_id → aantal seizoenen samen

  for (const [seizoen, info] of Object.entries(eigenPad.seizoenen || {})) {
    if (!RELEVANTE_SEIZOENEN.includes(seizoen)) continue;
    const eigenTeam = info.team;

    // Zoek wie er nog meer in dit team zat
    for (const anderePad of spelerspaden) {
      if (anderePad.speler_id === spelerId) continue;
      const anderInfo = anderePad.seizoenen?.[seizoen];
      if (anderInfo && anderInfo.team === eigenTeam) {
        teller.set(anderePad.speler_id, (teller.get(anderePad.speler_id) || 0) + 1);
      }
    }
  }

  // Top 3 langst samengespeeld
  return Array.from(teller.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, seizoenen]) => {
      const pad = spelerPadLookup.get(id);
      return {
        speler_id: id,
        naam: pad ? pad.roepnaam : id,
        seizoenen_samen: seizoenen
      };
    });
}

// --- Staf extractie ---

function extractStaf(csvData, teamsKNKV) {
  if (!csvData) return [];

  const rijen = parseCSV(csvData);
  const stafRijen = rijen.filter(r =>
    r['Teamrol'] === 'Technische staf' || r['Teamrol'] === 'Overige staf'
  );

  // Groepeer per persoon (kan bij meerdere teams staan)
  const perPersoon = new Map();

  for (const rij of stafRijen) {
    const id = rij['Rel. code'];
    if (!perPersoon.has(id)) {
      // Parse naam: "Witt, M. (Monique) te" → "Monique te Witt"
      const naam = parseStafNaam(rij['Naam']);
      const gebdat = rij['Geb.dat.'];
      const geboortejaar = gebdat ? parseInt(gebdat.split('-')[0]) : null;

      perPersoon.set(id, {
        id,
        naam,
        geboortejaar,
        rol: rij['Teamrol'],
        teams: []
      });
    }

    // Voeg team toe
    const teamNaam = rij['Team'];
    const knkvTeam = teamsKNKV?.find(t => t.team === teamNaam);
    perPersoon.get(id).teams.push({
      team: teamNaam,
      kleur: knkvTeam?.kleur || null
    });
  }

  return Array.from(perPersoon.values());
}

function parseStafNaam(raw) {
  if (!raw) return raw;
  // "Witt, M. (Monique) te" → "Monique te Witt"
  // "Naaktgeboren, D.J. (Dio)" → "Dio Naaktgeboren"
  // "Lichteveld, F. (Fred)" → "Fred Lichteveld"

  const roepnaamMatch = raw.match(/\(([^)]+)\)/);
  const roepnaam = roepnaamMatch ? roepnaamMatch[1] : '';

  // Achternaam staat voor de komma
  const kommaIdx = raw.indexOf(',');
  let achternaam = kommaIdx >= 0 ? raw.substring(0, kommaIdx).trim() : raw;

  // Tussenvoegsel kan na de roepnaam staan: "Witt, M. (Monique) te"
  const naRoepnaam = raw.substring(raw.indexOf(')') + 1).trim();
  const tussenvoegsel = naRoepnaam && naRoepnaam !== '' ? naRoepnaam : '';

  if (tussenvoegsel) {
    return `${roepnaam} ${tussenvoegsel} ${achternaam}`.trim();
  }
  return `${roepnaam} ${achternaam}`.trim();
}

// --- Teams huidig ---

function bouwTeamsHuidig(snapshot, perTeamAgg, teamsKNKV, stafLijst) {
  if (!perTeamAgg?.data) return [];

  // Bouw speler_ids per team uit snapshot
  const spelerPerTeam = new Map();
  for (const lid of snapshot.leden) {
    if (lid.spelactiviteit !== 'korfbal' || lid.status !== 'actief') continue;
    if (!lid.team) continue;
    if (!spelerPerTeam.has(lid.team)) spelerPerTeam.set(lid.team, []);
    spelerPerTeam.get(lid.team).push(lid.rel_code);
  }

  // Bouw staf_ids per team
  const stafPerTeam = new Map();
  for (const staf of stafLijst) {
    for (const t of staf.teams) {
      if (!stafPerTeam.has(t.team)) stafPerTeam.set(t.team, []);
      stafPerTeam.get(t.team).push(staf.id);
    }
  }

  return perTeamAgg.data.map(team => {
    const knkvTeam = teamsKNKV?.find(t => t.team === team.team);
    const owCode = owCodeLookup.get(team.team) || team.team;
    return {
      team: team.team,
      ow_code: owCode,
      categorie: team.categorie,
      kleur: team.kleur,
      niveau: team.niveau,
      spelvorm: knkvTeam?.spelvorm || (team.kleur && ['Blauw', 'Groen'].includes(team.kleur) ? '4-tal' : '8-tal'),
      pool_veld: knkvTeam?.pool_veld || null,
      pool_zaal: knkvTeam?.pool_zaal || null,
      speler_ids: spelerPerTeam.get(team.team) || [],
      staf_ids: stafPerTeam.get(team.team) || [],
      stats: {
        totaal: team.totaal,
        m: team.spelers_M,
        v: team.spelers_V,
        gem_leeftijd: team.gem_leeftijd
      }
    };
  });
}

// --- Verloop ---

function bouwVerloop(verloopData) {
  if (!verloopData) return null;

  const verloop = verloopData.verloop || [];

  const groepeer = (status) => verloop
    .filter(v => v.status === status)
    .map(v => ({
      id: v.rel_code,
      geslacht: v.geslacht,
      geboortejaar: v.geboortejaar,
      leeftijd: v.leeftijd_nieuw || v.leeftijd_vorig,
      team_vorig: v.team_vorig,
      team_nieuw: v.team_nieuw
    }));

  return {
    seizoen: verloopData._meta?.seizoen || huidigSeizoen,
    samenvatting: verloopData._meta?.samenvatting || {},
    nieuw: groepeer('nieuw'),
    herinschrijvers: groepeer('herinschrijver'),
    uitgestroomd: groepeer('uitgestroomd'),
    niet_spelend_geworden: groepeer('niet_spelend_geworden')
  };
}

// --- Streefmodel ---

function bouwStreefmodel(streefData) {
  if (!streefData) return null;

  const samenvatting = streefData.samenvatting || {};
  const huidig = samenvatting[huidigSeizoen] || {};

  const perBand = [];
  const banden = streefData._meta?.banden || {};

  for (const [bandNaam, bandInfo] of Object.entries(banden)) {
    const huidigBand = huidig.per_band?.[bandNaam] || {};
    const streefBand = samenvatting['2027-2028']?.per_band?.[bandNaam] || huidigBand;

    perBand.push({
      band: bandNaam,
      leeftijden: bandInfo.leeftijd,
      spelvorm: bandInfo.spelvorm,
      streef_spelers: streefBand.totaal || 0,
      streef_teams: streefBand.teams || 0,
      streef_per_team: streefBand.teams ? Math.round(streefBand.totaal / streefBand.teams) : 0,
      huidig_spelers: huidigBand.totaal || 0,
      vulgraad: huidigBand.totaal && streefBand.totaal
        ? Math.round((huidigBand.totaal / streefBand.totaal) * 100) / 100
        : null,
      status: berekenVulgraadStatus(huidigBand.totaal, streefBand.totaal)
    });
  }

  // A-categorie per band
  const perACategorie = [];
  for (const cat of ['U15', 'U17', 'U19']) {
    const geboortejaren = bepaalACategorieGeboortejaren(cat);
    const boogHuidig = streefData.boog_huidig?.per_leeftijd || [];
    const poolSpelers = boogHuidig
      .filter(p => geboortejaren.includes(seizoenJaar - 1 - p.leeftijd))
      .reduce((sum, p) => ({ totaal: sum.totaal + p.totaal, m: sum.m + p.m, v: sum.v + p.v }), { totaal: 0, m: 0, v: 0 });

    perACategorie.push({
      categorie: cat,
      geboortejaren,
      streef_selectie: 20,
      streef_per_team: 10,
      streef_teams: 2,
      huidig_pool: poolSpelers.totaal,
      vulgraad: poolSpelers.totaal ? Math.round((poolSpelers.totaal / 20) * 100) / 100 : null,
      gender: { m: poolSpelers.m, v: poolSpelers.v }
    });
  }

  return {
    seizoen: nieuwSeizoen,
    per_band: perBand,
    per_a_categorie: perACategorie,
    totaal_jeugd_streef: huidig.totaal || 185,
    totaal_jeugd_huidig: streefData.boog_huidig?.totaal || 0
  };
}

function bepaalACategorieGeboortejaren(cat) {
  switch (cat) {
    case 'U15': return [seizoenJaar - 13, seizoenJaar - 14];
    case 'U17': return [seizoenJaar - 15, seizoenJaar - 16];
    case 'U19': return [seizoenJaar - 17, seizoenJaar - 18];
    default: return [];
  }
}

function berekenVulgraadStatus(huidig, streef) {
  if (!huidig || !streef) return 'onbekend';
  const ratio = huidig / streef;
  if (ratio >= 0.80) return 'op_koers';
  if (ratio >= 0.60) return 'aandacht';
  return 'kritiek';
}

// --- Signalering ---

function bouwSignalering(alertsData) {
  if (!alertsData?.alerts) return [];

  return alertsData.alerts.map(alert => ({
    type: alert.type,
    ernst: alert.ernst,
    band: extractBandUitLeeftijdsgroep(alert.leeftijdsgroep),
    geboortejaar: extractGeboortejaarUitLeeftijdsgroep(alert.leeftijdsgroep),
    beschrijving: alert.beschrijving,
    impact_teamindeling: genereerImpactBeschrijving(alert)
  }));
}

function extractBandUitLeeftijdsgroep(lg) {
  if (!lg) return null;
  const bands = ['Blauw', 'Groen', 'Geel', 'Oranje', 'Rood'];
  for (const b of bands) {
    if (lg.includes(b)) return b;
  }
  return null;
}

function extractGeboortejaarUitLeeftijdsgroep(lg) {
  if (!lg) return null;
  const match = lg.match(/geboortejaar\s+(\d{4})/);
  return match ? parseInt(match[1]) : null;
}

function genereerImpactBeschrijving(alert) {
  switch (alert.type) {
    case 'genderdisbalans':
      return `Moeilijk om evenwichtige teams te vormen: ${alert.beschrijving}`;
    case 'instroom':
      return `Lagere instroom dan verwacht kan teamaantallen onder druk zetten`;
    case 'retentie':
      return `Hogere uitstroom dan verwacht — extra aandacht bij teamindeling`;
    case 'trendbreuk':
      return `Onverwachte trend — controleer bij seizoensplanning`;
    default:
      return alert.beschrijving;
  }
}

// --- Instroom profiel ---

function bouwInstroomProfiel(yamlTekst) {
  const verdeling = extractInstroomUitYAML(yamlTekst);
  const perLeeftijd = Object.entries(verdeling).map(([l, a]) => ({
    leeftijd: parseInt(l),
    aandeel: a
  }));

  return {
    gemiddeld_per_seizoen: 24,
    piek_leeftijd: [8, 9],
    mv_ratio: { m: 0.40, v: 0.60 },
    per_leeftijd: perLeeftijd
  };
}

// ====================================================================
// HOOFDPROGRAMMA
// ====================================================================

function main() {
  console.log('=== Export voor Team-Indeling ===');
  console.log(`Huidig seizoen: ${huidigSeizoen}`);
  console.log(`Nieuw seizoen:  ${nieuwSeizoen}\n`);

  // 1. Snapshot laden
  const snapshotBestand = vindMeestRecenteSnapshot();
  const snapshotDatum = snapshotBestand.replace('.json', '');
  console.log(`1. Snapshot: ${snapshotBestand}`);
  const snapshot = leesJSON(`data/leden/snapshots/${snapshotBestand}`);

  // 2. Staf uit CSV
  console.log('2. Staf laden uit Sportlink teams CSV...');
  const rawCSV = vindRawTeamsCSV(snapshotDatum);

  // 3. Spelerspaden
  console.log('3. Spelerspaden laden...');
  const spelerspaden = leesJSON('data/spelers/spelerspaden.json') || [];
  const spelerPadLookup = new Map();
  for (const pad of spelerspaden) {
    spelerPadLookup.set(pad.speler_id, pad);
  }

  // 4. Retentiemodel (YAML)
  console.log('4. Retentiemodel laden (jeugdmodel.yaml)...');
  const yamlTekst = parseYAML('model/jeugdmodel.yaml');
  const retentieData = yamlTekst ? extractRetentieUitYAML(yamlTekst) : {};

  // 5. Streefmodel
  console.log('5. Streefmodel laden...');
  const streefData = leesJSON('data/modellen/streef-ledenboog.json');

  // 6. Signalering
  console.log('6. Signalering laden...');
  const alertsData = leesJSON(`data/ledenverloop/signalering/${huidigSeizoen}-alerts.json`);

  // 7. Verloop
  console.log('7. Verloop huidig seizoen laden...');
  const verloopData = leesJSON(`data/ledenverloop/individueel/${huidigSeizoen}-verloop.json`);

  // 8. Teams KNKV — laad alle beschikbare seizoenen voor spelerspad-verrijking
  console.log('8. KNKV teams laden (alle beschikbare seizoenen)...');
  const teamsPerSeizoen = laadAlleTeamsKNKV();
  const teamsKNKV = teamsPerSeizoen.get(huidigSeizoen) || [];
  console.log(`   Teams-KNKV beschikbaar voor: ${[...teamsPerSeizoen.keys()].join(', ') || 'geen'}`);

  // 8b. Teams register (teams.json) — stabiele ow_codes per seizoen
  console.log('8b. Teamregister laden (teams.json)...');
  const teamsRegister = leesJSON(`data/seizoenen/${huidigSeizoen}/teams.json`);
  const owCodeLookup = new Map(); // j_nummer → ow_code
  const owCodeTeamLookup = new Map(); // ow_code → team object
  if (teamsRegister?.teams) {
    for (const team of teamsRegister.teams) {
      owCodeTeamLookup.set(team.ow_code, team);
      // Map j_nummers uit alle periodes naar ow_code
      for (const periode of Object.values(team.periodes || {})) {
        if (periode?.j_nummer) owCodeLookup.set(periode.j_nummer, team.ow_code);
      }
      // A-categorie en senioren: directe match op ow_code
      if (team.categorie === 'a' || !team.kleur) {
        owCodeLookup.set(team.ow_code, team.ow_code);
      }
    }
    console.log(`   Teamregister: ${teamsRegister.teams.length} teams met ow_code`);
  } else {
    console.warn('   ⚠ Teamregister niet gevonden — ow_codes worden niet meegenomen');
  }

  // 9. Aggregaties per team
  console.log('9. Aggregaties per team laden...');
  const perTeamAgg = leesJSON(`data/aggregaties/${snapshotDatum}-per-team.json`);

  // --- Staf extractie ---
  const stafLijst = extractStaf(rawCSV, teamsKNKV);
  console.log(`   Staf: ${stafLijst.length} personen gevonden`);

  // --- Spelers verwerken ---
  console.log('\n10. Spelers verwerken...');
  const actieveSpelers = snapshot.leden.filter(
    l => l.spelactiviteit === 'korfbal' && l.status === 'actief'
  );

  const spelers = actieveSpelers.map(lid => {
    const id = lid.rel_code || `TEMP_${lid.roepnaam}_${lid.achternaam}_${lid.geboortejaar}`;
    const pad = spelerPadLookup.get(id);

    // Spelerspad filteren op relevante seizoenen + verrijken met team-info
    const relevantPad = [];
    if (pad?.seizoenen) {
      for (const seizoen of RELEVANTE_SEIZOENEN) {
        if (pad.seizoenen[seizoen]) {
          const teamNaam = pad.seizoenen[seizoen].team;
          const teamInfo = zoekTeamInfo(teamsPerSeizoen, seizoen, teamNaam);
          relevantPad.push({
            seizoen,
            team: teamNaam,
            kleur: teamInfo.kleur,
            niveau: teamInfo.niveau,
            spelvorm: teamInfo.spelvorm,
            categorie: pad.seizoenen[seizoen].categorie
          });
        }
      }
    }

    // Seizoenen actief tellen
    const seizoenenActief = pad?.seizoenen ? Object.keys(pad.seizoenen).length : 1;

    // Instroom-leeftijd berekenen
    const lidSindsJaar = lid.lid_sinds ? parseInt(lid.lid_sinds.split('-')[0]) : null;
    const instroomLeeftijd = lidSindsJaar ? lidSindsJaar - lid.geboortejaar : null;

    // Volgend seizoen berekening
    const volgendSeizoen = bepaalVolgendSeizoen({
      geboortejaar: lid.geboortejaar,
      geslacht: lid.geslacht,
      huidig: {
        team: lid.team,
        categorie: lid.categorie,
        kleur: lid.kleur,
        a_categorie: lid.a_categorie,
        a_jaars: lid.a_jaars,
        leeftijd: lid.leeftijd_peildatum
      }
    });

    // Retentie-risico
    const retentie = berekenRetentie(lid, retentieData, seizoenenActief);

    // Teamgenoten
    const teamgenoten = berekenTeamgenotenHistorie(id, spelerspaden, spelerPadLookup);

    const achternaam = lid.tussenvoegsel
      ? `${lid.tussenvoegsel} ${lid.achternaam}`
      : lid.achternaam;

    return {
      id,
      roepnaam: lid.roepnaam,
      achternaam,
      geslacht: lid.geslacht,
      geboortejaar: lid.geboortejaar,
      lid_sinds: lid.lid_sinds,
      huidig: {
        team: lid.team,
        ow_code: lid.ow_code || owCodeLookup.get(lid.team) || null,
        categorie: lid.categorie,
        kleur: lid.kleur,
        a_categorie: lid.a_categorie,
        a_jaars: lid.a_jaars,
        leeftijd: lid.leeftijd_peildatum
      },
      volgend_seizoen: volgendSeizoen,
      spelerspad: relevantPad,
      retentie,
      teamgenoten_historie: teamgenoten,
      seizoenen_actief: seizoenenActief,
      instroom_leeftijd: instroomLeeftijd
    };
  });

  console.log(`   ${spelers.length} spelers verwerkt`);

  // --- Retentiemodel voor export ---
  const retentieExport = {
    bron: 'jeugdmodel v2.0 (16 seizoenen, 2010-2026)',
    per_leeftijd: Object.entries(retentieData.per_leeftijd || {}).map(([l, r]) => ({
      leeftijd: parseInt(l),
      retentie: r,
      retentie_m: retentieData.per_leeftijd_M?.[parseInt(l)] || null,
      retentie_v: retentieData.per_leeftijd_V?.[parseInt(l)] || null
    })),
    risico_drempels: { laag: 0.90, gemiddeld: 0.85, hoog: 0.80 }
  };

  // --- Alles samenstellen ---
  const exportData = {
    meta: {
      export_datum: new Date().toISOString().split('T')[0],
      export_versie: '1.0',
      bron: 'verenigingsmonitor',
      seizoen_huidig: huidigSeizoen,
      seizoen_nieuw: nieuwSeizoen,
      snapshot_datum: snapshotDatum,
      snapshot_bron: `data/leden/snapshots/${snapshotBestand}`,
      spelerspaden_bron: 'data/spelers/spelerspaden.json',
      staf_bron: `data/leden/snapshots/raw/${snapshotDatum}-sportlink-teams.csv`,
      totaal_actieve_spelers: spelers.length,
      totaal_jeugd: spelers.filter(s => s.huidig.leeftijd && s.huidig.leeftijd < 19).length,
      totaal_senioren: spelers.filter(s => !s.huidig.leeftijd || s.huidig.leeftijd >= 19).length,
      totaal_staf: stafLijst.length
    },
    spelers,
    staf: stafLijst,
    teams_huidig: bouwTeamsHuidig(snapshot, perTeamAgg, teamsKNKV, stafLijst),
    verloop: bouwVerloop(verloopData),
    retentiemodel: retentieExport,
    streefmodel: bouwStreefmodel(streefData),
    signalering: bouwSignalering(alertsData),
    instroom_profiel: yamlTekst ? bouwInstroomProfiel(yamlTekst) : null
  };

  // --- Schrijf output ---
  const outputDir = path.join(ROOT, 'data', 'export');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPad = path.join(outputDir, `export-${nieuwSeizoen}.json`);
  fs.writeFileSync(outputPad, JSON.stringify(exportData, null, 2), 'utf-8');

  console.log(`\n=== Export voltooid ===`);
  console.log(`Output: ${outputPad}`);
  console.log(`\nSamenvatting:`);
  console.log(`  Spelers:      ${exportData.meta.totaal_actieve_spelers}`);
  console.log(`  Jeugd:        ${exportData.meta.totaal_jeugd}`);
  console.log(`  Senioren:     ${exportData.meta.totaal_senioren}`);
  console.log(`  Staf:         ${exportData.meta.totaal_staf}`);
  console.log(`  Teams:        ${exportData.teams_huidig.length}`);
  console.log(`  Signalering:  ${exportData.signalering.length} alerts`);
  console.log(`  Verloop:      ${exportData.verloop?.samenvatting ? 'OK' : 'ontbreekt'}`);
}

main();
