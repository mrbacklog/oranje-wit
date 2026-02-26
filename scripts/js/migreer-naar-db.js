#!/usr/bin/env node
/**
 * Eenmalig migratiescript: alle JSON data → PostgreSQL op Railway.
 * Gebruik: node scripts/migreer-naar-db.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
process.env.OW_ROOT = require('path').resolve(__dirname, '..', '..');

const { pool } = require('../../apps/mcp/oranje-wit-db/db.js');
const sync = require('../../apps/mcp/oranje-wit-db/tools/sync.js');

async function main() {
  console.log('=== Oranje Wit JSON → PostgreSQL migratie ===\n');

  console.log('1. Seizoenen aanmaken...');
  const seizoenen = await sync.syncSeizoenen();
  console.log(`   ✓ ${seizoenen} seizoenen`);

  console.log('\n2. Snapshots importeren...');
  const fs = require('fs');
  const path = require('path');
  const snapshotDir = path.resolve(__dirname, '..', '..', 'data/leden/snapshots');
  const snapshotFiles = fs.readdirSync(snapshotDir)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
    .sort();

  for (const file of snapshotFiles) {
    try {
      const result = await sync.syncSnapshot(`data/leden/snapshots/${file}`);
      console.log(`   ✓ ${file}: ${result.leden} leden (seizoen ${result.seizoen})`);
    } catch (err) {
      console.log(`   ✗ ${file}: ${err.message}`);
    }
  }

  console.log('\n3. Teams importeren...');
  try {
    const teamsResult = await sync.syncTeams('2025-2026');
    console.log(`   ✓ ${teamsResult.teams} teams (seizoen 2025-2026)`);
  } catch (err) {
    console.log(`   ✗ Teams: ${err.message}`);
  }

  console.log('\n4. Spelerspaden importeren...');
  try {
    const padenResult = await sync.syncSpelerspaden();
    console.log(`   ✓ ${padenResult.rijen} spelerspad-rijen`);
  } catch (err) {
    console.log(`   ✗ Spelerspaden: ${err.message}`);
  }

  console.log('\n5. Ledenverloop importeren...');
  try {
    const verloopResult = await sync.syncVerloop();
    console.log(`   ✓ ${verloopResult.bestanden} bestanden, ${verloopResult.rijen} rijen`);
  } catch (err) {
    console.log(`   ✗ Verloop: ${err.message}`);
  }

  console.log('\n6. Cohorten importeren...');
  try {
    const cohortenResult = await sync.syncCohorten();
    console.log(`   ✓ ${cohortenResult.rijen} cohort-rijen`);
  } catch (err) {
    console.log(`   ✗ Cohorten: ${err.message}`);
  }

  console.log('\n7. Signalering importeren...');
  try {
    const sigResult = await sync.syncSignalering('2025-2026');
    console.log(`   ✓ ${sigResult.alerts} alerts (seizoen 2025-2026)`);
  } catch (err) {
    console.log(`   ✗ Signalering: ${err.message}`);
  }

  // Samenvatting
  console.log('\n=== Samenvatting ===');
  const counts = await pool.query(`
    SELECT 'leden' as tabel, COUNT(*)::int as rijen FROM leden
    UNION ALL SELECT 'snapshots', COUNT(*)::int FROM snapshots
    UNION ALL SELECT 'leden_snapshot', COUNT(*)::int FROM leden_snapshot
    UNION ALL SELECT 'teams', COUNT(*)::int FROM teams
    UNION ALL SELECT 'team_periodes', COUNT(*)::int FROM team_periodes
    UNION ALL SELECT 'spelerspaden', COUNT(*)::int FROM spelerspaden
    UNION ALL SELECT 'ledenverloop', COUNT(*)::int FROM ledenverloop
    UNION ALL SELECT 'cohort_seizoenen', COUNT(*)::int FROM cohort_seizoenen
    UNION ALL SELECT 'signalering', COUNT(*)::int FROM signalering
    ORDER BY tabel
  `);
  for (const row of counts.rows) {
    console.log(`   ${row.tabel}: ${row.rijen} rijen`);
  }

  await pool.end();
  console.log('\n✓ Migratie voltooid!');
}

main().catch(err => {
  console.error('Fout:', err);
  pool.end();
  process.exit(1);
});
