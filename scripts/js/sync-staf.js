/**
 * sync-staf.js — Importeer historische stafdata uit CSV naar database
 *
 * Leest beide CSV's (Staf overzicht.csv + Staf 2020-2021.csv),
 * matcht namen tegen de leden-tabel voor relCode,
 * en schrijft naar Staf + StafToewijzing tabellen.
 *
 * Gebruik: node scripts/js/sync-staf.js [--dry-run]
 */
require("dotenv/config");
const { Client } = require("pg");
const fs = require("fs");

const DRY_RUN = process.argv.includes("--dry-run");

// ============================================================
// NAAM → REL_CODE MAPPING
// Handmatige mapping voor namen die niet automatisch matchen.
// null = bewust geen lid (externe trainer, ouder, etc.)
// ============================================================
const MANUAL_REL_CODE = {
  "Arthyn Muller": "NFW26D7",
  "Alex de Boer": "NFW42M8",
  "Alex de Boer (Techniek)": "NFW42M8",
  "Alex de Boer (techniek)": "NFW42M8",
  "Bart v. d. Brugge": "NJH39X4",
  "Bente v.d. Linden": "NLP78D3",
  "Brigitte Zomer": "NJC35T9",
  "Ilonka Bouwknecht": "NJC90M5",
  "Ilonka Bouwknegt": "NJC90M5",
  "Ilse Kloot": "NKW49Z5",
  "Martijn vd Wiel": "NFW26R5",
  "Mirthe v Dalen": "NLH59F2",
  "Demi v Dijk": "NKG59L6",
  "Seth vd Burgt": "NLL20F4",
  "Erik vd Burgt": null,
  "Lex v Dalen": "NFX11D8",
  "Robbert v Ameijden": "NGP49B2",
  "Robin v Kalkeren": "NJF24X2",
  "Silvia v Honschoten": null,
  "Sylvia v Honschoten": null,
  "Simone v Haren": null,
  "Jet v Trooijen": "NKZ02T5",
  "Jet v Trooyen": "NKZ02T5",
  "Jet van Trooyen": "NKZ02T5",
  "Melina vd Merwe": null,
  "Rick v.d. Wijgaart": null,
  "Bart v/d Brugge": "NJH39X4",
  "Rob van Dongen (C2)": "NFW42R3",
  "Sander Roelofs (S2)": null,
  "Yannick Schild (B2)": null,
  "Simone van Zwoll (B2)": null,
  "Kees-Jan Oppe": "NFY88Q6",
  "Lianne Stomp": "NFV12W2",
  "Lianne Stomp - vd Burgt": "NFV12W2",
  "Lianne Stomp-vd Burgt": "NFV12W2",
  "Lianne vd Burgt": "NFV12W2",
  "Stefan de Blaaij": "NJK12T8",
  "Tessa Dubbelt": null,
  "Tessa Dubbled": null,
  "Tessa Dubbeld": null,
  "Desire Scheepers": null,
  "Desire Schepers": null,
  "Desiree Schepers": null,
  "Kimberley Jacobs": null,
  "Kimberly Jacobs": null,
  "Renee Leys": null,
  "Reneé Leijs": null,
  "Renée Leijs": null,
  "Rene te Witt": null,
  "Marcel SintNicolaas": "NKK88N6",
  "Marcel St. Nicolaas": "NKK88N6",
  "Viviënne Versnel": null,
  "Daniël den Uijl": null,
  "Tirza Fernhout": null,
  "Theo Androchte": null,
  "Theo Anroche": null,
  "Theo Anrochte": null,
  "Rubben Kamerbeek": null,
  "Wouter Blok, Jan de Jager": null,
  "Dahpne de Bruijn": null,
  "Alex van de Klooster": "NMT25X0",
  "Annemarie Schipper-de Boer": null,
  "Annemarie de Boer - Schipper": null,
  "Astrid Zuidergeest": null,
  "Astrid Zuidgeest": null,
  "Jordy Vaartmans": "NLG58W7",
  "Joris van den Neucker": null,
  "Michel van de Herik": "NFW82K4",
  "Mirjan de Wit": "NMT10Q1",
  "Mirjam de wit": "NMT10Q1",
  "Ymke de Bruijn": null,
  "Yvonne Mol": null,
  "Robert van Ameijden": "NGP49B2",
  "Erwin Nijhoff": null,
  "Menne Engelfriet": null,
  "Menno Kop": null,
  "Peter Berendse": null,
  "Peter Berendsen": null,
  "Peter Flach": null,
  "Pieter Ardon": null,
  "Monique Oppe": null,
  "Ron Westerkamp": null,
  "Rinke Hoekstra": null,
  "Rob van Heumen": null,
  "Erika ter Horst": null,
  "Irene van Ballegooijen": null,
  "Irene Ploeg": null,
  "Lieke Bakker": "NFW28G4",
  "Lion van der Klooster": null,
  "Natasha Bernards": null,
  "Paula Malschaert": null,
  "Maritte Vogelaar": null,
  "Cora Verwij": null,
  "Cora Vermij": null,
  "Diana Visser": null,
  "Hanno Lohuis": null,
  "Henk van Leer": null,
  "Barbara Camphens": null,
  "Barbara Camphens-Moerman": null,
  "Barbara Camphen-Moerman": null,
  "Lenny van den Bergh": null,
  "Marina Vinken": null,
  "Niels Molendijk": null,
  "Patrick Zuiderwijk": null,
  "Chris Gerritsen": null,
  "Chris de Jong": null,
  "Rick de Vries": null,
  "Mark Morelissen": null,
  "Ruud van Balkom": null,
  "Robin Dommisse": null,
  "Rolf Latuperisa": null,
  "Jeroen de Kruif": null,
  "Pablo Rubio": null,
  "Wilma Dekker": null,
  "Liesbeth Wibbens": "NJC46R3",
  "Liesbeth Kleingeld": "NJC46R3",
  "Anne Slijkhuis": null,
  "Maarten van Vliet": null,
  "Celia de Lange": null,
  "Jacqueline Dubbeldam": null,
  "Erin Bax": "NJX40G9",
  "Gunilda Valk": "NFW15M2",
  "Ilse Zuiderwijk": null,
  "Sietske van Dalen": null,
  "Renate Koster": null,
  "Erik van Dijk": "NFW13L9",
  "Erik van de Burgt": null,
  "Debita Zwanenburg-Moerman": null,
  "Ingrid Laban-Sinke": null,
  "Nynke Brouwer": null,
  "Jany Lacroes": null,
  "Kim de Reus": null,
  "Lindi Fasbender": null,
};

// Niet-persoon patronen (vacatures, carrousel, etc.)
const SKIP_PATTERNS = [
  /^vacature/i,
  /^n\.n\.b/i,
  /^nog in te vullen/i,
  /^eigen$/i,
  /^carousel/i,
  /^carrousel/i,
  /^trainerscarrousel/i,
  /^teamlft/i,
  /^s1s2/i,
  /^coach vacature/i,
  /^demi$/i,
  /^\d+ speelt/i,
  /^1x in de week/i,
];

// ============================================================
// NORMALISATIE
// ============================================================
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normTV = (s) => {
  let r = s.toLowerCase();
  r = r.replace(/\s*\([^)]*\)/g, "");
  r = r.replace(/\bv\.\s*d\.\s*/g, "van de ");
  r = r.replace(/\bv\.d\b/g, "van de");
  r = r.replace(/\bvd\b/g, "van de");
  r = r.replace(/\bv\/d\b/g, "van de");
  r = r.replace(/\bv\//g, "van ");
  r = r.replace(/\bv\b(?=\s+[a-z])/g, "van");
  r = r.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  r = r.replace(/[^a-z ]/g, "");
  r = r.replace(/\s+/g, " ").trim();
  return r;
};

function isSkippable(naam) {
  if (SKIP_PATTERNS.some((p) => p.test(naam))) return true;
  // Gecombineerde namen (twee personen met /)
  if (naam.includes("/") && naam.split("/").length === 2 && naam.split("/")[1].trim().length > 3)
    return true;
  return false;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // 1. Lees leden voor naam-matching
  const { rows: leden } = await client.query(
    "SELECT rel_code, roepnaam, tussenvoegsel, achternaam FROM leden"
  );
  const naamLookup = new Map();
  for (const lid of leden) {
    const tv = lid.tussenvoegsel ? lid.tussenvoegsel + " " : "";
    const volledig = lid.roepnaam + " " + tv + lid.achternaam;
    naamLookup.set(norm(volledig), lid.rel_code);
    if (lid.tussenvoegsel) {
      naamLookup.set(norm(lid.roepnaam + " " + lid.achternaam), lid.rel_code);
    }
  }

  // 2. Lees beide CSV's
  const csv1 = fs.readFileSync("docs/staf/Staf overzicht.csv", "utf-8");
  const csv2 = fs.readFileSync("docs/staf/Staf 2020-2021.csv", "utf-8");
  const lines1 = csv1.trim().split("\n").slice(1);
  const lines2 = csv2.trim().split("\n").slice(1);
  const allLines = [...lines1, ...lines2];

  console.log(`CSV regels: ${lines1.length} + ${lines2.length} = ${allLines.length}`);

  // 3. Parseer regels
  const records = [];
  const skipped = [];
  for (const line of allLines) {
    const [seizoen, naam, teamRaw, rol, functie] = line.split(";").map((s) => s.trim());
    if (!naam) continue;
    if (isSkippable(naam)) {
      skipped.push(naam);
      continue;
    }
    // Split teams: "S1/S2" → ["S1", "S2"], "S5 S6" → ["S5", "S6"]
    const teams = teamRaw.includes("/")
      ? teamRaw.split("/").map((t) => t.trim())
      : teamRaw.includes(" ") && /^[A-Z]\d/.test(teamRaw)
        ? teamRaw.split(/\s+/).map((t) => t.trim())
        : [teamRaw.trim()];

    for (const team of teams) {
      records.push({ seizoen, naam, team, rol, functie });
    }
  }

  console.log(`Parsed records: ${records.length} (${skipped.length} overgeslagen)`);

  // 4. Bepaal unieke personen + stafCodes
  // Normaliseer namen zodat varianten dezelfde persoon worden
  const naamVarianten = new Map(); // genormaliseerde naam → eerste voorkomen (originele naam)
  const persoonNaam = new Map(); // originele naam → genormaliseerde key

  function getNormKey(naam) {
    // Check handmatige mapping eerst — varianten wijzen naar dezelfde persoon
    // We gebruiken de genormaliseerde vorm als key
    const clean = naam.replace(/\s*\([^)]*\)/g, "").trim();
    return normTV(clean);
  }

  // Groepeer alle originele namen per genormaliseerde key
  const keyToOriginals = new Map();
  for (const r of records) {
    const key = getNormKey(r.naam);
    if (!keyToOriginals.has(key)) keyToOriginals.set(key, new Set());
    keyToOriginals.get(key).add(r.naam);
  }

  // Bepaal unieke personen (op volgorde van eerste voorkomen)
  const personen = []; // [{key, naam, relCode}]
  const keyToStafCode = new Map();
  const seen = new Set();

  for (const r of records) {
    const key = getNormKey(r.naam);
    if (seen.has(key)) continue;
    seen.add(key);

    // Bepaal relCode
    let relCode = undefined; // undefined = nog niet bepaald, null = bewust geen lid

    // 1. Handmatige mapping (op originele naam)
    const originals = keyToOriginals.get(key);
    for (const orig of originals) {
      if (orig in MANUAL_REL_CODE) {
        relCode = MANUAL_REL_CODE[orig]; // kan null zijn (bewust geen lid)
        break;
      }
    }

    // 2. Automatische naam-matching (alleen als handmatige mapping geen resultaat gaf)
    if (relCode === undefined) {
      // Probeer diverse normalisaties
      const tryNames = new Set();
      for (const orig of originals) {
        const clean = orig.replace(/\s*\([^)]*\)/g, "").trim();
        tryNames.add(normTV(clean));
        tryNames.add(norm(clean));

        // Achternaam, Voornaam format
        if (clean.includes(",")) {
          const parts = clean.split(",").map((s) => s.trim());
          if (parts.length === 2 && parts[1].length > 0) {
            tryNames.add(normTV(parts[1] + " " + parts[0]));
            tryNames.add(norm(parts[1] + " " + parts[0]));
            const voornaamDelen = parts[1].trim().split(/\s+/);
            if (voornaamDelen.length > 1) {
              const voornaam = voornaamDelen[0];
              const tv = voornaamDelen.slice(1).join(" ");
              tryNames.add(norm(voornaam + " " + tv + " " + parts[0]));
            }
          }
        }
      }

      for (const tryName of tryNames) {
        if (naamLookup.has(tryName)) {
          relCode = naamLookup.get(tryName);
          break;
        }
      }

      // Niet gevonden → null
      if (relCode === undefined) relCode = null;
    }

    const stafCode = `STAF-${String(personen.length + 1).padStart(3, "0")}`;
    keyToStafCode.set(key, stafCode);

    // Gebruik de mooiste originele naam als display naam
    const displayNaam = [...originals][0].replace(/\s*\([^)]*\)/g, "").trim();
    personen.push({ stafCode, naam: displayNaam, relCode, key });
  }

  // Dedupliceer personen met dezelfde relCode
  const relCodeToStafCode = new Map();
  const mergedAway = new Set();
  for (const p of personen) {
    if (!p.relCode) continue;
    if (relCodeToStafCode.has(p.relCode)) {
      const primaryCode = relCodeToStafCode.get(p.relCode);
      keyToStafCode.set(p.key, primaryCode);
      mergedAway.add(p.stafCode);
    } else {
      relCodeToStafCode.set(p.relCode, p.stafCode);
    }
  }

  const deduped = personen.filter((p) => !mergedAway.has(p.stafCode));

  // Hernummer stafCodes (geen gaten)
  const renumberMap = new Map();
  deduped.forEach((p, i) => {
    const newCode = `STAF-${String(i + 1).padStart(3, "0")}`;
    renumberMap.set(p.stafCode, newCode);
    p.stafCode = newCode;
  });
  for (const [key, code] of keyToStafCode) {
    const newCode = renumberMap.get(code);
    if (newCode) keyToStafCode.set(key, newCode);
  }

  if (mergedAway.size > 0) {
    console.log(`Samengevoegd: ${mergedAway.size} duplicaten (zelfde relCode)`);
  }

  console.log(`\nUnieke personen: ${deduped.length}`);
  console.log(`Met relCode: ${deduped.filter((p) => p.relCode).length}`);
  console.log(`Zonder relCode: ${deduped.filter((p) => !p.relCode).length}`);

  // 5. Bouw toewijzingen
  const toewijzingen = [];
  const toewijzingSeen = new Set();

  for (const r of records) {
    const key = getNormKey(r.naam);
    const stafCode = keyToStafCode.get(key);
    if (!stafCode) continue;

    const uniqKey = `${stafCode}|${r.seizoen}|${r.team}`;
    if (toewijzingSeen.has(uniqKey)) continue;
    toewijzingSeen.add(uniqKey);

    toewijzingen.push({
      stafId: stafCode,
      seizoen: r.seizoen,
      team: r.team,
      rol: r.rol,
      functie: r.functie || null,
    });
  }

  console.log(`Toewijzingen: ${toewijzingen.length}`);

  // 6. Seizoenen overzicht
  const seizoenen = [...new Set(toewijzingen.map((t) => t.seizoen))].sort();
  console.log(
    `Seizoenen: ${seizoenen.length} (${seizoenen[0]} t/m ${seizoenen[seizoenen.length - 1]})`
  );

  if (DRY_RUN) {
    console.log("\n=== DRY RUN — geen database-wijzigingen ===");
    console.log("\nEerste 10 personen:");
    deduped
      .slice(0, 10)
      .forEach((p) => console.log(`  ${p.stafCode} — ${p.naam} (relCode: ${p.relCode || "-"})`));
    console.log("\nEerste 10 toewijzingen:");
    toewijzingen
      .slice(0, 10)
      .forEach((t) => console.log(`  ${t.stafId} — ${t.seizoen} — ${t.team} — ${t.rol}`));
    await client.end();
    return;
  }

  // 7. Schrijf naar database
  console.log("\nSchrijven naar database...");

  // Staf records upsert
  let stafNieuw = 0,
    stafUpdate = 0;
  for (const p of deduped) {
    const { rows } = await client.query(
      `INSERT INTO "Staf" (id, rel_code, naam, rollen, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         rel_code = COALESCE(EXCLUDED.rel_code, "Staf".rel_code),
         naam = EXCLUDED.naam,
         "updatedAt" = NOW()
       RETURNING (xmax = 0) as inserted`,
      [p.stafCode, p.relCode, p.naam, "{}"]
    );
    if (rows[0].inserted) stafNieuw++;
    else stafUpdate++;
  }
  console.log(`Staf: ${stafNieuw} nieuw, ${stafUpdate} bijgewerkt`);

  // StafToewijzing records upsert
  let twNieuw = 0,
    twUpdate = 0;
  for (const t of toewijzingen) {
    const { rows } = await client.query(
      `INSERT INTO staf_toewijzingen (staf_id, seizoen, team, rol, functie, bron)
       VALUES ($1, $2, $3, $4, $5, 'staf_overzicht')
       ON CONFLICT (staf_id, seizoen, team) DO UPDATE SET
         rol = EXCLUDED.rol,
         functie = EXCLUDED.functie
       RETURNING (xmax = 0) as inserted`,
      [t.stafId, t.seizoen, t.team, t.rol, t.functie]
    );
    if (rows[0].inserted) twNieuw++;
    else twUpdate++;
  }
  console.log(`Toewijzingen: ${twNieuw} nieuw, ${twUpdate} bijgewerkt`);

  // 8. Verifieer
  const {
    rows: [{ count: stafCount }],
  } = await client.query('SELECT COUNT(*) as count FROM "Staf"');
  const {
    rows: [{ count: twCount }],
  } = await client.query("SELECT COUNT(*) as count FROM staf_toewijzingen");
  console.log(`\nVerificatie: ${stafCount} Staf, ${twCount} StafToewijzing`);

  await client.end();
  console.log("Klaar!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
