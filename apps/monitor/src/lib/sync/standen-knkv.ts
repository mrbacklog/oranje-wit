/**
 * standen-knkv.ts
 *
 * Haalt actuele competitiestanden op van de KNKV API en slaat ze op
 * in pool_standen + pool_stand_regels. Wordt aangeroepen bij het laden
 * van de teams-pagina — skipt als de data al van vandaag is.
 */

import { prisma } from "@/lib/db/prisma";

const CLUB_ID = "NCX19J3";
const API_BASE = "https://api-mijn.korfbal.nl/api/v2";

const SPORT_PERIODES = [
  { sport: "KORFBALL-VE-WK", periode: "veld_najaar" },
  { sport: "KORFBALL-ZA-WK", periode: "zaal" },
] as const;

// ---------------------------------------------------------------------------
// Niveau-afleiding op basis van poolnaam
// ---------------------------------------------------------------------------

function bepaalNiveau(poolNaam: string): string | null {
  const upper = poolNaam.toUpperCase();
  if (upper.includes("HK")) return "Hoofdklasse";
  if (upper.includes("OK")) return "Overgangsklasse";
  if (/^ROK/.test(upper)) return "Reserve Hoofdklasse";
  const rMatch = upper.match(/^R(\d)/);
  if (rMatch) return `Reserve ${rMatch[1]}e klasse`;
  if (upper.startsWith("RO")) return "Rood";
  if (upper.startsWith("OR")) return "Oranje";
  if (upper.startsWith("GE")) return "Geel";
  if (upper.startsWith("GR")) return "Groen";
  if (upper.startsWith("BL")) return "Blauw";
  if (/^1[A-Z]?$/.test(upper) || /^1-/.test(poolNaam)) return "1e klasse";
  if (/^2[A-Z]?$/.test(upper) || /^2-/.test(poolNaam)) return "2e klasse";
  if (/^3[A-Z]?$/.test(upper) || /^3-/.test(poolNaam)) return "3e klasse";
  const uMatch = poolNaam.match(/^U\d+-(\d)/);
  if (uMatch) return `${uMatch[1]}e klasse`;
  if (upper.startsWith("S-")) return "Speciaal";
  if (upper.startsWith("MW")) return "Micro/Wandel";
  return null;
}

// ---------------------------------------------------------------------------
// API types
// ---------------------------------------------------------------------------

interface KnkvPoolEntry {
  team: { name: string; ref_id: string };
  pools: { name: string; ref_id: number; sport: { name: string; ref_id: string } }[];
}

interface KnkvStandEntry {
  pool: { name: string; ref_id: number };
  standings: {
    stats: {
      position: number;
      played: number;
      won: number;
      draw: number;
      lost: number;
      points: number;
      goals: { for: number; against: number };
    };
    team: { name: string };
  }[];
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`HTTP ${res.status} voor ${url}`);
  return res.json() as Promise<T>;
}

async function haalPoolsOp(sportCode: string): Promise<Map<number, string>> {
  const data = await fetchJSON<KnkvPoolEntry[]>(
    `${API_BASE}/pools/club/${CLUB_ID}?sport=${sportCode}&team=true`
  );
  const poolMap = new Map<number, string>();
  for (const entry of data) {
    for (const pool of entry.pools) {
      poolMap.set(pool.ref_id, pool.name);
    }
  }
  return poolMap;
}

async function haalStandOp(poolRefId: number): Promise<KnkvStandEntry> {
  const data = await fetchJSON<KnkvStandEntry[]>(`${API_BASE}/matches/pools/${poolRefId}/standing`);
  return data[0] || { pool: { name: "", ref_id: poolRefId }, standings: [] };
}

// ---------------------------------------------------------------------------
// Staleness check
// ---------------------------------------------------------------------------

async function isStale(seizoen: string): Promise<boolean> {
  const result = await prisma.poolStand.aggregate({
    where: { seizoen },
    _max: { standDatum: true },
  });
  const laatsteDatum = result._max.standDatum;
  if (!laatsteDatum) return true;

  const vandaag = new Date().toISOString().slice(0, 10);
  const laatsteStr = laatsteDatum.toISOString().slice(0, 10);
  return laatsteStr < vandaag;
}

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

async function syncAlleStanden(seizoen: string): Promise<void> {
  const standDatum = new Date();

  for (const { sport, periode } of SPORT_PERIODES) {
    let poolMap: Map<number, string>;
    try {
      poolMap = await haalPoolsOp(sport);
    } catch {
      console.warn(`[standen-sync] Geen pools voor ${sport}`);
      continue;
    }

    for (const [refId, poolNaam] of poolMap) {
      try {
        const data = await haalStandOp(refId);
        if (data.standings.length === 0) continue;

        // Upsert pool_standen
        const poolStand = await prisma.poolStand.upsert({
          where: {
            seizoen_periode_pool: { seizoen, periode, pool: poolNaam },
          },
          create: {
            seizoen,
            periode,
            pool: poolNaam,
            niveau: bepaalNiveau(poolNaam),
            standDatum,
            bronBestand: "knkv-api",
          },
          update: {
            niveau: bepaalNiveau(poolNaam),
            standDatum,
            bronBestand: "knkv-api",
          },
        });

        // Verwijder oude regels, insert nieuwe
        await prisma.poolStandRegel.deleteMany({
          where: { poolStandId: poolStand.id },
        });

        await prisma.poolStandRegel.createMany({
          data: data.standings.map((entry) => ({
            poolStandId: poolStand.id,
            positie: entry.stats.position,
            teamNaam: entry.team.name,
            isOW: entry.team.name.includes("Oranje Wit"),
            gespeeld: entry.stats.played,
            gewonnen: entry.stats.won,
            gelijk: entry.stats.draw,
            verloren: entry.stats.lost,
            punten: entry.stats.points,
            doelpuntenVoor: entry.stats.goals.for,
            doelpuntenTegen: entry.stats.goals.against,
          })),
        });
      } catch {
        // Individuele pool mag falen zonder de rest te blokkeren
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function syncStandenIfStale(seizoen: string): Promise<void> {
  try {
    if (await isStale(seizoen)) {
      console.log(`[standen-sync] Standen verouderd voor ${seizoen}, verversing gestart...`);
      await syncAlleStanden(seizoen);
      console.log(`[standen-sync] Standen bijgewerkt.`);
    }
  } catch (err) {
    // Bij API-fouten: ga door met bestaande data
    console.warn(`[standen-sync] Fout bij synchronisatie:`, err);
  }
}
