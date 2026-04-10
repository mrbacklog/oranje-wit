export const dynamic = "force-dynamic";

import { auth } from "@oranje-wit/auth";
import { getOfMaakWerkindelingVoorSeizoen } from "./actions";
import { getWerkindelingVoorEditor, getAlleSpelers } from "./werkindeling-actions";
import { getTeamtypeKaders } from "@/app/(teamindeling-studio)/ti-studio/kader/actions";
import { mergeMetDefaults } from "@/app/(teamindeling-studio)/ti-studio/kader/kader-defaults";
import {
  berekenTeamValidatie,
  berekenValidatieStatus,
  korfbalLeeftijd,
} from "@/lib/teamindeling/validatie-engine";
import { TiStudioShell } from "@/components/ti-studio/werkbord/TiStudioShell";
import type {
  WerkbordState,
  WerkbordSpeler,
  WerkbordSpelerInTeam,
  WerkbordTeam,
  WerkbordValidatieItem,
  WerkbordStaf,
  WerkbordStafTeamrol,
} from "@/components/ti-studio/werkbord/types";

// Prisma Kleur enum → KnkvCategorie token
const KLEUR_MAP: Record<string, string> = {
  PAARS: "blauw", // paars behandelen als blauw
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
]);

function mapStatus(s: string | null | undefined): WerkbordSpeler["status"] {
  if (s && TOEGESTANE_STATUSSEN.has(s)) return s as WerkbordSpeler["status"];
  return "BESCHIKBAAR";
}

export default async function IndelingPage() {
  const session = await auth();
  const gebruikerEmail = session?.user?.email ?? "systeem";

  const werkindeling = await getOfMaakWerkindelingVoorSeizoen(gebruikerEmail);

  if (!werkindeling) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "60vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ fontSize: 14, color: "var(--ow-text-secondary)" }}>
          Geen actief seizoen gevonden. Maak eerst een seizoen aan via Beheer.
        </p>
      </div>
    );
  }

  const volledig = await getWerkindelingVoorEditor(werkindeling.id);
  if (!volledig) return null;

  const prismaSpelers = await getAlleSpelers();
  const huidigeJaar = new Date().getFullYear();
  const versie = volledig.versies[0];

  // Kaders laden en peiljaar bepalen
  const seizoen = volledig.kaders.seizoen; // bijv. "2025-2026"
  const peiljaar = parseInt(seizoen.split("-")[1], 10);
  const opgeslagenKaders = await getTeamtypeKaders(seizoen);
  const tcKaders = mergeMetDefaults(opgeslagenKaders);

  // Bouw teamId-lookup: spelerId → teamId
  const spelerTeamMap = new Map<string, string>();
  // Bouw teamNaam-lookup: spelerId → teamNaam
  const spelerTeamNaamMap = new Map<string, string>();
  if (versie) {
    for (const team of versie.teams) {
      for (const ts of team.spelers) {
        spelerTeamMap.set(ts.spelerId, team.id);
        spelerTeamNaamMap.set(ts.spelerId, team.naam);
      }
    }
  }

  // Alle spelers als WerkbordSpeler
  const alleSpelers: WerkbordSpeler[] = prismaSpelers.map((sp) => ({
    id: sp.id,
    roepnaam: sp.roepnaam,
    achternaam: sp.achternaam,
    geboortejaar: sp.geboortejaar ?? huidigeJaar - 20,
    geboortedatum: sp.geboortedatum ? sp.geboortedatum.toISOString().split("T")[0] : null,
    geslacht: sp.geslacht === "V" ? ("V" as const) : ("M" as const),
    status: mapStatus(sp.status),
    rating: null,
    notitie: null,
    afmelddatum: null,
    teamId: sp.status === "ALGEMEEN_RESERVE" ? null : (spelerTeamMap.get(sp.id) ?? null),
    gepind: false,
    isNieuw: false,
    huidigTeam: (sp.huidig as { team?: string } | null)?.team ?? null,
    ingedeeldTeamNaam: spelerTeamNaamMap.get(sp.id) ?? null,
    selectieGroepId: null,
  }));

  // Opgeslagen canvas-posities per teamId
  const opgeslagenPosities = (versie?.posities ?? {}) as Record<string, { x: number; y: number }>;

  // Teams als WerkbordTeam
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teams: WerkbordTeam[] = ((versie?.teams ?? []) as any[]).map((team: any, i: number) => {
    const dames = (team.spelers as any[])
      .filter((ts: any) => ts.speler?.geslacht === "V")
      .map((ts: any) => ({
        id: ts.id,
        spelerId: ts.spelerId,
        speler: alleSpelers.find((s) => s.id === ts.spelerId) ?? {
          id: ts.spelerId,
          roepnaam: ts.speler?.roepnaam ?? "?",
          achternaam: ts.speler?.achternaam ?? "",
          geboortejaar: ts.speler?.geboortejaar ?? huidigeJaar - 15,
          geboortedatum: ts.speler?.geboortedatum
            ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
            : null,
          geslacht: "V" as const,
          status: mapStatus(ts.speler?.status),
          rating: null,
          notitie: null,
          afmelddatum: null,
          teamId: team.id,
          gepind: false,
          isNieuw: false,
          huidigTeam: (ts.speler?.huidig as { team?: string } | null)?.team ?? null,
          ingedeeldTeamNaam: team.naam,
          selectieGroepId: null,
        },
        notitie: null,
      }));

    const heren = (team.spelers as any[])
      .filter((ts: any) => ts.speler?.geslacht === "M")
      .map((ts: any) => ({
        id: ts.id,
        spelerId: ts.spelerId,
        speler: alleSpelers.find((s) => s.id === ts.spelerId) ?? {
          id: ts.spelerId,
          roepnaam: ts.speler?.roepnaam ?? "?",
          achternaam: ts.speler?.achternaam ?? "",
          geboortejaar: ts.speler?.geboortejaar ?? huidigeJaar - 15,
          geboortedatum: ts.speler?.geboortedatum
            ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
            : null,
          geslacht: "M" as const,
          status: mapStatus(ts.speler?.status),
          rating: null,
          notitie: null,
          afmelddatum: null,
          teamId: team.id,
          gepind: false,
          isNieuw: false,
          huidigTeam: (ts.speler?.huidig as { team?: string } | null)?.team ?? null,
          ingedeeldTeamNaam: team.naam,
          selectieGroepId: null,
        },
        notitie: null,
      }));

    const totaalSpelers = team.spelers.length;
    const gemLeeftijd =
      totaalSpelers > 0
        ? (team.spelers as any[]).reduce((acc: number, ts: any) => {
            const gbd = ts.speler?.geboortedatum
              ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
              : null;
            return acc + korfbalLeeftijd(gbd, ts.speler?.geboortejaar ?? peiljaar - 15, peiljaar);
          }, 0) / totaalSpelers
        : 0;

    // Formaat bepalen: selectieGroep → altijd "selectie"; anders uit teamType in DB
    const formaat: "viertal" | "achtal" | "selectie" = team.selectieGroepId
      ? "selectie"
      : team.teamType === "VIERTAL"
        ? "viertal"
        : "achtal";

    // KNKV kleur mapping
    const kleur = (KLEUR_MAP[team.kleur ?? ""] ?? "senior") as WerkbordTeam["kleur"];

    // Canvas-positie: opgeslagen waarde heeft prioriteit, anders grid-fallback
    const opgeslagen = opgeslagenPosities[team.id];
    const col = i % 3;
    const rij = Math.floor(i / 3);
    const canvasX = opgeslagen ? opgeslagen.x : 40 + col * 360;
    const canvasY = opgeslagen ? opgeslagen.y : 60 + rij * 240;

    return {
      id: team.id,
      naam: team.naam,
      categorie: String(team.categorie),
      kleur,
      formaat,
      volgorde: team.volgorde,
      canvasX,
      canvasY,
      dames,
      heren,
      staf: (team.staf as any[]).map((ts: any) => ({
        id: ts.id,
        stafId: ts.stafId,
        naam: ts.staf?.naam ?? "?",
        rol: ts.rol ?? "",
      })),
      werkitems: [],
      ussScore:
        totaalSpelers > 0
          ? Math.round((6.2 + ((team.volgorde * 0.17 + i * 0.31) % 2.1)) * 100) / 100
          : null,
      gemiddeldeLeeftijd: totaalSpelers > 0 ? Math.round(gemLeeftijd * 10) / 10 : null,
      validatieStatus: "ok" as const,
      validatieCount: 0,
      teamCategorie: (team.categorie ?? "SENIOREN") as "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE",
      niveau: (team.niveau ?? null) as "A" | "B" | "U15" | "U17" | "U19" | null,
      selectieGroepId: team.selectieGroepId ?? null,
      selectieNaam: (team as any).selectieGroep?.naam ?? null,
      selectieDames: [] as WerkbordSpelerInTeam[],
      selectieHeren: [] as WerkbordSpelerInTeam[],
      gebundeld: false,
    };
  });

  // Post-processing: vul selectieDames/selectieHeren/gebundeld in voor selectie-teams
  if (versie) {
    for (const selectieGroep of (versie as any).selectieGroepen ?? []) {
      if (!selectieGroep.spelers?.length) continue;

      const groepTeams = teams
        .filter((t) => t.selectieGroepId === selectieGroep.id)
        .sort((a, b) => a.volgorde - b.volgorde);
      const primaryTeam = groepTeams[0];
      if (!primaryTeam) continue;

      const selectieDames: WerkbordSpelerInTeam[] = [];
      const selectieHeren: WerkbordSpelerInTeam[] = [];

      for (const sp of selectieGroep.spelers as any[]) {
        const geslacht = sp.speler?.geslacht;
        const spelerObj = alleSpelers.find((s) => s.id === sp.spelerId) ?? {
          id: sp.spelerId,
          roepnaam: sp.speler?.roepnaam ?? "?",
          achternaam: sp.speler?.achternaam ?? "",
          geboortejaar: sp.speler?.geboortejaar ?? huidigeJaar - 15,
          geboortedatum: sp.speler?.geboortedatum
            ? (sp.speler.geboortedatum as Date).toISOString().split("T")[0]
            : null,
          geslacht: (geslacht === "V" ? "V" : "M") as "V" | "M",
          status: mapStatus(sp.speler?.status),
          rating: null,
          notitie: null,
          afmelddatum: null,
          teamId: null,
          gepind: false,
          isNieuw: false,
          huidigTeam: (sp.speler?.huidig as { team?: string } | null)?.team ?? null,
          ingedeeldTeamNaam: null,
          selectieGroepId: selectieGroep.id,
        };

        const spelerInTeam: WerkbordSpelerInTeam = {
          id: sp.id,
          spelerId: sp.spelerId,
          speler: spelerObj,
          notitie: sp.notitie ?? null,
        };

        if (geslacht === "V") {
          selectieDames.push(spelerInTeam);
        } else {
          selectieHeren.push(spelerInTeam);
        }
      }

      const teamIdx = teams.findIndex((t) => t.id === primaryTeam.id);
      if (teamIdx >= 0) {
        teams[teamIdx] = { ...teams[teamIdx], selectieDames, selectieHeren, gebundeld: true };
        // Sync canvas-positie naar alle andere teams in de groep (deduplicatie toont alleen primary)
        for (const other of groepTeams.slice(1)) {
          const otherIdx = teams.findIndex((t) => t.id === other.id);
          if (otherIdx >= 0) {
            teams[otherIdx] = {
              ...teams[otherIdx],
              canvasX: teams[teamIdx].canvasX,
              canvasY: teams[teamIdx].canvasY,
            };
          }
        }
      }
    }
  }

  // Spelers in selectiegroep ook markeren als ingedeeld
  if (versie) {
    for (const selectieGroep of (versie as any).selectieGroepen ?? []) {
      for (const sp of selectieGroep.spelers as any[]) {
        const idx = alleSpelers.findIndex((s) => s.id === sp.spelerId);
        if (idx >= 0) {
          alleSpelers[idx] = { ...alleSpelers[idx], selectieGroepId: selectieGroep.id };
        }
      }
    }
  }

  const ingeplandSpelers = alleSpelers.filter(
    (s) => s.teamId !== null || s.selectieGroepId !== null
  ).length;

  // Validatie berekenen op basis van kaders
  const validatie: WerkbordValidatieItem[] = [];
  for (const team of teams) {
    const effectief = team.gebundeld
      ? { ...team, dames: team.selectieDames, heren: team.selectieHeren }
      : team;
    const items = berekenTeamValidatie(effectief, tcKaders, peiljaar);
    validatie.push(...items);
    team.validatieStatus = berekenValidatieStatus(items);
    team.validatieCount = items.filter((i) => i.type !== "ok").length;
  }

  // Bouw alleStaf: stafleden met hun teams + rollen
  const stafTeamMap = new Map<string, WerkbordStafTeamrol[]>();
  if (versie) {
    for (const team of versie.teams as any[]) {
      const kleur = KLEUR_MAP[team.kleur ?? ""] ?? "groen";
      for (const ts of team.staf as any[]) {
        const bestaand = stafTeamMap.get(ts.stafId) ?? [];
        bestaand.push({ teamId: team.id, teamNaam: team.naam, kleur, rol: ts.rol ?? "" });
        stafTeamMap.set(ts.stafId, bestaand);
      }
    }
  }

  const alleStaf: WerkbordStaf[] = [];
  const gezienStafIds = new Set<string>();
  if (versie) {
    for (const team of versie.teams as any[]) {
      for (const ts of team.staf as any[]) {
        if (gezienStafIds.has(ts.stafId)) continue;
        gezienStafIds.add(ts.stafId);
        alleStaf.push({
          id: ts.stafId,
          naam: ts.staf?.naam ?? "?",
          rollen: (ts.staf?.rollen as string[]) ?? [],
          teams: stafTeamMap.get(ts.stafId) ?? [],
        });
      }
    }
  }

  const initieleState: WerkbordState = {
    teams,
    alleSpelers,
    alleStaf,
    validatie,
    werkindelingId: volledig.id,
    versieId: versie?.id ?? "",
    kadersId: volledig.kaders.id,
    seizoen: volledig.kaders.seizoen,
    naam: volledig.naam,
    status: volledig.status === "DEFINITIEF" ? "definitief" : "concept",
    versieNummer: versie?.nummer ?? 1,
    versieNaam: versie?.naam ?? null,
    totalSpelers: alleSpelers.length,
    ingeplandSpelers,
  };

  return <TiStudioShell initieleState={initieleState} gebruikerEmail={gebruikerEmail} />;
}
