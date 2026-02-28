import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LeeftijdEntry = {
  leeftijd: number;
  band: string;
  totaal: number | null;
  m: number | null;
  v: number | null;
};

export type Boog = {
  beschrijving: string;
  per_leeftijd: LeeftijdEntry[];
};

export type BandenMeta = Record<string, { leeftijd: number[]; spelvorm: string }>;

export type StreefmodelResult = {
  versie: string | null;
  banden: BandenMeta;
  boog_huidig: Boog | null;
  projecties: Record<string, Boog>;
};

// ---------------------------------------------------------------------------
// Banden configuratie (statisch)
// ---------------------------------------------------------------------------

const BANDEN: BandenMeta = {
  Blauw: { leeftijd: [5, 6, 7], spelvorm: "4-tallen" },
  Groen: { leeftijd: [8, 9], spelvorm: "4-tallen" },
  Geel: { leeftijd: [10, 11, 12], spelvorm: "8-tallen" },
  Oranje: { leeftijd: [13, 14, 15], spelvorm: "8-tallen" },
  Rood: { leeftijd: [16, 17, 18], spelvorm: "8-tallen" },
};

// ---------------------------------------------------------------------------
// Categorie mapping (statisch)
// ---------------------------------------------------------------------------

export const CATEGORIE_MAPPING = {
  F: { band: "Blauw", leeftijden: [6, 7], spelvorm: "4-tal" },
  E: { band: "Groen", leeftijden: [8, 9], spelvorm: "4-tal" },
  D: { band: "Geel", leeftijden: [10, 11, 12], spelvorm: "8-tal" },
  C: { band: "Oranje", leeftijden: [13, 14, 15], spelvorm: "8-tal" },
  B: { band: "Rood", leeftijden: [16, 17], spelvorm: "8-tal" },
  A: { band: "Rood", leeftijden: [17, 18], spelvorm: "8-tal" },
  S: { band: "Senioren", leeftijden: null, spelvorm: "8-tal" },
  K: { band: "Kangoeroe", leeftijden: [4, 5], spelvorm: null },
} as const;

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export async function getStreefmodel(): Promise<StreefmodelResult> {
  const rows = await prisma.streefmodel.findMany({
    orderBy: [{ versie: "asc" }, { seizoenDoel: "asc" }, { leeftijd: "asc" }],
  });

  if (rows.length === 0) {
    return {
      versie: null,
      banden: BANDEN,
      boog_huidig: null,
      projecties: {},
    };
  }

  const versie = rows[0].versie;
  const basis = rows[0].seizoenBasis;

  // Groepeer per seizoen_doel
  const bogen: Record<string, LeeftijdEntry[]> = {};
  for (const r of rows) {
    const key = r.seizoenDoel;
    if (!bogen[key]) bogen[key] = [];
    bogen[key].push({
      leeftijd: r.leeftijd,
      band: r.band,
      totaal: r.totaal,
      m: r.m,
      v: r.v,
    });
  }

  const boogHuidig = bogen[basis]
    ? { beschrijving: `Huidig seizoen ${basis}`, per_leeftijd: bogen[basis] }
    : null;

  const projecties: Record<string, Boog> = {};
  for (const key of Object.keys(bogen).sort()) {
    if (key === basis) continue;
    projecties[key] = {
      beschrijving: `Streefmodel ${key}`,
      per_leeftijd: bogen[key],
    };
  }

  return {
    versie,
    banden: BANDEN,
    boog_huidig: boogHuidig,
    projecties,
  };
}
