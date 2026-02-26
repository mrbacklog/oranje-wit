const fs = require('fs');
const path = require('path');
const { pool } = require('../db.js');

const ROOT = process.env.OW_ROOT || path.resolve(__dirname, '..', '..');

function readJSON(relPath) {
  const full = path.resolve(ROOT, relPath);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

// --- Seizoenen vullen ---
async function syncSeizoenen() {
  const seizoenen = [];
  for (let y = 2010; y <= 2026; y++) {
    seizoenen.push({ seizoen: `${y}-${y + 1}`, start_jaar: y, eind_jaar: y + 1 });
  }
  for (const s of seizoenen) {
    await pool.query(
      `INSERT INTO seizoenen (seizoen, start_jaar, eind_jaar) VALUES ($1, $2, $3) ON CONFLICT (seizoen) DO NOTHING`,
      [s.seizoen, s.start_jaar, s.eind_jaar]
    );
  }
  return seizoenen.length;
}

// --- Leden importeren uit snapshot of alle-leden.json ---
async function syncLeden(snapshotPath) {
  const data = readJSON(snapshotPath);
  const leden = Array.isArray(data) ? data : data.leden || [];
  let count = 0;
  let skipped = 0;
  for (const lid of leden) {
    if (!lid.rel_code) { skipped++; continue; }
    await pool.query(
      `INSERT INTO leden (rel_code, roepnaam, achternaam, tussenvoegsel, voorletters,
         geslacht, geboortejaar, geboortedatum, lid_sinds, afmelddatum, lidsoort,
         email, registratie_datum)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (rel_code) DO UPDATE SET
         roepnaam = COALESCE(NULLIF(EXCLUDED.roepnaam, ''), leden.roepnaam),
         achternaam = COALESCE(NULLIF(EXCLUDED.achternaam, ''), leden.achternaam),
         tussenvoegsel = COALESCE(EXCLUDED.tussenvoegsel, leden.tussenvoegsel),
         voorletters = COALESCE(EXCLUDED.voorletters, leden.voorletters),
         geslacht = COALESCE(EXCLUDED.geslacht, leden.geslacht),
         geboortejaar = COALESCE(EXCLUDED.geboortejaar, leden.geboortejaar),
         geboortedatum = COALESCE(EXCLUDED.geboortedatum, leden.geboortedatum),
         lid_sinds = COALESCE(EXCLUDED.lid_sinds, leden.lid_sinds),
         afmelddatum = COALESCE(EXCLUDED.afmelddatum, leden.afmelddatum),
         lidsoort = COALESCE(EXCLUDED.lidsoort, leden.lidsoort),
         email = COALESCE(EXCLUDED.email, leden.email),
         registratie_datum = COALESCE(EXCLUDED.registratie_datum, leden.registratie_datum),
         updated_at = now()`,
      [lid.rel_code, lid.roepnaam || '', lid.achternaam || '', lid.tussenvoegsel || null,
       lid.voorletters || null, lid.geslacht || null, lid.geboortejaar || null,
       lid.geboortedatum || null, lid.lid_sinds || null, lid.afmelddatum || null,
       lid.lidsoort || null, lid.email || null, lid.registratie_datum || null]
    );
    count++;
  }
  return count;
}

// --- Snapshot importeren ---
async function syncSnapshot(snapshotPath) {
  const data = readJSON(snapshotPath);
  const leden = Array.isArray(data) ? data : data.leden || [];
  if (leden.length === 0) return { error: 'Geen leden in snapshot' };

  // Bepaal datum en seizoen uit metadata
  const filename = path.basename(snapshotPath, '.json');
  const datum = filename;
  const meta = data._meta || {};
  const seizoen = meta.seizoen || leden[0]?.seizoen || data.seizoen;
  if (!seizoen) return { error: 'Geen seizoen gevonden in snapshot' };

  // Zorg dat seizoen bestaat
  const [startJaar] = seizoen.split('-').map(Number);
  await pool.query(
    `INSERT INTO seizoenen (seizoen, start_jaar, eind_jaar) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    [seizoen, startJaar, startJaar + 1]
  );

  // Importeer leden (upsert naar leden-tabel)
  await syncLeden(snapshotPath);

  // Snapshot metadata
  const bronnen = meta.bronnen || data.bronnen || [];
  const snapshotRes = await pool.query(
    `INSERT INTO snapshots (snapshot_datum, seizoen, totaal_leden, totaal_spelers, bronnen)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (snapshot_datum) DO UPDATE SET
       totaal_leden = EXCLUDED.totaal_leden, totaal_spelers = EXCLUDED.totaal_spelers
     RETURNING id`,
    [datum, seizoen, leden.length, leden.filter(l => l.spelactiviteit === 'korfbal').length, bronnen]
  );
  const snapshotId = snapshotRes.rows[0].id;

  // Verwijder bestaande snapshot data
  await pool.query(`DELETE FROM leden_snapshot WHERE snapshot_id = $1`, [snapshotId]);

  // Lid-status per snapshot (alleen leden die in de leden-tabel zitten)
  let inserted = 0;
  for (const lid of leden) {
    if (!lid.rel_code) continue;
    await pool.query(
      `INSERT INTO leden_snapshot (snapshot_id, rel_code, lidsoort, spelactiviteit, status, team, ow_code,
        teamrol, categorie, kleur, a_categorie, a_jaars, leeftijd_peildatum, pool_veld, pool_zaal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [snapshotId, lid.rel_code, lid.lidsoort, lid.spelactiviteit, lid.status || 'actief',
       lid.team, lid.ow_code || null, lid.teamrol || null,
       lid.categorie || null, lid.kleur || null, lid.a_categorie || null, lid.a_jaars || null,
       lid.leeftijd_peildatum || null, lid.pool_veld || null, lid.pool_zaal || null]
    );
    inserted++;
  }

  return { snapshot_id: snapshotId, datum, seizoen, leden: inserted };
}

// --- Teams importeren ---
async function syncTeams(seizoen) {
  const teamsPath = `data/seizoenen/${seizoen}/teams.json`;
  let data;
  try { data = readJSON(teamsPath); } catch { return { error: `Bestand niet gevonden: ${teamsPath}` }; }

  const teams = data.teams || data;
  let count = 0;

  for (const t of teams) {
    const teamRes = await pool.query(
      `INSERT INTO teams (seizoen, ow_code, categorie, kleur, leeftijdsgroep, spelvorm)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (seizoen, ow_code) DO UPDATE SET
         kleur = EXCLUDED.kleur, leeftijdsgroep = EXCLUDED.leeftijdsgroep, spelvorm = EXCLUDED.spelvorm
       RETURNING id`,
      [seizoen, t.ow_code, t.categorie, t.kleur || null, t.leeftijdsgroep || null, t.spelvorm || null]
    );
    const teamId = teamRes.rows[0].id;

    if (t.periodes) {
      for (const [periode, pdata] of Object.entries(t.periodes)) {
        if (!pdata) continue;
        await pool.query(
          `INSERT INTO team_periodes (team_id, periode, j_nummer, pool, sterkte, gem_leeftijd, aantal_spelers)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (team_id, periode) DO UPDATE SET
             j_nummer = EXCLUDED.j_nummer, pool = EXCLUDED.pool, sterkte = EXCLUDED.sterkte,
             gem_leeftijd = EXCLUDED.gem_leeftijd, aantal_spelers = EXCLUDED.aantal_spelers`,
          [teamId, periode, pdata.j_nummer || null, pdata.pool || null,
           pdata.sterkte || null, pdata.gem_leeftijd || null, pdata.aantal_spelers || null]
        );
      }
    }
    count++;
  }
  return { seizoen, teams: count };
}

// --- Spelerspaden importeren ---
// Structuur: array van { speler_id, seizoenen: { "2011-2012": { team, categorie, rol }, ... } }
async function syncSpelerspaden() {
  const data = readJSON('data/spelers/spelerspaden.json');
  const paden = Array.isArray(data) ? data : data.spelers || [];
  let count = 0;

  for (const speler of paden) {
    const spelerId = speler.speler_id || speler.rel_code;
    if (!spelerId) continue;
    const seizoenen = speler.seizoenen || {};
    // seizoenen is een object { "2011-2012": { team, categorie, rol } }
    for (const [seizoen, sdata] of Object.entries(seizoenen)) {
      if (!seizoen || typeof sdata !== 'object') continue;
      await pool.query(
        `INSERT INTO spelerspaden (speler_id, seizoen, team, ow_code, categorie, rol)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (speler_id, seizoen) DO UPDATE SET
           team = EXCLUDED.team, ow_code = EXCLUDED.ow_code, categorie = EXCLUDED.categorie`,
        [spelerId, seizoen, sdata.team || null, sdata.ow_code || null,
         sdata.categorie || null, sdata.rol || 'speler']
      );
      count++;
    }
  }
  return { rijen: count };
}

// --- Ledenverloop importeren ---
// Structuur: { _meta: { seizoen }, verloop: [{ rel_code, status, ... }] }
async function syncVerloop() {
  const dir = path.resolve(ROOT, 'data/ledenverloop/individueel');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('-verloop.json')).sort();
  let totalCount = 0;

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const meta = data._meta || {};
    const records = data.verloop || data.records || data.leden || (Array.isArray(data) ? data : []);
    const seizoen = meta.seizoen || data.seizoen || file.replace('-verloop.json', '');

    for (const r of records) {
      if (!r.rel_code) continue;
      await pool.query(
        `INSERT INTO ledenverloop (seizoen, rel_code, status, geboortejaar, geslacht,
          leeftijd_vorig, leeftijd_nieuw, team_vorig, team_nieuw)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (seizoen, rel_code) DO UPDATE SET
           status = EXCLUDED.status, team_vorig = EXCLUDED.team_vorig, team_nieuw = EXCLUDED.team_nieuw`,
        [seizoen, r.rel_code, r.status, r.geboortejaar || null, r.geslacht || null,
         r.leeftijd_vorig || null, r.leeftijd_nieuw || null, r.team_vorig || null, r.team_nieuw || null]
      );
      totalCount++;
    }
  }
  return { bestanden: files.length, rijen: totalCount };
}

// --- Cohorten importeren ---
// Structuur: { per_cohort: [{ geboortejaar, geslacht, seizoenen: { "2024-2025": { leeftijd, band, actief, ... } } }] }
async function syncCohorten() {
  const data = readJSON('data/ledenverloop/cohorten/totaal-cohorten.json');
  const cohorten = data.per_cohort || data.cohorten || (Array.isArray(data) ? data : []);
  let count = 0;

  for (const c of cohorten) {
    if (!c.geboortejaar || !c.geslacht) continue;
    const seizoenen = c.seizoenen || {};
    for (const [seizoen, sdata] of Object.entries(seizoenen)) {
      if (!seizoen || typeof sdata !== 'object') continue;
      await pool.query(
        `INSERT INTO cohort_seizoenen (geboortejaar, geslacht, seizoen, leeftijd, band,
          actief, behouden, nieuw, herinschrijver, uitgestroomd, retentie_pct)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (geboortejaar, geslacht, seizoen) DO UPDATE SET
           actief = EXCLUDED.actief, behouden = EXCLUDED.behouden, nieuw = EXCLUDED.nieuw,
           herinschrijver = EXCLUDED.herinschrijver, uitgestroomd = EXCLUDED.uitgestroomd,
           retentie_pct = EXCLUDED.retentie_pct`,
        [c.geboortejaar, c.geslacht, seizoen, sdata.leeftijd || null, sdata.band || null,
         sdata.actief || 0, sdata.behouden || 0, sdata.nieuw || 0, sdata.herinschrijver || 0,
         sdata.uitgestroomd || 0, sdata.retentie_pct || null]
      );
      count++;
    }
  }
  return { rijen: count };
}

// --- Signalering importeren ---
async function syncSignalering(seizoen) {
  const filePath = `data/ledenverloop/signalering/${seizoen}-alerts.json`;
  let data;
  try { data = readJSON(filePath); } catch { return { error: `Bestand niet gevonden: ${filePath}` }; }

  const alerts = Array.isArray(data) ? data : data.alerts || [];
  await pool.query(`DELETE FROM signalering WHERE seizoen = $1`, [seizoen]);

  for (const a of alerts) {
    await pool.query(
      `INSERT INTO signalering (seizoen, type, ernst, leeftijdsgroep, geslacht, waarde, drempel, streef, beschrijving)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [seizoen, a.type || 'onbekend', a.ernst || 'aandacht', a.leeftijdsgroep || null,
       a.geslacht || null, a.waarde || null, a.drempel || null, a.streef || null, a.beschrijving || null]
    );
  }
  return { seizoen, alerts: alerts.length };
}

// --- Alles syncen ---
async function syncAlles() {
  const results = {};

  results.seizoenen = await syncSeizoenen();

  // Sync master ledenregister (alle-leden.json) als dat bestaat
  const allLedenPath = 'data/leden/alle-leden.json';
  try {
    const allLedenFull = path.resolve(ROOT, allLedenPath);
    if (fs.existsSync(allLedenFull)) {
      results.leden_master = await syncLeden(allLedenPath);
    }
  } catch (err) { results.leden_master = { error: err.message }; }

  const snapshotDir = path.resolve(ROOT, 'data/leden/snapshots');
  const snapshotFiles = fs.readdirSync(snapshotDir)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
    .sort();

  results.snapshots = [];
  for (const file of snapshotFiles) {
    try {
      const r = await syncSnapshot(`data/leden/snapshots/${file}`);
      results.snapshots.push(r);
    } catch (err) {
      results.snapshots.push({ error: file, message: err.message });
    }
  }

  try { results.teams = await syncTeams('2025-2026'); } catch (err) { results.teams = { error: err.message }; }
  try { results.spelerspaden = await syncSpelerspaden(); } catch (err) { results.spelerspaden = { error: err.message }; }
  try { results.verloop = await syncVerloop(); } catch (err) { results.verloop = { error: err.message }; }
  try { results.cohorten = await syncCohorten(); } catch (err) { results.cohorten = { error: err.message }; }
  try { results.signalering = await syncSignalering('2025-2026'); } catch (err) { results.signalering = { error: err.message }; }

  return results;
}

module.exports = {
  syncSeizoenen, syncLeden, syncSnapshot, syncTeams,
  syncSpelerspaden, syncVerloop, syncCohorten, syncSignalering, syncAlles,
};
