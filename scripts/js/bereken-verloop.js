/**
 * bereken-verloop.js
 *
 * Task 4: Berekent individueel ledenverloop tussen opeenvolgende snapshots.
 *
 * Classificaties:
 * - behouden: rel_code in BEIDE snapshots met spelactiviteit korfbal
 * - nieuw: rel_code in nieuw snapshot (korfbal) maar NIET in vorig, en NIET in eerdere snapshots
 * - herinschrijver: rel_code in nieuw snapshot (korfbal), NIET in vorig, maar WEL in een eerder snapshot
 * - uitgestroomd: rel_code in vorig (korfbal) maar NIET in nieuw met korfbal
 * - niet_spelend_geworden: rel_code in vorig (korfbal), nog in nieuw maar spelactiviteit != korfbal
 *
 * Output: data/ledenverloop/individueel/YYYY-YYYY-verloop.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOTS_DIR = path.join(ROOT, 'data', 'leden', 'snapshots');
const OUTPUT_DIR = path.join(ROOT, 'data', 'ledenverloop', 'individueel');

// Auto-discover snapshot files from directory, sorted chronologically
function discoverSnapshots() {
  const files = fs.readdirSync(SNAPSHOTS_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('.'))
    .sort();

  return files.map(file => {
    const data = JSON.parse(fs.readFileSync(path.join(SNAPSHOTS_DIR, file), 'utf8'));
    const meta = data._meta || {};
    const snapshotYear = parseInt(meta.snapshot_datum || file.substring(0, 4), 10);
    return {
      file,
      seizoen: meta.seizoen || null,
      snapshot_year: snapshotYear,
      data,
    };
  });
}

// Build consecutive pairs: each pair covers the season of the NEWER snapshot
// snapshot 2010-06-01 (seizoen 2010-2011) → snapshot 2011-06-01 (seizoen 2011-2012)
// = verloop during 2011-2012, output file: 2011-2012-verloop.json
function buildPairs(snapshots) {
  const pairs = [];
  for (let i = 1; i < snapshots.length; i++) {
    const seizoen = snapshots[i].seizoen;
    if (!seizoen) continue;
    pairs.push({
      vorig_idx: i - 1,
      nieuw_idx: i,
      seizoen,
      file: `${seizoen}-verloop.json`,
    });
  }
  return pairs;
}

function getKorfbalMembers(snapshot) {
  return snapshot.leden.filter(l => l.spelactiviteit === 'korfbal');
}

function getAllMembers(snapshot) {
  return snapshot.leden;
}

function getLeeftijd(member, snapshotYear) {
  if (member.leeftijd_peildatum != null) {
    return member.leeftijd_peildatum;
  }
  return snapshotYear - member.geboortejaar;
}

function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Discover and load all snapshots
  console.log('Discovering snapshots...');
  const snapshots = discoverSnapshots();
  console.log(`Found ${snapshots.length} snapshots:`);
  snapshots.forEach(s => console.log(`  ${s.file} (${s.seizoen}, year=${s.snapshot_year})`));

  const PAIRS = buildPairs(snapshots);
  console.log(`\nProcessing ${PAIRS.length} pairs...\n`);

  // Build cumulative set of rel_codes seen in korfbal across all prior snapshots
  // For herinschrijver detection
  const allPriorKorfbalRelCodes = []; // allPriorKorfbalRelCodes[i] = Set of rel_codes seen in korfbal in snapshots 0..i-1

  for (let i = 0; i < snapshots.length; i++) {
    if (i === 0) {
      allPriorKorfbalRelCodes.push(new Set());
    } else {
      // Union of previous prior set + korfbal members from snapshot i-1
      const prev = new Set(allPriorKorfbalRelCodes[i - 1]);
      getKorfbalMembers(snapshots[i - 1].data).forEach(m => prev.add(m.rel_code));
      allPriorKorfbalRelCodes.push(prev);
    }
  }

  // Process each pair
  for (const pair of PAIRS) {
    const vorig = snapshots[pair.vorig_idx];
    const nieuw = snapshots[pair.nieuw_idx];

    const vorigKorfbal = getKorfbalMembers(vorig.data);
    const nieuwKorfbal = getKorfbalMembers(nieuw.data);
    const nieuwAll = getAllMembers(nieuw.data);

    // Create lookup maps
    const vorigKorfbalMap = new Map();
    vorigKorfbal.forEach(m => vorigKorfbalMap.set(m.rel_code, m));

    const nieuwKorfbalMap = new Map();
    nieuwKorfbal.forEach(m => nieuwKorfbalMap.set(m.rel_code, m));

    const nieuwAllMap = new Map();
    nieuwAll.forEach(m => nieuwAllMap.set(m.rel_code, m));

    // Prior korfbal rel_codes (before the vorig snapshot)
    const priorCodes = allPriorKorfbalRelCodes[pair.vorig_idx];

    const verloop = [];
    const samenvatting = { behouden: 0, nieuw: 0, herinschrijver: 0, uitgestroomd: 0, niet_spelend_geworden: 0 };

    // 1. Process all rel_codes in vorig korfbal
    for (const [relCode, vorigMember] of vorigKorfbalMap) {
      if (nieuwKorfbalMap.has(relCode)) {
        // behouden: in both as korfbal
        const nieuwMember = nieuwKorfbalMap.get(relCode);
        samenvatting.behouden++;
        verloop.push({
          rel_code: relCode,
          status: 'behouden',
          geboortejaar: vorigMember.geboortejaar,
          geslacht: vorigMember.geslacht,
          leeftijd_vorig: getLeeftijd(vorigMember, vorig.snapshot_year),
          leeftijd_nieuw: getLeeftijd(nieuwMember, nieuw.snapshot_year),
          team_vorig: vorigMember.team || null,
          team_nieuw: nieuwMember.team || null,
        });
      } else if (nieuwAllMap.has(relCode) && nieuwAllMap.get(relCode).spelactiviteit !== 'korfbal') {
        // niet_spelend_geworden: still in snapshot but no longer korfbal
        const nieuwMember = nieuwAllMap.get(relCode);
        samenvatting.niet_spelend_geworden++;
        verloop.push({
          rel_code: relCode,
          status: 'niet_spelend_geworden',
          geboortejaar: vorigMember.geboortejaar,
          geslacht: vorigMember.geslacht,
          leeftijd_vorig: getLeeftijd(vorigMember, vorig.snapshot_year),
          leeftijd_nieuw: getLeeftijd(nieuwMember, nieuw.snapshot_year),
          team_vorig: vorigMember.team || null,
          team_nieuw: nieuwMember.team || null,
        });
      } else {
        // uitgestroomd: not in new snapshot at all
        samenvatting.uitgestroomd++;
        verloop.push({
          rel_code: relCode,
          status: 'uitgestroomd',
          geboortejaar: vorigMember.geboortejaar,
          geslacht: vorigMember.geslacht,
          leeftijd_vorig: getLeeftijd(vorigMember, vorig.snapshot_year),
          leeftijd_nieuw: null,
          team_vorig: vorigMember.team || null,
          team_nieuw: null,
        });
      }
    }

    // 2. Process rel_codes in nieuw korfbal that are NOT in vorig korfbal
    for (const [relCode, nieuwMember] of nieuwKorfbalMap) {
      if (!vorigKorfbalMap.has(relCode)) {
        // Check if this person was in any earlier snapshot as korfbal
        // Also check if they were in vorigKorfbalMap (already handled above, won't be here)
        // priorCodes = codes from snapshots before vorig
        // We also need to check if they were in vorig as non-korfbal (they still count as new/herinschrijver)

        const wasInEarlierKorfbal = priorCodes.has(relCode);

        if (wasInEarlierKorfbal) {
          samenvatting.herinschrijver++;
          verloop.push({
            rel_code: relCode,
            status: 'herinschrijver',
            geboortejaar: nieuwMember.geboortejaar,
            geslacht: nieuwMember.geslacht,
            leeftijd_vorig: null,
            leeftijd_nieuw: getLeeftijd(nieuwMember, nieuw.snapshot_year),
            team_vorig: null,
            team_nieuw: nieuwMember.team || null,
          });
        } else {
          samenvatting.nieuw++;
          verloop.push({
            rel_code: relCode,
            status: 'nieuw',
            geboortejaar: nieuwMember.geboortejaar,
            geslacht: nieuwMember.geslacht,
            leeftijd_vorig: null,
            leeftijd_nieuw: getLeeftijd(nieuwMember, nieuw.snapshot_year),
            team_vorig: null,
            team_nieuw: nieuwMember.team || null,
          });
        }
      }
    }

    // Use deduplicated counts (Map size, not array length)
    const totaalVorig = vorigKorfbalMap.size;
    const totaalNieuw = nieuwKorfbalMap.size;

    // Build output
    const output = {
      _meta: {
        seizoen: pair.seizoen,
        snapshot_vorig: vorig.data._meta.snapshot_datum,
        snapshot_nieuw: nieuw.data._meta.snapshot_datum,
        gegenereerd: '2026-02-24',
        totaal_vorig: totaalVorig,
        totaal_nieuw: totaalNieuw,
        samenvatting,
      },
      verloop: verloop.sort((a, b) => a.rel_code.localeCompare(b.rel_code)),
    };

    // Validate counts
    const expectedNieuw = output._meta.totaal_nieuw;
    const computedNieuw = samenvatting.behouden + samenvatting.nieuw + samenvatting.herinschrijver;
    if (computedNieuw !== expectedNieuw) {
      console.error(`WARNING ${pair.seizoen}: computed new total ${computedNieuw} != actual ${expectedNieuw}`);
    }

    const expectedVorig = output._meta.totaal_vorig;
    const computedVorig = samenvatting.behouden + samenvatting.uitgestroomd + samenvatting.niet_spelend_geworden;
    if (computedVorig !== expectedVorig) {
      console.error(`WARNING ${pair.seizoen}: computed prev total ${computedVorig} != actual ${expectedVorig}`);
    }

    // Write file
    const outputPath = path.join(OUTPUT_DIR, pair.file);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

    console.log(`${pair.seizoen}: vorig=${output._meta.totaal_vorig}, nieuw=${output._meta.totaal_nieuw}, ` +
      `behouden=${samenvatting.behouden}, nieuw=${samenvatting.nieuw}, herinschrijver=${samenvatting.herinschrijver}, ` +
      `uitgestroomd=${samenvatting.uitgestroomd}, niet_spelend=${samenvatting.niet_spelend_geworden}`);
  }

  console.log('\nDone! Files written to:', OUTPUT_DIR);
}

main();
