const { Router } = require('express');
const { pool } = require('../db');

const router = Router();

// GET /api/teams-register?seizoen=2025-2026
router.get('/teams-register', async (req, res) => {
  try {
    const seizoen = req.query.seizoen || '2025-2026';

    const { rows } = await pool.query(
      `SELECT t.id, t.ow_code, t.categorie, t.kleur, t.leeftijdsgroep, t.spelvorm,
              tp.periode, tp.j_nummer, tp.pool, tp.sterkte, tp.gem_leeftijd, tp.aantal_spelers
       FROM teams t
       LEFT JOIN team_periodes tp ON t.id = tp.team_id
       WHERE t.seizoen = $1
       ORDER BY t.ow_code, CASE tp.periode
         WHEN 'veld_najaar' THEN 1 WHEN 'zaal_deel1' THEN 2
         WHEN 'zaal_deel2' THEN 3 WHEN 'veld_voorjaar' THEN 4 ELSE 5 END`,
      [seizoen]
    );

    // Groepeer per team
    const teamsMap = new Map();
    for (const r of rows) {
      if (!teamsMap.has(r.ow_code)) {
        teamsMap.set(r.ow_code, {
          ow_code: r.ow_code,
          categorie: r.categorie,
          kleur: r.kleur,
          leeftijdsgroep: r.leeftijdsgroep,
          spelvorm: r.spelvorm,
          periodes: {},
        });
      }
      if (r.periode) {
        teamsMap.get(r.ow_code).periodes[r.periode] = {
          j_nummer: r.j_nummer,
          pool: r.pool,
          sterkte: r.sterkte,
          gem_leeftijd: r.gem_leeftijd ? Number(r.gem_leeftijd) : null,
          aantal_spelers: r.aantal_spelers,
        };
      }
    }

    // Vul ontbrekende periodes aan met null
    const periodeNamen = ['veld_najaar', 'zaal_deel1', 'zaal_deel2', 'veld_voorjaar'];
    for (const team of teamsMap.values()) {
      for (const p of periodeNamen) {
        if (!(p in team.periodes)) team.periodes[p] = null;
      }
    }

    res.json({
      _meta: { seizoen },
      teams: [...teamsMap.values()],
    });
  } catch (err) {
    console.error('teams-register error:', err.message);
    res.status(500).json({ error: 'Database fout' });
  }
});

module.exports = router;
