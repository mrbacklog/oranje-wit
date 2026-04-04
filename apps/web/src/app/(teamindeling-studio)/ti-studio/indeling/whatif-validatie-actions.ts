"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { valideerWhatIf } from "@/lib/teamindeling/whatif/validatie";
import type { SpelerLookup } from "@/lib/teamindeling/whatif/validatie";
import type { PinDataVoorValidatie } from "@/lib/teamindeling/whatif/pin-validatie";
import type { TeamAantalKaders } from "@/lib/teamindeling/whatif/kader-validatie";
import type { WhatIfTeamData, WhatIfValidatie } from "@/lib/teamindeling/whatif/types";
import type { WerkindelingTeamData } from "@/lib/teamindeling/whatif/delta";
import type { BlauwdrukKaders } from "@/lib/teamindeling/validatie/types";
import { PEILJAAR } from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";

// ============================================================
// WHAT-IF VALIDATIE SERVER ACTION
// ============================================================

/**
 * Laad alle benodigde data en draai volledige validatie voor een what-if.
 *
 * Retourneert een geserialiseerde versie van WhatIfValidatie
 * (Maps omgezet naar plain objects voor server action transport).
 */
export async function valideerWhatIfVoorToepassen(
  whatIfId: string
): Promise<WhatIfValidatieResultaat> {
  const whatIf = await prisma.whatIf.findUniqueOrThrow({
    where: { id: whatIfId },
    select: {
      id: true,
      werkindelingId: true,
      teams: {
        select: {
          id: true,
          bronTeamId: true,
          naam: true,
          categorie: true,
          kleur: true,
          teamType: true,
          volgorde: true,
          spelers: {
            select: { id: true, spelerId: true, statusOverride: true, notitie: true },
          },
          staf: {
            select: { id: true, stafId: true, rol: true },
          },
        },
      },
      werkindeling: {
        select: {
          blauwdrukId: true,
          blauwdruk: {
            select: {
              kaders: true,
              pins: {
                select: {
                  id: true,
                  type: true,
                  spelerId: true,
                  stafId: true,
                  waarde: true,
                },
              },
            },
          },
          versies: {
            orderBy: { nummer: "desc" as const },
            take: 1,
            select: {
              teams: {
                select: {
                  id: true,
                  naam: true,
                  categorie: true,
                  kleur: true,
                  spelers: { select: { spelerId: true } },
                  staf: { select: { stafId: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const huidigeVersie = whatIf.werkindeling.versies[0];

  if (!huidigeVersie) {
    throw new Error("Werkindeling heeft geen versie");
  }

  // Bouw what-if team data
  const whatIfTeams: WhatIfTeamData[] = whatIf.teams.map((t: any) => ({
    id: t.id,
    bronTeamId: t.bronTeamId,
    naam: t.naam,
    categorie: t.categorie,
    kleur: t.kleur,
    teamType: t.teamType,
    volgorde: t.volgorde,
    spelers: t.spelers.map((s: any) => ({
      id: s.id,
      spelerId: s.spelerId,
      statusOverride: s.statusOverride,
      notitie: s.notitie,
    })),
    staf: t.staf.map((s: any) => ({
      id: s.id,
      stafId: s.stafId,
      rol: s.rol,
    })),
  }));

  // Bouw werkindeling team data
  const werkindelingTeams: WerkindelingTeamData[] = huidigeVersie.teams.map((t: any) => ({
    id: t.id,
    naam: t.naam,
    spelers: t.spelers.map((s: any) => ({ spelerId: s.spelerId })),
    staf: t.staf.map((s: any) => ({ stafId: s.stafId })),
  }));

  // Verzamel alle unieke speler-IDs
  const alleSpelerIds = new Set<string>();
  for (const t of whatIfTeams) {
    for (const s of t.spelers) alleSpelerIds.add(s.spelerId);
  }
  for (const t of werkindelingTeams) {
    for (const s of t.spelers) alleSpelerIds.add(s.spelerId);
  }

  // Laad speler-gegevens voor de lookup
  const spelerLookup = await laadSpelerLookup([...alleSpelerIds]);

  // Bouw pin-data
  const pins: PinDataVoorValidatie[] = (whatIf.werkindeling.blauwdruk.pins ?? []).map((p: any) => ({
    id: p.id,
    type: p.type,
    spelerId: p.spelerId,
    stafId: p.stafId,
    waarde: p.waarde as { teamNaam: string; teamId: string },
  }));

  // Blauwdruk-kaders
  const kaders = whatIf.werkindeling.blauwdruk.kaders as BlauwdrukKaders | null;

  // Teamaantal-kaders extraheren uit blauwdruk kaders (als beschikbaar)
  const teamAantalKaders = extractTeamAantalKaders(kaders);

  // Draai validatie
  const validatie = valideerWhatIf(whatIfTeams, werkindelingTeams, spelerLookup, PEILJAAR, {
    kaders: kaders ?? undefined,
    pins,
    teamAantalKaders,
  });

  logger.info(
    `What-if ${whatIfId} gevalideerd: ` +
      `${validatie.teamValidaties.size} teams, ` +
      `${validatie.pinSchendingen.length} pin-schendingen, ` +
      `${validatie.kaderAfwijkingen.length} kader-afwijkingen`
  );

  // Serialiseer voor transport (Maps -> Objects)
  return serialiseerValidatie(validatie);
}

// ============================================================
// Helpers
// ============================================================

async function laadSpelerLookup(spelerIds: string[]): Promise<Map<string, SpelerLookup>> {
  if (spelerIds.length === 0) return new Map();

  const spelers = await prisma.speler.findMany({
    where: { id: { in: spelerIds } },
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geboortejaar: true,
      geboortedatum: true,
      geslacht: true,
    },
  });

  const lookup = new Map<string, SpelerLookup>();
  for (const s of spelers) {
    lookup.set(s.id, {
      id: s.id,
      roepnaam: s.roepnaam,
      achternaam: s.achternaam,
      geboortejaar: s.geboortejaar,
      geboortedatum: s.geboortedatum?.toISOString() ?? null,
      geslacht: s.geslacht as "M" | "V",
    });
  }

  return lookup;
}

/**
 * Extraheer teamaantal-kaders uit blauwdruk kaders JSON.
 * Zoekt naar velden als "aantalTeams" per categorie-sleutel.
 */
function extractTeamAantalKaders(kaders: BlauwdrukKaders | null): TeamAantalKaders | undefined {
  if (!kaders) return undefined;

  const result: TeamAantalKaders = {};
  let heeftKaders = false;

  for (const [sleutel, settings] of Object.entries(kaders)) {
    // Als de settings een aantalTeams veld heeft, gebruik dat
    const s = settings as Record<string, unknown>;
    if (typeof s.aantalTeams === "number") {
      result[sleutel] = s.aantalTeams;
      heeftKaders = true;
    }
  }

  return heeftKaders ? result : undefined;
}

// ============================================================
// Serialisatie voor server action transport
// ============================================================

export interface WhatIfValidatieResultaat {
  teamValidaties: Record<
    string,
    {
      status: string;
      meldingen: Array<{ regel: string; bericht: string; ernst: string }>;
    }
  >;
  crossTeamMeldingen: Array<{ regel: string; bericht: string; ernst: string }>;
  pinSchendingen: Array<{
    pinId: string;
    type: string;
    beschrijving: string;
    huidigTeam: string | null;
    verwachtTeam: string;
  }>;
  kaderAfwijkingen: Array<{
    categorie: string;
    verwachtAantal: number;
    werkelijkAantal: number;
    verschil: number;
  }>;
  heeftHardefouten: boolean;
  heeftAfwijkingen: boolean;
}

function serialiseerValidatie(validatie: WhatIfValidatie): WhatIfValidatieResultaat {
  const teamValidaties: WhatIfValidatieResultaat["teamValidaties"] = {};
  for (const [id, val] of validatie.teamValidaties) {
    teamValidaties[id] = {
      status: val.status,
      meldingen: val.meldingen.map((m) => ({
        regel: m.regel,
        bericht: m.bericht,
        ernst: m.ernst,
      })),
    };
  }

  return {
    teamValidaties,
    crossTeamMeldingen: validatie.crossTeamMeldingen.map((m) => ({
      regel: m.regel,
      bericht: m.bericht,
      ernst: m.ernst,
    })),
    pinSchendingen: validatie.pinSchendingen,
    kaderAfwijkingen: validatie.kaderAfwijkingen,
    heeftHardefouten: validatie.heeftHardefouten,
    heeftAfwijkingen: validatie.heeftAfwijkingen,
  };
}
