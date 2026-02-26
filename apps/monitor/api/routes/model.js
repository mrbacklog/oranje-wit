const { Router } = require('express');
const { pool } = require('../db');
const fs = require('fs');
const path = require('path');

const router = Router();

// GET /api/categorie-mapping — statische configuratie
router.get('/categorie-mapping', (req, res) => {
  res.json({
    _meta: {
      beschrijving: 'Mapping oud categoriesysteem → Competitie 2.0 banden',
      toelichting: 'Lettercategorieën (F-A) waren de standaard t/m seizoen 2024-2025. Vanaf 2025-2026 gebruikt KNKV het kleurensysteem.',
    },
    categorie_naar_band: {
      F: { band: 'Blauw', leeftijden: [6, 7], spelvorm: '4-tal' },
      E: { band: 'Groen', leeftijden: [8, 9], spelvorm: '4-tal' },
      D: { band: 'Geel', leeftijden: [10, 11, 12], spelvorm: '8-tal' },
      C: { band: 'Oranje', leeftijden: [13, 14, 15], spelvorm: '8-tal' },
      B: { band: 'Rood', leeftijden: [16, 17], spelvorm: '8-tal' },
      A: { band: 'Rood', leeftijden: [17, 18], spelvorm: '8-tal' },
      S: { band: 'Senioren', leeftijden: null, spelvorm: '8-tal' },
      K: { band: 'Kangoeroe', leeftijden: [4, 5], spelvorm: null },
    },
  });
});

// GET /api/streefmodel — streefmodel uit database, fallback naar JSON-bestand
router.get('/streefmodel', async (req, res) => {
  try {
    // Probeer database eerst
    const { rows } = await pool.query(
      `SELECT versie, seizoen_basis, seizoen_doel, leeftijd, band, totaal, m, v
       FROM streefmodel ORDER BY versie, seizoen_doel, leeftijd`
    );

    if (rows.length > 0) {
      // Database heeft data — structureer het
      const bogen = {};
      const meta = { beschrijving: '', versie: rows[0].versie, banden: {} };
      meta.banden = {
        Blauw: { leeftijd: [5, 6, 7], spelvorm: '4-tallen' },
        Groen: { leeftijd: [8, 9], spelvorm: '4-tallen' },
        Geel: { leeftijd: [10, 11, 12], spelvorm: '8-tallen' },
        Oranje: { leeftijd: [13, 14, 15], spelvorm: '8-tallen' },
        Rood: { leeftijd: [16, 17, 18], spelvorm: '8-tallen' },
      };

      for (const r of rows) {
        const key = r.seizoen_doel;
        if (!bogen[key]) bogen[key] = { beschrijving: key, per_leeftijd: [] };
        bogen[key].per_leeftijd.push({ leeftijd: r.leeftijd, band: r.band, totaal: r.totaal, m: r.m, v: r.v });
      }

      const seizoenKeys = Object.keys(bogen).sort();
      const basis = rows[0].seizoen_basis;
      const result = { _meta: meta };
      if (bogen[basis]) result.boog_huidig = { beschrijving: `Huidig seizoen ${basis}`, per_leeftijd: bogen[basis].per_leeftijd };
      for (const key of seizoenKeys) {
        if (key === basis) continue;
        const year = key.split('-')[0];
        result[`boog_${year}`] = { beschrijving: `Streefmodel ${key}`, per_leeftijd: bogen[key].per_leeftijd };
      }
      return res.json(result);
    }

    // Fallback: lees JSON-bestand
    const jsonPath = path.resolve(__dirname, '..', '..', 'data', 'modellen', 'streef-ledenboog.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      return res.json(data);
    }

    res.json({ _meta: { beschrijving: 'Geen streefmodel data' }, boog_huidig: null });
  } catch (err) {
    console.error('streefmodel error:', err.message);
    res.status(500).json({ error: 'Database fout' });
  }
});

module.exports = router;
