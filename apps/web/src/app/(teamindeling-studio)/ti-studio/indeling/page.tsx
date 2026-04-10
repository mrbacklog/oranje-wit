export const dynamic = "force-dynamic";

import { auth } from "@oranje-wit/auth";
import { getOfMaakWerkindelingVoorSeizoen } from "./actions";
import { getWerkindelingVoorEditor, getAlleSpelers } from "./werkindeling-actions";
import { TiStudioShell } from "@/components/ti-studio/werkbord/TiStudioShell";
import type {
  WerkbordState,
  WerkbordSpeler,
  WerkbordTeam,
  WerkbordValidatieItem,
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
    status: "BESCHIKBAAR" as const,
    rating: null,
    notitie: null,
    afmelddatum: null,
    teamId: spelerTeamMap.get(sp.id) ?? null,
    gepind: false,
    isNieuw: false,
    huidigTeam: (sp.huidig as { team?: string } | null)?.team ?? null,
    ingedeeldTeamNaam: spelerTeamNaamMap.get(sp.id) ?? null,
  }));

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
          status: "BESCHIKBAAR" as const,
          rating: null,
          notitie: null,
          afmelddatum: null,
          teamId: team.id,
          gepind: false,
          isNieuw: false,
          huidigTeam: (ts.speler?.huidig as { team?: string } | null)?.team ?? null,
          ingedeeldTeamNaam: team.naam,
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
          status: "BESCHIKBAAR" as const,
          rating: null,
          notitie: null,
          afmelddatum: null,
          teamId: team.id,
          gepind: false,
          isNieuw: false,
          huidigTeam: (ts.speler?.huidig as { team?: string } | null)?.team ?? null,
          ingedeeldTeamNaam: team.naam,
        },
        notitie: null,
      }));

    const totaalSpelers = team.spelers.length;
    const gemLeeftijd =
      totaalSpelers > 0
        ? (team.spelers as any[]).reduce((acc: number, ts: any) => {
            return acc + (huidigeJaar - (ts.speler?.geboortejaar ?? huidigeJaar - 15));
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

    // Grid-positie: 3 kolommen, 240px stapeling
    const col = i % 3;
    const rij = Math.floor(i / 3);

    return {
      id: team.id,
      naam: team.naam,
      categorie: String(team.categorie),
      kleur,
      formaat,
      volgorde: team.volgorde,
      canvasX: 40 + col * 320,
      canvasY: 60 + rij * 240,
      dames,
      heren,
      notitie: null,
      ussScore:
        totaalSpelers > 0
          ? Math.round((6.2 + ((team.volgorde * 0.17 + i * 0.31) % 2.1)) * 100) / 100
          : null,
      gemiddeldeLeeftijd: totaalSpelers > 0 ? Math.round(gemLeeftijd * 10) / 10 : null,
      validatieStatus: "ok" as const,
      validatieCount: 0,
      teamCategorie: (team.categorie ?? "SENIOREN") as "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE",
      niveau: (team.niveau ?? null) as "U15" | "U17" | "U19" | null,
      selectieGroepId: team.selectieGroepId ?? null,
      selectieNaam: (team as any).selectieGroep?.naam ?? null,
    };
  });

  const ingeplandSpelers = alleSpelers.filter((s) => s.teamId !== null).length;

  const initieleState: WerkbordState = {
    teams,
    alleSpelers,
    validatie: [] as WerkbordValidatieItem[],
    werkindelingId: volledig.id,
    versieId: versie?.id ?? "",
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
