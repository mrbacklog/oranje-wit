const { Router } = require('express');
const { pool } = require('../db');

const router = Router();

// Helper: vind de meest recente snapshot voor een seizoen
async function latestSnapshot(seizoen) {
  const { rows } = await pool.query(
    `SELECT id, snapshot_datum FROM snapshots
     WHERE seizoen = $1 ORDER BY snapshot_datum DESC LIMIT 1`,
    [seizoen]
  );
  return rows[0] || null;
}

// GET /api/per-geboortejaar?seizoen=2025-2026
router.get('/per-geboortejaar', async (req, res) => {
  try {
    const seizoen = req.query.seizoen || '2025-2026';
    const snap = await latestSnapshot(seizoen);
    if (!snap) return res.json({ _meta: { seizoen }, data: [] });

    const { rows } = await pool.query(
      `SELECT l.geboortejaar, l.geslacht, COUNT(*) as aantal,
              ls.a_categorie, ls.a_jaars
       FROM leden_snapshot ls
       JOIN leden l ON ls.rel_code = l.rel_code
       WHERE ls.snapshot_id = $1
         AND ls.spelactiviteit IS NOT NULL
       GROUP BY l.geboortejaar, l.geslacht, ls.a_categorie, ls.a_jaars
       ORDER BY l.geboortejaar, l.geslacht`,
      [snap.id]
    );

    res.json({
      _meta: { datum: snap.snapshot_datum, seizoen },
      data: rows.map(r => ({
        geboortejaar: r.geboortejaar,
        geslacht: r.geslacht,
        aantal: parseInt(r.aantal),
        a_categorie: r.a_categorie || null,
        a_jaars: r.a_jaars || null,
        streef: null,
        vulgraad: null,
        signalering: null,
      })),
    });
  } catch (err) {
    console.error('per-geboortejaar error:', err.message);
    res.status(500).json({ error: 'Database fout' });
  }
});

// GET /api/per-kleur?seizoen=2025-2026
router.get('/per-kleur', async (req, res) => {
  try {
    const seizoen = req.query.seizoen || '2025-2026';
    const snap = await latestSnapshot(seizoen);
    if (!snap) return res.json({ _meta: { seizoen }, data: [] });

    const { rows } = await pool.query(
      `SELECT
         COALESCE(ls.kleur, t.kleur, 'Onbekend') as kleur,
         ls.categorie,
         COUNT(DISTINCT ls.ow_code) as teams,
         COUNT(*) FILTER (WHERE l.geslacht = 'M') as spelers_m,
         COUNT(*) FILTER (WHERE l.geslacht = 'V') as spelers_v,
         COUNT(*) as totaal
       FROM leden_snapshot ls
       JOIN leden l ON ls.rel_code = l.rel_code
       LEFT JOIN teams t ON ls.ow_code = t.ow_code AND t.seizoen = $2
       WHERE ls.snapshot_id = $1
         AND ls.spelactiviteit IS NOT NULL
       GROUP BY COALESCE(ls.kleur, t.kleur, 'Onbekend'), ls.categorie
       ORDER BY ls.categorie, kleur`,
      [snap.id, seizoen]
    );

    res.json({
      _meta: { datum: snap.snapshot_datum, seizoen },
      data: rows.map(r => ({
        kleur: r.kleur,
        categorie: r.categorie,
        teams: parseInt(r.teams),
        spelers_M: parseInt(r.spelers_m),
        spelers_V: parseInt(r.spelers_v),
        totaal: parseInt(r.totaal),
      })),
    });
  } catch (err) {
    console.error('per-kleur error:', err.message);
    res.status(500).json({ error: 'Database fout' });
  }
});

// GET /api/per-team?seizoen=2025-2026
router.get('/per-team', async (req, res) => {
  try {
    const seizoen = req.query.seizoen || '2025-2026';
    const snap = await latestSnapshot(seizoen);
    if (!snap) return res.json({ _meta: { seizoen }, data: [] });

    const { rows } = await pool.query(
      `SELECT
         ls.ow_code as team,
         ls.categorie,
         COALESCE(ls.kleur, t.kleur) as kleur,
         t.leeftijdsgroep as niveau,
         COUNT(*) FILTER (WHERE l.geslacht = 'M') as spelers_m,
         COUNT(*) FILTER (WHERE l.geslacht = 'V') as spelers_v,
         COUNT(*) as totaal,
         ROUND(AVG(ls.leeftijd_peildatum)::numeric, 1) as gem_leeftijd
       FROM leden_snapshot ls
       JOIN leden l ON ls.rel_code = l.rel_code
       LEFT JOIN teams t ON ls.ow_code = t.ow_code AND t.seizoen = $2
       WHERE ls.snapshot_id = $1
         AND ls.spelactiviteit IS NOT NULL
         AND ls.ow_code IS NOT NULL
       GROUP BY ls.ow_code, ls.categorie, COALESCE(ls.kleur, t.kleur), t.leeftijdsgroep
       ORDER BY ls.categorie, ls.ow_code`,
      [snap.id, seizoen]
    );

    res.json({
      _meta: { datum: snap.snapshot_datum, seizoen },
      data: rows.map(r => ({
        team: r.team,
        categorie: r.categorie,
        kleur: r.kleur || null,
        niveau: r.niveau || null,
        spelers_M: parseInt(r.spelers_m),
        spelers_V: parseInt(r.spelers_v),
        totaal: parseInt(r.totaal),
        gem_leeftijd: r.gem_leeftijd ? parseFloat(r.gem_leeftijd) : null,
      })),
    });
  } catch (err) {
    console.error('per-team error:', err.message);
    res.status(500).json({ error: 'Database fout' });
  }
});

module.exports = router;
