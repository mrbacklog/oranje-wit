// apps/web/src/lib/teamindeling/validatie-update.ts
// Gedeelde helper voor het berekenen van ValidatieUpdate vanuit een teamId.
// Gebruikt door de API route (route.ts) én de server action (team-config-actions.ts).
import { prisma } from "@/lib/teamindeling/db/prisma";
import { getTeamtypeKaders } from "@/app/(protected)/kader/actions";
import { mergeMetDefaults } from "@/app/(protected)/kader/kader-defaults";
import { berekenTeamValidatie, berekenValidatieStatus } from "@/lib/teamindeling/validatie-engine";
import { korfbalPeildatum, berekenKorfbalLeeftijd, type Seizoen } from "@oranje-wit/types";
import type { ValidatieUpdate } from "@/components/werkbord/types";

export const DB_KLEUR_MAP: Record<string, string> = {
  BLAUW: "blauw",
  GROEN: "groen",
  GEEL: "geel",
  ORANJE: "oranje",
  ROOD: "rood",
  PAARS: "blauw",
};

export async function haalValidatieUpdate(teamId: string): Promise<ValidatieUpdate> {
  const teamData = await prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    select: {
      id: true,
      categorie: true,
      kleur: true,
      teamType: true,
      niveau: true,
      versie: {
        select: {
          werkindeling: {
            select: { kaders: { select: { seizoen: true } } },
          },
        },
      },
      spelers: {
        select: {
          speler: {
            select: {
              id: true,
              geslacht: true,
              geboortejaar: true,
              geboortedatum: true,
              roepnaam: true,
              achternaam: true,
            },
          },
        },
      },
    },
  });

  const seizoen = teamData.versie.werkindeling.kaders.seizoen;
  const peildatum = korfbalPeildatum(seizoen as Seizoen);
  const tcKaders = mergeMetDefaults(await getTeamtypeKaders(seizoen));

  type TeamSpelerRow = (typeof teamData.spelers)[number];

  const dames = teamData.spelers
    .filter((ts: TeamSpelerRow) => ts.speler.geslacht === "V")
    .map((ts: TeamSpelerRow) => ({
      id: ts.speler.id,
      spelerId: ts.speler.id,
      speler: {
        ...ts.speler,
        geboortedatum: ts.speler.geboortedatum
          ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
          : null,
        geslacht: "V" as const,
        status: "BESCHIKBAAR" as const,
        rating: null,
        notitie: null,
        afmelddatum: null,
        teamId,
        isNieuw: false,
        openMemoCount: 0,
        huidigTeam: null,
        ingedeeldTeamNaam: null,
        selectieGroepId: null,
      },
      notitie: null,
    }));

  const heren = teamData.spelers
    .filter((ts: TeamSpelerRow) => ts.speler.geslacht === "M")
    .map((ts: TeamSpelerRow) => ({
      id: ts.speler.id,
      spelerId: ts.speler.id,
      speler: {
        ...ts.speler,
        geboortedatum: ts.speler.geboortedatum
          ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
          : null,
        geslacht: "M" as const,
        status: "BESCHIKBAAR" as const,
        rating: null,
        notitie: null,
        afmelddatum: null,
        teamId,
        isNieuw: false,
        openMemoCount: 0,
        huidigTeam: null,
        ingedeeldTeamNaam: null,
        selectieGroepId: null,
      },
      notitie: null,
    }));

  const totaalSpelers = teamData.spelers.length;
  const gemLeeftijd =
    totaalSpelers > 0
      ? teamData.spelers.reduce((acc: number, ts: TeamSpelerRow) => {
          const gbd = ts.speler.geboortedatum
            ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
            : null;
          return (
            acc +
            berekenKorfbalLeeftijd(
              gbd,
              ts.speler.geboortejaar ?? peildatum.getFullYear() - 15,
              peildatum
            )
          );
        }, 0) / totaalSpelers
      : null;

  const teamVoorValidatie = {
    id: teamId,
    naam: "",
    categorie: String(teamData.categorie),
    kleur: (DB_KLEUR_MAP[teamData.kleur ?? ""] ?? "senior") as
      | "blauw"
      | "groen"
      | "geel"
      | "oranje"
      | "rood"
      | "senior",
    formaat: (teamData.teamType === "VIERTAL" ? "viertal" : "achtal") as
      | "viertal"
      | "achtal"
      | "selectie",
    volgorde: 0,
    canvasX: 0,
    canvasY: 0,
    dames,
    heren,
    staf: [],
    werkitems: [],
    ussScore: null,
    gemiddeldeLeeftijd: gemLeeftijd !== null ? Math.round(gemLeeftijd * 10) / 10 : null,
    validatieStatus: "ok" as const,
    validatieCount: 0,
    teamCategorie: (teamData.categorie ?? "SENIOREN") as "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE",
    niveau: (teamData.niveau ?? null) as "A" | "B" | "U15" | "U17" | "U19" | null,
    selectieGroepId: null,
    selectieNaam: null,
    selectieDames: [],
    selectieHeren: [],
    gebundeld: false,
    openMemoCount: 0,
  };

  const items = berekenTeamValidatie(teamVoorValidatie, tcKaders, peildatum);
  return {
    teamId,
    items,
    status: berekenValidatieStatus(items),
    count: items.filter((i) => i.type !== "ok").length,
  };
}
