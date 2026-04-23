"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────

export interface DrawerWerkversie {
  id: string;
  nummer: number;
  naam: string | null;
  auteur: string;
  createdAt: Date;
  aantalIngedeeld: number;
}

export interface DrawerWhatIf {
  id: string;
  vraag: string;
  status: string;
  basisVersieNummer: number;
  aantalTeams: number;
  isStale: boolean;
  createdAt: Date;
}

export interface DrawerArchiefVersie {
  id: string;
  nummer: number;
  naam: string | null;
  auteur: string;
  createdAt: Date;
}

export interface DrawerData {
  werkversie: DrawerWerkversie;
  whatIfs: DrawerWhatIf[];
  archiefVersies: DrawerArchiefVersie[];
}

// ─── getVersiesVoorDrawer ─────────────────────────────────────

export async function getVersiesVoorDrawer(werkindelingId: string): Promise<DrawerData> {
  await requireTC();
  const versies = await prisma.versie.findMany({
    where: { werkindelingId },
    orderBy: { nummer: "desc" },
    select: { id: true, nummer: true, naam: true, auteur: true, createdAt: true },
  });

  if (versies.length === 0) {
    throw new Error("Werkindeling heeft geen versies");
  }

  const werkversieRaw = versies[0];
  const archiefRaw = versies.slice(1);

  const [whatIfs, aantalIngedeeld] = await Promise.all([
    prisma.whatIf.findMany({
      where: { werkindelingId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        vraag: true,
        status: true,
        basisVersieNummer: true,
        createdAt: true,
        _count: { select: { teams: true } },
      },
    }),
    prisma.teamSpeler.count({
      where: { team: { versie: { werkindelingId, nummer: werkversieRaw.nummer } } },
    }),
  ]);

  return {
    werkversie: {
      ...werkversieRaw,
      aantalIngedeeld,
    },
    whatIfs: whatIfs.map((wi) => ({
      id: wi.id,
      vraag: wi.vraag,
      status: wi.status,
      basisVersieNummer: wi.basisVersieNummer,
      aantalTeams: wi._count.teams,
      isStale: wi.basisVersieNummer < werkversieRaw.nummer,
      createdAt: wi.createdAt,
    })),
    archiefVersies: archiefRaw,
  };
}

// ─── createWhatIfVanHuidigeVersie ─────────────────────────────

export async function createWhatIfVanHuidigeVersie(
  werkindelingId: string,
  data: { vraag: string; toelichting?: string }
): Promise<{ id: string }> {
  await requireTC();

  // Haal de huidige werkversie volledig op — inclusief selectiegroepen en hun
  // gebundelde spelers/staf, zodat de what-if een exacte kopie kan zijn.
  const hoogsteVersie = await prisma.versie.findFirst({
    where: { werkindelingId },
    orderBy: { nummer: "desc" },
    include: {
      teams: {
        select: {
          id: true,
          naam: true,
          categorie: true,
          kleur: true,
          teamType: true,
          niveau: true,
          volgorde: true,
          selectieGroepId: true,
          spelers: { select: { spelerId: true, statusOverride: true, notitie: true } },
          staf: { select: { stafId: true, rol: true } },
        },
      },
      selectieGroepen: {
        select: {
          id: true,
          naam: true,
          gebundeld: true,
          spelers: { select: { spelerId: true, statusOverride: true, notitie: true } },
          staf: { select: { stafId: true, rol: true } },
        },
      },
    },
  });

  if (!hoogsteVersie) {
    throw new Error("Werkindeling heeft geen versie");
  }

  type BronTeam = (typeof hoogsteVersie)["teams"][number];
  type BronSG = (typeof hoogsteVersie)["selectieGroepen"][number];

  const sgById = new Map<string, BronSG>();
  for (const sg of hoogsteVersie.selectieGroepen ?? []) sgById.set(sg.id, sg);

  // Bepaal primary team per gebundelde pool (laagste volgorde). Pool-spelers
  // worden alléén op dat primary team platgeslagen — net zoals werkversie-UI
  // deduplicateert (page.tsx: selectieDames/-Heren alleen op primaryTeam).
  const primaryIdPerPool = new Map<string, string>();
  for (const sg of hoogsteVersie.selectieGroepen ?? []) {
    if (!sg.gebundeld) continue;
    const teamsInPool = hoogsteVersie.teams
      .filter((t: BronTeam) => t.selectieGroepId === sg.id)
      .sort((a: BronTeam, b: BronTeam) => a.volgorde - b.volgorde);
    if (teamsInPool[0]) primaryIdPerPool.set(sg.id, teamsInPool[0].id);
  }

  // Voor elk team: plat de pool-spelers/staf alléén op het primary team van
  // een gebundelde pool. Andere teams in dezelfde pool krijgen hun eigen
  // (meestal lege) TeamSpeler/TeamStaf-set. Bij promotie reconstrueren we
  // de pool weer in v2 op basis van het primary team.
  const teamsData = hoogsteVersie.teams.map((team: BronTeam) => {
    const sg = team.selectieGroepId ? sgById.get(team.selectieGroepId) : null;
    const gebundeld = sg?.gebundeld ?? false;
    const isPrimary = sg && gebundeld && primaryIdPerPool.get(sg.id) === team.id;

    const extraSpelers = isPrimary && sg ? sg.spelers : [];
    const extraStaf = isPrimary && sg ? sg.staf : [];

    // Ontdubbel: een speler mag niet twee keer in hetzelfde team zitten
    const spelerIds = new Set(team.spelers.map((s: { spelerId: string }) => s.spelerId));
    const stafIds = new Set(team.staf.map((s: { stafId: string }) => s.stafId));
    const extraSpelersGefilterd = extraSpelers.filter(
      (s: { spelerId: string }) => !spelerIds.has(s.spelerId)
    );
    const extraStafGefilterd = extraStaf.filter((s: { stafId: string }) => !stafIds.has(s.stafId));

    return {
      bronTeamId: team.id,
      naam: team.naam,
      categorie: team.categorie,
      kleur: team.kleur,
      teamType: team.teamType,
      niveau: team.niveau,
      volgorde: team.volgorde,
      selectieGroepBronId: team.selectieGroepId,
      selectieNaam: sg?.naam ?? null,
      gebundeld,
      spelers: { create: [...team.spelers, ...extraSpelersGefilterd] },
      staf: { create: [...team.staf, ...extraStafGefilterd] },
    };
  });

  const whatIf = await prisma.whatIf.create({
    data: {
      werkindelingId,
      vraag: data.vraag,
      toelichting: data.toelichting ?? null,
      basisVersieNummer: hoogsteVersie.nummer,
      posities: hoogsteVersie.posities ?? undefined,
      teams: {
        create: teamsData,
      },
    },
    select: { id: true },
  });

  logger.info(`What-if "${data.vraag}" aangemaakt voor werkindeling ${werkindelingId}`);
  revalidatePath("/indeling");
  return whatIf;
}
