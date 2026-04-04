export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { PEILJAAR, PEILDATUM } from "@oranje-wit/types";
import {
  TeamDetailView,
  type TeamDetailData,
  type SpelerItem,
  type StafItem,
} from "@/components/teamindeling/mobile/teams/TeamDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

/** Bereken korfballeeftijd */
function korfbalLeeftijd(geboortedatum: Date | null, geboortejaar: number): number {
  if (geboortedatum) {
    const ms = PEILDATUM.getTime() - geboortedatum.getTime();
    return Math.round((ms / (365.25 * 86_400_000)) * 100) / 100;
  }
  return PEILJAAR - geboortejaar;
}

/** Kleurindicatie op basis van korfballeeftijd */
function kleurIndicatie(kl: number): string | null {
  if (kl < 5) return "PAARS";
  if (kl <= 8) return "BLAUW";
  if (kl <= 10) return "GROEN";
  if (kl <= 12) return "GEEL";
  if (kl <= 14) return "ORANJE";
  if (kl <= 18) return "ROOD";
  return null;
}

/** Spelvorm-gebaseerde teamgrootte target */
function getTarget(spelvorm: string | null): number {
  const s = (spelvorm ?? "").toLowerCase();
  if (s.includes("viertal") || s.includes("4-tal")) return 6;
  if (s.includes("zestal") || s.includes("6-tal")) return 8;
  if (s.includes("achtal") || s.includes("8-tal")) return 10;
  return 12; // senioren default
}

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params;
  const seizoen = await getActiefSeizoen();

  // Haal OWTeam op
  const owTeam = await prisma.oWTeam.findUnique({
    where: { id: Number(id) },
  });

  if (!owTeam) notFound();

  // Zoek de werkindeling-team die matcht op naam
  const teamNaam = owTeam.naam ?? owTeam.owCode;

  const werkTeam = await prisma.team.findFirst({
    where: {
      naam: teamNaam,
      versie: {
        werkindeling: {
          blauwdruk: { seizoen },
        },
      },
    },
    select: {
      id: true,
      spelers: {
        select: {
          spelerId: true,
          speler: {
            select: {
              id: true,
              roepnaam: true,
              achternaam: true,
              geboortejaar: true,
              geboortedatum: true,
              geslacht: true,
            },
          },
        },
      },
      staf: {
        select: {
          stafId: true,
          rol: true,
          staf: {
            select: { id: true, naam: true },
          },
        },
      },
    },
  });

  // Ook StafToewijzing (uit monitor-data) als fallback
  const stafToewijzingen = await prisma.stafToewijzing.findMany({
    where: {
      seizoen,
      team: teamNaam,
    },
    select: {
      stafId: true,
      rol: true,
      staf: { select: { id: true, naam: true } },
    },
  });

  // Bouw spelers
  type WerkSpeler = NonNullable<typeof werkTeam>["spelers"][number];
  const spelers: SpelerItem[] = (werkTeam?.spelers ?? [])
    .map((ts: WerkSpeler) => {
      const kl = korfbalLeeftijd(ts.speler.geboortedatum, ts.speler.geboortejaar);
      return {
        id: ts.speler.id,
        roepnaam: ts.speler.roepnaam,
        achternaam: ts.speler.achternaam,
        korfbalLeeftijd: kl,
        geslacht: ts.speler.geslacht,
        kleur: kleurIndicatie(kl),
      };
    })
    .sort((a: SpelerItem, b: SpelerItem) => {
      // Heren eerst, dan dames. Binnen groep op leeftijd aflopend.
      if (a.geslacht !== b.geslacht) return a.geslacht === "M" ? -1 : 1;
      return b.korfbalLeeftijd - a.korfbalLeeftijd;
    });

  // Bouw staf (werkindeling heeft voorrang, stafToewijzingen als fallback)
  type WerkStaf = NonNullable<typeof werkTeam>["staf"][number];
  const stafMap = new Map<string, StafItem>();
  for (const ts of (werkTeam?.staf ?? []) as WerkStaf[]) {
    stafMap.set(ts.stafId, { id: ts.staf.id, naam: ts.staf.naam, rol: ts.rol });
  }
  for (const st of stafToewijzingen) {
    if (!stafMap.has(st.stafId)) {
      stafMap.set(st.stafId, { id: st.staf.id, naam: st.staf.naam, rol: st.rol });
    }
  }
  const staf = Array.from(stafMap.values());

  const teamData: TeamDetailData = {
    id: owTeam.id,
    naam: teamNaam,
    categorie: owTeam.categorie,
    kleur: owTeam.kleur?.toUpperCase() ?? null,
    leeftijdsgroep: owTeam.leeftijdsgroep,
    spelvorm: owTeam.spelvorm,
    spelers,
    staf,
    target: getTarget(owTeam.spelvorm),
  };

  return <TeamDetailView team={teamData} />;
}
