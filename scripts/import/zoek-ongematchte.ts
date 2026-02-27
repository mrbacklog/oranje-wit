import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface Ongematchte {
  naam: string;
  g: string;
  acht: string; // achternaam zoekterm
  seizoen?: string;
  team?: string;
}

const NAMEN: Ongematchte[] = [
  // Terugkerend (verschijnen in meerdere seizoenen)
  { naam: "Irene van Ballegooijen", g: "V", acht: "ballegooij" },
  { naam: "Kim van Eewijk / Ewijk", g: "V", acht: "ewijk" },
  { naam: "Jan Peter Verwaal", g: "M", acht: "verwaal" },
  { naam: "Kim van de Starre", g: "V", acht: "starre" },
  { naam: "Dorien in't Veld", g: "V", acht: "veld" },
  { naam: "Lisette in't Veld", g: "V", acht: "veld" },
  { naam: "Mariette van Dijk", g: "V", acht: "dijk" },
  { naam: "Simone Vanhooijdonck / Kuijper", g: "V", acht: "hooij" },
  { naam: "Roel Vanhooijdonck", g: "M", acht: "hooij" },
  { naam: "Tamara Haksteen / Opstal-Haksteen", g: "V", acht: "haksteen" },
  { naam: "Mirthe Verweij", g: "V", acht: "verweij" },
  { naam: "Renee Leijs", g: "V", acht: "leijs" },
  { naam: "Robin Dommisse", g: "V", acht: "dommisse" },
  { naam: "Mor Ullmann", g: "M", acht: "ullmann" },
  { naam: "Daphne de Bruin", g: "V", acht: "bruin" },
  // Uniek per seizoen
  { naam: "Arno Bosje", g: "M", acht: "bosje" },
  { naam: "Ilonka Zwijnenburg", g: "V", acht: "zwijnenburg" },
  { naam: "Petra Wedemeijer", g: "V", acht: "wedemeijer" },
  { naam: "Renate Vliet", g: "V", acht: "vliet" },
  { naam: "Ymke de Bruin", g: "V", acht: "bruin" },
  { naam: "Jonneke v.d. Berg", g: "V", acht: "berg" },
  { naam: "Bart v.d. Brugge", g: "M", acht: "brugge" },
  { naam: "Jeroen von Wasserthal", g: "M", acht: "wasserthal" },
  { naam: "Maarten van 't Noordende", g: "M", acht: "noordende" },
  { naam: "Lotte Koorneef", g: "V", acht: "koorneef" },
  { naam: "Melissa Duyndam", g: "V", acht: "duyndam" },
  { naam: "Wouter Koorneef", g: "M", acht: "koorneef" },
  { naam: "Rik de Vries", g: "M", acht: "vries" },
  { naam: "Paul de Roijer", g: "M", acht: "roijer" },
  { naam: "Freek de Peuter", g: "M", acht: "peuter" },
  { naam: "Danny van Trooyen", g: "M", acht: "trooyen" },
  { naam: "Damien van Trooyen", g: "M", acht: "trooyen" },
  { naam: "Bas van Bodegom", g: "M", acht: "bodegom" },
  { naam: "Simone van Haaren", g: "V", acht: "haaren" },
  { naam: "Barbara Moerman", g: "V", acht: "moerman" },
  { naam: "Babette Meuhlhaus", g: "V", acht: "meuhlhaus" },
  { naam: "Esther Toorn", g: "V", acht: "toorn" },
  { naam: "Vera van Nes", g: "V", acht: "nes" },
  { naam: "Estelle Rubio", g: "V", acht: "rubio" },
  { naam: "Jarno Valk", g: "M", acht: "valk" },
  { naam: "Nando Ooyen", g: "M", acht: "ooyen" },
  { naam: "Johan Kuipers", g: "M", acht: "kuipers" },
  { naam: "Mark-Jan Wondergem", g: "M", acht: "wondergem" },
  { naam: "Floris v. Willigen", g: "M", acht: "willigen" },
  { naam: "Danique v. Willigen", g: "V", acht: "willigen" },
  { naam: "Milo Meyers", g: "M", acht: "meyers" },
  { naam: "Tim Donkevoort", g: "M", acht: "donkevoort" },
  { naam: "Laura Peeters", g: "V", acht: "peeters" },
  { naam: "Moniek Talens", g: "V", acht: "talens" },
  { naam: "Thomas Boeije", g: "M", acht: "boeije" },
  { naam: "Raoul Kuijper", g: "M", acht: "kuijper" },
  { naam: "Suzan de Haan-van Dijk", g: "V", acht: "haan" },
  { naam: "Noa de Geus", g: "V", acht: "geus" },
  { naam: "Zoe Kamezman", g: "V", acht: "kamezman" },
  { naam: "Yves Katbahadour", g: "M", acht: "katbahadour" },
  { naam: "Suzanne Euser", g: "V", acht: "euser" },
  { naam: "Debita Zwanenburg-Moerman", g: "V", acht: "zwanenburg" },
  { naam: "J.P. Verwaal (MW1)", g: "M", acht: "verwaal" },
  { naam: "A de Haas (B1)", g: "V", acht: "haas" },
  { naam: "M. Sas (C1)", g: "V", acht: "sas" },
  { naam: "T Karstens (D3)", g: "M", acht: "karstens" },
  { naam: "L. Exalto (E1/F1)", g: "V", acht: "exalto" },
  { naam: "F. van Rijswijk (E6)", g: "V", acht: "rijswijk" },
  { naam: "J. den Dekker (F2)", g: "M", acht: "dekker" },
  { naam: "L. van der Laars (S6)", g: "V", acht: "laars" },
  { naam: "L. Van de rest (F3)", g: "V", acht: "rest" },
  { naam: "E. Ardon (S3)", g: "V", acht: "ardon" },
  { naam: "M. Verweij (S1)", g: "V", acht: "verweij" },
  { naam: "Merlijn de Wit", g: "M", acht: "wit" },
  { naam: "Sander Heerspring", g: "M", acht: "heerspring" },
  { naam: "Sanae el Arbiati", g: "V", acht: "arbiati" },
  { naam: "Lucien Mol", g: "M", acht: "mol" },
  { naam: "Merel Hoffman", g: "V", acht: "hoffman" },
  { naam: "Ariadne (alleen voornaam)", g: "V", acht: "ariadne" },
];

async function main() {
  for (const n of NAMEN) {
    const res = await pool.query(
      `SELECT rel_code, roepnaam, achternaam, tussenvoegsel, voorletters, geslacht, geboortejaar,
              lid_sinds::text, afmelddatum::text
       FROM leden
       WHERE LOWER(achternaam) LIKE $1
       ORDER BY geslacht, geboortejaar`,
      [`%${n.acht}%`]
    );

    console.log(`\n--- ${n.naam} (${n.g}) ---`);
    if (res.rows.length === 0) {
      // Probeer op roepnaam
      const roepRes = await pool.query(
        `SELECT rel_code, roepnaam, achternaam, tussenvoegsel, voorletters, geslacht, geboortejaar
         FROM leden WHERE LOWER(roepnaam) LIKE $1 ORDER BY geboortejaar`,
        [`%${n.acht}%`]
      );
      if (roepRes.rows.length > 0) {
        console.log("  (op roepnaam):");
        for (const r of roepRes.rows)
          console.log(
            `    ${r.rel_code} ${r.roepnaam} ${r.tussenvoegsel || ""} ${r.achternaam} ${r.geslacht} geb:${r.geboortejaar}`
          );
      } else {
        console.log("  NIET GEVONDEN IN DB");
      }
    } else {
      for (const r of res.rows)
        console.log(
          `  ${r.rel_code} ${r.roepnaam} ${r.tussenvoegsel || ""} ${r.achternaam} ${r.geslacht} geb:${r.geboortejaar} lid:${r.lid_sinds || "?"} afm:${r.afmelddatum || "actief"}`
        );
    }
  }

  await pool.end();
}

main();
