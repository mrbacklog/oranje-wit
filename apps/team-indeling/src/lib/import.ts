/**
 * Kern import-logica: importeert data uit de Verenigingsmonitor export-JSON
 * naar de gedeelde database.
 *
 * Wordt gebruikt door:
 * - CLI: scripts/import-data.ts
 * - API: src/app/api/import/route.ts
 *
 * Veiligheidsgaranties bij re-import:
 * - Speler/Staf basisdata: bijgewerkt (bron is leidend)
 * - Speler.notitie / Staf.notitie: behouden (gebruikersinvoer)
 * - ReferentieTeam: vervangen (pure referentie)
 * - Blauwdruk.kaders: bijgewerkt (referentiedata)
 * - Blauwdruk.speerpunten/toelichting: behouden (gebruikersinvoer)
 * - Pins, Concepten, Scenario's: ongewijzigd
 */

import { prisma } from "./db/prisma";
import type { Prisma } from "@oranje-wit/database";

// --- Types ---

export interface ImportResult {
  seizoen: string;
  exportDatum: string;
  snapshotDatum: string;
  spelers: { nieuw: number; bijgewerkt: number; fouten: number };
  staf: { nieuw: number; bijgewerkt: number; fouten: number };
  teams: { geladen: number };
  blauwdruk: { status: "aangemaakt" | "bijgewerkt" | "ongewijzigd" };
  importId: string;
}

interface ExportMeta {
  export_datum: string;
  export_versie: string;
  bron: string;
  seizoen_huidig: string;
  seizoen_nieuw: string;
  snapshot_datum: string;
  totaal_actieve_spelers: number;
  totaal_jeugd: number;
  totaal_senioren: number;
  totaal_staf: number;
}

interface ExportSpeler {
  id: string;
  roepnaam: string;
  achternaam: string;
  geslacht: "M" | "V";
  geboortejaar: number;
  lid_sinds: string | null;
  huidig: {
    team: string | null;
    categorie: string | null;
    kleur: string | null;
    a_categorie: string | null;
    a_jaars: string | null;
    leeftijd: number | null;
  };
  volgend_seizoen: {
    leeftijd: number;
    a_categorie: string | null;
    a_jaars: string | null;
    band_b: string | null;
    opmerking: string | null;
  };
  spelerspad: Array<{
    seizoen: string;
    team: string;
    kleur: string | null;
    niveau: string | null;
    spelvorm: string | null;
    categorie: string | null;
  }>;
  retentie: {
    risico: string;
    kans_behoud: number;
    factoren: string[];
  };
  teamgenoten_historie: Array<{
    speler_id: string;
    naam: string;
    seizoenen_samen: number;
  }>;
  seizoenen_actief: number;
  instroom_leeftijd: number | null;
}

interface ExportStaf {
  id: string;
  naam: string;
  geboortejaar: number | null;
  rol: string;
  teams: Array<{ team: string; kleur: string | null }>;
}

interface ExportTeamHuidig {
  team: string;
  categorie: string;
  kleur: string | null;
  niveau: string | null;
  spelvorm: string | null;
  pool_veld: string | null;
  pool_zaal: string | null;
  speler_ids: string[];
  staf_ids: string[];
  stats: { totaal: number; m: number; v: number; gem_leeftijd: number };
}

export interface ExportData {
  meta: ExportMeta;
  spelers: ExportSpeler[];
  staf: ExportStaf[];
  teams_huidig: ExportTeamHuidig[];
  verloop: unknown;
  retentiemodel: unknown;
  streefmodel: unknown;
  signalering: unknown[];
  instroom_profiel: unknown;
}

// --- Helpers ---

function mapRol(rol: string): string[] {
  switch (rol) {
    case "Technische staf":
      return ["trainer"];
    case "Overige staf":
      return ["begeleider"];
    default:
      return [rol.toLowerCase()];
  }
}

function buildKaders(data: ExportData): Prisma.InputJsonValue {
  return {
    knkv: "Competitie 2.0 regels (zie rules/knkv-regels.md)",
    ow: "OW-voorkeuren (zie rules/ow-voorkeuren.md)",
    streefmodel: data.streefmodel,
    signalering: data.signalering,
    verloop: data.verloop,
    retentiemodel: data.retentiemodel,
    instroom_profiel: data.instroom_profiel,
  } as Prisma.InputJsonValue;
}

// --- Hoofdfunctie ---

export async function importData(data: ExportData): Promise<ImportResult> {
  const meta = data.meta;

  const result: ImportResult = {
    seizoen: meta.seizoen_nieuw,
    exportDatum: meta.export_datum,
    snapshotDatum: meta.snapshot_datum,
    spelers: { nieuw: 0, bijgewerkt: 0, fouten: 0 },
    staf: { nieuw: 0, bijgewerkt: 0, fouten: 0 },
    teams: { geladen: 0 },
    blauwdruk: { status: "ongewijzigd" },
    importId: "",
  };

  // 1. Spelers upsert
  for (const speler of data.spelers) {
    try {
      const r = await prisma.speler.upsert({
        where: { id: speler.id },
        create: {
          id: speler.id,
          roepnaam: speler.roepnaam,
          achternaam: speler.achternaam,
          geboortejaar: speler.geboortejaar,
          geslacht: speler.geslacht,
          lidSinds: speler.lid_sinds,
          huidig: speler.huidig as Prisma.InputJsonValue,
          spelerspad: speler.spelerspad as unknown as Prisma.InputJsonValue,
          volgendSeizoen: speler.volgend_seizoen as Prisma.InputJsonValue,
          retentie: speler.retentie as Prisma.InputJsonValue,
          teamgenotenHistorie: speler.teamgenoten_historie as unknown as Prisma.InputJsonValue,
          seizoenenActief: speler.seizoenen_actief,
          instroomLeeftijd: speler.instroom_leeftijd,
        },
        update: {
          roepnaam: speler.roepnaam,
          achternaam: speler.achternaam,
          geboortejaar: speler.geboortejaar,
          geslacht: speler.geslacht,
          lidSinds: speler.lid_sinds,
          huidig: speler.huidig as Prisma.InputJsonValue,
          spelerspad: speler.spelerspad as unknown as Prisma.InputJsonValue,
          volgendSeizoen: speler.volgend_seizoen as Prisma.InputJsonValue,
          retentie: speler.retentie as Prisma.InputJsonValue,
          teamgenotenHistorie: speler.teamgenoten_historie as unknown as Prisma.InputJsonValue,
          seizoenenActief: speler.seizoenen_actief,
          instroomLeeftijd: speler.instroom_leeftijd,
          // notitie wordt NIET aangeraakt (gebruikersinvoer)
        },
      });

      if (r.createdAt.getTime() === r.updatedAt.getTime()) {
        result.spelers.nieuw++;
      } else {
        result.spelers.bijgewerkt++;
      }
    } catch (err) {
      console.error(`  Speler fout: ${speler.roepnaam} ${speler.achternaam}: ${err}`);
      result.spelers.fouten++;
    }
  }

  // 2. Staf upsert — zoek op relCode (Sportlink ID), maak stafCode als PK
  //    staf_ids in ReferentieTeams worden ook omgezet van Sportlink ID → stafCode
  const sportlinkToStafCode = new Map<string, string>();

  for (const staf of data.staf) {
    try {
      // Zoek bestaand record op relCode (Sportlink ID)
      const bestaand = await prisma.staf.findUnique({
        where: { relCode: staf.id },
      });

      if (bestaand) {
        // Update bestaand record
        await prisma.staf.update({
          where: { id: bestaand.id },
          data: {
            naam: staf.naam,
            geboortejaar: staf.geboortejaar,
            rollen: mapRol(staf.rol),
            // notitie wordt NIET aangeraakt (gebruikersinvoer)
          },
        });
        sportlinkToStafCode.set(staf.id, bestaand.id);
        result.staf.bijgewerkt++;
      } else {
        // Genereer nieuwe stafCode
        const last = await prisma.staf.findFirst({
          where: { id: { startsWith: "STAF-" } },
          orderBy: { id: "desc" },
        });
        const num = last ? parseInt(last.id.replace("STAF-", "")) + 1 : 1;
        const stafCode = `STAF-${String(num).padStart(3, "0")}`;

        await prisma.staf.create({
          data: {
            id: stafCode,
            relCode: staf.id,
            naam: staf.naam,
            geboortejaar: staf.geboortejaar,
            rollen: mapRol(staf.rol),
          },
        });
        sportlinkToStafCode.set(staf.id, stafCode);
        result.staf.nieuw++;
      }
    } catch (err) {
      console.error(`  Staf fout: ${staf.naam}: ${err}`);
      result.staf.fouten++;
    }
  }

  // 3. ReferentieTeams — vervang per seizoen
  await prisma.referentieTeam.deleteMany({
    where: { seizoen: meta.seizoen_huidig },
  });

  if (data.teams_huidig.length > 0) {
    await prisma.referentieTeam.createMany({
      data: data.teams_huidig.map((team) => ({
        seizoen: meta.seizoen_huidig,
        naam: team.team,
        categorie: team.categorie,
        kleur: team.kleur,
        niveau: team.niveau,
        spelvorm: team.spelvorm,
        poolVeld: team.pool_veld,
        poolZaal: team.pool_zaal,
        spelerIds: team.speler_ids,
        stafIds: team.staf_ids.map((sid) => sportlinkToStafCode.get(sid) ?? sid),
        stats: team.stats as Prisma.InputJsonValue,
      })),
    });
    result.teams.geladen = data.teams_huidig.length;
  }

  // 4. Blauwdruk — upsert kaders, behoud toelichting + speerpunten
  const bestaande = await prisma.blauwdruk.findUnique({
    where: { seizoen: meta.seizoen_nieuw },
  });

  if (bestaande) {
    await prisma.blauwdruk.update({
      where: { seizoen: meta.seizoen_nieuw },
      data: { kaders: buildKaders(data) },
      // toelichting en speerpunten worden NIET aangeraakt
    });
    result.blauwdruk.status = "bijgewerkt";
  } else {
    await prisma.blauwdruk.create({
      data: {
        seizoen: meta.seizoen_nieuw,
        toelichting: `Blauwdruk ${meta.seizoen_nieuw}, geimporteerd uit Verenigingsmonitor (${meta.export_datum}).`,
        kaders: buildKaders(data),
        speerpunten: [],
      },
    });
    result.blauwdruk.status = "aangemaakt";
  }

  // 5. Import-record aanmaken
  const importRecord = await prisma.import.create({
    data: {
      seizoen: meta.seizoen_nieuw,
      exportDatum: meta.export_datum,
      snapshotDatum: meta.snapshot_datum,
      spelersNieuw: result.spelers.nieuw,
      spelersBijgewerkt: result.spelers.bijgewerkt,
      stafNieuw: result.staf.nieuw,
      stafBijgewerkt: result.staf.bijgewerkt,
      teamsGeladen: result.teams.geladen,
      meta: meta as unknown as Prisma.InputJsonValue,
    },
  });

  result.importId = importRecord.id;
  return result;
}

// --- Status opvragen ---

export async function getLastImport() {
  return prisma.import.findFirst({
    orderBy: { createdAt: "desc" },
  });
}
