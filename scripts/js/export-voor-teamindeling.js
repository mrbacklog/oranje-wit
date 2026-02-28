#!/usr/bin/env node
/**
 * Export-script: genereert één JSON-bestand met alle data die de
 * Team-Indeling tool nodig heeft voor een nieuw seizoen.
 *
 * Bron: PostgreSQL database (speler_seizoenen, competitie_spelers, leden, etc.)
 *
 * Gebruik:
 *   DATABASE_URL=... node scripts/js/export-voor-teamindeling.js [seizoen]
 *   DATABASE_URL=... node scripts/js/export-voor-teamindeling.js 2026-2027
 *
 * Output:
 *   data/export/export-YYYY-YYYY.json
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// --- Configuratie ---
const ROOT = path.resolve(__dirname, '..', '..');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const seizoenArg = process.argv[2]; // optioneel: "2026-2027"

// Bepaal seizoenen
const huidigSeizoen = '2025-2026';
const nieuwSeizoen = seizoenArg || '2026-2027';
const seizoenJaar = parseInt(nieuwSeizoen.split('-')[0]); // 2026

// Laatste 5 seizoenen voor spelerspad-historie
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

function parseYAML(relatief) {
  const volledig = path.join(ROOT, relatief);
  if (!fs.existsSync(volledig)) return null;
  return fs.readFileSync(volledig, 'utf-8');
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
  const result = new Map();

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

  const geslachtKey = geslacht === 'M' ? 'per_leeftijd_M' : 'per_leeftijd_V';
  let kansBehoud = retentieData[geslachtKey]?.[leeftijd]
    || retentieData.per_leeftijd?.[leeftijd]
    || 0.90;

  const factoren = [];

  if (leeftijd === 17) factoren.push('leeftijd_17_cliff');
  if (leeftijd === 6 || leeftijd === 7) factoren.push('instap_fragiel');
  if (leeftijd === 12) factoren.push('transitiejaar_b_naar_a');

  if (seizoenenActief >= 6) factoren.push(`${seizoenenActief}e_seizoen_hoge_binding`);
  if (seizoenenActief <= 1) factoren.push('nieuw_lid_laag_gebonden');

  let risico;
  if (kansBehoud >= 0.90) risico = 'laag';
  else if (kansBehoud >= 0.85) risico = 'gemiddeld';
  else risico = 'hoog';

  return { risico, kans_behoud: kansBehoud, factoren };
}

// --- Signalering ---

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

async function main() {
  console.log('=== Export voor Team-Indeling ===');
  console.log(`Huidig seizoen: ${huidigSeizoen}`);
  console.log(`Nieuw seizoen:  ${nieuwSeizoen}\n`);

  // 1. Actieve spelers laden uit database (speler_seizoenen + leden)
  console.log('1. Actieve spelers laden uit database...');
  const { rows: actieveSpelers } = await pool.query(`
    SELECT l.rel_code, l.roepnaam, l.achternaam, l.tussenvoegsel, l.geslacht,
           l.geboortejaar, l.lid_sinds,
           cp.team, cp.bron
    FROM competitie_spelers cp
    JOIN leden l ON cp.rel_code = l.rel_code
    WHERE cp.seizoen = $1
    ORDER BY l.achternaam, l.roepnaam
  `, [huidigSeizoen]);
  console.log(`   ${actieveSpelers.length} spelers gevonden`);

  // 2. Spelerspaden laden uit database (speler_seizoenen + competitie_spelers)
  console.log('2. Spelerspaden laden uit database...');
  const { rows: padData } = await pool.query(`
    SELECT rel_code, seizoen, team, competitie, team as comp_team
    FROM competitie_spelers
    WHERE seizoen = ANY($1)
    ORDER BY rel_code, seizoen,
      CASE competitie
        WHEN 'veld_najaar' THEN 1 WHEN 'zaal' THEN 2 WHEN 'veld_voorjaar' THEN 3
      END
  `, [RELEVANTE_SEIZOENEN]);

  // Groepeer per speler
  const spelerPadLookup = new Map();
  for (const row of padData) {
    if (!spelerPadLookup.has(row.rel_code)) {
      spelerPadLookup.set(row.rel_code, {});
    }
    const pad = spelerPadLookup.get(row.rel_code);
    if (!pad[row.seizoen]) {
      pad[row.seizoen] = { team: row.team, competities: [] };
    }
    if (row.competitie) {
      pad[row.seizoen].competities.push({
        competitie: row.competitie,
        team: row.comp_team
      });
    }
  }

  // Tel seizoenen actief (alle seizoenen, niet alleen relevante)
  const { rows: seizoenTellingen } = await pool.query(`
    SELECT rel_code, COUNT(DISTINCT seizoen)::int as seizoenen
    FROM competitie_spelers
    GROUP BY rel_code
  `);
  const seizoenenActiefLookup = new Map();
  for (const row of seizoenTellingen) {
    seizoenenActiefLookup.set(row.rel_code, row.seizoenen);
  }

  // 3. Retentiemodel (YAML)
  console.log('3. Retentiemodel laden (jeugdmodel.yaml)...');
  const yamlTekst = parseYAML('model/jeugdmodel.yaml');
  const retentieData = yamlTekst ? extractRetentieUitYAML(yamlTekst) : {};

  // 4. Streefmodel
  console.log('4. Streefmodel laden...');
  const streefData = leesJSON('data/modellen/streef-ledenboog.json');

  // 5. Signalering uit database
  console.log('5. Signalering laden uit database...');
  const { rows: signaleringen } = await pool.query(`
    SELECT type, ernst, leeftijdsgroep, geslacht, waarde, drempel, streef, beschrijving
    FROM signalering
    WHERE seizoen = $1
    ORDER BY ernst, type
  `, [huidigSeizoen]);

  // 6. Verloop uit database
  console.log('6. Verloop laden uit database...');
  const { rows: verloopData } = await pool.query(`
    SELECT rel_code, geslacht, geboortejaar, status,
           leeftijd_vorig, leeftijd_nieuw, team_vorig, team_nieuw
    FROM ledenverloop
    WHERE seizoen = $1
  `, [huidigSeizoen]);

  // 7. Teams KNKV — laad alle beschikbare seizoenen
  console.log('7. KNKV teams laden (alle beschikbare seizoenen)...');
  const teamsPerSeizoen = laadAlleTeamsKNKV();
  const teamsKNKV = teamsPerSeizoen.get(huidigSeizoen) || [];
  console.log(`   Teams-KNKV beschikbaar voor: ${[...teamsPerSeizoen.keys()].join(', ') || 'geen'}`);

  // 7b. Teams register (teams.json) — stabiele ow_codes per seizoen
  console.log('7b. Teamregister laden (teams.json)...');
  const teamsRegister = leesJSON(`data/seizoenen/${huidigSeizoen}/teams.json`);
  const owCodeLookup = new Map(); // j_nummer/teamnaam → ow_code
  const owCodeTeamLookup = new Map(); // ow_code → team object
  if (teamsRegister?.teams) {
    for (const team of teamsRegister.teams) {
      owCodeTeamLookup.set(team.ow_code, team);
      for (const periode of Object.values(team.periodes || {})) {
        if (periode?.j_nummer) owCodeLookup.set(periode.j_nummer, team.ow_code);
      }
      if (team.categorie === 'a' || !team.kleur) {
        owCodeLookup.set(team.ow_code, team.ow_code);
      }
    }
    console.log(`   Teamregister: ${teamsRegister.teams.length} teams met ow_code`);
  }

  // 8. Teamgenoten-historie berekenen uit database
  console.log('8. Teamgenoten-historie berekenen...');
  const { rows: teamgenotenData } = await pool.query(`
    SELECT a.rel_code as speler, b.rel_code as genoot,
           COUNT(DISTINCT a.seizoen)::int as seizoenen_samen
    FROM speler_seizoenen a
    JOIN speler_seizoenen b ON a.seizoen = b.seizoen AND a.team = b.team AND a.rel_code != b.rel_code
    WHERE a.seizoen = ANY($1)
    GROUP BY a.rel_code, b.rel_code
    HAVING COUNT(DISTINCT a.seizoen) >= 2
    ORDER BY a.rel_code, COUNT(DISTINCT a.seizoen) DESC
  `, [RELEVANTE_SEIZOENEN]);

  // Groepeer per speler, neem top 3
  const teamgenotenLookup = new Map();
  for (const row of teamgenotenData) {
    if (!teamgenotenLookup.has(row.speler)) {
      teamgenotenLookup.set(row.speler, []);
    }
    const lijst = teamgenotenLookup.get(row.speler);
    if (lijst.length < 3) {
      lijst.push({ speler_id: row.genoot, seizoenen_samen: row.seizoenen_samen });
    }
  }

  // Naam-lookup voor teamgenoten
  const alleGenootIds = new Set();
  for (const lijst of teamgenotenLookup.values()) {
    for (const g of lijst) alleGenootIds.add(g.speler_id);
  }
  const naamLookup = new Map();
  if (alleGenootIds.size > 0) {
    const { rows: naamRows } = await pool.query(
      `SELECT rel_code, roepnaam FROM leden WHERE rel_code = ANY($1)`,
      [Array.from(alleGenootIds)]
    );
    for (const r of naamRows) naamLookup.set(r.rel_code, r.roepnaam);
  }

  // --- Spelers verwerken ---
  console.log('\n9. Spelers verwerken...');
  const huidigSeizoenJaar = parseInt(huidigSeizoen.split('-')[0]);

  const spelers = actieveSpelers.map(lid => {
    const id = lid.rel_code;
    const padPerSeizoen = spelerPadLookup.get(id) || {};

    // Spelerspad filteren op relevante seizoenen + verrijken met team-info
    const relevantPad = [];
    for (const seizoen of RELEVANTE_SEIZOENEN) {
      if (padPerSeizoen[seizoen]) {
        const teamNaam = padPerSeizoen[seizoen].team;
        const teamInfo = zoekTeamInfo(teamsPerSeizoen, seizoen, teamNaam);
        relevantPad.push({
          seizoen,
          team: teamNaam,
          kleur: teamInfo.kleur,
          niveau: teamInfo.niveau,
          spelvorm: teamInfo.spelvorm
        });
      }
    }

    const seizoenenActief = seizoenenActiefLookup.get(id) || 1;

    // Instroom-leeftijd berekenen
    const lidSindsJaar = lid.lid_sinds ? parseInt(String(lid.lid_sinds).split('-')[0]) : null;
    const instroomLeeftijd = lidSindsJaar ? lidSindsJaar - lid.geboortejaar : null;

    // Huidige leeftijd
    const leeftijdHuidig = huidigSeizoenJaar - lid.geboortejaar;

    // Huidige categorie bepalen
    const knkvTeam = teamsKNKV?.find(t => t.team === lid.team);
    const huidigeKleur = knkvTeam?.kleur || null;
    const huidigeCategorie = knkvTeam?.categorie || null;
    const huidigeACat = bepaalACategorieVolgendSeizoen(lid.geboortejaar);

    const huidigInfo = {
      team: lid.team,
      ow_code: owCodeLookup.get(lid.team) || null,
      categorie: huidigeCategorie,
      kleur: huidigeKleur,
      a_categorie: leeftijdHuidig >= 13 ? huidigeACat.a_categorie : null,
      a_jaars: leeftijdHuidig >= 13 ? huidigeACat.a_jaars : null,
      leeftijd: leeftijdHuidig
    };

    // Volgend seizoen
    const volgendSeizoen = bepaalVolgendSeizoen({
      geboortejaar: lid.geboortejaar,
      geslacht: lid.geslacht,
      huidig: huidigInfo
    });

    // Retentie-risico
    const retentie = berekenRetentie(lid, retentieData, seizoenenActief);

    // Teamgenoten
    const teamgenoten = (teamgenotenLookup.get(id) || []).map(g => ({
      speler_id: g.speler_id,
      naam: naamLookup.get(g.speler_id) || g.speler_id,
      seizoenen_samen: g.seizoenen_samen
    }));

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
      huidig: huidigInfo,
      volgend_seizoen: volgendSeizoen,
      spelerspad: relevantPad,
      retentie,
      teamgenoten_historie: teamgenoten,
      seizoenen_actief: seizoenenActief,
      instroom_leeftijd: instroomLeeftijd
    };
  });

  console.log(`   ${spelers.length} spelers verwerkt`);

  // --- Teams huidig ---
  console.log('10. Teams huidig opbouwen...');

  // Bouw speler_ids per team uit actieveSpelers
  const spelerPerTeam = new Map();
  for (const s of actieveSpelers) {
    if (!s.team) continue;
    if (!spelerPerTeam.has(s.team)) spelerPerTeam.set(s.team, []);
    spelerPerTeam.get(s.team).push(s.rel_code);
  }

  // Team-stats uit database
  const { rows: teamStats } = await pool.query(`
    SELECT ss.team,
           COUNT(*)::int as totaal,
           COUNT(*) FILTER (WHERE l.geslacht = 'M')::int as spelers_m,
           COUNT(*) FILTER (WHERE l.geslacht = 'V')::int as spelers_v,
           ROUND(AVG($2 - l.geboortejaar)::numeric, 1) as gem_leeftijd
    FROM speler_seizoenen ss
    JOIN leden l ON ss.rel_code = l.rel_code
    WHERE ss.seizoen = $1
    GROUP BY ss.team
    ORDER BY ss.team
  `, [huidigSeizoen, huidigSeizoenJaar]);

  const teamsHuidig = teamStats.map(team => {
    const knkvTeam = teamsKNKV?.find(t => t.team === team.team);
    const owCode = owCodeLookup.get(team.team) || team.team;
    return {
      team: team.team,
      ow_code: owCode,
      categorie: knkvTeam?.categorie || null,
      kleur: knkvTeam?.kleur || null,
      niveau: knkvTeam?.niveau || null,
      spelvorm: knkvTeam?.spelvorm || (knkvTeam?.kleur && ['Blauw', 'Groen'].includes(knkvTeam.kleur) ? '4-tal' : '8-tal'),
      pool_veld: knkvTeam?.pool_veld || null,
      pool_zaal: knkvTeam?.pool_zaal || null,
      speler_ids: spelerPerTeam.get(team.team) || [],
      staf_ids: [],
      stats: {
        totaal: team.totaal,
        m: team.spelers_m,
        v: team.spelers_v,
        gem_leeftijd: parseFloat(team.gem_leeftijd) || null
      }
    };
  });

  // --- Verloop opbouwen ---
  const groepeer = (status) => verloopData
    .filter(v => v.status === status)
    .map(v => ({
      id: v.rel_code,
      geslacht: v.geslacht,
      geboortejaar: v.geboortejaar,
      leeftijd: v.leeftijd_nieuw || v.leeftijd_vorig,
      team_vorig: v.team_vorig,
      team_nieuw: v.team_nieuw
    }));

  const verloopSamenvatting = {};
  for (const status of ['behouden', 'uitgestroomd', 'nieuw', 'herinschrijver']) {
    verloopSamenvatting[status] = verloopData.filter(v => v.status === status).length;
  }

  const verloop = {
    seizoen: huidigSeizoen,
    samenvatting: verloopSamenvatting,
    nieuw: groepeer('nieuw'),
    herinschrijvers: groepeer('herinschrijver'),
    uitgestroomd: groepeer('uitgestroomd')
  };

  // --- Signalering opbouwen ---
  const signaleringExport = signaleringen.map(alert => ({
    type: alert.type,
    ernst: alert.ernst,
    band: extractBandUitLeeftijdsgroep(alert.leeftijdsgroep),
    geboortejaar: extractGeboortejaarUitLeeftijdsgroep(alert.leeftijdsgroep),
    beschrijving: alert.beschrijving,
    impact_teamindeling: genereerImpactBeschrijving(alert)
  }));

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
      export_versie: '2.0',
      bron: 'database (speler_seizoenen + competitie_spelers + leden)',
      seizoen_huidig: huidigSeizoen,
      seizoen_nieuw: nieuwSeizoen,
      totaal_actieve_spelers: spelers.length,
      totaal_jeugd: spelers.filter(s => s.huidig.leeftijd && s.huidig.leeftijd < 19).length,
      totaal_senioren: spelers.filter(s => !s.huidig.leeftijd || s.huidig.leeftijd >= 19).length
    },
    spelers,
    staf: [],
    teams_huidig: teamsHuidig,
    verloop,
    retentiemodel: retentieExport,
    streefmodel: bouwStreefmodel(streefData),
    signalering: signaleringExport,
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
  console.log(`  Teams:        ${exportData.teams_huidig.length}`);
  console.log(`  Signalering:  ${exportData.signalering.length} alerts`);
  console.log(`  Verloop:      ${Object.keys(exportData.verloop.samenvatting).length ? 'OK' : 'ontbreekt'}`);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
  process.exit(1);
});
