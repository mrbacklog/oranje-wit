const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const { pool } = require("./db.js");

const server = new McpServer({
  name: "oranje-wit-db",
  version: "1.0.0",
});

// --- Tool: ow_status ---
server.tool("ow_status", "Database status: tabellen, rijen, laatste sync", {}, async () => {
  const res = await pool.query(`
    SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `);
  const counts = [];
  for (const row of res.rows) {
    const countRes = await pool.query(`SELECT COUNT(*) as n FROM "${row.tablename}"`);
    counts.push({ tabel: row.tablename, rijen: parseInt(countRes.rows[0].n) });
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            tabellen: counts,
            totaal_rijen: counts.reduce((s, c) => s + c.rijen, 0),
          },
          null,
          2
        ),
      },
    ],
  };
});

// --- Tool: ow_query ---
server.tool(
  "ow_query",
  "Voer een SQL SELECT query uit",
  {
    sql: z.string().describe("SQL query (alleen SELECT)"),
    params: z.array(z.any()).optional().describe("Query parameters ($1, $2, ...)"),
  },
  async ({ sql, params }) => {
    const trimmed = sql.trim().toUpperCase();
    if (
      !trimmed.startsWith("SELECT") &&
      !trimmed.startsWith("WITH") &&
      !trimmed.startsWith("EXPLAIN")
    ) {
      return {
        content: [{ type: "text", text: "Fout: alleen SELECT/WITH/EXPLAIN queries toegestaan." }],
      };
    }
    const res = await pool.query(sql, params || []);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ rows: res.rows, rowCount: res.rowCount }, null, 2),
        },
      ],
    };
  }
);

// --- Tool: ow_leden_zoek ---
server.tool(
  "ow_leden_zoek",
  "Zoek leden op naam, team, geboortejaar, seizoen",
  {
    naam: z.string().optional().describe("Zoek op roepnaam of achternaam (ILIKE)"),
    team: z.string().optional().describe("Filter op team"),
    geboortejaar: z.number().optional().describe("Filter op geboortejaar"),
    seizoen: z.string().optional().describe("Seizoen (default: meest recente)"),
  },
  async ({ naam, team, geboortejaar, seizoen }) => {
    const conditions = [];
    const params = [];
    let i = 1;

    if (naam) {
      conditions.push(`(l.roepnaam ILIKE $${i} OR l.achternaam ILIKE $${i})`);
      params.push(`%${naam}%`);
      i++;
    }
    if (team) {
      conditions.push(`ss.team = $${i}`);
      params.push(team);
      i++;
    }
    if (geboortejaar) {
      conditions.push(`l.geboortejaar = $${i}`);
      params.push(geboortejaar);
      i++;
    }

    let seizoenFilter;
    if (seizoen) {
      seizoenFilter = `ss.seizoen = $${i}`;
      params.push(seizoen);
      i++;
    } else {
      seizoenFilter = `ss.seizoen = (SELECT MAX(seizoen) FROM speler_seizoenen)`;
    }

    const sql = `
    SELECT l.rel_code, l.roepnaam, l.tussenvoegsel, l.achternaam, l.geslacht, l.geboortejaar,
           ss.team, ss.seizoen
    FROM leden l
    JOIN speler_seizoenen ss ON l.rel_code = ss.rel_code
    WHERE ${seizoenFilter}
    ${conditions.length ? "AND " + conditions.join(" AND ") : ""}
    ORDER BY l.achternaam, l.roepnaam
    LIMIT 100
  `;

    const res = await pool.query(sql, params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ resultaten: res.rows, aantal: res.rowCount }, null, 2),
        },
      ],
    };
  }
);

// --- Tool: ow_team_info ---
server.tool(
  "ow_team_info",
  "Team ophalen met periodedata en spelers",
  {
    ow_code: z.string().describe("Stabiele team-ID (bijv. R1, O2, U15-1)"),
    seizoen: z.string().describe("Seizoen (bijv. 2025-2026)"),
  },
  async ({ ow_code, seizoen }) => {
    const teamRes = await pool.query(`SELECT * FROM teams WHERE ow_code = $1 AND seizoen = $2`, [
      ow_code,
      seizoen,
    ]);
    if (teamRes.rowCount === 0) {
      return {
        content: [{ type: "text", text: `Team ${ow_code} niet gevonden in seizoen ${seizoen}` }],
      };
    }
    const team = teamRes.rows[0];
    const periodesRes = await pool.query(
      `SELECT * FROM team_periodes WHERE team_id = $1 ORDER BY CASE periode
      WHEN 'veld_najaar' THEN 1 WHEN 'zaal_deel1' THEN 2
      WHEN 'zaal_deel2' THEN 3 WHEN 'veld_voorjaar' THEN 4 END`,
      [team.id]
    );
    // Spelers uit speler_seizoenen (telling-naam = team)
    const spelersRes = await pool.query(
      `SELECT l.rel_code, l.roepnaam, l.achternaam, l.geslacht, l.geboortejaar
     FROM speler_seizoenen ss
     JOIN leden l ON ss.rel_code = l.rel_code
     WHERE ss.seizoen = $1 AND ss.team = (
       SELECT tp.j_nummer FROM team_periodes tp WHERE tp.team_id = $2 AND tp.periode = 'veld_najaar' LIMIT 1
     )
     ORDER BY l.geboortejaar, l.achternaam`,
      [seizoen, team.id]
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { team, periodes: periodesRes.rows, spelers: spelersRes.rows },
            null,
            2
          ),
        },
      ],
    };
  }
);

// --- Tool: ow_spelerspad ---
server.tool(
  "ow_spelerspad",
  "Spelerspad van 1 speler over alle seizoenen",
  {
    speler_id: z.string().optional().describe("rel_code van de speler"),
    naam: z.string().optional().describe("Zoek op naam (als rel_code onbekend)"),
  },
  async ({ speler_id, naam }) => {
    let relCode = speler_id;
    if (!relCode && naam) {
      const zoek = await pool.query(
        `SELECT rel_code, roepnaam, achternaam FROM leden WHERE roepnaam ILIKE $1 OR achternaam ILIKE $1 LIMIT 5`,
        [`%${naam}%`]
      );
      if (zoek.rowCount === 0)
        return { content: [{ type: "text", text: `Geen speler gevonden met naam "${naam}"` }] };
      if (zoek.rowCount > 1)
        return {
          content: [
            { type: "text", text: JSON.stringify({ meerdere_matches: zoek.rows }, null, 2) },
          ],
        };
      relCode = zoek.rows[0].rel_code;
    }
    if (!relCode) return { content: [{ type: "text", text: "Geef speler_id of naam mee." }] };

    const lidRes = await pool.query(`SELECT * FROM leden WHERE rel_code = $1`, [relCode]);
    const padRes = await pool.query(
      `SELECT seizoen, team, geslacht, bron, competitie
     FROM competitie_spelers
     WHERE rel_code = $1
     ORDER BY seizoen,
       CASE competitie
         WHEN 'veld_najaar' THEN 1 WHEN 'zaal' THEN 2 WHEN 'veld_voorjaar' THEN 3
       END`,
      [relCode]
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { speler: lidRes.rows[0] || null, pad: padRes.rows, seizoenen: padRes.rowCount },
            null,
            2
          ),
        },
      ],
    };
  }
);

// --- Tool: ow_verloop ---
server.tool(
  "ow_verloop",
  "Verloop-samenvatting per seizoen",
  {
    seizoen: z.string().describe("Seizoen (bijv. 2025-2026)"),
  },
  async ({ seizoen }) => {
    const summary = await pool.query(
      `
    SELECT status, COUNT(*) as aantal,
           ROUND(AVG(leeftijd_nieuw)::numeric, 1) as gem_leeftijd
    FROM ledenverloop WHERE seizoen = $1 GROUP BY status ORDER BY status
  `,
      [seizoen]
    );
    const detail = await pool.query(
      `
    SELECT geslacht, status, COUNT(*) as aantal
    FROM ledenverloop WHERE seizoen = $1 GROUP BY geslacht, status ORDER BY geslacht, status
  `,
      [seizoen]
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { seizoen, samenvatting: summary.rows, per_geslacht: detail.rows },
            null,
            2
          ),
        },
      ],
    };
  }
);

// --- Tool: ow_cohort ---
server.tool(
  "ow_cohort",
  "Cohortdata per geboortejaar/geslacht",
  {
    geboortejaar: z.number().describe("Geboortejaar"),
    geslacht: z.string().optional().describe("M of V (optioneel)"),
  },
  async ({ geboortejaar, geslacht }) => {
    const params = [geboortejaar];
    let filter = "geboortejaar = $1";
    if (geslacht) {
      filter += " AND geslacht = $2";
      params.push(geslacht);
    }
    const res = await pool.query(
      `SELECT * FROM cohort_seizoenen WHERE ${filter} ORDER BY seizoen`,
      params
    );
    return {
      content: [{ type: "text", text: JSON.stringify({ geboortejaar, rijen: res.rows }, null, 2) }],
    };
  }
);

// --- Tool: ow_signalering ---
server.tool(
  "ow_signalering",
  "Actieve alerts ophalen",
  {
    seizoen: z.string().describe("Seizoen"),
    ernst: z.string().optional().describe("Filter op ernst: kritiek, aandacht, op_koers"),
  },
  async ({ seizoen, ernst }) => {
    const params = [seizoen];
    let filter = "seizoen = $1";
    if (ernst) {
      filter += " AND ernst = $2";
      params.push(ernst);
    }
    const res = await pool.query(
      `SELECT * FROM signalering WHERE ${filter} ORDER BY ernst, type`,
      params
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ seizoen, alerts: res.rows, aantal: res.rowCount }, null, 2),
        },
      ],
    };
  }
);

// --- Tool: ow_seizoenen ---
server.tool("ow_seizoenen", "Alle bekende seizoenen met status", {}, async () => {
  const res = await pool.query(
    `SELECT seizoen, start_jaar, eind_jaar, status FROM seizoenen ORDER BY seizoen DESC`
  );
  return {
    content: [{ type: "text", text: JSON.stringify({ seizoenen: res.rows }, null, 2) }],
  };
});

// --- Tool: ow_blauwdruk ---
server.tool(
  "ow_blauwdruk",
  "Blauwdruk + concepten + scenario-namen voor een seizoen",
  {
    seizoen: z.string().describe('Seizoen (bijv. "2026-2027")'),
  },
  async ({ seizoen }) => {
    const bRes = await pool.query(`SELECT * FROM "Blauwdruk" WHERE seizoen = $1`, [seizoen]);
    if (bRes.rowCount === 0) {
      return { content: [{ type: "text", text: `Geen blauwdruk gevonden voor ${seizoen}` }] };
    }
    const blauwdruk = bRes.rows[0];

    const cRes = await pool.query(
      `SELECT c.id, c.naam, c.uitgangsprincipe, c.status, c.volgorde,
              json_agg(json_build_object('id', s.id, 'naam', s.naam, 'status', s.status, 'isWerkindeling', s."isWerkindeling") ORDER BY s."createdAt") FILTER (WHERE s.id IS NOT NULL) AS scenarios
       FROM "Concept" c
       LEFT JOIN "Scenario" s ON s."conceptId" = c.id AND s."verwijderdOp" IS NULL
       WHERE c."blauwdrukId" = $1
       GROUP BY c.id ORDER BY c.volgorde`,
      [blauwdruk.id]
    );

    const pinsRes = await pool.query(
      `SELECT COUNT(*) AS aantal FROM "Pin" WHERE "blauwdrukId" = $1`,
      [blauwdruk.id]
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              blauwdruk: {
                id: blauwdruk.id,
                seizoen: blauwdruk.seizoen,
                isWerkseizoen: blauwdruk.isWerkseizoen,
                toelichting: blauwdruk.toelichting,
                speerpunten: blauwdruk.speerpunten,
                aantalPins: parseInt(pinsRes.rows[0].aantal),
              },
              concepten: cRes.rows,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// --- Tool: ow_scenario ---
server.tool(
  "ow_scenario",
  "Scenario ophalen met teams en spelerslijsten (laatste versie)",
  {
    scenarioId: z.string().describe("Scenario ID (cuid)"),
  },
  async ({ scenarioId }) => {
    const sRes = await pool.query(
      `SELECT s.*, c.naam AS concept_naam, c."blauwdrukId"
       FROM "Scenario" s JOIN "Concept" c ON c.id = s."conceptId"
       WHERE s.id = $1`,
      [scenarioId]
    );
    if (sRes.rowCount === 0) {
      return { content: [{ type: "text", text: `Scenario ${scenarioId} niet gevonden` }] };
    }
    const scenario = sRes.rows[0];

    // Laatste versie
    const vRes = await pool.query(
      `SELECT * FROM "Versie" WHERE "scenarioId" = $1 ORDER BY nummer DESC LIMIT 1`,
      [scenarioId]
    );
    if (vRes.rowCount === 0) {
      return {
        content: [
          { type: "text", text: JSON.stringify({ scenario, versie: null, teams: [] }, null, 2) },
        ],
      };
    }
    const versie = vRes.rows[0];

    // Teams met spelers en staf
    const tRes = await pool.query(
      `SELECT t.id, t.naam, t.alias, t.categorie, t.kleur, t."teamType", t.niveau, t.volgorde,
              t."validatieStatus",
              COALESCE(json_agg(
                json_build_object(
                  'id', sp.id, 'roepnaam', sp.roepnaam, 'achternaam', sp.achternaam,
                  'geslacht', sp.geslacht, 'geboortejaar', sp.geboortejaar,
                  'status', COALESCE(ts."statusOverride"::text, sp.status::text)
                ) ORDER BY sp.geboortejaar, sp.achternaam
              ) FILTER (WHERE sp.id IS NOT NULL), '[]') AS spelers
       FROM "Team" t
       LEFT JOIN "TeamSpeler" ts ON ts."teamId" = t.id
       LEFT JOIN "Speler" sp ON sp.id = ts."spelerId"
       WHERE t."versieId" = $1
       GROUP BY t.id ORDER BY t.volgorde`,
      [versie.id]
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              scenario: {
                id: scenario.id,
                naam: scenario.naam,
                status: scenario.status,
                isWerkindeling: scenario.isWerkindeling,
                concept: scenario.concept_naam,
              },
              versie: {
                id: versie.id,
                nummer: versie.nummer,
                naam: versie.naam,
                auteur: versie.auteur,
                createdAt: versie.createdAt,
              },
              teams: tRes.rows,
              aantalTeams: tRes.rowCount,
              aantalSpelers: tRes.rows.reduce((s, t) => s + (t.spelers?.length || 0), 0),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// --- Tool: ow_evaluaties ---
server.tool(
  "ow_evaluaties",
  "Evaluaties ophalen per speler, seizoen of ronde",
  {
    spelerId: z.string().optional().describe("Speler ID (rel_code)"),
    seizoen: z.string().optional().describe("Seizoen (bijv. 2025-2026)"),
    ronde: z.number().optional().describe("Ronde nummer"),
  },
  async ({ spelerId, seizoen, ronde }) => {
    const conditions = [];
    const params = [];
    let i = 1;

    if (spelerId) {
      conditions.push(`e."spelerId" = $${i++}`);
      params.push(spelerId);
    }
    if (seizoen) {
      conditions.push(`e.seizoen = $${i++}`);
      params.push(seizoen);
    }
    if (ronde) {
      conditions.push(`e.ronde = $${i++}`);
      params.push(ronde);
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
    const res = await pool.query(
      `SELECT e.id, e."spelerId", sp.roepnaam, sp.achternaam,
              e.seizoen, e.ronde, e.type, e.scores, e.opmerking,
              e."teamNaam", e.status, e."ingediendOp"
       FROM "Evaluatie" e
       JOIN "Speler" sp ON sp.id = e."spelerId"
       ${where}
       ORDER BY e.seizoen DESC, e.ronde, sp.achternaam
       LIMIT 200`,
      params
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ evaluaties: res.rows, aantal: res.rowCount }, null, 2),
        },
      ],
    };
  }
);

// --- Tool: ow_speler_score ---
server.tool(
  "ow_speler_score",
  "USS score (Geunificeerde Score Schaal) voor een speler",
  {
    spelerId: z.string().optional().describe("Speler ID (rel_code)"),
    naam: z.string().optional().describe("Zoek op naam als spelerId onbekend"),
    seizoen: z.string().optional().describe("Seizoen — leeg = meest recente"),
  },
  async ({ spelerId, naam, seizoen }) => {
    let id = spelerId;

    if (!id && naam) {
      const zoek = await pool.query(
        `SELECT id, roepnaam, achternaam FROM "Speler" WHERE roepnaam ILIKE $1 OR achternaam ILIKE $1 LIMIT 5`,
        [`%${naam}%`]
      );
      if (zoek.rowCount === 0)
        return { content: [{ type: "text", text: `Geen speler gevonden met naam "${naam}"` }] };
      if (zoek.rowCount > 1)
        return {
          content: [{ type: "text", text: JSON.stringify({ meerdere_matches: zoek.rows }) }],
        };
      id = zoek.rows[0].id;
    }
    if (!id) return { content: [{ type: "text", text: "Geef spelerId of naam mee." }] };

    const seizoenFilter = seizoen
      ? `u.seizoen = $2`
      : `u.seizoen = (SELECT MAX(seizoen) FROM speler_uss WHERE "spelerId" = $1)`;
    const params = seizoen ? [id, seizoen] : [id];

    const res = await pool.query(
      `SELECT sp.id, sp.roepnaam, sp.achternaam, sp.geboortejaar, sp.geslacht,
              u.seizoen, u.leeftijdsgroep,
              u.uss_overall, u.uss_pijlers,
              u.uss_coach, u.uss_scout, u.uss_vergelijking, u.uss_team, u.uss_basislijn,
              u.betrouwbaarheid,
              u.aantal_coach_sessies, u.aantal_scout_sessies, u.aantal_vergelijkingen
       FROM "Speler" sp
       JOIN speler_uss u ON u."spelerId" = sp.id
       WHERE u."spelerId" = $1 AND ${seizoenFilter}`,
      params
    );

    if (res.rowCount === 0)
      return { content: [{ type: "text", text: `Geen USS score gevonden voor speler ${id}` }] };

    return {
      content: [{ type: "text", text: JSON.stringify(res.rows[0], null, 2) }],
    };
  }
);

// --- Tool: ow_write ---
server.tool(
  "ow_write",
  "Gecontroleerde schrijfoperaties: speler-status, blauwdruk-gezien, teamspeler-plaatsing",
  {
    operatie: z
      .enum([
        "speler_status", // Speler.status + notitie bijwerken
        "blauwdruk_gezien", // BlauwdrukSpeler.gezienStatus + notitie
        "team_speler_toevoegen", // Speler aan team toevoegen
        "team_speler_verwijderen", // Speler uit team verwijderen
        "scenario_notitie", // Scenario.toelichting bijwerken
      ])
      .describe("Type mutatie"),
    params: z
      .record(z.any())
      .describe(
        "Parameters: speler_status={spelerId,status,notitie?} | blauwdruk_gezien={blauwdrukId,spelerId,gezienStatus,notitie?} | team_speler_toevoegen={teamId,spelerId,statusOverride?} | team_speler_verwijderen={teamId,spelerId} | scenario_notitie={scenarioId,toelichting}"
      ),
  },
  async ({ operatie, params: p }) => {
    try {
      let result;

      if (operatie === "speler_status") {
        const allowed = [
          "BESCHIKBAAR",
          "TWIJFELT",
          "GAAT_STOPPEN",
          "NIEUW_POTENTIEEL",
          "NIEUW_DEFINITIEF",
          "ALGEMEEN_RESERVE",
        ];
        if (!allowed.includes(p.status)) throw new Error(`Ongeldige status: ${p.status}`);
        const res = await pool.query(
          `UPDATE "Speler" SET status = $1, notitie = COALESCE($2, notitie), "updatedAt" = NOW() WHERE id = $3 RETURNING id, roepnaam, achternaam, status`,
          [p.status, p.notitie ?? null, p.spelerId]
        );
        result = { bijgewerkt: res.rows[0] };
      } else if (operatie === "blauwdruk_gezien") {
        const allowed = ["ONGEZIEN", "GROEN", "GEEL", "ORANJE", "ROOD"];
        if (!allowed.includes(p.gezienStatus))
          throw new Error(`Ongeldige gezienStatus: ${p.gezienStatus}`);
        const res = await pool.query(
          `UPDATE "BlauwdrukSpeler"
           SET "gezienStatus" = $1, notitie = COALESCE($2, notitie), "updatedAt" = NOW()
           WHERE "blauwdrukId" = $3 AND "spelerId" = $4
           RETURNING id, "gezienStatus"`,
          [p.gezienStatus, p.notitie ?? null, p.blauwdrukId, p.spelerId]
        );
        if (res.rowCount === 0) throw new Error("BlauwdrukSpeler record niet gevonden");
        result = { bijgewerkt: res.rows[0] };
      } else if (operatie === "team_speler_toevoegen") {
        const res = await pool.query(
          `INSERT INTO "TeamSpeler" (id, "teamId", "spelerId", "statusOverride")
           VALUES (gen_random_uuid(), $1, $2, $3)
           ON CONFLICT ("teamId", "spelerId") DO UPDATE SET "statusOverride" = EXCLUDED."statusOverride"
           RETURNING id`,
          [p.teamId, p.spelerId, p.statusOverride ?? null]
        );
        result = { geplaatst: { teamId: p.teamId, spelerId: p.spelerId, id: res.rows[0].id } };
      } else if (operatie === "team_speler_verwijderen") {
        const res = await pool.query(
          `DELETE FROM "TeamSpeler" WHERE "teamId" = $1 AND "spelerId" = $2 RETURNING id`,
          [p.teamId, p.spelerId]
        );
        result = { verwijderd: res.rowCount > 0, teamId: p.teamId, spelerId: p.spelerId };
      } else if (operatie === "scenario_notitie") {
        const res = await pool.query(
          `UPDATE "Scenario" SET toelichting = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id, naam`,
          [p.toelichting, p.scenarioId]
        );
        if (res.rowCount === 0) throw new Error("Scenario niet gevonden");
        result = { bijgewerkt: res.rows[0] };
      }

      return {
        content: [{ type: "text", text: JSON.stringify({ ok: true, ...result }, null, 2) }],
      };
    } catch (e) {
      return { content: [{ type: "text", text: JSON.stringify({ ok: false, fout: e.message }) }] };
    }
  }
);

// --- Sync tools ---
const sync = require("./tools/sync.js");

server.tool(
  "ow_sync_leden",
  "Importeer leden JSON naar DB",
  {
    pad: z.string().describe("Relatief pad naar leden JSON (bijv. data/leden/alle-leden.json)"),
  },
  async ({ pad }) => {
    const result = await sync.syncLeden(pad);
    return {
      content: [{ type: "text", text: JSON.stringify({ leden_geimporteerd: result }, null, 2) }],
    };
  }
);

server.tool(
  "ow_sync_teams",
  "Importeer teams.json naar DB",
  {
    seizoen: z.string().describe("Seizoen (bijv. 2025-2026)"),
  },
  async ({ seizoen }) => {
    const result = await sync.syncTeams(seizoen);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool("ow_sync_alles", "Volledige sync: leden + teams → DB", {}, async () => {
  const result = await sync.syncAlles();
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

// --- Start server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Oranje Wit MCP server gestart");
}

main().catch((err) => {
  console.error("MCP server error:", err);
  process.exit(1);
});
