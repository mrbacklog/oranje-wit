const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  // U19 teams + selectieGroepId
  const teams = await c.query(
    `SELECT t.naam, t.id, t."selectieGroepId"
     FROM "Team" t WHERE t.naam LIKE 'U19%' ORDER BY t.naam`
  );
  console.log("U19 teams:", teams.rows);

  // Spelers in U19 teams (of in leider als gekoppeld)
  const leider = teams.rows.find((t) => !t.selectieGroepId);
  const teamIds = teams.rows.map((t) => t.id);

  const spelers = await c.query(
    `SELECT s."roepnaam", s."achternaam", s."geboortejaar", s."geslacht"::text, t.naam
     FROM "TeamSpeler" ts
     JOIN "Speler" s ON s.id = ts."spelerId"
     JOIN "Team" t ON t.id = ts."teamId"
     WHERE ts."teamId" = ANY($1)
     ORDER BY s."geslacht", s."achternaam"`,
    [teamIds]
  );

  const m = spelers.rows.filter((r) => r.geslacht === "M").length;
  const v = spelers.rows.filter((r) => r.geslacht === "V").length;
  console.log(`\nU19 selectie: ${spelers.rows.length} spelers (${m}M / ${v}V)`);
  spelers.rows.forEach((r) =>
    console.log(`  ${r.roepnaam} ${r.achternaam} (${r.geboortejaar}, ${r.geslacht}) → ${r.naam}`)
  );

  await c.end();
}
main().catch(console.error);
