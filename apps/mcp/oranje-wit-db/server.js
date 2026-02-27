const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { pool } = require('./db.js');

const server = new McpServer({
  name: 'oranje-wit-db',
  version: '1.0.0',
});

// --- Tool: ow_status ---
server.tool('ow_status', 'Database status: tabellen, rijen, laatste sync', {}, async () => {
  const res = await pool.query(`
    SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `);
  const counts = [];
  for (const row of res.rows) {
    const countRes = await pool.query(`SELECT COUNT(*) as n FROM "${row.tablename}"`);
    counts.push({ tabel: row.tablename, rijen: parseInt(countRes.rows[0].n) });
  }
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        tabellen: counts,
        totaal_rijen: counts.reduce((s, c) => s + c.rijen, 0),
      }, null, 2),
    }],
  };
});

// --- Tool: ow_query ---
server.tool('ow_query', 'Voer een SQL SELECT query uit', {
  sql: z.string().describe('SQL query (alleen SELECT)'),
  params: z.array(z.any()).optional().describe('Query parameters ($1, $2, ...)'),
}, async ({ sql, params }) => {
  const trimmed = sql.trim().toUpperCase();
  if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH') && !trimmed.startsWith('EXPLAIN')) {
    return { content: [{ type: 'text', text: 'Fout: alleen SELECT/WITH/EXPLAIN queries toegestaan.' }] };
  }
  const res = await pool.query(sql, params || []);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ rows: res.rows, rowCount: res.rowCount }, null, 2),
    }],
  };
});

// --- Tool: ow_leden_zoek ---
server.tool('ow_leden_zoek', 'Zoek leden op naam, team, geboortejaar, seizoen', {
  naam: z.string().optional().describe('Zoek op roepnaam of achternaam (ILIKE)'),
  team: z.string().optional().describe('Filter op team'),
  geboortejaar: z.number().optional().describe('Filter op geboortejaar'),
  seizoen: z.string().optional().describe('Seizoen (default: meest recente)'),
}, async ({ naam, team, geboortejaar, seizoen }) => {
  const conditions = [];
  const params = [];
  let i = 1;

  if (naam) { conditions.push(`(l.roepnaam ILIKE $${i} OR l.achternaam ILIKE $${i})`); params.push(`%${naam}%`); i++; }
  if (team) { conditions.push(`ss.team = $${i}`); params.push(team); i++; }
  if (geboortejaar) { conditions.push(`l.geboortejaar = $${i}`); params.push(geboortejaar); i++; }

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
    ${conditions.length ? 'AND ' + conditions.join(' AND ') : ''}
    ORDER BY l.achternaam, l.roepnaam
    LIMIT 100
  `;

  const res = await pool.query(sql, params);
  return { content: [{ type: 'text', text: JSON.stringify({ resultaten: res.rows, aantal: res.rowCount }, null, 2) }] };
});

// --- Tool: ow_team_info ---
server.tool('ow_team_info', 'Team ophalen met periodedata en spelers', {
  ow_code: z.string().describe('Stabiele team-ID (bijv. R1, O2, U15-1)'),
  seizoen: z.string().describe('Seizoen (bijv. 2025-2026)'),
}, async ({ ow_code, seizoen }) => {
  const teamRes = await pool.query(
    `SELECT * FROM teams WHERE ow_code = $1 AND seizoen = $2`, [ow_code, seizoen]
  );
  if (teamRes.rowCount === 0) {
    return { content: [{ type: 'text', text: `Team ${ow_code} niet gevonden in seizoen ${seizoen}` }] };
  }
  const team = teamRes.rows[0];
  const periodesRes = await pool.query(
    `SELECT * FROM team_periodes WHERE team_id = $1 ORDER BY CASE periode
      WHEN 'veld_najaar' THEN 1 WHEN 'zaal_deel1' THEN 2
      WHEN 'zaal_deel2' THEN 3 WHEN 'veld_voorjaar' THEN 4 END`, [team.id]
  );
  // Spelers uit speler_seizoenen (telling-naam = team)
  const spelersRes = await pool.query(
    `SELECT l.rel_code, l.roepnaam, l.achternaam, l.geslacht, l.geboortejaar
     FROM speler_seizoenen ss
     JOIN leden l ON ss.rel_code = l.rel_code
     WHERE ss.seizoen = $1 AND ss.team = (
       SELECT tp.j_nummer FROM team_periodes tp WHERE tp.team_id = $2 AND tp.periode = 'veld_najaar' LIMIT 1
     )
     ORDER BY l.geboortejaar, l.achternaam`, [seizoen, team.id]
  );
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ team, periodes: periodesRes.rows, spelers: spelersRes.rows }, null, 2),
    }],
  };
});

// --- Tool: ow_spelerspad ---
server.tool('ow_spelerspad', 'Spelerspad van 1 speler over alle seizoenen', {
  speler_id: z.string().optional().describe('rel_code van de speler'),
  naam: z.string().optional().describe('Zoek op naam (als rel_code onbekend)'),
}, async ({ speler_id, naam }) => {
  let relCode = speler_id;
  if (!relCode && naam) {
    const zoek = await pool.query(
      `SELECT rel_code, roepnaam, achternaam FROM leden WHERE roepnaam ILIKE $1 OR achternaam ILIKE $1 LIMIT 5`,
      [`%${naam}%`]
    );
    if (zoek.rowCount === 0) return { content: [{ type: 'text', text: `Geen speler gevonden met naam "${naam}"` }] };
    if (zoek.rowCount > 1) return { content: [{ type: 'text', text: JSON.stringify({ meerdere_matches: zoek.rows }, null, 2) }] };
    relCode = zoek.rows[0].rel_code;
  }
  if (!relCode) return { content: [{ type: 'text', text: 'Geef speler_id of naam mee.' }] };

  const lidRes = await pool.query(`SELECT * FROM leden WHERE rel_code = $1`, [relCode]);
  const padRes = await pool.query(
    `SELECT ss.seizoen, ss.team, ss.geslacht, ss.bron,
            cs.competitie, cs.team as competitie_team
     FROM speler_seizoenen ss
     LEFT JOIN competitie_spelers cs ON cs.speler_seizoen_id = ss.id
     WHERE ss.rel_code = $1
     ORDER BY ss.seizoen, cs.competitie`, [relCode]
  );
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ speler: lidRes.rows[0] || null, pad: padRes.rows, seizoenen: padRes.rowCount }, null, 2),
    }],
  };
});

// --- Tool: ow_verloop ---
server.tool('ow_verloop', 'Verloop-samenvatting per seizoen', {
  seizoen: z.string().describe('Seizoen (bijv. 2025-2026)'),
}, async ({ seizoen }) => {
  const summary = await pool.query(`
    SELECT status, COUNT(*) as aantal,
           ROUND(AVG(leeftijd_nieuw)::numeric, 1) as gem_leeftijd
    FROM ledenverloop WHERE seizoen = $1 GROUP BY status ORDER BY status
  `, [seizoen]);
  const detail = await pool.query(`
    SELECT geslacht, status, COUNT(*) as aantal
    FROM ledenverloop WHERE seizoen = $1 GROUP BY geslacht, status ORDER BY geslacht, status
  `, [seizoen]);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ seizoen, samenvatting: summary.rows, per_geslacht: detail.rows }, null, 2),
    }],
  };
});

// --- Tool: ow_cohort ---
server.tool('ow_cohort', 'Cohortdata per geboortejaar/geslacht', {
  geboortejaar: z.number().describe('Geboortejaar'),
  geslacht: z.string().optional().describe('M of V (optioneel)'),
}, async ({ geboortejaar, geslacht }) => {
  const params = [geboortejaar];
  let filter = 'geboortejaar = $1';
  if (geslacht) { filter += ' AND geslacht = $2'; params.push(geslacht); }
  const res = await pool.query(
    `SELECT * FROM cohort_seizoenen WHERE ${filter} ORDER BY seizoen`, params
  );
  return { content: [{ type: 'text', text: JSON.stringify({ geboortejaar, rijen: res.rows }, null, 2) }] };
});

// --- Tool: ow_signalering ---
server.tool('ow_signalering', 'Actieve alerts ophalen', {
  seizoen: z.string().describe('Seizoen'),
  ernst: z.string().optional().describe('Filter op ernst: kritiek, aandacht, op_koers'),
}, async ({ seizoen, ernst }) => {
  const params = [seizoen];
  let filter = 'seizoen = $1';
  if (ernst) { filter += ' AND ernst = $2'; params.push(ernst); }
  const res = await pool.query(`SELECT * FROM signalering WHERE ${filter} ORDER BY ernst, type`, params);
  return { content: [{ type: 'text', text: JSON.stringify({ seizoen, alerts: res.rows, aantal: res.rowCount }, null, 2) }] };
});

// --- Sync tools ---
const sync = require('./tools/sync.js');

server.tool('ow_sync_leden', 'Importeer leden JSON naar DB', {
  pad: z.string().describe('Relatief pad naar leden JSON (bijv. data/leden/alle-leden.json)'),
}, async ({ pad }) => {
  const result = await sync.syncLeden(pad);
  return { content: [{ type: 'text', text: JSON.stringify({ leden_geimporteerd: result }, null, 2) }] };
});

server.tool('ow_sync_teams', 'Importeer teams.json naar DB', {
  seizoen: z.string().describe('Seizoen (bijv. 2025-2026)'),
}, async ({ seizoen }) => {
  const result = await sync.syncTeams(seizoen);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

server.tool('ow_sync_alles', 'Volledige sync: leden + teams → DB', {}, async () => {
  const result = await sync.syncAlles();
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// --- Start server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Oranje Wit MCP server gestart');
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
