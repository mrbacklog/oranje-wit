/**
 * bereken-verloop.js
 *
 * Berekent individueel ledenverloop tussen opeenvolgende seizoenen.
 * Bron: speler_seizoenen + leden tabellen (PostgreSQL).
 *
 * Classificaties:
 * - behouden: rel_code in BEIDE seizoenen
 * - nieuw: rel_code in nieuw seizoen maar NIET in vorig, en NIET in eerdere seizoenen
 * - herinschrijver: rel_code in nieuw seizoen, NIET in vorig, maar WEL in een eerder seizoen
 * - uitgestroomd: rel_code in vorig maar NIET in nieuw
 *
 * Output: ledenverloop tabel in PostgreSQL
 */

const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getAllSeasons() {
  const { rows } = await pool.query(`SELECT seizoen, eind_jaar FROM seizoenen ORDER BY seizoen`);
  return rows;
}

async function getSpelersForSeason(seizoen) {
  const { rows } = await pool.query(
    `SELECT DISTINCT cp.rel_code, cp.team, cp.geslacht, l.geboortejaar
     FROM competitie_spelers cp
     JOIN leden l ON cp.rel_code = l.rel_code
     WHERE cp.seizoen = $1`,
    [seizoen]
  );
  return rows;
}

function getLeeftijd(geboortejaar, eindJaar) {
  if (!geboortejaar) return null;
  return eindJaar - geboortejaar;
}

async function main() {
  console.log("Ledenverloop berekenen uit database...\n");

  const seizoenen = await getAllSeasons();
  // Filter seizoenen die daadwerkelijk spelers hebben
  const seizoenenMetData = [];
  for (const s of seizoenen) {
    const { rows } = await pool.query(
      `SELECT COUNT(DISTINCT rel_code) as n
       FROM competitie_spelers
       WHERE seizoen = $1`,
      [s.seizoen]
    );
    if (parseInt(rows[0].n) > 0) {
      seizoenenMetData.push(s);
    }
  }

  console.log(`${seizoenenMetData.length} seizoenen met data gevonden`);

  // Bouw cumulatieve set van rel_codes voor herinschrijver-detectie
  const allPriorRelCodes = []; // allPriorRelCodes[i] = Set van rel_codes in seizoenen 0..i-1

  const seizoenSpelers = []; // cache: spelers per seizoen

  for (let i = 0; i < seizoenenMetData.length; i++) {
    const spelers = await getSpelersForSeason(seizoenenMetData[i].seizoen);
    seizoenSpelers.push(spelers);

    if (i === 0) {
      allPriorRelCodes.push(new Set());
    } else {
      const prev = new Set(allPriorRelCodes[i - 1]);
      seizoenSpelers[i - 1].forEach((m) => prev.add(m.rel_code));
      allPriorRelCodes.push(prev);
    }
  }

  // Verwijder bestaande verloop-records
  await pool.query(`DELETE FROM ledenverloop`);
  console.log("Bestaande ledenverloop records verwijderd\n");

  let totalInserted = 0;

  // Verwerk elk seizoenspaar
  for (let i = 1; i < seizoenenMetData.length; i++) {
    const vorig = seizoenenMetData[i - 1];
    const nieuw = seizoenenMetData[i];

    const vorigSpelers = seizoenSpelers[i - 1];
    const nieuwSpelers = seizoenSpelers[i];

    const vorigMap = new Map();
    vorigSpelers.forEach((m) => vorigMap.set(m.rel_code, m));

    const nieuwMap = new Map();
    nieuwSpelers.forEach((m) => nieuwMap.set(m.rel_code, m));

    const priorCodes = allPriorRelCodes[i - 1];
    const samenvatting = { behouden: 0, nieuw: 0, herinschrijver: 0, uitgestroomd: 0 };
    const records = [];

    // 1. Verwerk spelers uit vorig seizoen
    for (const [relCode, vorigMember] of vorigMap) {
      if (nieuwMap.has(relCode)) {
        const nieuwMember = nieuwMap.get(relCode);
        samenvatting.behouden++;
        records.push({
          seizoen: nieuw.seizoen,
          rel_code: relCode,
          status: "behouden",
          geboortejaar: vorigMember.geboortejaar,
          geslacht: vorigMember.geslacht,
          leeftijd_vorig: getLeeftijd(vorigMember.geboortejaar, vorig.eind_jaar),
          leeftijd_nieuw: getLeeftijd(nieuwMember.geboortejaar, nieuw.eind_jaar),
          team_vorig: vorigMember.team || null,
          team_nieuw: nieuwMember.team || null,
        });
      } else {
        samenvatting.uitgestroomd++;
        records.push({
          seizoen: nieuw.seizoen,
          rel_code: relCode,
          status: "uitgestroomd",
          geboortejaar: vorigMember.geboortejaar,
          geslacht: vorigMember.geslacht,
          leeftijd_vorig: getLeeftijd(vorigMember.geboortejaar, vorig.eind_jaar),
          leeftijd_nieuw: null,
          team_vorig: vorigMember.team || null,
          team_nieuw: null,
        });
      }
    }

    // 2. Verwerk spelers in nieuw seizoen die NIET in vorig zaten
    for (const [relCode, nieuwMember] of nieuwMap) {
      if (!vorigMap.has(relCode)) {
        const wasInEarlier = priorCodes.has(relCode);

        if (wasInEarlier) {
          samenvatting.herinschrijver++;
          records.push({
            seizoen: nieuw.seizoen,
            rel_code: relCode,
            status: "herinschrijver",
            geboortejaar: nieuwMember.geboortejaar,
            geslacht: nieuwMember.geslacht,
            leeftijd_vorig: null,
            leeftijd_nieuw: getLeeftijd(nieuwMember.geboortejaar, nieuw.eind_jaar),
            team_vorig: null,
            team_nieuw: nieuwMember.team || null,
          });
        } else {
          samenvatting.nieuw++;
          records.push({
            seizoen: nieuw.seizoen,
            rel_code: relCode,
            status: "nieuw",
            geboortejaar: nieuwMember.geboortejaar,
            geslacht: nieuwMember.geslacht,
            leeftijd_vorig: null,
            leeftijd_nieuw: getLeeftijd(nieuwMember.geboortejaar, nieuw.eind_jaar),
            team_vorig: null,
            team_nieuw: nieuwMember.team || null,
          });
        }
      }
    }

    // Batch insert naar database
    for (const r of records) {
      await pool.query(
        `INSERT INTO ledenverloop (seizoen, rel_code, status, geboortejaar, geslacht,
          leeftijd_vorig, leeftijd_nieuw, team_vorig, team_nieuw)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (seizoen, rel_code) DO UPDATE SET
           status = EXCLUDED.status, geboortejaar = EXCLUDED.geboortejaar,
           geslacht = EXCLUDED.geslacht, leeftijd_vorig = EXCLUDED.leeftijd_vorig,
           leeftijd_nieuw = EXCLUDED.leeftijd_nieuw, team_vorig = EXCLUDED.team_vorig,
           team_nieuw = EXCLUDED.team_nieuw`,
        [
          r.seizoen,
          r.rel_code,
          r.status,
          r.geboortejaar,
          r.geslacht,
          r.leeftijd_vorig,
          r.leeftijd_nieuw,
          r.team_vorig,
          r.team_nieuw,
        ]
      );
    }

    totalInserted += records.length;

    console.log(
      `${nieuw.seizoen}: vorig=${vorigMap.size}, nieuw=${nieuwMap.size}, ` +
        `behouden=${samenvatting.behouden}, nieuw=${samenvatting.nieuw}, ` +
        `herinschrijver=${samenvatting.herinschrijver}, uitgestroomd=${samenvatting.uitgestroomd}`
    );
  }

  console.log(`\nTotaal ${totalInserted} verloop-records geschreven naar database`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  pool.end();
  process.exit(1);
});
