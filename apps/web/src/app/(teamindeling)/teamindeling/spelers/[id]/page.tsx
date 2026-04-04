export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { PEILJAAR, PEILDATUM } from "@oranje-wit/types";
import {
  SpelerDetailView,
  type SpelerDetailData,
  type SeizoenEntry,
} from "@/components/teamindeling/mobile/spelers/SpelerDetailView";

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

export default async function SpelerDetailPage({ params }: Props) {
  const { id } = await params;
  const seizoen = await getActiefSeizoen();

  // Haal speler op
  const speler = await prisma.speler.findUnique({
    where: { id },
  });

  if (!speler) notFound();

  // Tussenvoegsel opzoeken via leden-tabel
  const lid = await prisma.lid.findUnique({
    where: { relCode: id },
    select: { tussenvoegsel: true },
  });

  // Zoek huidig team in werkindeling
  const werkTeamSpeler = await prisma.teamSpeler.findFirst({
    where: {
      spelerId: id,
      team: {
        versie: {
          werkindeling: {
            blauwdruk: { seizoen },
          },
        },
      },
    },
    select: {
      team: {
        select: {
          naam: true,
        },
      },
    },
  });

  const teamNaam = werkTeamSpeler?.team.naam ?? null;

  // Zoek OWTeam id voor link
  let teamId: number | null = null;
  if (teamNaam) {
    const owTeam = await prisma.oWTeam.findFirst({
      where: { seizoen, naam: teamNaam },
      select: { id: true },
    });
    teamId = owTeam?.id ?? null;
  }

  // Seizoenshistorie uit spelerspad
  const seizoensHistorie: SeizoenEntry[] = [];
  if (speler.spelerspad && Array.isArray(speler.spelerspad)) {
    for (const entry of speler.spelerspad as Array<{
      seizoen?: string;
      team?: string;
      kleur?: string;
    }>) {
      if (entry.seizoen && entry.team) {
        seizoensHistorie.push({
          seizoen: entry.seizoen,
          team: entry.team,
          kleur: entry.kleur?.toUpperCase() ?? null,
        });
      }
    }
    // Nieuwste eerst
    seizoensHistorie.sort((a, b) => b.seizoen.localeCompare(a.seizoen));
  }

  const kl = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);

  const data: SpelerDetailData = {
    id: speler.id,
    roepnaam: speler.roepnaam,
    achternaam: speler.achternaam,
    tussenvoegsel: lid?.tussenvoegsel ?? null,
    korfbalLeeftijd: kl,
    geboortejaar: speler.geboortejaar,
    geslacht: speler.geslacht,
    kleur: kleurIndicatie(kl),
    status: speler.status,
    teamNaam,
    teamId,
    lidSinds: speler.lidSinds,
    seizoenenActief: speler.seizoenenActief,
    seizoensHistorie,
  };

  return <SpelerDetailView speler={data} />;
}
