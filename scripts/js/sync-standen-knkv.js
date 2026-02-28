/**
 * sync-standen-knkv.js
 *
 * Haalt actuele competitiestanden op van de KNKV API (api-mijn.korfbal.nl)
 * en slaat ze op in pool_standen + pool_stand_regels.
 *
 * Overschrijft bestaande standen voor hetzelfde seizoen/periode/pool.
 *
 * Gebruik:
 *   node -r dotenv/config scripts/js/sync-standen-knkv.js [seizoen]
 *   Standaard seizoen: 2025-2026
 */

const { Pool } = require("pg");

const db = new Pool({ connectionString: process.env.DATABASE_URL });

const SEIZOEN = process.argv[2] || "2025-2026";
const CLUB_ID = "NCX19J3";
const API_BASE = "https://api-mijn.korfbal.nl/api/v2";

const SPORT_PERIODES = [
  { sport: "KORFBALL-VE-WK", periode: "veld_najaar" },
  { sport: "KORFBALL-ZA-WK", periode: "zaal" },
];

// ---------------------------------------------------------------------------
// Niveau-afleiding op basis van poolnaam
// ---------------------------------------------------------------------------

function bepaalNiveau(poolNaam) {
  const upper = poolNaam.toUpperCase();
  // Hoofdklasse: HK-08, U15-HK-08, U17-HK-07, U15-HKD, U17-HKD
  if (upper.includes("HK")) return "Hoofdklasse";
  // Overgangsklasse: U19-OK-07, U19-OKD
  if (upper.includes("OK")) return "Overgangsklasse";
  // Reserve: R1D, R2-28, R3W, ROKD
  if (/^ROK/.test(upper)) return "Reserve Hoofdklasse";
  if (/^R\d/.test(upper)) return `Reserve ${upper.match(/^R(\d)/)[1]}e klasse`;
  // B-kleuren
  if (upper.startsWith("RO")) return "Rood";
  if (upper.startsWith("OR")) return "Oranje";
  if (upper.startsWith("GE")) return "Geel";
  if (upper.startsWith("GR")) return "Groen";
  if (upper.startsWith("BL")) return "Blauw";
  // Senioren-klassen
  if (/^1[A-Z]?$/.test(upper) || /^1-/.test(poolNaam)) return "1e klasse";
  if (/^2[A-Z]?$/.test(upper) || /^2-/.test(poolNaam)) return "2e klasse";
  if (/^3[A-Z]?$/.test(upper) || /^3-/.test(poolNaam)) return "3e klasse";
  // U-categorieën met klasse: U17-1-11, U17-1G, U19-2-08, U19-2E
  const uMatch = poolNaam.match(/^U\d+-(\d)/);
  if (uMatch) return `${uMatch[1]}e klasse`;
  // Speciaal
  if (upper.startsWith("S-")) return "Speciaal";
  if (upper.startsWith("MW")) return "Micro/Wandel";
  return null;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} voor ${url}`);
  return res.json();
}

async function haalPoolsOp(sportCode) {
  const url = `${API_BASE}/pools/club/${CLUB_ID}?sport=${sportCode}&team=true`;
  const data = await fetchJSON(url);

  // Verzamel unieke pools (meerdere teams kunnen in dezelfde pool zitten)
  const poolMap = new Map();
  for (const entry of data) {
    for (const pool of entry.pools) {
      poolMap.set(pool.ref_id, pool.name);
    }
  }
  return poolMap; // Map<ref_id, poolNaam>
}

async function haalStandOp(poolRefId) {
  const url = `${API_BASE}/matches/pools/${poolRefId}/standing`;
  const data = await fetchJSON(url);
  // API retourneert een array — neem het eerste element
  if (Array.isArray(data)) return data[0] || { standings: [] };
  return data;
}

// ---------------------------------------------------------------------------
// Database upsert
// ---------------------------------------------------------------------------

async function slaStandOp(client, seizoen, periode, poolNaam, standings, standDatum) {
  // Upsert pool_standen
  const upsertResult = await client.query(
    `
    INSERT INTO pool_standen (seizoen, periode, pool, niveau, stand_datum, bron_bestand)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (seizoen, periode, pool)
    DO UPDATE SET niveau = EXCLUDED.niveau,
                  stand_datum = EXCLUDED.stand_datum,
                  bron_bestand = EXCLUDED.bron_bestand
    RETURNING id
  `,
    [seizoen, periode, poolNaam, bepaalNiveau(poolNaam), standDatum, "knkv-api"]
  );

  const poolStandId = upsertResult.rows[0].id;

  // Verwijder oude regels
  await client.query("DELETE FROM pool_stand_regels WHERE pool_stand_id = $1", [poolStandId]);

  // Insert nieuwe regels
  if (standings.length > 0) {
    const valuesStr = [];
    const params = [];
    let idx = 1;

    for (const entry of standings) {
      valuesStr.push(
        `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8}, $${idx + 9}, $${idx + 10})`
      );
      idx += 11;

      const s = entry.stats;
      const teamNaam = entry.team.name;
      params.push(
        poolStandId,
        s.position,
        teamNaam,
        teamNaam.includes("Oranje Wit"),
        s.played,
        s.won,
        s.draw,
        s.lost,
        s.points,
        s.goals.for,
        s.goals.against
      );
    }

    await client.query(
      `
      INSERT INTO pool_stand_regels (pool_stand_id, positie, team_naam, is_ow, gs, wn, gl, vl, pt, vr, tg)
      VALUES ${valuesStr.join(", ")}
    `,
      params
    );
  }

  return standings.length;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\nStanden synchroniseren voor seizoen ${SEIZOEN}...\n`);
  const standDatum = new Date().toISOString().slice(0, 10);
  let totaalPools = 0;
  let totaalRegels = 0;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    for (const { sport, periode } of SPORT_PERIODES) {
      console.log(`--- ${periode} (${sport}) ---`);

      let poolMap;
      try {
        poolMap = await haalPoolsOp(sport);
      } catch (err) {
        console.log(`  Geen pools gevonden voor ${sport}: ${err.message}`);
        continue;
      }

      if (poolMap.size === 0) {
        console.log("  Geen pools gevonden.");
        continue;
      }

      console.log(`  ${poolMap.size} unieke pools gevonden`);

      for (const [refId, poolNaam] of poolMap) {
        try {
          const data = await haalStandOp(refId);
          const standings = data.standings || [];

          if (standings.length === 0) {
            console.log(`  ${poolNaam}: geen stand beschikbaar`);
            continue;
          }

          const aantalRegels = await slaStandOp(
            client,
            SEIZOEN,
            periode,
            poolNaam,
            standings,
            standDatum
          );
          console.log(`  ${poolNaam} (${bepaalNiveau(poolNaam) || "?"}): ${aantalRegels} teams`);
          totaalPools++;
          totaalRegels += aantalRegels;
        } catch (err) {
          console.log(`  ${poolNaam}: FOUT — ${err.message}`);
        }
      }
    }

    await client.query("COMMIT");
    console.log(`\nKlaar: ${totaalPools} pools, ${totaalRegels} regels opgeslagen.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Transactie teruggedraaid:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await db.end();
  }
}

main();
