// scripts/migratie-selectie-groep.mjs
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// 1. Maak tabellen aan
await client.query(`
  CREATE TABLE IF NOT EXISTS "SelectieGroep" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "versieId" TEXT NOT NULL REFERENCES "Versie"(id) ON DELETE CASCADE,
    naam TEXT
  );
  CREATE INDEX IF NOT EXISTS "SelectieGroep_versieId_idx" ON "SelectieGroep"("versieId");

  CREATE TABLE IF NOT EXISTS "SelectieSpeler" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "selectieGroepId" TEXT NOT NULL REFERENCES "SelectieGroep"(id) ON DELETE CASCADE,
    "spelerId" TEXT NOT NULL REFERENCES "Speler"(id),
    "statusOverride" TEXT,
    notitie TEXT,
    CONSTRAINT "SelectieSpeler_selectieGroepId_spelerId_key" UNIQUE ("selectieGroepId", "spelerId")
  );
  CREATE INDEX IF NOT EXISTS "SelectieSpeler_selectieGroepId_idx" ON "SelectieSpeler"("selectieGroepId");
  CREATE INDEX IF NOT EXISTS "SelectieSpeler_spelerId_idx" ON "SelectieSpeler"("spelerId");

  CREATE TABLE IF NOT EXISTS "SelectieStaf" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "selectieGroepId" TEXT NOT NULL REFERENCES "SelectieGroep"(id) ON DELETE CASCADE,
    "stafId" TEXT NOT NULL REFERENCES "Staf"(id),
    rol TEXT NOT NULL,
    CONSTRAINT "SelectieStaf_selectieGroepId_stafId_key" UNIQUE ("selectieGroepId", "stafId")
  );
  CREATE INDEX IF NOT EXISTS "SelectieStaf_selectieGroepId_idx" ON "SelectieStaf"("selectieGroepId");
`);

console.log("Tabellen aangemaakt");

// 1b. Drop oude FK constraint EERST (self-reference Team -> Team)
// zodat we selectieGroepId naar SelectieGroep ids kunnen laten wijzen
await client.query(`
  ALTER TABLE "Team" DROP CONSTRAINT IF EXISTS "Team_selectieGroepId_fkey";
`);
console.log("Oude FK constraint gedropd");

// 2. Migreer bestaande selectie-data
// Zoek alle teams die een selectieGroepId hebben (= leden van een selectie)
// Het team waar selectieGroepId naar verwijst is de "leider"
const { rows: leiders } = await client.query(`
  SELECT DISTINCT t_leider.id as leider_id, t_leider."versieId"
  FROM "Team" t_lid
  JOIN "Team" t_leider ON t_leider.id = t_lid."selectieGroepId"
`);

console.log(`${leiders.length} bestaande selecties gevonden`);

for (const leider of leiders) {
  // Maak SelectieGroep aan
  const {
    rows: [groep],
  } = await client.query(
    `
    INSERT INTO "SelectieGroep" (id, "versieId")
    VALUES (gen_random_uuid()::text, $1)
    RETURNING id
  `,
    [leider.versieId]
  );

  console.log(`  SelectieGroep ${groep.id} voor leider ${leider.leider_id}`);

  // Verplaats spelers van leider-team naar SelectieSpeler
  await client.query(
    `
    INSERT INTO "SelectieSpeler" (id, "selectieGroepId", "spelerId", "statusOverride", notitie)
    SELECT gen_random_uuid()::text, $1, ts."spelerId", ts."statusOverride", ts.notitie
    FROM "TeamSpeler" ts
    WHERE ts."teamId" = $2
  `,
    [groep.id, leider.leider_id]
  );

  // Verplaats staf van leider-team naar SelectieStaf
  await client.query(
    `
    INSERT INTO "SelectieStaf" (id, "selectieGroepId", "stafId", rol)
    SELECT gen_random_uuid()::text, $1, ts."stafId", ts.rol
    FROM "TeamStaf" ts
    WHERE ts."teamId" = $2
  `,
    [groep.id, leider.leider_id]
  );

  // Verwijder TeamSpeler/TeamStaf van leider-team
  await client.query(`DELETE FROM "TeamSpeler" WHERE "teamId" = $1`, [leider.leider_id]);
  await client.query(`DELETE FROM "TeamStaf" WHERE "teamId" = $1`, [leider.leider_id]);

  // Stel selectieGroepId in op alle teams (leider + leden)
  await client.query(
    `
    UPDATE "Team" SET "selectieGroepId" = $1
    WHERE id = $2 OR "selectieGroepId" = $2
  `,
    [groep.id, leider.leider_id]
  );
}

// 3. Maak nieuwe FK constraint aan (Team -> SelectieGroep)
await client.query(`
  ALTER TABLE "Team" ADD CONSTRAINT "Team_selectieGroepId_fkey"
    FOREIGN KEY ("selectieGroepId") REFERENCES "SelectieGroep"(id) ON DELETE SET NULL;
`);

console.log("FK constraint bijgewerkt");

// Verify
const {
  rows: [count],
} = await client.query(`SELECT count(*) FROM "SelectieGroep"`);
console.log(`\nKlaar. ${count.count} SelectieGroepen aangemaakt.`);

await client.end();
