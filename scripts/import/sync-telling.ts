/**
 * Importeer telling-bestand → speler_seizoenen + competitie_spelers
 *
 * Leest docs/Telling spelers per seizoen.xlsx
 * Matcht namen aan leden-tabel via rel_code
 *
 * Gebruik: npx tsx scripts/import/sync-telling.ts
 */

import { Pool } from "pg";
import { resolve } from "path";
import "dotenv/config";

const XLSX_PATH = resolve(
  __dirname,
  "../../docs/Telling spelers per seizoen.xlsx"
);

interface TellingRij {
  naam: string;
  geslacht: string;
  team: string;
  teamVorigSeizoen?: string;
}

interface LidRecord {
  rel_code: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  voorletters: string | null;
  geslacht: string;
  geboortejaar: number | null;
  lid_sinds: string | null;
  afmelddatum: string | null;
}

// ============================================================
// HANDMATIGE MAPPINGS (naam in telling → rel_code)
// Sleutel: norm(naam) zodat het ongeacht hoofdletters/accenten matcht
// ============================================================

const MANUAL_MAP: Record<string, string> = {
  // === SPATIE-FORMAAT (2010-2011, 2019+) ===
  "irene van ballegooijen": "NGX49G5",
  "kim van eewijk / ewijk": "NGM12S2",
  "kim van eewijk": "NGM12S2",
  "jan peter verwaal": "NFW14Y3",
  "kim van de starre": "NJK09N2",
  "dorien in't veld": "NFW28D3",
  "lisette in't veld": "NGD97S8",
  "mariette van dijk": "NFW40Y6",
  "tamara haksteen / opstal-haksteen": "NFX24T4",
  "tamara haksteen": "NFX24T4",
  "mirthe verweij": "NJH51Q1",
  "renee leijs": "NJC15N7",
  "ilonka zwijnenburg": "NJC90M5",
  "renate vliet": "NFW41J4",
  "barbara moerman": "NFW41S7",
  "debita zwanenburg-moerman": "NFW15S4",
  "simone vanhooijdonck / kuijper": "NGL91R1",
  "simone vanhooijdonck": "NGL91R1",
  "suzanne euser": "NJG60C4",
  "ymke de bruin": "NJC16H8",
  "bart v.d. brugge": "NJH39X4",
  "jeroen von wasserthal": "NKR16Z6",
  "maarten van 't noordende": "NJT90J1",
  "floris v. willigen": "NLK19D1",
  "danique v. willigen": "NLL37R4",
  "jonneke v.d. berg": "NKP72D8",
  "rik de vries": "NGX37Q4",
  "freek de peuter": "NJG52P6",
  "mark-jan wondergem": "NGB14K1",
  "johan kuipers": "NGC32X7",
  "raoul kuijper": "NLN28Y3",
  "jarno valk": "NLG57L7",
  "thomas boeije": "NLP77V6",
  "vera van nes": "NLG57Q2",
  "noa de geus": "NLS45P6",
  "sanae el arbiati": "NMW34Q6",
  "estelle rubio": "NLG58Y1",
  "merlijn de wit": "NMJ57G2",
  "ariadne (alleen voornaam)": "NNF86F0",
  "paul de roijer": "NKX06V9",
  "sander heerspring": "NLV80P4",
  "nando ooyen": "NJT89Y8",
  "laura peeters": "NGZ14H4",
  "danny van trooyen": "NJZ80M3",
  "damien van trooyen": "NJZ80J2",
  "bas van bodegom": "SKIP", // niet in DB
  // Spellingsverschillen telling vs DB (gevonden via fuzzy zoeken)
  "arno bosje": "NGL51P7", // DB: Borsje
  "roel vanhooijdonck": "NJK09M5", // DB: Vanhooydonck (ij→y)
  "petra wedemeijer": "NFW13D3", // DB: Wedemeyer
  "lotte koorneef": "NKN64T9", // DB: Koornneef (dubbel-n)
  "melissa duyndam": "NKR22S0", // DB: Duijndam
  "wouter koorneef": "NLB71F2", // DB: Koornneef (dubbel-n)
  "milo meyers": "NLG93G0", // DB: Meijers
  "simone van haaren": "NGZ14B2", // DB: van Haren (enkel-a)
  "mor ullmann": "NFV03D7", // DB: Ullman (enkel-n)
  "yves katbahadour": "NJD69G6", // DB: Katbahadoer
  // === KOMMA-FORMAAT (2011-2016) ===
  "ballegooijen, van i (irene)": "NGX49G5",
  "vries de, r (rik)": "NGX37Q4",
  "starre, van der k (kim)": "NJK09N2",
  "vanhooydonck, s (simone)": "NGL91R1",
  "vanhooydonck,  s (simone)": "NGL91R1",
  "kuijper - vanhooydonck,  s (simone)": "NGL91R1",
  "haksteen, t.k. (tamara)": "NFX24T4",
  "haksteen,  t.k. (tamara)": "NFX24T4",
  "verweij, m (mirthe)": "NJH51Q1",
  "verweij,  m (mirthe)": "NJH51Q1",
  "leijs, r (renee)": "NJC15N7",
  "leijs,  r (renee)": "NJC15N7",
  "leijs, r (renée)": "NJC15N7",
  "leijs,  r (renée)": "NJC15N7",
  "peuter de, f (freek)": "NJG52P6",
  "trooyen, van d. (danny)": "NJZ80M3",
  "trooyen, van d. (damien)": "NJZ80J2",
  "moerman, b (barbara)": "NFW41S7",
  "ooyen, n (nando": "NJT89Y8", // ontbrekende sluithaak in telling
  "kuipers (johan)": "NGC32X7",
  "wondergem (mark-jan)": "NGB14K1",
  "nes van, v (vera)": "NLG57Q2",
  "rubio, e. (estelle)": "NLG58Y1",
  "valk (jarno)": "NLG57L7",
  "willigen v., f. (floris)": "NLK19D1",
  "willigen v., d (danique)": "NLL37R4",
  "peeters, l. (laura)": "NGZ14H4",
  "boeije (thomas)": "NLP77V6",
  "kuijper (raoul)": "NLN28Y3",
  "de geus, n.e.j.(noa)": "NLS45P6",
  "koorneef, t. (tommie)": "NLB71B4", // DB: Koornneef (dubbel-n)
  "koorneef, w (wouter)": "NLB71F2", // DB: Koornneef
  "haaren, van. s (simone)": "NGZ14B2", // DB: van Haren
  "ullmann, mor": "NFV03D7", // DB: Ullman
  "katbahadour, yves": "NJD69G6", // DB: Katbahadoer
  "meyers, m. (milo)": "NLG93G0", // DB: Meijers
  "donkevoort, t. (tim)": "SKIP", // niet in DB
  "talens, m. (moniek)": "SKIP",
  "talens, m.(moniek)": "SKIP",
  "meuhlhaus, b (babette)": "NLG57H9", // DB: Babet Muehlhaus
  "meuhlhaus, b (babet)": "NLG57H9",
  "toorn, e.  (esther)": "NLG57J3", // DB: Esther Torn (dubbel-o → enkel-o)
  "kamezman, zoe": "NLX08G7", // DB: Zoë Kamerman
  "mol, l.a. (lucien)": "NMY95H8", // Lucien Hol (achternaam fout in telling)
  "hoffman, m. (merel)": "SKIP",
  // === ACHTERNAAM-ROEPNAAM FORMAAT (2017-2019) ===
  "verweij, mirthe": "NJH51Q1",
  "starre, kim van der": "NJK09N2",
  "haan-van dijk, suzan de": "NHP43T7", // DB: Suzanne van Dijk (getrouwd met de Haan)
  // === BRUIN/DIJK FORMAAT met rare spacing ===
  "bruin, de d.(daphne)": "NJB68C3", // DB: Daphne de Bruyn (ui→uy)
  "haan-van dijk, de s(suzan)": "NHP43T7", // DB: Suzanne van Dijk
  // === INITIAAL-FORMAAT (2020-2021 coaches + 2025-2026) ===
  "j.p. verwaal (mw1)": "NFW14Y3",
  "a de haas (b1)": "NLH27P1",
  "m. sas (c1)": "NLP78Q4", // Maarten Sas (M, geb 2008)
  "l. exalto (e1/f1)": "NMB03R4",
  "f. van rijswijk (e6)": "NMN85P8",
  "j. den dekker (f2)": "NMN09P0",
  "l. van der laars (s6)": "NLP92T7",
  "l. van de rest (f3)": "NMN65L0",
  "e. ardon (s3)": "NJG13L1",
  "m. verweij (s1)": "NJH51Q1",
  "zwanenburg-moerman, d.": "NFW15S4",
  "verwaal, j.p.": "NFW14Y3",
  "de haas, a": "NLH27P1",
  "sas, m.": "NLP78Q4",
  "karstens, t": "NLM17J9", // Tara Karsten (geslacht in telling onjuist)
  "exalto, l.": "NMB03R4", // Laura
  "exalto, l.b.c.": "NMD34T8", // Lisa
  "ameijden, van j.": "NMC41W4", // Joep
  "ameijden, van m.": "NMK59H6", // Morris
  "van rijswijk, f.": "NMN85P8",
  "den dekker, j.": "NMN09P0",
  "van der laars, l.": "NLP92T7",
  "van de rest, l.": "NMN65L0",
  "verweij, m.": "NJH51Q1",
  "ardon, e.": "NJG13L1",
  "merlijn wit, de": "NMJ57G2",
  // === ROBIN DOMMISSE → SCHOT (getrouwd) ===
  "robin dommisse": "NJQ72K1",
  "dommisse, r. (robin)": "NJQ72K1",
  "dommisse,  r. (robin)": "NJQ72K1",
  // === 2016-2017 varianten (geen spatie voor haakjes) ===
  "verweij, m.(mirthe)": "NJH51Q1",
  "starre, van der k.(kim)": "NJK09N2",
  "haan-van dijk, de s(suzan)": "NHP43T7", // DB: Suzanne van Dijk
  // === SMART QUOTES (Unicode U+2019 in Excel) ===
  "maarten van \u2019t noordende": "NJT90J1",
  "dorien in\u2019t veld": "NFW28D3",
  "lisette in\u2019t veld": "NGD97S8",
  // === ENCODING-PROBLEMEN (garbled UTF-8 in Excel) ===
  "tun\u03C2y\u00FCrek, s\u00FCmeyra": "NLR80N6",
  "quarr\u00E9, elena": "NLB70S0",
  "tun\u00CF\u201Ay\u00C3\u00BCrek, s\u00C3\u00BCmeyra": "NLR80N6",
  "quarr\u00C3\u00A9, elena": "NLB70S0",
};

// ============================================================
// HELPERS
// ============================================================

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normInitials(s: string): string {
  return s
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

const TUSSENVOEGSELS = [
  "van de",
  "van den",
  "van der",
  "van het",
  "van 't",
  "in 't",
  "op de",
  "op den",
  "van",
  "de",
  "den",
  "der",
  "het",
  "'t",
  "te",
  "ten",
  "ter",
];

function wasActief(lid: LidRecord, seizoenStartJaar: number): boolean {
  const ls = lid.lid_sinds ? new Date(lid.lid_sinds).getFullYear() : 1990;
  const af = lid.afmelddatum
    ? new Date(lid.afmelddatum).getFullYear()
    : 2100;
  return ls <= seizoenStartJaar + 1 && af >= seizoenStartJaar;
}

// ============================================================
// NAAM PARSING
// ============================================================

interface Candidate {
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string;
  voorletters: string;
}

function parseCandidates(raw: string): Candidate[] {
  const s = raw.trim();
  const candidates: Candidate[] = [];

  // Skip header/summary rijen
  if (
    s.match(
      /^\d+\/\d+|^S\d|^A\d|^B\d|^C\d|^D\d|^E\d|^F\d|^MW|^Kangoeroes$|^-\s|^Iis$/
    )
  )
    return [];

  const commaIdx = s.indexOf(",");

  if (commaIdx > 0) {
    const achternaamRaw = s.slice(0, commaIdx).trim();
    const rest = s.slice(commaIdx + 1).trim();

    // Extract "(Roepnaam)"
    const haakjes = rest.match(/\(([^)]+)\)/);
    const roepnaam = haakjes ? haakjes[1].trim() : "";
    const voorHaakjes = haakjes
      ? rest.slice(0, rest.indexOf("(")).trim()
      : rest;
    const naHaakjes = haakjes
      ? rest.slice(rest.indexOf(")") + 1).trim()
      : "";

    let tv = "";
    let vl = "";

    // Tussenvoegsel na haakjes: "Opstal-Haksteen, T.K. (Tamara) van"
    if (naHaakjes) {
      const naLower = naHaakjes.toLowerCase();
      if (TUSSENVOEGSELS.includes(naLower)) tv = naLower;
    }

    // Analyseer deel voor haakjes
    const voorLower = voorHaakjes.toLowerCase().trim();
    if (voorLower) {
      // Check of het begint met tussenvoegsel: "van E." of "van der K"
      const matchedTv = TUSSENVOEGSELS.find(
        (t) => voorLower === t || voorLower.startsWith(t + " ")
      );
      if (matchedTv) {
        if (!tv) tv = matchedTv;
        const vlPart = voorHaakjes.slice(matchedTv.length).trim();
        if (vlPart) vl = vlPart;
      } else {
        vl = voorHaakjes;
      }
    }

    candidates.push({
      roepnaam,
      achternaam: achternaamRaw,
      tussenvoegsel: tv,
      voorletters: normInitials(vl),
    });

    // Extra candidate: als geen haakjes, rest kan "Roepnaam [tv]" zijn
    if (!haakjes && rest.trim()) {
      const restParts = rest.split(/\s+/);
      const rn = restParts[0];
      const tvParts = restParts.slice(1).join(" ").toLowerCase();
      const matchedTv = TUSSENVOEGSELS.find((t) => tvParts === t);
      candidates.push({
        roepnaam: rn,
        achternaam: achternaamRaw,
        tussenvoegsel: matchedTv || "",
        voorletters: "",
      });
    }
  } else {
    // SPATIE-formaat: "Roepnaam [tv] Achternaam"
    const parts = s.split(/\s+/);
    if (parts.length >= 2) {
      // Try: first word = roepnaam, rest = [tv] + achternaam
      const roepnaam = parts[0];
      const restJoined = parts.slice(1).join(" ");

      // Check voor tussenvoegsel
      const restLower = restJoined.toLowerCase();
      let found = false;
      for (const tv of TUSSENVOEGSELS) {
        if (restLower.startsWith(tv + " ") && restJoined.length > tv.length + 1) {
          const achternaam = restJoined.slice(tv.length).trim();
          candidates.push({
            roepnaam,
            achternaam,
            tussenvoegsel: tv,
            voorletters: "",
          });
          found = true;
          break;
        }
      }
      if (!found) {
        candidates.push({
          roepnaam,
          achternaam: parts.slice(1).join(" "),
          tussenvoegsel: "",
          voorletters: "",
        });
      }
    }
  }

  return candidates;
}

// ============================================================
// MATCHING
// ============================================================

function matchLid(
  naam: string,
  geslacht: string,
  leden: LidRecord[],
  seizoen: string
): { relCode: string | null; methode: string } {
  // Check handmatige mapping eerst
  const naamLower = naam.trim().toLowerCase();
  // Probeer exacte match, dan genormaliseerde match (smart quotes → gewone)
  const naamNorm = naamLower
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // smart quotes → '
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"'); // smart double quotes
  const manualCode = MANUAL_MAP[naamLower] || MANUAL_MAP[naamNorm];
  if (manualCode === "SKIP") {
    return { relCode: null, methode: "skip_handmatig" };
  }
  if (manualCode) {
    return { relCode: manualCode, methode: "handmatig" };
  }
  // Fallback: garbled encoding fix — strip non-ASCII en match bekende patronen
  const asciiOnly = naamLower.replace(/[^\x20-\x7e]/g, "");
  if (asciiOnly.includes("rek, smeyra") || asciiOnly.includes("tun") && asciiOnly.includes("rek")) {
    return { relCode: "NLR80N6", methode: "handmatig_encoding" }; // Sümeyra Tunςyürek
  }
  if (asciiOnly.includes("quarr") && asciiOnly.includes("elena")) {
    return { relCode: "NLB70S0", methode: "handmatig_encoding" }; // Elena Quarré
  }

  const candidates = parseCandidates(naam);
  if (candidates.length === 0) return { relCode: null, methode: "skip" };

  const seizoenStart = parseInt(seizoen.split("-")[0]);
  const gLeden = leden.filter((l) => l.geslacht === geslacht);

  for (const c of candidates) {
    const normRoep = norm(c.roepnaam);
    const normAcht = norm(c.achternaam);
    if (!normAcht) continue;

    // Pass 1: Exact roepnaam + achternaam
    if (normRoep) {
      const exact = gLeden.filter(
        (l) => norm(l.roepnaam) === normRoep && norm(l.achternaam) === normAcht
      );
      if (exact.length === 1)
        return { relCode: exact[0].rel_code, methode: "exact" };
      if (exact.length > 1) {
        const actief = exact.filter((l) => wasActief(l, seizoenStart));
        if (actief.length === 1)
          return { relCode: actief[0].rel_code, methode: "exact+tijd" };
      }
    }

    // Pass 2: Achternaam + voorletters
    if (c.voorletters) {
      const achtMatches = gLeden.filter(
        (l) => norm(l.achternaam) === normAcht
      );
      // Met tussenvoegsel-check
      const vlTvMatches = achtMatches.filter((l) => {
        if (!l.voorletters) return false;
        const lidVl = normInitials(l.voorletters);
        const vlOk =
          lidVl === c.voorletters ||
          lidVl.startsWith(c.voorletters) ||
          c.voorletters.startsWith(lidVl);
        if (!vlOk) return false;
        if (c.tussenvoegsel && l.tussenvoegsel) {
          return norm(c.tussenvoegsel) === norm(l.tussenvoegsel);
        }
        return true;
      });
      if (vlTvMatches.length === 1)
        return { relCode: vlTvMatches[0].rel_code, methode: "acht+vl+tv" };
      if (vlTvMatches.length > 1) {
        const actief = vlTvMatches.filter((l) => wasActief(l, seizoenStart));
        if (actief.length === 1)
          return { relCode: actief[0].rel_code, methode: "acht+vl+tv+tijd" };
      }
      // Zonder tussenvoegsel-check
      const vlMatches = achtMatches.filter((l) => {
        if (!l.voorletters) return false;
        const lidVl = normInitials(l.voorletters);
        return (
          lidVl === c.voorletters ||
          lidVl.startsWith(c.voorletters) ||
          c.voorletters.startsWith(lidVl)
        );
      });
      if (vlMatches.length === 1)
        return { relCode: vlMatches[0].rel_code, methode: "acht+vl" };
      if (vlMatches.length > 1) {
        const actief = vlMatches.filter((l) => wasActief(l, seizoenStart));
        if (actief.length === 1)
          return { relCode: actief[0].rel_code, methode: "acht+vl+tijd" };
      }
    }

    // Pass 3: Achternaam + roepnaam fuzzy
    if (normRoep) {
      const achtMatches = gLeden.filter(
        (l) => norm(l.achternaam) === normAcht
      );
      const fuzzy = achtMatches.filter(
        (l) =>
          norm(l.roepnaam).includes(normRoep) ||
          normRoep.includes(norm(l.roepnaam))
      );
      if (fuzzy.length === 1)
        return { relCode: fuzzy[0].rel_code, methode: "fuzzy" };
      if (fuzzy.length > 1) {
        const actief = fuzzy.filter((l) => wasActief(l, seizoenStart));
        if (actief.length === 1)
          return { relCode: actief[0].rel_code, methode: "fuzzy+tijd" };
      }
    }

    // Pass 4: Achternaam-only + actief
    const achtOnly = gLeden.filter((l) => norm(l.achternaam) === normAcht);
    if (achtOnly.length === 1)
      return { relCode: achtOnly[0].rel_code, methode: "acht_uniek" };
    if (achtOnly.length > 1) {
      const actief = achtOnly.filter((l) => wasActief(l, seizoenStart));
      if (actief.length === 1)
        return { relCode: actief[0].rel_code, methode: "acht+tijd" };
      // Initiaal als tiebreaker
      if (normRoep || c.voorletters) {
        const initial = (
          normRoep ? normRoep[0] : c.voorletters[0]
        ).toUpperCase();
        const im = actief.filter(
          (l) =>
            l.roepnaam.toUpperCase().startsWith(initial) ||
            (l.voorletters && normInitials(l.voorletters).startsWith(initial))
        );
        if (im.length === 1)
          return { relCode: im[0].rel_code, methode: "acht+initiaal" };
      }
    }

    // Pass 5: Samengestelde achternaam
    if (normAcht.includes("-")) {
      for (const part of normAcht.split("-")) {
        const pm = gLeden.filter((l) => norm(l.achternaam) === part);
        const actief = pm.filter((l) => wasActief(l, seizoenStart));
        if (actief.length === 1)
          return { relCode: actief[0].rel_code, methode: "samengesteld" };
      }
    }

    // Pass 6: Tussenvoegsel in achternaam (bijv. normAcht = "ballegooijen" maar DB heeft "Ballegooijen" met tv "van")
    {
      const achtWithTv = gLeden.filter((l) => {
        if (!l.tussenvoegsel) return false;
        return norm(l.achternaam) === normAcht;
      });
      if (achtWithTv.length === 1)
        return { relCode: achtWithTv[0].rel_code, methode: "acht+db_tv" };
      if (achtWithTv.length > 1) {
        const actief = achtWithTv.filter((l) => wasActief(l, seizoenStart));
        if (actief.length === 1)
          return { relCode: actief[0].rel_code, methode: "acht+db_tv+tijd" };
      }
    }
  }

  return { relCode: null, methode: "geen_match" };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const wb = XLSX.readFile(XLSX_PATH);
    const seizoenen = wb.SheetNames.filter((s: string) =>
      s.match(/^\d{4}-\d{4}$/)
    );

    const ledenRes = await pool.query(
      "SELECT rel_code, roepnaam, achternaam, tussenvoegsel, voorletters, geslacht, geboortejaar, lid_sinds::text, afmelddatum::text FROM leden"
    );
    const leden: LidRecord[] = ledenRes.rows;
    console.log(`Leden in DB: ${leden.length}`);
    console.log(`Seizoenen in telling: ${seizoenen.length}\n`);

    let totaalGematcht = 0;
    let totaalNiet = 0;
    const nietGematcht: { seizoen: string; naam: string; team: string }[] = [];

    for (const seizoen of seizoenen) {
      const ws = wb.Sheets[seizoen];
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const header = data[0] || [];
      const hasVorig = header.length >= 4;
      const rijen: TellingRij[] = data
        .slice(1)
        .filter((r) => r[0] && String(r[0]).trim())
        .map((r) => ({
          naam: String(r[0]).trim(),
          geslacht: String(r[1]).trim() === "H" ? "M" : "V",
          team: String(r[2] || "").trim(),
          teamVorigSeizoen: hasVorig
            ? String(r[3] || "").trim() || undefined
            : undefined,
        }));

      let gematcht = 0;
      let niet = 0;

      for (const rij of rijen) {
        const match = matchLid(rij.naam, rij.geslacht, leden, seizoen);

        if (match.relCode) {
          const res = await pool.query(
            `INSERT INTO speler_seizoenen (rel_code, seizoen, team, geslacht, bron, betrouwbaar)
             VALUES ($1, $2, $3, $4, 'telling', true)
             ON CONFLICT (rel_code, seizoen) DO UPDATE SET
               team = EXCLUDED.team, geslacht = EXCLUDED.geslacht, bron = EXCLUDED.bron
             RETURNING id`,
            [match.relCode, seizoen, rij.team, rij.geslacht]
          );
          const ssId = res.rows[0].id;

          await pool.query(
            `INSERT INTO competitie_spelers (speler_seizoen_id, competitie, team, bron)
             VALUES ($1, 'veld_najaar', $2, 'telling')
             ON CONFLICT (speler_seizoen_id, competitie) DO UPDATE SET
               team = EXCLUDED.team, bron = EXCLUDED.bron`,
            [ssId, rij.team]
          );

          // Team vorig seizoen → veld_voorjaar van vorig seizoen
          if (rij.teamVorigSeizoen) {
            const sj = parseInt(seizoen.split("-")[0]);
            const vorigSeizoen = `${sj - 1}-${sj}`;
            const vorigRes = await pool.query(
              `SELECT id FROM speler_seizoenen WHERE rel_code = $1 AND seizoen = $2`,
              [match.relCode, vorigSeizoen]
            );
            if (vorigRes.rows.length > 0) {
              await pool.query(
                `INSERT INTO competitie_spelers (speler_seizoen_id, competitie, team, bron)
                 VALUES ($1, 'veld_voorjaar', $2, 'preseason')
                 ON CONFLICT (speler_seizoen_id, competitie) DO UPDATE SET
                   team = COALESCE(NULLIF(EXCLUDED.team, ''), competitie_spelers.team)`,
                [vorigRes.rows[0].id, rij.teamVorigSeizoen]
              );
            }
          }

          gematcht++;
        } else if (match.methode !== "skip") {
          niet++;
          nietGematcht.push({ seizoen, naam: rij.naam, team: rij.team });
        }
      }

      totaalGematcht += gematcht;
      totaalNiet += niet;
      console.log(
        `${seizoen}: ${rijen.length} rijen → ${gematcht} gematcht (${Math.round((gematcht / Math.max(rijen.length, 1)) * 100)}%), ${niet} niet`
      );
    }

    const pct = Math.round(
      (totaalGematcht / Math.max(totaalGematcht + totaalNiet, 1)) * 100
    );
    console.log(
      `\nTotaal: ${totaalGematcht} gematcht, ${totaalNiet} niet (${pct}%)`
    );

    if (nietGematcht.length > 0) {
      console.log(`\n=== NIET GEMATCHT (${nietGematcht.length}) ===`);
      for (const n of nietGematcht) {
        console.log(`  ${n.seizoen} | ${n.naam} | ${n.team}`);
      }
    }

    const ssCount = await pool.query(
      "SELECT COUNT(*)::int as n FROM speler_seizoenen"
    );
    const spCount = await pool.query(
      "SELECT COUNT(*)::int as n FROM competitie_spelers"
    );
    console.log(
      `\nEindstand: ${ssCount.rows[0].n} speler_seizoenen, ${spCount.rows[0].n} competitie_spelers`
    );
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("FOUT:", e.message);
  process.exit(1);
});
