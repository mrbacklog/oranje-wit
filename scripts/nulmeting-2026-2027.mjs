/**
 * Nulmeting seizoensovergang 2026-2027.
 * Leest wat er per tabel al klaarstaat voor het nieuwe seizoen.
 *
 * Gebruik: node scripts/nulmeting-2026-2027.mjs
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

const out = (s) => process.stdout.write(s + "\n");

async function toon(titel, sql, params = []) {
  try {
    const { rows } = await client.query(sql, params);
    out(`\n### ${titel}`);
    if (rows.length === 0) {
      out("(geen rijen)");
      return;
    }
    for (const r of rows) {
      out(
        Object.entries(r)
          .map(([k, v]) => `${k}=${v}`)
          .join("  ")
      );
    }
  } catch (e) {
    out(`\n### ${titel}\nFOUT: ${e.message}`);
  }
}

await client.connect();

await toon(
  "Seizoenen (laatste 5)",
  `SELECT seizoen, status FROM seizoenen ORDER BY seizoen DESC LIMIT 5`
);

await toon(
  "competitie_spelers per seizoen (laatste 4)",
  `SELECT seizoen, competitie, COUNT(*)::int AS aantal
     FROM competitie_spelers
    WHERE seizoen >= '2024-2025'
    GROUP BY seizoen, competitie
    ORDER BY seizoen DESC, competitie`
);

await toon(
  "speler_seizoenen per seizoen (laatste 4)",
  `SELECT seizoen, COUNT(*)::int AS spelers
     FROM speler_seizoenen
    WHERE seizoen >= '2023-2024'
    GROUP BY seizoen ORDER BY seizoen DESC`
);

await toon(
  "Teams per seizoen (laatste 3)",
  `SELECT seizoen, COUNT(*)::int AS teams
     FROM teams WHERE seizoen >= '2024-2025'
    GROUP BY seizoen ORDER BY seizoen DESC`
);

await toon(
  "Leden totaal / afgemeld",
  `SELECT COUNT(*)::int AS totaal,
          COUNT(afmelddatum)::int AS met_afmelddatum,
          COUNT(*) FILTER (WHERE afmelddatum IS NULL)::int AS actief
     FROM leden`
);

await toon(
  "Leden: afmeldingen en instroom per maand sinds 2026-01",
  `SELECT to_char(afmelddatum,'YYYY-MM') AS maand, COUNT(*)::int AS afmeldingen
     FROM leden WHERE afmelddatum >= '2026-01-01'
    GROUP BY 1 ORDER BY 1`
);

await toon(
  "Leden: nieuw sinds 2026-01 (lid_sinds)",
  `SELECT to_char(lid_sinds,'YYYY-MM') AS maand, COUNT(*)::int AS nieuw
     FROM leden WHERE lid_sinds >= '2026-01-01'
    GROUP BY 1 ORDER BY 1`
);

await toon(
  "Verloop-pipeline: laatste seizoen per tabel",
  `SELECT 'ledenverloop' AS tabel, MAX(seizoen) AS laatste FROM ledenverloop
   UNION ALL SELECT 'cohort_seizoenen', MAX(seizoen) FROM cohort_seizoenen
   UNION ALL SELECT 'signalering', MAX(seizoen) FROM signalering`
);

await toon(
  "Werkseizoen (Kaders)",
  `SELECT seizoen, "isWerkseizoen" FROM "Kaders" ORDER BY seizoen DESC LIMIT 6`
);

await toon(
  "Seizoensstatus rond de overgang",
  `SELECT seizoen, status FROM seizoenen
    WHERE seizoen BETWEEN '2024-2025' AND '2028-2029' ORDER BY seizoen`
);

await toon(
  "Teams 2026-2027",
  `SELECT COUNT(*)::int AS teams FROM teams WHERE seizoen = '2026-2027'`
);

await toon("Speler-records (Team-Indeling)", `SELECT COUNT(*)::int AS spelers FROM "Speler"`);

await toon(
  "Afmeldingen vanaf juni 2026 per geboortejaar",
  `SELECT EXTRACT(YEAR FROM geboortedatum)::int AS geboortejaar, COUNT(*)::int AS aantal
     FROM leden WHERE afmelddatum >= '2026-06-01'
    GROUP BY 1 ORDER BY 1`
);

await toon(
  "Actualiteit leden-tabel",
  `SELECT MAX(lid_sinds)::text AS laatste_instroom,
          MAX(afmelddatum)::text AS laatste_afmelding,
          MAX(registratie_datum)::text AS laatste_registratie
     FROM leden`
);

await client.end();
