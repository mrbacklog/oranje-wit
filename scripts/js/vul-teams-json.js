#!/usr/bin/env node
/**
 * vul-teams-json.js
 *
 * Beheert het teamregister (teams.json) per seizoen met stabiele ow_codes.
 * Legt per competitieperiode het J-nummer, pool, teamsterkte en gem. leeftijd vast.
 *
 * Modi:
 *   node scripts/vul-teams-json.js init <seizoen>
 *     - Maakt teams.json aan vanuit teams-knkv.json en vult veld_najaar
 *
 *   node scripts/vul-teams-json.js update <seizoen> <periode>
 *     - Werkt een periode bij met verse KNKV-data (pools, j_nummers)
 *     - Matcht teams op spelersoverlap of pool-prefix
 *
 *   node scripts/vul-teams-json.js sterkte <seizoen> <periode>
 *     - Importeert teamsterkte uit data/seizoenen/<seizoen>/teamsterkte-<periode>.json
 *
 *   node scripts/vul-teams-json.js status <seizoen>
 *     - Toont overzicht: welke periodes zijn gevuld, welke ontbreken
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const PERIODES = ["veld_najaar", "zaal_deel1", "zaal_deel2", "veld_voorjaar"];

// Kleur-afkorting mapping voor ow_code
const KLEUR_PREFIX = {
  Rood: "R",
  Oranje: "O",
  Geel: "G",
  Groen: "Gr",
  Blauw: "Bl",
};

// --- Helpers ---

function leesJSON(relatief) {
  const volledig = path.join(ROOT, relatief);
  if (!fs.existsSync(volledig)) {
    console.warn(`  ⚠ Bestand niet gevonden: ${relatief}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(volledig, "utf-8"));
}

function schrijfJSON(relatief, data) {
  const volledig = path.join(ROOT, relatief);
  fs.mkdirSync(path.dirname(volledig), { recursive: true });
  fs.writeFileSync(volledig, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`  ✓ Geschreven: ${relatief}`);
}

function teamsJsonPad(seizoen) {
  return `data/seizoenen/${seizoen}/teams.json`;
}

function leegPeriodeObject() {
  return { j_nummer: null, pool: null, sterkte: null, gem_leeftijd: null, aantal_spelers: null };
}

function legePeriodes() {
  return {
    veld_najaar: null,
    zaal_deel1: null,
    zaal_deel2: null,
    veld_voorjaar: null,
  };
}

// --- Init: maak teams.json vanuit teams-knkv.json ---

function init(seizoen) {
  const knkvPad = `data/seizoenen/${seizoen}/teams-knkv.json`;
  const knkvData = leesJSON(knkvPad);
  if (!knkvData) {
    console.error(`Kan niet initialiseren: ${knkvPad} ontbreekt.`);
    process.exit(1);
  }

  // Tellers per kleur voor volgnummers
  const tellers = {};

  const teams = knkvData.teams.map((knkv) => {
    const basis = {
      categorie: knkv.categorie,
    };

    if (knkv.categorie === "a") {
      // A-categorie: ow_code = bestaande teamnaam
      basis.ow_code = knkv.team;
      if (knkv.leeftijdsgroep) basis.leeftijdsgroep = knkv.leeftijdsgroep;
      if (knkv.niveau) basis.niveau = knkv.niveau;
      basis.spelvorm = "8-tal";
      basis.periodes = legePeriodes();
      basis.periodes.veld_najaar = {
        j_nummer: null,
        pool: knkv.pool_veld,
        sterkte: null,
        gem_leeftijd: null,
        aantal_spelers: null,
      };
      if (knkv.pool_zaal) {
        basis.periodes.zaal_deel1 = {
          j_nummer: null,
          pool: knkv.pool_zaal,
          sterkte: null,
          gem_leeftijd: null,
          aantal_spelers: null,
        };
      }
    } else {
      // B-categorie: ow_code = kleurprefix + volgnummer
      const kleur = knkv.kleur;
      const prefix = KLEUR_PREFIX[kleur];
      if (!prefix) {
        // Senioren B-categorie: gebruik teamnaam
        basis.ow_code = knkv.team;
        basis.leeftijdsgroep = "Senioren";
      } else {
        tellers[kleur] = (tellers[kleur] || 0) + 1;
        basis.ow_code = prefix + tellers[kleur];
        basis.kleur = kleur;
      }
      basis.spelvorm = knkv.spelvorm || "8-tal";
      basis.periodes = legePeriodes();
      basis.periodes.veld_najaar = {
        j_nummer: knkv.team.startsWith("J") ? knkv.team : null,
        pool: knkv.pool_veld,
        sterkte: null,
        gem_leeftijd: null,
        aantal_spelers: null,
      };
      if (knkv.pool_zaal) {
        basis.periodes.zaal_deel1 = {
          j_nummer: knkv.team.startsWith("J") ? knkv.team : null,
          pool: knkv.pool_zaal,
          sterkte: null,
          gem_leeftijd: null,
          aantal_spelers: null,
        };
      }
    }

    return basis;
  });

  const result = {
    _meta: {
      seizoen,
      aangemaakt: new Date().toISOString().split("T")[0],
      laatst_bijgewerkt: new Date().toISOString().split("T")[0],
      bron_knkv: "teams-knkv.json",
      periodes: PERIODES,
      toelichting:
        "ow_code is de stabiele team-identiteit per seizoen. J-nummers kunnen per periode verschuiven door KNKV-hernummering op basis van gemiddelde leeftijd. ow_code wijzigt niet.",
    },
    teams,
  };

  schrijfJSON(teamsJsonPad(seizoen), result);

  console.log(`\nTeams.json geinitialiseerd voor ${seizoen}:`);
  console.log(`  ${teams.filter((t) => t.categorie === "a").length} A-categorie teams`);
  console.log(`  ${teams.filter((t) => t.categorie === "b").length} B-categorie teams`);
  console.log(`\nVolgende stappen:`);
  console.log(`  1. Controleer de ow_code toekenningen (volgorde binnen kleur)`);
  console.log(
    `  2. Voeg teamsterkte toe: node scripts/vul-teams-json.js sterkte ${seizoen} veld_najaar`
  );
}

// --- Update: werk periode bij met verse KNKV-data ---

function update(seizoen, periode) {
  if (!PERIODES.includes(periode)) {
    console.error(`Ongeldige periode: ${periode}. Kies uit: ${PERIODES.join(", ")}`);
    process.exit(1);
  }

  const teamsData = leesJSON(teamsJsonPad(seizoen));
  if (!teamsData) {
    console.error(`teams.json niet gevonden. Eerst init uitvoeren.`);
    process.exit(1);
  }

  const knkvData = leesJSON(`data/seizoenen/${seizoen}/teams-knkv.json`);
  if (!knkvData) {
    console.error(`teams-knkv.json niet gevonden voor ${seizoen}.`);
    process.exit(1);
  }

  // Match KNKV-teams aan ow_codes
  let bijgewerkt = 0;
  for (const knkvTeam of knkvData.teams) {
    let match = null;

    // Strategie 1: directe match op bestaande j_nummer in eerdere periodes
    for (const team of teamsData.teams) {
      for (const p of PERIODES) {
        const pd = team.periodes[p];
        if (pd && pd.j_nummer === knkvTeam.team) {
          match = team;
          break;
        }
      }
      if (match) break;

      // A-categorie: match op ow_code
      if (team.categorie === "a" && team.ow_code === knkvTeam.team) {
        match = team;
        break;
      }
    }

    // Strategie 2: match op kleur + pool-prefix
    if (!match && knkvTeam.kleur) {
      const kandidaten = teamsData.teams.filter((t) => t.kleur === knkvTeam.kleur);
      if (kandidaten.length === 1) {
        match = kandidaten[0];
      }
      // Bij meerdere kandidaten: gebruik pool-prefix of laat open
    }

    if (match) {
      const isVeld = periode.includes("veld");
      match.periodes[periode] = {
        j_nummer: knkvTeam.team.startsWith("J") ? knkvTeam.team : null,
        pool: isVeld ? knkvTeam.pool_veld : knkvTeam.pool_zaal,
        sterkte: (match.periodes[periode] && match.periodes[periode].sterkte) || null,
        gem_leeftijd: (match.periodes[periode] && match.periodes[periode].gem_leeftijd) || null,
        aantal_spelers: (match.periodes[periode] && match.periodes[periode].aantal_spelers) || null,
      };
      bijgewerkt++;
    } else {
      console.warn(
        `  ⚠ Geen match gevonden voor KNKV-team ${knkvTeam.team} (${knkvTeam.kleur || knkvTeam.leeftijdsgroep})`
      );
    }
  }

  teamsData._meta.laatst_bijgewerkt = new Date().toISOString().split("T")[0];
  schrijfJSON(teamsJsonPad(seizoen), teamsData);
  console.log(`\n${bijgewerkt} teams bijgewerkt voor periode ${periode}.`);
}

// --- Sterkte: importeer teamsterkte uit invoerbestand ---

function sterkte(seizoen, periode) {
  if (!PERIODES.includes(periode)) {
    console.error(`Ongeldige periode: ${periode}. Kies uit: ${PERIODES.join(", ")}`);
    process.exit(1);
  }

  const teamsData = leesJSON(teamsJsonPad(seizoen));
  if (!teamsData) {
    console.error(`teams.json niet gevonden. Eerst init uitvoeren.`);
    process.exit(1);
  }

  const sterktePad = `data/seizoenen/${seizoen}/teamsterkte-${periode}.json`;
  const sterkteData = leesJSON(sterktePad);
  if (!sterkteData) {
    console.error(`\nTeamsterkte-bestand niet gevonden: ${sterktePad}`);
    console.error(`\nMaak dit bestand aan met ow_codes als sleutels:`);
    console.error(`{`);
    console.error(`  "R1": 86,`);
    console.error(`  "O1": { "sterkte": 59, "gem_leeftijd": 14.07 },`);
    console.error(`  "G1": 43`);
    console.error(`}`);
    process.exit(1);
  }

  let bijgewerkt = 0;
  for (const [owCode, waarde] of Object.entries(sterkteData)) {
    if (owCode.startsWith("_")) continue; // metadata overslaan
    const team = teamsData.teams.find((t) => t.ow_code === owCode);
    if (!team) {
      console.warn(`  ⚠ Onbekende ow_code: ${owCode}`);
      continue;
    }

    if (!team.periodes[periode]) {
      team.periodes[periode] = leegPeriodeObject();
    }

    // Ondersteun zowel simpel getal als object { sterkte, gem_leeftijd }
    if (typeof waarde === "object" && waarde !== null) {
      if (waarde.sterkte != null) team.periodes[periode].sterkte = waarde.sterkte;
      if (waarde.gem_leeftijd != null) team.periodes[periode].gem_leeftijd = waarde.gem_leeftijd;
    } else {
      team.periodes[periode].sterkte = waarde;
    }
    bijgewerkt++;
  }

  teamsData._meta.laatst_bijgewerkt = new Date().toISOString().split("T")[0];
  schrijfJSON(teamsJsonPad(seizoen), teamsData);
  console.log(`\n${bijgewerkt} teams: sterkte ingevuld voor periode ${periode}.`);
}

// --- Status: toon overzicht ---

function status(seizoen) {
  const teamsData = leesJSON(teamsJsonPad(seizoen));
  if (!teamsData) {
    console.error(`teams.json niet gevonden voor ${seizoen}.`);
    process.exit(1);
  }

  console.log(`\nTeamregister ${seizoen} — ${teamsData.teams.length} teams\n`);

  // Groepeer per type
  const aCat = teamsData.teams.filter((t) => t.categorie === "a");
  const bCatSen = teamsData.teams.filter((t) => t.categorie === "b" && !t.kleur);
  const bCatJeugd = teamsData.teams.filter((t) => t.categorie === "b" && t.kleur);

  console.log(`A-categorie: ${aCat.length} teams`);
  aCat.forEach((t) => {
    const periodeStatus = PERIODES.map((p) => {
      const pd = t.periodes[p];
      if (!pd) return "  -  ";
      const s = pd.sterkte !== null ? `S:${pd.sterkte}` : "";
      return pd.pool ? `${pd.pool}${s ? " " + s : ""}` : "(leeg)";
    });
    console.log(`  ${t.ow_code.padEnd(8)} ${periodeStatus.join(" | ")}`);
  });

  console.log(`\nB-categorie senioren: ${bCatSen.length} teams`);
  bCatSen.forEach((t) => {
    const periodeStatus = PERIODES.map((p) => {
      const pd = t.periodes[p];
      if (!pd) return "  -  ";
      return pd.sterkte !== null ? `S:${pd.sterkte}` : pd.pool || "(leeg)";
    });
    console.log(`  ${t.ow_code.padEnd(8)} ${periodeStatus.join(" | ")}`);
  });

  console.log(`\nB-categorie jeugd: ${bCatJeugd.length} teams`);

  // Groepeer per kleur
  const kleuren = ["Rood", "Oranje", "Geel", "Groen", "Blauw"];
  for (const kleur of kleuren) {
    const kleurTeams = bCatJeugd.filter((t) => t.kleur === kleur);
    if (kleurTeams.length === 0) continue;
    console.log(`  ${kleur}:`);
    kleurTeams.forEach((t) => {
      const periodeStatus = PERIODES.map((p) => {
        const pd = t.periodes[p];
        if (!pd) return "   -   ";
        const j = pd.j_nummer || "?";
        const s = pd.sterkte !== null ? ` S:${pd.sterkte}` : "";
        const l = pd.gem_leeftijd !== null ? ` (${pd.gem_leeftijd})` : "";
        return `${j}${s}${l}`;
      });
      console.log(`    ${t.ow_code.padEnd(5)} ${periodeStatus.join(" | ")}`);
    });
  }

  // Samenvatting vulling
  console.log(`\nPeriode-vulling:`);
  for (const p of PERIODES) {
    const gevuld = teamsData.teams.filter((t) => t.periodes[p] !== null).length;
    const metSterkte = teamsData.teams.filter(
      (t) => t.periodes[p] && t.periodes[p].sterkte !== null
    ).length;
    console.log(
      `  ${p.padEnd(15)} ${gevuld}/${teamsData.teams.length} teams | ${metSterkte} met sterkte`
    );
  }
}

// --- Main ---

const [, , modus, seizoen, periode] = process.argv;

if (!modus || !seizoen) {
  console.log(`Gebruik:`);
  console.log(`  node scripts/vul-teams-json.js init <seizoen>`);
  console.log(`  node scripts/vul-teams-json.js update <seizoen> <periode>`);
  console.log(`  node scripts/vul-teams-json.js sterkte <seizoen> <periode>`);
  console.log(`  node scripts/vul-teams-json.js status <seizoen>`);
  console.log(`\nPeriodes: ${PERIODES.join(", ")}`);
  process.exit(0);
}

switch (modus) {
  case "init":
    init(seizoen);
    break;
  case "update":
    if (!periode) {
      console.error("Periode vereist voor update.");
      process.exit(1);
    }
    update(seizoen, periode);
    break;
  case "sterkte":
    if (!periode) {
      console.error("Periode vereist voor sterkte.");
      process.exit(1);
    }
    sterkte(seizoen, periode);
    break;
  case "status":
    status(seizoen);
    break;
  default:
    console.error(`Onbekende modus: ${modus}. Kies uit: init, update, sterkte, status`);
    process.exit(1);
}
