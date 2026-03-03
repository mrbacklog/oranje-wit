const fs = require("fs");
const path = require("path");
const { pool } = require("../db.js");

const ROOT = process.env.OW_ROOT || path.resolve(__dirname, "..", "..");

function readJSON(relPath) {
  const full = path.resolve(ROOT, relPath);
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

// --- Seizoenen vullen ---
async function syncSeizoenen() {
  const seizoenen = [];
  for (let y = 2010; y <= 2026; y++) {
    seizoenen.push({
      seizoen: `${y}-${y + 1}`,
      start_jaar: y,
      eind_jaar: y + 1,
      start_datum: `${y}-08-01`,
      eind_datum: `${y + 1}-06-30`,
      peildatum: `${y}-12-31`,
    });
  }
  for (const s of seizoenen) {
    await pool.query(
      `INSERT INTO seizoenen (seizoen, start_jaar, eind_jaar, start_datum, eind_datum, peildatum)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (seizoen) DO UPDATE SET
         start_datum = COALESCE(seizoenen.start_datum, EXCLUDED.start_datum),
         eind_datum = COALESCE(seizoenen.eind_datum, EXCLUDED.eind_datum),
         peildatum = COALESCE(seizoenen.peildatum, EXCLUDED.peildatum)`,
      [s.seizoen, s.start_jaar, s.eind_jaar, s.start_datum, s.eind_datum, s.peildatum]
    );
  }
  return seizoenen.length;
}

// --- Leden importeren uit JSON (array van lid-objecten) ---
async function syncLeden(ledenPath) {
  const data = readJSON(ledenPath);
  const leden = Array.isArray(data) ? data : data.leden || [];
  let count = 0;
  for (const lid of leden) {
    if (!lid.rel_code) continue;
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
      [
        lid.rel_code,
        lid.roepnaam || "",
        lid.achternaam || "",
        lid.tussenvoegsel || null,
        lid.voorletters || null,
        lid.geslacht || null,
        lid.geboortejaar || null,
        lid.geboortedatum || null,
        lid.lid_sinds || null,
        lid.afmelddatum || null,
        lid.lidsoort || null,
        lid.email || null,
        lid.registratie_datum || null,
      ]
    );
    count++;
  }
  return count;
}

// --- Teams importeren ---
// --- Team-aliases herbouwen (KNKV-namen → ow_code) ---
async function buildTeamAliases(seizoen) {
  const { rows: teams } = await pool.query(
    "SELECT id, ow_code, categorie, kleur, leeftijdsgroep FROM teams WHERE seizoen = $1",
    [seizoen]
  );
  const { rows: periodes } = await pool.query(
    `SELECT tp.team_id, tp.j_nummer FROM team_periodes tp
     JOIN teams t ON t.id = tp.team_id
     WHERE t.seizoen = $1 AND tp.j_nummer IS NOT NULL`,
    [seizoen]
  );

  const jPerTeam = new Map();
  for (const p of periodes) {
    if (!jPerTeam.has(p.team_id)) jPerTeam.set(p.team_id, new Set());
    jPerTeam.get(p.team_id).add(p.j_nummer);
  }

  const aliases = new Map();
  const add = (alias, id, code) => {
    if (alias && !aliases.has(alias)) aliases.set(alias, { id, code });
  };

  for (const t of teams) {
    add(t.ow_code, t.id, t.ow_code);
    for (const jNr of jPerTeam.get(t.id) || []) {
      add(jNr, t.id, t.ow_code);
      add(`OW J${jNr.substring(1)}`, t.id, t.ow_code);
    }
    if (/^\d+$/.test(t.ow_code)) add(`S${t.ow_code}`, t.id, t.ow_code);
  }

  // Selectie-aliases → selectie-teams
  const senSel = teams.find((t) => t.ow_code === "S-selectie");
  if (senSel) {
    add("S1/S2", senSel.id, senSel.ow_code);
    add("S1S2", senSel.id, senSel.ow_code);
  }
  for (const pfx of ["U15", "U17", "U19"]) {
    const sel = teams.find((t) => t.ow_code === `${pfx}-selectie`);
    if (sel) add(pfx, sel.id, sel.ow_code);
  }
  const kang = teams.find((t) => t.ow_code === "Kangoeroes" || t.ow_code === "K");
  if (kang) {
    add("Kangoeroes", kang.id, kang.ow_code);
    add("K", kang.id, kang.ow_code);
  }

  await pool.query("DELETE FROM team_aliases WHERE seizoen = $1", [seizoen]);
  if (aliases.size > 0) {
    const vals = [];
    const params = [];
    let i = 1;
    for (const [alias, { id, code }] of aliases) {
      vals.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3})`);
      params.push(seizoen, alias, id, code);
      i += 4;
    }
    await pool.query(
      `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code) VALUES ${vals.join(", ")}`,
      params
    );
  }
  return aliases.size;
}

async function syncTeams(seizoen) {
  const teamsPath = `data/seizoenen/${seizoen}/teams.json`;
  let data;
  try {
    data = readJSON(teamsPath);
  } catch {
    return { error: `Bestand niet gevonden: ${teamsPath}` };
  }

  const teams = data.teams || data;
  let count = 0;

  for (const t of teams) {
    const teamRes = await pool.query(
      `INSERT INTO teams (seizoen, ow_code, naam, categorie, kleur, leeftijdsgroep, spelvorm)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (seizoen, ow_code) DO UPDATE SET
         naam = COALESCE(EXCLUDED.naam, teams.naam),
         kleur = EXCLUDED.kleur, leeftijdsgroep = EXCLUDED.leeftijdsgroep, spelvorm = EXCLUDED.spelvorm
       RETURNING id`,
      [
        seizoen,
        t.ow_code,
        t.naam || null,
        t.categorie,
        t.kleur || null,
        t.leeftijdsgroep || null,
        t.spelvorm || null,
      ]
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
          [
            teamId,
            periode,
            pdata.j_nummer || null,
            pdata.pool || null,
            pdata.sterkte || null,
            pdata.gem_leeftijd || null,
            pdata.aantal_spelers || null,
          ]
        );
      }
    }
    count++;
  }

  // Herbouw team_aliases na sync
  await buildTeamAliases(seizoen);

  return { seizoen, teams: count };
}

// --- Alles syncen ---
async function syncAlles() {
  const results = {};

  results.seizoenen = await syncSeizoenen();

  // Sync master ledenregister als dat bestaat
  const allLedenPath = "data/leden/alle-leden.json";
  try {
    const allLedenFull = path.resolve(ROOT, allLedenPath);
    if (fs.existsSync(allLedenFull)) {
      results.leden_master = await syncLeden(allLedenPath);
    }
  } catch (err) {
    results.leden_master = { error: err.message };
  }

  try {
    results.teams = await syncTeams("2025-2026");
  } catch (err) {
    results.teams = { error: err.message };
  }

  return results;
}

module.exports = {
  syncSeizoenen,
  syncLeden,
  syncTeams,
  buildTeamAliases,
  syncAlles,
};
