const { Router } = require('express');
const { pool } = require('../db');

const router = Router();

// GET /api/signalering?seizoen=2025-2026
router.get('/signalering', async (req, res) => {
  try {
    const seizoen = req.query.seizoen || '2025-2026';

    const { rows } = await pool.query(
      `SELECT type, ernst, leeftijdsgroep, geslacht, waarde, drempel, streef, beschrijving
       FROM signalering WHERE seizoen = $1
       ORDER BY CASE ernst WHEN 'kritiek' THEN 0 WHEN 'aandacht' THEN 1 ELSE 2 END, type`,
      [seizoen]
    );

    const kritiek = rows.filter(r => r.ernst === 'kritiek').length;
    const aandacht = rows.filter(r => r.ernst === 'aandacht').length;

    res.json({
      _meta: {
        seizoen,
        totaal_alerts: rows.length,
        kritiek,
        aandacht,
      },
      alerts: rows.map(r => ({
        type: r.type,
        ernst: r.ernst,
        leeftijdsgroep: r.leeftijdsgroep,
        geslacht: r.geslacht,
        waarde: Number(r.waarde),
        drempel: Number(r.drempel),
        streef: Number(r.streef),
        beschrijving: r.beschrijving,
      })),
    });
  } catch (err) {
    console.error('signalering error:', err.message);
    res.status(500).json({ error: 'Database fout' });
  }
});

module.exports = router;
