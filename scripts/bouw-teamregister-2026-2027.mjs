/**
 * Bouwt het teamregister voor 2026-2027: koppelt de teams uit de indeling aan de
 * Sportlink-veldteams en kent stabiele ow_codes toe.
 *
 * De koppeling J-nummer → teamnaam wordt niet geraden maar afgeleid uit de spelers:
 * per Sportlink-team wint het databaseteam waar de meeste spelers in zitten.
 *
 * Schrijft data/seizoenen/2026-2027/teams.json. Met --apply worden ook de rijen in
 * teams / team_periodes / team_aliases weggeschreven.
 *
 * Gebruik: node scripts/bouw-teamregister-2026-2027.mjs <versieId> [--apply]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const SEIZOEN = "2026-2027";
const args = process.argv.slice(2);
const VERSIE_ID = args.find((a) => !a.startsWith("--"));
const APPLY = args.includes("--apply");
const UITVOER = resolve(__dirname, `../data/seizoenen/${SEIZOEN}/teams.json`);

if (!VERSIE_ID) {
  process.stderr.write("Geef een versieId mee.\n");
  process.exit(1);
}

const out = (s) => process.stdout.write(s + "\n");

/**
 * Teams die formeel B-categorie zijn maar bij een selectie horen.
 * U15-2 speelt dit seizoen in de B-categorie, maar blijft onderdeel van de U15-selectie.
 */
const SELECTIE_KOPPELING = { "OW-U15-2": "OW-U15-1" };

/** Naam in de indeling → stabiele ow_code. */
function owCodeVan(naam) {
  const n = naam.trim();
  let m = n.match(/^Senioren\s+(\d+)$/i);
  if (m) return `OW-S${m[1]}`;
  if (/^Midweek\s*1$/i.test(n)) return "OW-MW1";
  if (/^Kangoeroes$/i.test(n)) return "OW-KANGOEROES";
  m = n.match(/^U(\d+)-(\d+)/i);
  if (m) return `OW-U${m[1]}-${m[2]}`;
  m = n.match(/^(Rood|Oranje|Geel|Groen|Blauw)\s+(\d+)$/i);
  if (m) return `OW-${m[1].toUpperCase()}-${m[2]}`;
  return null;
}

const sportlink = JSON.parse(
  readFileSync(resolve(__dirname, `../data/seizoenen/${SEIZOEN}/teams-sportlink.json`), "utf8")
);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows: indelingTeams } = await client.query(
  `SELECT t.id, t.naam, t.categorie::text AS categorie, t.kleur::text AS kleur,
          t."teamType"::text AS team_type, t.niveau, t.volgorde
     FROM "Team" t WHERE t."versieId" = $1 ORDER BY t.volgorde`,
  [VERSIE_ID]
);

const { rows: spelerRijen } = await client.query(
  `SELECT t.naam AS team, ts."spelerId" AS rc
     FROM "Team" t
     JOIN "TeamSpeler" ts ON ts."teamId" = t.id
    WHERE t."versieId" = $1
   UNION ALL
   SELECT COALESCE(g.naam, 'Selectiegroep'), ss."spelerId"
     FROM "SelectieGroep" g
     JOIN "SelectieSpeler" ss ON ss."selectieGroepId" = g.id
     JOIN "Speler" s ON s.id = ss."spelerId"
    WHERE g."versieId" = $1`,
  [VERSIE_ID]
);
const teamVanSpeler = new Map(spelerRijen.map((r) => [r.rc, r.team]));

/**
 * Directe naamkoppeling: "Senioren 3" ↔ "3", "U19-1" ↔ "U19-1", "Midweek 1" ↔ "MW1".
 * Nodig omdat spelers van de selectieteams in een gebundelde pool zitten — daar wijst
 * de spelers-afleiding naar de selectiegroep in plaats van naar het team.
 */
function directeNaam(code) {
  if (/^\d+$/.test(code)) return `Senioren ${code}`;
  if (code === "MW1") return "Midweek 1";
  if (/^U\d+-\d+$/.test(code)) return code;
  return null;
}

const indelingNamen = new Set(indelingTeams.map((t) => t.naam));

// Leid per Sportlink-team af welk indelingsteam erbij hoort.
const koppeling = [];
for (const t of sportlink) {
  const direct = directeNaam(t.code);
  if (direct && indelingNamen.has(direct)) {
    koppeling.push({
      sportlink: t.code,
      indeling: direct,
      zekerheid: 100,
      spelers: t.spelers.length,
      bron: "naam",
    });
    continue;
  }
  const tellingen = new Map();
  for (const s of t.spelers) {
    const dbt = teamVanSpeler.get(s.relCode);
    if (dbt) tellingen.set(dbt, (tellingen.get(dbt) ?? 0) + 1);
  }
  const [beste, aantal] = [...tellingen.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  koppeling.push({
    sportlink: t.code,
    indeling: beste,
    zekerheid: t.spelers.length ? Math.round((aantal / t.spelers.length) * 100) : 0,
    spelers: t.spelers.length,
    bron: "spelers",
  });
}

out("### Afgeleide koppeling Sportlink → indeling\n");
for (const k of koppeling) {
  const owCode = k.indeling ? owCodeVan(k.indeling) : null;
  const vlag = !k.indeling || !owCode ? "  ← CONTROLEREN" : k.zekerheid < 100 ? "  ← deels" : "";
  out(
    `  ${k.sportlink.padEnd(7)} → ${(k.indeling ?? "geen match").padEnd(20)} ${(owCode ?? "?").padEnd(16)} ` +
      `${k.bron === "naam" ? "op naam" : `${k.zekerheid}% van ${k.spelers} spelers`}${vlag}`
  );
}

// Bouw het register uit de indeling; selectieteams krijgen hun J-nummer uit de koppeling.
const jNummerVan = new Map();
for (const k of koppeling) if (k.indeling) jNummerVan.set(k.indeling, k.sportlink);

const teams = indelingTeams.map((t) => {
  const owCode = owCodeVan(t.naam);
  return {
    ow_code: owCode,
    naam: t.naam,
    categorie: t.categorie === "A_CATEGORIE" || t.categorie === "SENIOREN" ? "a" : "b",
    kleur: t.kleur,
    leeftijdsgroep: t.niveau,
    spelvorm: t.team_type,
    team_type:
      t.categorie === "SENIOREN"
        ? /midweek/i.test(t.naam)
          ? "OVERIG"
          : "SENIOREN"
        : /kangoeroes/i.test(t.naam)
          ? "OVERIG"
          : t.categorie === "A_CATEGORIE"
            ? "SELECTIE"
            : "JEUGD",
    selectie_ow_code: SELECTIE_KOPPELING[owCode] ?? null,
    sort_order: t.volgorde,
    periodes: {
      veld_najaar: { j_nummer: jNummerVan.get(t.naam) ?? null },
    },
  };
});

const zonderCode = teams.filter((t) => !t.ow_code);
out(`\n### Teams in het register: ${teams.length}`);
if (zonderCode.length > 0) {
  out(`LET OP: geen ow_code afleidbaar voor: ${zonderCode.map((t) => t.naam).join(", ")}`);
}

const nieuw = [];
const { rows: vorig } = await client.query(`SELECT ow_code FROM teams WHERE seizoen = '2025-2026'`);
const vorigeCodes = new Set(vorig.map((r) => r.ow_code));
for (const t of teams) if (t.ow_code && !vorigeCodes.has(t.ow_code)) nieuw.push(t.ow_code);
const vervallen = [...vorigeCodes].filter((c) => !teams.some((t) => t.ow_code === c));

out(`  nieuw t.o.v. 2025-2026: ${nieuw.join(", ") || "geen"}`);
out(`  vervallen:              ${vervallen.join(", ") || "geen"}`);

writeFileSync(
  UITVOER,
  JSON.stringify(
    {
      _meta: {
        seizoen: SEIZOEN,
        aangemaakt: new Date().toISOString().slice(0, 10),
        bron_indeling: VERSIE_ID,
        bron_sportlink: "teams-sportlink.json",
        toelichting:
          "ow_code is de stabiele team-identiteit per seizoen. J-nummers kunnen per periode " +
          "verschuiven door KNKV-hernummering; ow_code wijzigt niet. De koppeling J-nummer → " +
          "team is afgeleid uit de spelersbezetting, niet uit de naam.",
      },
      teams,
    },
    null,
    2
  ),
  "utf8"
);
out(`\nGeschreven: ${UITVOER}`);

if (!APPLY) {
  out("\nDry-run: database niet gewijzigd. Draai met --apply.");
  await client.end();
  process.exit(0);
}

await client.query("BEGIN");
try {
  for (const t of teams) {
    if (!t.ow_code) continue;
    const { rows } = await client.query(
      `INSERT INTO teams (seizoen, ow_code, naam, team_type, categorie, kleur,
                          leeftijdsgroep, spelvorm, is_selectie, selectie_ow_code, sort_order)
       VALUES ($1,$2,$3,$4::"OWTeamType",$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (seizoen, ow_code) DO UPDATE
         SET naam = EXCLUDED.naam, team_type = EXCLUDED.team_type, categorie = EXCLUDED.categorie,
             kleur = EXCLUDED.kleur, leeftijdsgroep = EXCLUDED.leeftijdsgroep,
             spelvorm = EXCLUDED.spelvorm, selectie_ow_code = EXCLUDED.selectie_ow_code,
             sort_order = EXCLUDED.sort_order
       RETURNING id`,
      [
        SEIZOEN,
        t.ow_code,
        t.naam,
        t.team_type,
        t.categorie,
        t.kleur,
        t.leeftijdsgroep,
        t.spelvorm,
        false, // 2025-2026 zet dit nergens; niet stilzwijgend afwijken
        t.selectie_ow_code,
        t.sort_order,
      ]
    );
    const teamId = rows[0].id;

    const jNummer = t.periodes.veld_najaar.j_nummer;
    await client.query(
      `INSERT INTO team_periodes (team_id, periode, j_nummer)
       VALUES ($1, 'veld_najaar', $2)
       ON CONFLICT (team_id, periode) DO UPDATE SET j_nummer = EXCLUDED.j_nummer`,
      [teamId, jNummer]
    );

    for (const alias of new Set([t.naam, jNummer].filter(Boolean))) {
      await client.query(
        `INSERT INTO team_aliases (seizoen, alias, ow_team_id, ow_code)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (seizoen, alias) DO UPDATE SET ow_team_id = EXCLUDED.ow_team_id,
                                                    ow_code = EXCLUDED.ow_code`,
        [SEIZOEN, alias, teamId, t.ow_code]
      );
    }
  }
  await client.query("COMMIT");
  out("COMMIT — teamregister weggeschreven.");
} catch (e) {
  await client.query("ROLLBACK");
  out(`FOUT — teruggedraaid: ${e.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
