import sharp from "sharp";
import { prisma, relCode, teamId } from "./types";
import { TEAM_DEFS } from "./seed-teams";
import { STATUS_FIXTURES } from "./seed-status-edge";
import { LEEFTIJD_FIXTURES } from "./seed-leeftijd-edge";
import { logger } from "@oranje-wit/types";

/**
 * Sectie 1.9 — Fictieve profielfoto's via DiceBear v9 Lorelei.
 *
 * Stijl: lorelei — realistischer geïllustreerd portret dan personas-stijl.
 * Sexe-suggestie via haar-keuze (variant01-48), deterministisch via rel_code.
 *
 * Dekking:
 *   80% van default spelers krijgt foto (deterministisch via rel_code % 5 !== 0)
 *   Alle edge-case fixtures (status 1.3, leeftijd 1.4, data-incomplete 1.5, multi-team 1.6) krijgen foto
 *   1 extra broken-image-fixture: rel_code 990050000001 met bronUrl maar imageWebp = 1x1 grijs
 *
 * Rate-limit: 1 req / 100ms op DiceBear
 * CI-fallback: bij timeout >3s wordt 1x1 grijze WebP placeholder gebruikt
 */

// 1×1 grijs WebP (hardcoded bytes) — gebruikt als fallback bij netwerkproblemen
const GRIJS_WEBP_1X1 = Buffer.from(
  "UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoBAAEAAkA4JZACdAEO/hgFQAAAA" + "A==",
  "base64"
);

const DICEBEAR_BASE = "https://api.dicebear.com/9.x/lorelei/png";
const FETCH_TIMEOUT_MS = 3000;
const RATE_LIMIT_MS = 100;

// Lorelei variant-namen: variant01..variant48 (48 stuks)
// Bron: https://api.dicebear.com/9.x/lorelei/schema.json
// Lagere variant-nummers neigen vaker naar lang haar; hogere nummers vaker kort.
// Empirische split: V krijgt variants 01-30 (langer haar), M krijgt 31-48 (korter haar).
function loreleiHair(relCode: string, geslacht: "M" | "V"): string {
  const seed = parseInt(relCode.slice(-2), 10);
  const num = geslacht === "V" ? 1 + (seed % 30) : 31 + (seed % 18);
  return `variant${String(num).padStart(2, "0")}`;
}

function bouwDiceBearUrl(relCode: string, geslacht: "M" | "V", _geboortejaar: number): string {
  // DiceBear v9 lorelei API — query-params
  const parts: string[] = [
    `seed=${encodeURIComponent(relCode)}`,
    `size=256`,
    `hair=${encodeURIComponent(loreleiHair(relCode, geslacht))}`,
  ];

  return `${DICEBEAR_BASE}?${parts.join("&")}`;
}

async function fetchMetTimeout(url: string): Promise<Buffer | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      logger.warn(`[seed-fotos] DiceBear HTTP ${res.status} voor ${url}`);
      return null;
    }
    const buf = await res.arrayBuffer();
    return Buffer.from(buf);
  } catch {
    logger.warn(`[seed-fotos] DiceBear timeout/fout voor ${url} — fallback placeholder`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function pngNaarWebp(pngBuf: Buffer): Promise<Buffer> {
  return sharp(pngBuf).webp({ quality: 80 }).toBuffer();
}

interface FotoTarget {
  relCode: string;
  geslacht: "M" | "V";
  geboortejaar: number;
  altijdFoto: boolean; // edge-case fixtures krijgen altijd een foto
}

/**
 * Zorg dat er een Lid-record bestaat voor dit relCode.
 * LidFoto heeft een FK naar Lid.relCode, dus zonder Lid-record kan er geen foto zijn.
 * Synth spelers hebben geen echte Lid-tegenhanger — we maken een minimale stub.
 */
async function zorgLidBestaat(
  relCode: string,
  geslacht: "M" | "V",
  geboortejaar: number
): Promise<void> {
  await prisma.lid.upsert({
    where: { relCode },
    create: {
      relCode,
      roepnaam: `Synth-${relCode}`,
      achternaam: "Seed",
      geslacht,
      geboortejaar,
    },
    update: {},
  });
}

async function upsertFoto(target: FotoTarget): Promise<"skip" | "ok" | "placeholder"> {
  // Idempotent: skip als al bestaat
  const bestaand = await prisma.lidFoto.findUnique({ where: { relCode: target.relCode } });
  if (bestaand) return "skip";

  // LidFoto heeft FK naar Lid.relCode — zorg dat Lid bestaat
  await zorgLidBestaat(target.relCode, target.geslacht, target.geboortejaar);

  const url = bouwDiceBearUrl(target.relCode, target.geslacht, target.geboortejaar);
  const pngBuf = await fetchMetTimeout(url);

  let webpBuf: Buffer;
  let result: "ok" | "placeholder";

  if (pngBuf) {
    webpBuf = await pngNaarWebp(pngBuf);
    result = "ok";
  } else {
    webpBuf = GRIJS_WEBP_1X1;
    result = "placeholder";
  }

  await prisma.lidFoto.upsert({
    where: { relCode: target.relCode },
    create: {
      relCode: target.relCode,
      bronUrl: url,
      imageWebp: webpBuf,
    },
    update: {
      bronUrl: url,
      imageWebp: webpBuf,
    },
  });

  return result;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function seedFotos(): Promise<void> {
  logger.info("[seed-fotos] starten");

  const targets: FotoTarget[] = [];

  // --- Default spelers (80% krijgt foto, via rel_code % 5 !== 0) ---
  for (const team of TEAM_DEFS) {
    if (team.defaultOmvang === 0) continue;
    const geboortejaar = berekenGeboortejaar(team.alias ?? team.naam);
    for (let i = 1; i <= team.defaultOmvang; i++) {
      const code = relCode(team.nr, i);
      const heeftFoto = parseInt(code.slice(-1), 10) % 5 !== 0;
      if (heeftFoto) {
        const isVrouw = i % 2 === 1;
        targets.push({
          relCode: code,
          geslacht: isVrouw ? "V" : "M",
          geboortejaar,
          altijdFoto: false,
        });
      }
    }
  }

  // --- Status-fixtures (1.3) — altijd foto ---
  for (const f of STATUS_FIXTURES) {
    const code = `99001000${String(f.volgnr).padStart(4, "0")}`;
    targets.push({
      relCode: code,
      geslacht: f.geslacht,
      geboortejaar: 2000,
      altijdFoto: true,
    });
  }

  // --- Leeftijd-fixtures (1.4) — altijd foto ---
  for (const f of LEEFTIJD_FIXTURES) {
    const code = `99002000${String(f.volgnr).padStart(4, "0")}`;
    targets.push({
      relCode: code,
      geslacht: f.geslacht,
      geboortejaar: f.geboortejaar,
      altijdFoto: true,
    });
  }

  // --- Data-incomplete fixtures (1.5) — altijd foto ---
  const dataIncompleteFixtures = [
    { code: "990030000001", geslacht: "V" as const, geboortejaar: 2000 },
    { code: "990030000002", geslacht: "V" as const, geboortejaar: 2000 }, // geslacht onbekend, gebruik V als fallback
    { code: "990030000003", geslacht: "M" as const, geboortejaar: 2000 },
  ];
  for (const f of dataIncompleteFixtures) {
    targets.push({
      relCode: f.code,
      geslacht: f.geslacht,
      geboortejaar: f.geboortejaar,
      altijdFoto: true,
    });
  }

  // --- Multi-team fixtures (1.6) — altijd foto ---
  const multiTeamFixtures = [
    { code: "990040000001", geslacht: "V" as const },
    { code: "990040000002", geslacht: "M" as const },
  ];
  for (const f of multiTeamFixtures) {
    targets.push({ relCode: f.code, geslacht: f.geslacht, geboortejaar: 2000, altijdFoto: true });
  }

  // --- Broken-image fixture: bronUrl aanwezig, imageWebp = 1x1 grijs ---
  // Maak eerst een Lid-stub aan (LidFoto heeft FK naar Lid)
  await prisma.lid.upsert({
    where: { relCode: "990050000001" },
    create: {
      relCode: "990050000001",
      roepnaam: "Synth-990050000001",
      achternaam: "BrokenImage",
      geslacht: "M",
      geboortejaar: 2000,
    },
    update: {},
  });
  await prisma.lidFoto.upsert({
    where: { relCode: "990050000001" },
    create: {
      relCode: "990050000001",
      bronUrl: bouwDiceBearUrl("990050000001", "M", 2000),
      imageWebp: GRIJS_WEBP_1X1,
    },
    update: {
      bronUrl: bouwDiceBearUrl("990050000001", "M", 2000),
      imageWebp: GRIJS_WEBP_1X1,
    },
  });
  logger.info("[seed-fotos] broken-image fixture aangemaakt (990050000001)");

  // --- Verwerk alle targets met rate-limit ---
  let aantalOk = 0;
  let aantalPlaceholder = 0;
  let aantalSkip = 0;

  for (const target of targets) {
    const result = await upsertFoto(target);
    if (result === "ok") aantalOk++;
    else if (result === "placeholder") aantalPlaceholder++;
    else aantalSkip++;

    // Rate-limit: 1 req per 100ms
    await sleep(RATE_LIMIT_MS);
  }

  logger.info(
    `[seed-fotos] klaar — ${aantalOk} echt, ${aantalPlaceholder} placeholder, ` +
      `${aantalSkip} overgeslagen (al aanwezig)`
  );
}

/** Hulpfunctie: zelfde logica als in seed-default-spelers */
function berekenGeboortejaar(alias: string): number {
  if (alias === "S1" || alias === "S2" || alias === "MW1" || alias === "RC") return 2000;
  if (alias === "S3" || alias === "S4") return 2002;
  if (alias === "EDGE-LEEG" || alias === "EDGE-ONDER") return 2000;
  if (alias.startsWith("U19")) return 2007;
  if (alias.startsWith("U17")) return 2009;
  if (alias.startsWith("U15")) return 2011;
  if (alias === "R1" || alias === "R2") return 2013;
  if (alias === "O1" || alias === "O2") return 2015;
  if (alias === "G1" || alias === "G2") return 2017;
  if (alias === "Gr1" || alias === "Gr2") return 2018;
  if (alias === "B1" || alias === "B2") return 2019;
  if (alias === "K") return 2020;
  return 2010;
}
