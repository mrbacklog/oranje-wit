require("dotenv/config");
const { Client } = require("pg");
const fs = require("fs");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows: leden } = await client.query(
    "SELECT rel_code, roepnaam, tussenvoegsel, achternaam FROM leden"
  );

  const csv = fs.readFileSync("docs/staf/Staf overzicht.csv", "utf-8");
  const lines = csv.trim().split("\n").slice(1);

  const stafNamen = [...new Set(lines.map((l) => l.split(";")[1].trim()))];

  // Filter niet-personen
  const skipPatterns = [
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

  const norm = (s) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // accenten verwijderen
      .replace(/[^a-z ]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  // Normaliseer tussenvoegsels + haakjes verwijderen
  const normTV = (s) => {
    let r = s.toLowerCase();
    r = r.replace(/\s*\([^)]*\)/g, ""); // haakjes weg
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

  // Handmatige mapping: staf-CSV naam → rel_code
  const MANUAL_REL_CODE = {
    "Arthyn Muller": "NFW26D7", // Arthijn Muller
    "Alex de Boer": "NFW42M8", // Alexander de Boer
    "Alex de Boer (Techniek)": "NFW42M8",
    "Alex de Boer (techniek)": "NFW42M8",
    "Bart v. d. Brugge": "NJH39X4", // Bart van der Brugge
    "Bente v.d. Linden": "NLP78D3", // Benthe van der Linden
    "Brigitte Zomer": "NJC35T9", // Brigit Zomer
    "Dahpne de Bruijn": "NKQ13Q3", // Daphne de Bruijn → Syrah? Nee...
    "Ilonka Bouwknecht": "NKY54N3", // Lianne Bouwknegt (fout?) → skip
    "Ilonka Bouwknegt": "NKY54N3", // idem
    "Ilse Kloot": "NKW49Z5", // Elin Kloot? Nee → Ilse Kloot-Post
    "Martijn vd Wiel": "NFW26R5", // Martijn van der Wiel
    "Mirthe v Dalen": "NLH59F2", // Mirte van Dalen
    "Demi v Dijk": "NKG59L6", // Demi van Dijk
    "Seth vd Burgt": null, // niet in leden
    "Erik vd Burgt": null, // niet in leden
    "Lex v Dalen": "NFX11D8", // Lex van Dalen
    "Robbert v Ameijden": "NGP49B2", // Robbert van Ameijden
    "Robin v Kalkeren": "NJF24X2", // Robin van Kalkeren
    "Silvia v Honschoten": null, // niet in leden
    "Sylvia v Honschoten": null,
    "Simone v Haren": null, // niet in leden
    "Jet v Trooijen": null, // niet in leden
    "Jet v Trooyen": null,
    "Jet van Trooyen": null,
    "Melina vd Merwe": null, // niet in leden
    "Rick v.d. Wijgaart": null, // niet in leden
    "Bart v/d Brugge": "NJH39X4", // Bart van der Brugge
    "Rob van Dongen (C2)": null, // niet in leden (er is geen Dongen)
    "Sander Roelofs (S2)": null, // niet in leden
    "Yannick Schild (B2)": null, // niet in leden
    "Simone van Zwoll (B2)": null, // niet in leden
    "Kees-Jan Oppe": "NFY88Q6", // Kees Jan Oppe
    "Lianne Stomp": "NFV13X2", // Wilfred Stomp? Nee → niet in leden als Lianne
    "Lianne Stomp - vd Burgt": null, // niet in leden
    "Lianne Stomp-vd Burgt": null,
    "Stefan de Blaaij": "NJK12T8", // Stefan de Blaay
    "Tessa Dubbelt": null, // niet in leden
    "Tessa Dubbled": null,
    "Desire Scheepers": null, // niet in leden
    "Desire Schepers": null,
    "Kimberley Jacobs": null, // niet in leden (Xavi/Vive Jacobs zijn kinderen)
    "Kimberly Jacobs": null,
    "Renee Leys": "NJW94B0", // Gerard Leijs? Nee → niet in leden
    "Reneé Leijs": null,
    "Renée Leijs": null,
    "Rene te Witt": null, // niet in leden
    "Marcel SintNicolaas": null, // niet in leden
    "Marcel St. Nicolaas": null,
    "Viviënne Versnel": null, // niet in leden
    "Daniël den Uijl": null, // niet in leden
    "Tirza Fernhout": null, // niet in leden (Tirsa ook niet?)
    "Theo Androchte": null, // niet in leden
    "Theo Anroche": null,
    "Rubben Kamerbeek": null, // Ruben Kamerbeek niet in leden
    "Wouter Blok, Jan de Jager": null, // twee personen
    "Dahpne de Bruijn": null, // Daphne de Bruijn niet in leden (geen Bruijn)
    "Alex van de Klooster": "NMT25X0", // Alex van der Klooster
    "Annemarie Schipper-de Boer": null,
    "Astrid Zuidergeest": null, // niet als Zuidergeest, niet als Zuidgeest
    "Jordy Vaartmans": "NLG58W7", // Jordi Vaartmans
    "Joris van den Neucker": null, // niet in leden
    "Michel van de Herik": "NFW82K4", // Michel van den Herik
    "Mirjan de Wit": "NMT10Q1", // Mirjam de Wit
    "Ymke de Bruijn": null, // niet in leden
    "Yvonne Mol": null, // niet in leden (geen Yvonne)
    "Robert van Ameijden": "NGP49B2", // Robbert van Ameijden
    "Erwin Nijhoff": null, // niet in leden (Frieda/Liv Nijhoff)
    "Menne Engelfriet": null, // niet in leden (Demi Engelfriet)
    "Menno Kop": null, // niet in leden
    "Peter Berendse": null, // niet in leden
    "Peter Flach": "NKX56P2", // Joram Flach? Nee → niet in leden
    "Pieter Ardon": null, // niet in leden (Rob/Linda/Kim Ardon wel)
    "Monique Oppe": null, // niet in leden
    "Ron Westerkamp": null,
    "Rinke Hoekstra": null,
    "Rob van Heumen": "NFT37Y9", // Erik van Heumen? Nee → niet in leden
    "Erika ter Horst": null, // niet in leden (Henk/Fred/Bridget ter Horst wel)
    "Irene van Ballegooijen": null, // niet in leden (Chris van Ballegooijen wel)
    "Irene Ploeg": null, // niet in leden (Henno/Hans/Lieke Ploeg wel)
    "Lieke Bakker": null, // niet in leden? (veel Bakkers, geen Lieke)
    "Lion van der Klooster": null, // niet in leden
    "Natasha Bernards": null,
    "Paula Malschaert": null, // niet in leden (Art Malschaert wel)
    "Maritte Vogelaar": null, // niet in leden (Arie/Elin Vogelaar wel)
    "Cora Verwij": null, // niet in leden
    "Diana Visser": null,
    "Hanno Lohuis": null, // niet in leden (Jens/Floor Lohuis wel)
    "Henk van Leer": null,
    "Barbara Camphens": null, // niet in leden (Bas/Tijn/Saar Camphens wel)
    "Lenny van den Bergh": null, // niet in leden (Aniek/Marit van den Bergh wel)
    "Marina Vinken": null, // niet in leden (Jack/Jesper Vinken wel)
    "Niels Molendijk": null, // niet in leden? (Arie/Aron Molendijk wel)
    "Patrick Zuiderwijk": null, // niet in leden
    "Chris Gerritsen": null, // niet in leden? (Tom/Peter Gerritsen wel)
    "Chris de Jong": null,
    "Rick de Vries": null, // niet in leden? (Sanne/Rik de Vries)
    "Mark Morelissen": null,
    "Ruud van Balkom": null,
    "Robin Dommisse": null, // niet in leden? (Diana/Marc/Kim Dommisse wel)
    "Rolf Latuperisa": null,
    "Jeroen de Kruif": null,
    "Pablo Rubio": null,
    "Wilma Dekker": null, // niet in leden als Wilma
    "Liesbeth Wibbens": null, // niet in leden (Jan Harm/Esther Wibbens wel)
    "Anne Slijkhuis": null, // niet in leden (Christiaan/Eline Slijkhuis wel)
    "Maarten van Vliet": null, // niet in leden (Tycho/Kian Vliet wel, geen 'van')
    "Celia de Lange": null, // niet in leden (Sanna de Lange wel)
    "Jacqueline Dubbeldam": null, // niet in leden (Johan Dubbeldam wel)
    "Erin Bax": "NJX40G9", // Erinn Bax
    "Gunilda Valk": null, // niet in leden (Jarno/Leendert/Marlies Valk)
    "Ilse Zuiderwijk": null,
    "Sietske van Dalen": null, // niet in leden (Lex/Arjo van Dalen)
    "Renate Koster": null, // niet in leden (Robert/Senne Koster)
    "Erik van Dijk": "NFW13L9", // Eric van Dijk
  };

  // Bouw lookups uit leden-tabel
  const naamLookup = new Map();
  const relCodeLookup = new Map();
  for (const lid of leden) {
    relCodeLookup.set(lid.rel_code, lid);
    const tv = lid.tussenvoegsel ? lid.tussenvoegsel + " " : "";
    const volledig = lid.roepnaam + " " + tv + lid.achternaam;
    naamLookup.set(norm(volledig), lid);

    if (lid.tussenvoegsel) {
      naamLookup.set(norm(lid.roepnaam + " " + lid.achternaam), lid);
    }
  }

  // Achternaam → leden lookup
  const achternaamLookup = new Map();
  for (const lid of leden) {
    const key = norm(lid.achternaam);
    if (!achternaamLookup.has(key)) achternaamLookup.set(key, []);
    achternaamLookup.get(key).push(lid);
  }

  const matched = [];
  const notMatched = [];
  const skipped = [];

  function tryMatch(naam) {
    // Handmatige mapping eerst
    if (naam in MANUAL_REL_CODE) {
      const rc = MANUAL_REL_CODE[naam];
      if (rc === null) return null; // bewust niet-matchbaar
      const lid = relCodeLookup.get(rc);
      if (lid) return { lid, method: "handmatig" };
    }

    const tryNames = new Set();
    const clean = naam.replace(/\s*\([^)]*\)/g, "").trim();

    tryNames.add(normTV(clean));
    tryNames.add(norm(clean));

    // 'Achternaam, Voornaam [tv]' format
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
          tryNames.add(normTV(voornaam + " " + tv + " " + parts[0]));
        }
      }
    }

    // Getrouwde naam: 'Schipper-de Boer' → probeer 'Schipper' en 'de Boer'
    if (clean.includes("-") && !clean.includes(",")) {
      const words = clean.split(/\s+/);
      const voornaam = words[0];
      const rest = words.slice(1).join(" ");
      if (rest.includes("-")) {
        const hyphenParts = rest.split("-");
        tryNames.add(normTV(voornaam + " " + hyphenParts[0].trim()));
        tryNames.add(normTV(voornaam + " " + hyphenParts[1].trim()));
      }
    }

    for (const tryName of tryNames) {
      if (naamLookup.has(tryName)) {
        return { lid: naamLookup.get(tryName), method: "naam" };
      }
    }

    return null;
  }

  for (const naam of stafNamen) {
    if (skipPatterns.some((p) => p.test(naam))) {
      skipped.push(naam);
      continue;
    }
    if (
      naam.includes("/") &&
      naam.split("/").length === 2 &&
      naam.split("/")[1].trim().length > 3
    ) {
      skipped.push(naam + " (gecombineerd)");
      continue;
    }

    // Handmatige mapping check — als null, bewust niet-matchbaar
    if (naam in MANUAL_REL_CODE && MANUAL_REL_CODE[naam] === null) {
      notMatched.push(naam + " [GEEN LID]");
      continue;
    }

    const result = tryMatch(naam);
    if (result) {
      const lid = result.lid;
      const tv = lid.tussenvoegsel ? lid.tussenvoegsel + " " : "";
      matched.push({
        stafNaam: naam,
        relCode: lid.rel_code,
        lidNaam: lid.roepnaam + " " + tv + lid.achternaam,
        method: result.method,
      });
      continue;
    }

    // Initiaal-matching
    let found = false;
    if (naam.includes(",")) {
      const parts = naam.split(",").map((s) => s.trim());
      const voornaamDeel = parts[1]?.trim() || "";
      const isInitiaal = voornaamDeel.replace(/[^a-zA-Z]/g, "").length <= 3;

      if (isInitiaal) {
        const initiaalMatch = voornaamDeel.match(/([A-Za-z])/);
        if (initiaalMatch) {
          const initiaal = initiaalMatch[1].toLowerCase();
          let achternaamPart = parts[0].trim();

          const tvInVoornaam = voornaamDeel.match(/^(de|van|van de|van den|van der|ter|te)\s+/i);
          let tvPart = "";
          if (tvInVoornaam) tvPart = tvInVoornaam[1].toLowerCase();

          const tvInAchternaam = achternaamPart.match(
            /^(de|van|van de|van den|van der|ter|te)\s+/i
          );
          if (tvInAchternaam) {
            tvPart = tvInAchternaam[1].toLowerCase();
            achternaamPart = achternaamPart.replace(tvInAchternaam[0], "").trim();
          }

          const achternaamKey = norm(achternaamPart);
          const candidates = [];

          if (achternaamLookup.has(achternaamKey)) {
            for (const lid of achternaamLookup.get(achternaamKey)) {
              if (lid.roepnaam.toLowerCase().startsWith(initiaal)) {
                if (!tvPart || (lid.tussenvoegsel && lid.tussenvoegsel.toLowerCase() === tvPart)) {
                  candidates.push(lid);
                }
              }
            }
          }

          if (candidates.length === 1) {
            const lid = candidates[0];
            const tv = lid.tussenvoegsel ? lid.tussenvoegsel + " " : "";
            matched.push({
              stafNaam: naam,
              relCode: lid.rel_code,
              lidNaam: lid.roepnaam + " " + tv + lid.achternaam,
              method: "initiaal",
            });
            found = true;
          } else if (candidates.length > 1) {
            notMatched.push(
              naam +
                " [AMBIG: " +
                candidates.map((c) => c.roepnaam + " " + c.achternaam).join(" / ") +
                "]"
            );
            found = true;
          }
        }
      }
    }

    if (!found) {
      notMatched.push(naam);
    }
  }

  // Resultaten
  matched.sort((a, b) => a.stafNaam.localeCompare(b.stafNaam));
  notMatched.sort();
  skipped.sort();

  const geenLid = notMatched.filter((n) => n.includes("[GEEN LID]")).length;
  const ambig = notMatched.filter((n) => n.includes("[AMBIG")).length;
  const echteNotMatched = notMatched.filter(
    (n) => !n.includes("[GEEN LID]") && !n.includes("[AMBIG")
  );
  const personen = stafNamen.length - skipped.length;

  console.log("=== MATCH RESULTAAT ===");
  console.log("Totaal unieke stafnamen:", stafNamen.length);
  console.log("Overgeslagen (geen persoon):", skipped.length);
  console.log("Te matchen personen:", personen);
  console.log("Gematcht met rel_code:", matched.length);
  console.log("Bewust geen lid (niet in Sportlink):", geenLid);
  console.log("Ambigue matches:", ambig);
  console.log("Onbekend (nog te onderzoeken):", echteNotMatched.length);
  console.log();
  console.log("Match-rate:", ((matched.length / personen) * 100).toFixed(1) + "%");
  console.log(
    "Gecategoriseerd:",
    (((matched.length + geenLid + ambig) / personen) * 100).toFixed(1) + "%"
  );
  console.log();

  if (echteNotMatched.length > 0) {
    console.log("=== NOG TE ONDERZOEKEN (" + echteNotMatched.length + ") ===");
    echteNotMatched.forEach((n) => console.log("  " + n));
    console.log();
  }

  if (ambig > 0) {
    console.log("=== AMBIGUE MATCHES (" + ambig + ") ===");
    notMatched.filter((n) => n.includes("[AMBIG")).forEach((n) => console.log("  " + n));
    console.log();
  }

  console.log("=== BEWUST GEEN LID (" + geenLid + ") ===");
  notMatched
    .filter((n) => n.includes("[GEEN LID]"))
    .forEach((n) => console.log("  " + n.replace(" [GEEN LID]", "")));
  console.log();

  console.log("=== OVERGESLAGEN (" + skipped.length + ") ===");
  skipped.forEach((n) => console.log("  " + n));

  await client.end();
}
main();
