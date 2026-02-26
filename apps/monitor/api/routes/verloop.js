const { Router } = require('express');
const { pool } = require('../db');

const router = Router();

// GET /api/instroom-uitstroom
router.get('/instroom-uitstroom', async (req, res) => {
  try {
    // Instroom per leeftijd (all-time)
    const instroomRes = await pool.query(
      `SELECT leeftijd_nieuw as leeftijd,
              COUNT(*) FILTER (WHERE geslacht = 'M') as m,
              COUNT(*) FILTER (WHERE geslacht = 'V') as v,
              COUNT(*) as totaal
       FROM ledenverloop
       WHERE status IN ('nieuw', 'herinschrijver')
         AND leeftijd_nieuw IS NOT NULL
       GROUP BY leeftijd_nieuw
       ORDER BY leeftijd_nieuw`
    );

    // Uitstroom per leeftijd (all-time)
    const uitstroomRes = await pool.query(
      `SELECT leeftijd_vorig as leeftijd,
              COUNT(*) FILTER (WHERE geslacht = 'M') as m,
              COUNT(*) FILTER (WHERE geslacht = 'V') as v,
              COUNT(*) as totaal
       FROM ledenverloop
       WHERE status IN ('uitgestroomd', 'niet_spelend_geworden')
         AND leeftijd_vorig IS NOT NULL
       GROUP BY leeftijd_vorig
       ORDER BY leeftijd_vorig`
    );

    // Retentie per leeftijd (all-time)
    const retentieRes = await pool.query(
      `WITH aanwezig AS (
         SELECT seizoen, geslacht, leeftijd_vorig as leeftijd, COUNT(*) as n
         FROM ledenverloop
         WHERE leeftijd_vorig IS NOT NULL
           AND status NOT IN ('nieuw', 'herinschrijver')
         GROUP BY seizoen, geslacht, leeftijd_vorig
       ),
       terug AS (
         SELECT seizoen, geslacht, leeftijd_vorig as leeftijd, COUNT(*) as n
         FROM ledenverloop
         WHERE status = 'behouden'
           AND leeftijd_vorig IS NOT NULL
         GROUP BY seizoen, geslacht, leeftijd_vorig
       )
       SELECT
         a.leeftijd,
         SUM(a.n)::int as aanwezig_totaal,
         COALESCE(SUM(t.n), 0)::int as terug_totaal,
         ROUND(COALESCE(SUM(t.n), 0)::numeric / NULLIF(SUM(a.n), 0), 3) as retentie_totaal,
         SUM(a.n) FILTER (WHERE a.geslacht = 'M')::int as aanwezig_m,
         COALESCE(SUM(t.n) FILTER (WHERE a.geslacht = 'M'), 0)::int as terug_m,
         ROUND(COALESCE(SUM(t.n) FILTER (WHERE a.geslacht = 'M'), 0)::numeric
           / NULLIF(SUM(a.n) FILTER (WHERE a.geslacht = 'M'), 0), 3) as retentie_m,
         SUM(a.n) FILTER (WHERE a.geslacht = 'V')::int as aanwezig_v,
         COALESCE(SUM(t.n) FILTER (WHERE a.geslacht = 'V'), 0)::int as terug_v,
         ROUND(COALESCE(SUM(t.n) FILTER (WHERE a.geslacht = 'V'), 0)::numeric
           / NULLIF(SUM(a.n) FILTER (WHERE a.geslacht = 'V'), 0), 3) as retentie_v
       FROM aanwezig a
       LEFT JOIN terug t ON a.seizoen = t.seizoen AND a.geslacht = t.geslacht AND a.leeftijd = t.leeftijd
       GROUP BY a.leeftijd
       ORDER BY a.leeftijd`
    );

    res.json({
      _meta: {
        bron: 'ledenverloop database',
        toelichting: 'Retentie = % spelers dat volgend seizoen terugkeert.',
      },
      instroom_per_leeftijd: instroomRes.rows.map(r => ({
        leeftijd: r.leeftijd,
        M: parseInt(r.m),
        V: parseInt(r.v),
        totaal: parseInt(r.totaal),
      })),
      uitstroom_per_leeftijd: uitstroomRes.rows.map(r => ({
        leeftijd: r.leeftijd,
        M: parseInt(r.m),
        V: parseInt(r.v),
        totaal: parseInt(r.totaal),
      })),
      retentie_alle_seizoenen: retentieRes.rows.map(r => ({
        leeftijd: r.leeftijd,
        aanwezig_totaal: r.aanwezig_totaal,
        terug_totaal: r.terug_totaal,
        retentie_totaal: r.retentie_totaal ? parseFloat(r.retentie_totaal) : null,
        aanwezig_M: r.aanwezig_m,
        terug_M: r.terug_m,
        retentie_M: r.retentie_m ? parseFloat(r.retentie_m) : null,
        aanwezig_V: r.aanwezig_v,
        terug_V: r.terug_v,
        retentie_V: r.retentie_v ? parseFloat(r.retentie_v) : null,
      })),
    });
  } catch (err) {
    console.error('instroom-uitstroom error:', err.message);
    res.status(500).json({ error: 'Database fout' });
  }
});

// GET /api/cohorten
router.get('/cohorten', async (req, res) => {
  try {
    // 1. Alle seizoenen
    const seizRes = await pool.query(
      `SELECT seizoen FROM seizoenen ORDER BY seizoen`
    );
    const seizoenen = seizRes.rows.map(r => r.seizoen);

    // 2. Per cohort data
    const cohortRes = await pool.query(
      `SELECT geboortejaar, geslacht, seizoen, leeftijd, band,
              actief, behouden, nieuw, herinschrijver, uitgestroomd, retentie_pct
       FROM cohort_seizoenen
       ORDER BY geboortejaar DESC, geslacht, seizoen`
    );

    // Groepeer per (geboortejaar, geslacht)
    const cohortMap = new Map();
    for (const r of cohortRes.rows) {
      const key = `${r.geboortejaar}_${r.geslacht}`;
      if (!cohortMap.has(key)) {
        cohortMap.set(key, {
          geboortejaar: r.geboortejaar,
          geslacht: r.geslacht,
          seizoenen: {},
        });
      }
      cohortMap.get(key).seizoenen[r.seizoen] = {
        leeftijd: r.leeftijd,
        band: r.band,
        actief: r.actief,
        behouden: r.behouden,
        nieuw: r.nieuw,
        herinschrijver: r.herinschrijver,
        uitgestroomd: r.uitgestroomd,
        retentie_pct: r.retentie_pct ? parseFloat(r.retentie_pct) : null,
      };
    }

    // 3. _totalen.per_seizoen
    const totSeizoenRes = await pool.query(
      `SELECT seizoen,
              SUM(actief) as totaal,
              SUM(behouden) as behouden,
              SUM(nieuw) as nieuw,
              SUM(herinschrijver) as herinschrijver,
              SUM(uitgestroomd) as uitgestroomd
       FROM cohort_seizoenen
       GROUP BY seizoen
       ORDER BY seizoen`
    );

    const perSeizoen = [];
    let vorig = null;
    for (const r of totSeizoenRes.rows) {
      const totaal = parseInt(r.totaal);
      const behouden = parseInt(r.behouden);
      const nieuw = parseInt(r.nieuw);
      const herinschrijver = parseInt(r.herinschrijver);
      const uitgestroomd = parseInt(r.uitgestroomd);
      const entry = {
        seizoen: r.seizoen,
        totaal_vorig: vorig,
        totaal_nieuw: totaal,
        behouden,
        nieuw,
        herinschrijver,
        uitgestroomd,
        niet_spelend_geworden: 0,
        retentie_pct: vorig ? parseFloat((behouden / vorig * 100).toFixed(1)) : null,
        netto_groei: vorig ? totaal - vorig : null,
        netto_groei_pct: vorig ? parseFloat(((totaal - vorig) / vorig * 100).toFixed(1)) : null,
      };
      perSeizoen.push(entry);
      vorig = totaal;
    }

    // 4. _totalen.per_leeftijdsgroep
    const groepRanges = [
      { groep: '6-12', min: 6, max: 12 },
      { groep: '13-18', min: 13, max: 18 },
      { groep: '19+', min: 19, max: 99 },
    ];

    const leeftGroepRes = await pool.query(
      `SELECT seizoen, leeftijd,
              SUM(behouden) as behouden,
              SUM(actief) as actief,
              SUM(nieuw + herinschrijver) as instroom,
              SUM(uitgestroomd) as uitstroom
       FROM cohort_seizoenen
       WHERE leeftijd IS NOT NULL
       GROUP BY seizoen, leeftijd
       ORDER BY seizoen, leeftijd`
    );

    // Aggregeer per groep per seizoen
    const groepData = groepRanges.map(gr => {
      const perSz = {};
      for (const r of leeftGroepRes.rows) {
        if (r.leeftijd >= gr.min && r.leeftijd <= gr.max) {
          if (!perSz[r.seizoen]) perSz[r.seizoen] = { behouden: 0, actief: 0, instroom: 0, uitstroom: 0 };
          perSz[r.seizoen].behouden += parseInt(r.behouden);
          perSz[r.seizoen].actief += parseInt(r.actief);
          perSz[r.seizoen].instroom += parseInt(r.instroom);
          perSz[r.seizoen].uitstroom += parseInt(r.uitstroom);
        }
      }
      const perSeizoenObj = {};
      for (const [sz, d] of Object.entries(perSz)) {
        const vorig = d.behouden + d.uitstroom; // die er vorig seizoen waren
        perSeizoenObj[sz] = {
          retentie_pct: vorig > 0 ? parseFloat((d.behouden / vorig * 100).toFixed(1)) : null,
          instroom: d.instroom,
          uitstroom: d.uitstroom,
        };
      }
      return { groep: gr.groep, per_seizoen: perSeizoenObj };
    });

    // 5. _totalen.instroom_leeftijd
    const instroomRes = await pool.query(
      `SELECT seizoen, geboortejaar,
              SUM(nieuw + herinschrijver) as instroom
       FROM cohort_seizoenen
       WHERE (nieuw + herinschrijver) > 0
       GROUP BY seizoen, geboortejaar
       ORDER BY seizoen, geboortejaar`
    );

    // Bereken leeftijd bij instroom en groepeer per seizoen
    const instroomPerSeizoen = {};
    for (const r of instroomRes.rows) {
      if (!instroomPerSeizoen[r.seizoen]) instroomPerSeizoen[r.seizoen] = { verdeling: {}, totaal: 0 };
      const startJaar = parseInt(r.seizoen.split('-')[0]);
      const leeftijd = startJaar - r.geboortejaar;
      const bucket = leeftijd < 5 ? '<5' : leeftijd >= 15 ? '15+' : String(leeftijd);
      const n = parseInt(r.instroom);
      instroomPerSeizoen[r.seizoen].verdeling[bucket] = (instroomPerSeizoen[r.seizoen].verdeling[bucket] || 0) + n;
      instroomPerSeizoen[r.seizoen].totaal += n;
    }

    const instroomLeeftijd = Object.entries(instroomPerSeizoen)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([seizoen, d]) => ({
        seizoen,
        totaal_instroom: d.totaal,
        verdeling: d.verdeling,
      }));

    res.json({
      _meta: {
        beschrijving: 'Ledenverloop per geboortejaar-cohort over alle seizoenen',
        seizoenen,
      },
      per_cohort: [...cohortMap.values()],
      _totalen: {
        per_seizoen: perSeizoen,
        per_leeftijdsgroep: groepData,
        instroom_leeftijd: instroomLeeftijd,
      },
    });
  } catch (err) {
    console.error('cohorten error:', err.message);
    res.status(500).json({ error: 'Database fout' });
  }
});

module.exports = router;
