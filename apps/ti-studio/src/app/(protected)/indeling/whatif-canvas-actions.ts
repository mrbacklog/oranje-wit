"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import {
  logger,
  korfbalPeildatum,
  berekenKorfbalLeeftijd,
  HUIDIG_SEIZOEN,
  type Seizoen,
} from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import type {
  WerkbordTeam,
  WerkbordSpeler,
  WerkbordSpelerInTeam,
  WerkbordStafInTeam,
  WerkbordValidatieItem,
} from "@/components/werkbord/types";

// Prisma Kleur enum → KnkvCategorie token (zelfde mapping als page.tsx)
const KLEUR_MAP: Record<string, string> = {
  PAARS: "blauw",
  BLAUW: "blauw",
  GROEN: "groen",
  GEEL: "geel",
  ORANJE: "oranje",
  ROOD: "rood",
};

const TOEGESTANE_STATUSSEN = new Set([
  "BESCHIKBAAR",
  "TWIJFELT",
  "GAAT_STOPPEN",
  "GESTOPT",
  "AFGEMELD",
  "ALGEMEEN_RESERVE",
  "GEBLESSEERD",
]);

type MapStatusArg = string | null | undefined;

function mapStatus(s: MapStatusArg): WerkbordSpeler["status"] {
  if (s && TOEGESTANE_STATUSSEN.has(s)) return s as WerkbordSpeler["status"];
  return "BESCHIKBAAR";
}

export interface WhatIfCanvasData {
  teams: WerkbordTeam[];
  alleSpelers: WerkbordSpeler[];
  validatie: WerkbordValidatieItem[];
}

type MinSpelerData = {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number | null;
  geboortedatum: Date | null;
  geslacht: string;
  status: string | null;
};

type MinSpelerInTeam = {
  id: string;
  spelerId: string;
  notitie: string | null;
  speler: MinSpelerData;
};

type MinStafInTeam = {
  id: string;
  stafId: string;
  rol: string | null;
  staf: { naam: string } | null;
};

type MinTeamKern = {
  id: string;
  naam: string;
  categorie: string;
  kleur: string | null;
  teamType: string | null;
  niveau: string | null;
  volgorde: number;
  selectieGroepId: string | null;
  spelers: MinSpelerInTeam[];
  staf: MinStafInTeam[];
};

type MinWhatIfTeam = {
  id: string;
  bronTeamId: string | null;
  naam: string;
  categorie: string;
  kleur: string | null;
  teamType: string | null;
  niveau: string | null;
  volgorde: number;
  spelers: MinSpelerInTeam[];
  staf: MinStafInTeam[];
};

/**
 * Haal een what-if op en transformeer naar canvas-data in dezelfde shape
 * als de werkversie (WerkbordTeam[] + WerkbordSpeler[]).
 *
 * Strategie: neem de werkversie-teams als basis, vervang teams waarvan
 * `bronTeamId` overeenkomt met een what-if team door de what-if variant,
 * en voeg toe wat geen bron heeft. Staf en posities komen uit het brontaam
 * wanneer aanwezig.
 *
 * Validatie is leeg — dat is out of scope voor de variant-modus.
 */
export async function getWhatIfVoorCanvas(
  whatIfId: string
): Promise<ActionResult<WhatIfCanvasData>> {
  await requireTC();

  try {
    const whatIf = await prisma.whatIf.findUnique({
      where: { id: whatIfId },
      select: {
        id: true,
        werkindelingId: true,
        teams: {
          orderBy: { volgorde: "asc" as const },
          select: {
            id: true,
            bronTeamId: true,
            naam: true,
            categorie: true,
            kleur: true,
            teamType: true,
            niveau: true,
            volgorde: true,
            spelers: {
              select: {
                id: true,
                spelerId: true,
                statusOverride: true,
                notitie: true,
                speler: {
                  select: {
                    id: true,
                    roepnaam: true,
                    achternaam: true,
                    geboortejaar: true,
                    geboortedatum: true,
                    geslacht: true,
                    status: true,
                  },
                },
              },
            },
            staf: {
              select: {
                id: true,
                stafId: true,
                rol: true,
                staf: { select: { naam: true } },
              },
            },
          },
        },
      },
    });

    if (!whatIf) {
      return { ok: false, error: "What-if niet gevonden" };
    }

    // Haal de huidige werkversie van de werkindeling op
    const werkindeling = await prisma.werkindeling.findUniqueOrThrow({
      where: { id: whatIf.werkindelingId },
      select: {
        id: true,
        kaders: { select: { id: true, seizoen: true } },
        versies: {
          orderBy: { nummer: "desc" as const },
          take: 1,
          select: {
            id: true,
            nummer: true,
            posities: true,
            selectieGroepen: {
              select: {
                id: true,
                naam: true,
                gebundeld: true,
                spelers: {
                  select: {
                    id: true,
                    spelerId: true,
                    notitie: true,
                    speler: {
                      select: {
                        id: true,
                        roepnaam: true,
                        achternaam: true,
                        geboortejaar: true,
                        geboortedatum: true,
                        geslacht: true,
                        status: true,
                      },
                    },
                  },
                },
              },
            },
            teams: {
              orderBy: { volgorde: "asc" as const },
              select: {
                id: true,
                naam: true,
                categorie: true,
                kleur: true,
                teamType: true,
                niveau: true,
                volgorde: true,
                selectieGroepId: true,
                spelers: {
                  select: {
                    id: true,
                    spelerId: true,
                    notitie: true,
                    speler: {
                      select: {
                        id: true,
                        roepnaam: true,
                        achternaam: true,
                        geboortejaar: true,
                        geboortedatum: true,
                        geslacht: true,
                        status: true,
                      },
                    },
                  },
                },
                staf: {
                  select: {
                    id: true,
                    stafId: true,
                    rol: true,
                    staf: { select: { naam: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const versie = werkindeling.versies[0];
    if (!versie) {
      return { ok: false, error: "Werkindeling heeft geen werkversie" };
    }

    const seizoen = werkindeling.kaders.seizoen as Seizoen;
    const peildatum = korfbalPeildatum(seizoen);
    const huidigeJaar = new Date().getFullYear();

    const opgeslagenPosities = (versie.posities ?? {}) as Record<string, { x: number; y: number }>;

    // Lookup: selectiegroepen uit de werkversie per id, zodat we de spelers
    // van gebundelde pools in het canvas-team kunnen tonen.
    type MinSelectieGroep = {
      id: string;
      naam: string | null;
      gebundeld: boolean;
      spelers: MinSpelerInTeam[];
    };
    const selectieGroepen = (versie.selectieGroepen ?? []) as unknown as MinSelectieGroep[];
    const selectieGroepById = new Map<string, MinSelectieGroep>();
    for (const sg of selectieGroepen) {
      selectieGroepById.set(sg.id, sg);
    }

    // Lookup: welk werkversie-team wordt overschreven door een what-if team?
    const bronIdToWhatIfTeam = new Map<string, MinWhatIfTeam>();
    const whatIfTeamsZonderBron: MinWhatIfTeam[] = [];
    const whatIfTeamsTyped = whatIf.teams as unknown as MinWhatIfTeam[];
    for (const wit of whatIfTeamsTyped) {
      if (wit.bronTeamId) {
        bronIdToWhatIfTeam.set(wit.bronTeamId, wit);
      } else {
        whatIfTeamsZonderBron.push(wit);
      }
    }

    // Haal alle losse spelers op (niet in enig team) voor de pool.
    // We herhalen dezelfde shape als getAlleSpelers maar houden het minimaal:
    // alleen spelers uit team/what-if + alle andere actieve spelers die bekend
    // zijn bij het volledige werkversie-canvas. Voor de variant-modus houden we
    // het simpel: we vullen `teamId` correct voor de weergave. De pool-spelers
    // komen via de bestaande init-props — hier leveren we dezelfde shape op.
    const extraSpelers = await prisma.speler.findMany({
      select: {
        id: true,
        roepnaam: true,
        achternaam: true,
        geboortejaar: true,
        geboortedatum: true,
        geslacht: true,
        status: true,
        seizoenenActief: true,
        huidig: true,
      },
    });

    // Join tussenvoegsel uit Lid + ussScore + fotocheck, zoals getAlleSpelers.
    const spelerIds = extraSpelers.map((s) => s.id);
    const [leden, ussScores, fotos] = await Promise.all([
      prisma.lid.findMany({
        where: { relCode: { in: spelerIds } },
        select: { relCode: true, tussenvoegsel: true },
      }),
      prisma.spelerUSS.findMany({
        where: { spelerId: { in: spelerIds }, seizoen: HUIDIG_SEIZOEN },
        select: { spelerId: true, ussOverall: true },
      }),
      prisma.lidFoto.findMany({
        where: { relCode: { in: spelerIds } },
        select: { relCode: true },
      }),
    ]);
    const tussenvoegselMap = new Map<string, string | null>(
      leden.map((l: { relCode: string; tussenvoegsel: string | null }) => [
        l.relCode,
        l.tussenvoegsel,
      ])
    );
    const ussMap = new Map<string, number | null>(
      ussScores.map((u: { spelerId: string; ussOverall: number | null }) => [
        u.spelerId,
        u.ussOverall ?? null,
      ])
    );
    const fotoSet = new Set<string>(fotos.map((f: { relCode: string }) => f.relCode));

    // Effectieve teamId per speler in variant-context
    const spelerTeamInVariant = new Map<string, string>();
    const spelerTeamNaamInVariant = new Map<string, string>();

    // Bouw canvas-teams
    const canvasTeams: WerkbordTeam[] = [];

    function bouwSpelerInTeam(
      tsId: string,
      spelerId: string,
      notitie: string | null,
      spelerData: {
        id: string;
        roepnaam: string;
        achternaam: string;
        geboortejaar: number | null;
        geboortedatum: Date | null;
        geslacht: string;
        status: string | null;
      },
      teamId: string,
      teamNaam: string
    ): WerkbordSpelerInTeam {
      const effectieveStatus = mapStatus(spelerData.status);
      const werkbordSpeler: WerkbordSpeler = {
        id: spelerData.id,
        roepnaam: spelerData.roepnaam,
        tussenvoegsel: tussenvoegselMap.get(spelerData.id) ?? null,
        achternaam: spelerData.achternaam,
        geboortejaar: spelerData.geboortejaar ?? huidigeJaar - 15,
        geboortedatum: spelerData.geboortedatum
          ? spelerData.geboortedatum.toISOString().split("T")[0]
          : null,
        geslacht: spelerData.geslacht === "V" ? "V" : "M",
        status: effectieveStatus,
        sportlinkStatus: mapStatus(spelerData.status),
        rating: null,
        notitie: null,
        afmelddatum: null,
        teamId,
        isNieuw: false,
        openMemoCount: 0,
        ussScore: null,
        fotoUrl: null,
        huidigTeam: null,
        ingedeeldTeamNaam: teamNaam,
        selectieGroepId: null,
      };
      spelerTeamInVariant.set(spelerId, teamId);
      spelerTeamNaamInVariant.set(spelerId, teamNaam);
      return {
        id: tsId,
        spelerId,
        speler: werkbordSpeler,
        notitie,
      };
    }

    function bouwStafInTeam(
      id: string,
      stafId: string,
      naam: string,
      rol: string | null
    ): WerkbordStafInTeam {
      return {
        id,
        stafId,
        naam,
        rol: rol ?? "",
      };
    }

    function berekenGemLeeftijd(
      spelers: Array<{ speler: { geboortedatum: Date | null; geboortejaar: number | null } }>
    ): number | null {
      if (spelers.length === 0) return null;
      const totaal = spelers.reduce((acc, ts) => {
        const gbd = ts.speler.geboortedatum
          ? ts.speler.geboortedatum.toISOString().split("T")[0]
          : null;
        return (
          acc +
          berekenKorfbalLeeftijd(
            gbd,
            ts.speler.geboortejaar ?? peildatum.getFullYear() - 15,
            peildatum
          )
        );
      }, 0);
      return Math.round((totaal / spelers.length) * 10) / 10;
    }

    // Helper: bouw selectie-pool-data voor een team op basis van de SelectieGroep
    // uit de werkversie. Gebundelde selecties tonen hun spelers in het canvas
    // team (selectieDames/selectieHeren).
    function bouwSelectieData(
      selectieGroepId: string | null,
      teamId: string,
      teamNaam: string
    ): Pick<WerkbordTeam, "selectieNaam" | "selectieDames" | "selectieHeren" | "gebundeld"> {
      if (!selectieGroepId) {
        return {
          selectieNaam: null,
          selectieDames: [],
          selectieHeren: [],
          gebundeld: false,
        };
      }
      const sg = selectieGroepById.get(selectieGroepId);
      if (!sg) {
        return {
          selectieNaam: null,
          selectieDames: [],
          selectieHeren: [],
          gebundeld: false,
        };
      }
      const damesBron = sg.spelers.filter((s) => s.speler.geslacht === "V");
      const herenBron = sg.spelers.filter((s) => s.speler.geslacht === "M");
      return {
        selectieNaam: sg.naam ?? null,
        selectieDames: damesBron.map((s) =>
          bouwSpelerInTeam(s.id, s.spelerId, s.notitie, s.speler, teamId, teamNaam)
        ),
        selectieHeren: herenBron.map((s) =>
          bouwSpelerInTeam(s.id, s.spelerId, s.notitie, s.speler, teamId, teamNaam)
        ),
        gebundeld: sg.gebundeld,
      };
    }

    // Bouw teams: voor elk werkversie-team kies between what-if override of origineel
    const versieTeams = versie.teams as unknown as MinTeamKern[];
    versieTeams.forEach((werkTeam: MinTeamKern, i: number) => {
      const whatIfTeam = bronIdToWhatIfTeam.get(werkTeam.id);
      const teamId = werkTeam.id; // we gebruiken het WERKVERSIE team-id als canvas-id
      const teamNaam = whatIfTeam?.naam ?? werkTeam.naam;
      const opgeslagen = opgeslagenPosities[werkTeam.id];
      const col = i % 3;
      const rij = Math.floor(i / 3);
      const canvasX = opgeslagen ? opgeslagen.x : 40 + col * 360;
      const canvasY = opgeslagen ? opgeslagen.y : 60 + rij * 240;

      if (whatIfTeam) {
        // Overschreven door what-if — gebruik spelers/staf van what-if
        const damesBron = whatIfTeam.spelers.filter((s) => s.speler.geslacht === "V");
        const herenBron = whatIfTeam.spelers.filter((s) => s.speler.geslacht === "M");

        const dames = damesBron.map((s) =>
          bouwSpelerInTeam(s.id, s.spelerId, s.notitie, s.speler, teamId, teamNaam)
        );
        const heren = herenBron.map((s) =>
          bouwSpelerInTeam(s.id, s.spelerId, s.notitie, s.speler, teamId, teamNaam)
        );
        const staf = whatIfTeam.staf.map((st) =>
          bouwStafInTeam(st.id, st.stafId, st.staf?.naam ?? "?", st.rol)
        );

        const formaat: "viertal" | "achtal" | "selectie" = werkTeam.selectieGroepId
          ? "selectie"
          : whatIfTeam.teamType === "VIERTAL"
            ? "viertal"
            : "achtal";

        const kleur = (KLEUR_MAP[whatIfTeam.kleur ?? werkTeam.kleur ?? ""] ??
          "senior") as WerkbordTeam["kleur"];

        canvasTeams.push({
          id: teamId,
          naam: teamNaam,
          categorie: String(whatIfTeam.categorie ?? werkTeam.categorie),
          kleur,
          formaat,
          volgorde: whatIfTeam.volgorde ?? werkTeam.volgorde,
          canvasX,
          canvasY,
          dames,
          heren,
          staf,
          ussScore: null,
          gemiddeldeLeeftijd: berekenGemLeeftijd(whatIfTeam.spelers),
          validatieStatus: "ok",
          validatieCount: 0,
          teamCategorie: (whatIfTeam.categorie ?? werkTeam.categorie ?? "SENIOREN") as
            | "SENIOREN"
            | "A_CATEGORIE"
            | "B_CATEGORIE",
          niveau: (whatIfTeam.niveau ?? werkTeam.niveau ?? null) as
            | "A"
            | "B"
            | "U15"
            | "U17"
            | "U19"
            | null,
          selectieGroepId: werkTeam.selectieGroepId ?? null,
          ...bouwSelectieData(werkTeam.selectieGroepId, teamId, teamNaam),
          werkitems: [],
          openMemoCount: 0,
        });
      } else {
        // Niet overschreven — kopieer 1-op-1 van werkversie
        const damesBron = werkTeam.spelers.filter((s) => s.speler.geslacht === "V");
        const herenBron = werkTeam.spelers.filter((s) => s.speler.geslacht === "M");

        const dames = damesBron.map((s) =>
          bouwSpelerInTeam(s.id, s.spelerId, s.notitie, s.speler, teamId, teamNaam)
        );
        const heren = herenBron.map((s) =>
          bouwSpelerInTeam(s.id, s.spelerId, s.notitie, s.speler, teamId, teamNaam)
        );
        const staf = werkTeam.staf.map((st) =>
          bouwStafInTeam(st.id, st.stafId, st.staf?.naam ?? "?", st.rol)
        );

        const formaat: "viertal" | "achtal" | "selectie" = werkTeam.selectieGroepId
          ? "selectie"
          : werkTeam.teamType === "VIERTAL"
            ? "viertal"
            : "achtal";

        const kleur = (KLEUR_MAP[werkTeam.kleur ?? ""] ?? "senior") as WerkbordTeam["kleur"];

        canvasTeams.push({
          id: teamId,
          naam: teamNaam,
          categorie: String(werkTeam.categorie),
          kleur,
          formaat,
          volgorde: werkTeam.volgorde,
          canvasX,
          canvasY,
          dames,
          heren,
          staf,
          ussScore: null,
          gemiddeldeLeeftijd: berekenGemLeeftijd(werkTeam.spelers),
          validatieStatus: "ok",
          validatieCount: 0,
          teamCategorie: (werkTeam.categorie ?? "SENIOREN") as
            | "SENIOREN"
            | "A_CATEGORIE"
            | "B_CATEGORIE",
          niveau: (werkTeam.niveau ?? null) as "A" | "B" | "U15" | "U17" | "U19" | null,
          selectieGroepId: werkTeam.selectieGroepId ?? null,
          ...bouwSelectieData(werkTeam.selectieGroepId, teamId, teamNaam),
          werkitems: [],
          openMemoCount: 0,
        });
      }
    });

    // Voeg what-if teams zonder bron toe (nieuwe teams binnen de variant)
    whatIfTeamsZonderBron.forEach((wit: MinWhatIfTeam, idx: number) => {
      const teamId = wit.id; // nieuw team → gebruik what-if-team-id als canvas-id
      const teamNaam = wit.naam;
      const i = versie.teams.length + idx;
      const col = i % 3;
      const rij = Math.floor(i / 3);
      const canvasX = 40 + col * 360;
      const canvasY = 60 + rij * 240;

      const damesBron = wit.spelers.filter((s) => s.speler.geslacht === "V");
      const herenBron = wit.spelers.filter((s) => s.speler.geslacht === "M");

      const dames = damesBron.map((s) =>
        bouwSpelerInTeam(s.id, s.spelerId, s.notitie, s.speler, teamId, teamNaam)
      );
      const heren = herenBron.map((s) =>
        bouwSpelerInTeam(s.id, s.spelerId, s.notitie, s.speler, teamId, teamNaam)
      );
      const staf = wit.staf.map((st) =>
        bouwStafInTeam(st.id, st.stafId, st.staf?.naam ?? "?", st.rol)
      );

      const formaat: "viertal" | "achtal" | "selectie" =
        wit.teamType === "VIERTAL" ? "viertal" : "achtal";
      const kleur = (KLEUR_MAP[wit.kleur ?? ""] ?? "senior") as WerkbordTeam["kleur"];

      canvasTeams.push({
        id: teamId,
        naam: teamNaam,
        categorie: String(wit.categorie),
        kleur,
        formaat,
        volgorde: wit.volgorde,
        canvasX,
        canvasY,
        dames,
        heren,
        staf,
        ussScore: null,
        gemiddeldeLeeftijd: berekenGemLeeftijd(wit.spelers),
        validatieStatus: "ok",
        validatieCount: 0,
        teamCategorie: (wit.categorie ?? "SENIOREN") as "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE",
        niveau: (wit.niveau ?? null) as "A" | "B" | "U15" | "U17" | "U19" | null,
        selectieGroepId: null,
        selectieNaam: null,
        selectieDames: [],
        selectieHeren: [],
        gebundeld: false,
        werkitems: [],
        openMemoCount: 0,
      });
    });

    // Bouw alleSpelers: iedereen, met correct teamId in variant-context
    const alleSpelers: WerkbordSpeler[] = extraSpelers.map((sp) => {
      const effectieveStatus = mapStatus(sp.status);
      const inVariantTeamId = spelerTeamInVariant.get(sp.id) ?? null;
      return {
        id: sp.id,
        roepnaam: sp.roepnaam,
        tussenvoegsel: tussenvoegselMap.get(sp.id) ?? null,
        achternaam: sp.achternaam,
        geboortejaar: sp.geboortejaar ?? huidigeJaar - 20,
        geboortedatum: sp.geboortedatum ? sp.geboortedatum.toISOString().split("T")[0] : null,
        geslacht: sp.geslacht === "V" ? "V" : "M",
        status: effectieveStatus,
        sportlinkStatus: mapStatus(sp.status),
        rating: null,
        notitie: null,
        afmelddatum: null,
        teamId: effectieveStatus === "ALGEMEEN_RESERVE" ? null : inVariantTeamId,
        isNieuw: sp.seizoenenActief === 1,
        openMemoCount: 0,
        ussScore: ussMap.get(sp.id) ?? null,
        fotoUrl: fotoSet.has(sp.id) ? `/api/scouting/spelers/${sp.id}/foto` : null,
        huidigTeam: (sp.huidig as { team?: string } | null)?.team ?? null,
        ingedeeldTeamNaam: spelerTeamNaamInVariant.get(sp.id) ?? null,
        selectieGroepId: null,
      };
    });

    return {
      ok: true,
      data: {
        teams: canvasTeams,
        alleSpelers,
        validatie: [],
      },
    };
  } catch (error) {
    logger.warn("getWhatIfVoorCanvas fout:", error);
    const message = error instanceof Error ? error.message : "Onbekende fout";
    return { ok: false, error: message };
  }
}
