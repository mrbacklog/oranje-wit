"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import { effectieveSpelerStatus } from "@/lib/teamindeling/speler-status";

export async function getSpelersVoorStudio() {
  await requireTC();

  // Haal actief werkseizoen kaders op
  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true },
  });

  if (!kaders) return [];

  // Haal alle spelers parallel op
  const [kadersSpelers, spelers, werkindeling, actieveWerkitems] = await Promise.all([
    prisma.kadersSpeler.findMany({
      where: { kadersId: kaders.id },
      select: {
        spelerId: true,
        gezienStatus: true,
        statusOverride: true,
        notitie: true,
      },
    }),

    prisma.speler.findMany({
      select: {
        id: true,
        roepnaam: true,
        achternaam: true,
        geboortejaar: true,
        geslacht: true,
        status: true,
        huidig: true,
        spelerspad: true,
      },
      orderBy: [{ achternaam: "asc" }],
    }),

    prisma.werkindeling.findFirst({
      where: { kadersId: kaders.id, status: "ACTIEF" },
      select: {
        versies: {
          orderBy: { nummer: "desc" },
          take: 1,
          select: {
            teams: {
              select: {
                naam: true,
                kleur: true,
                spelers: {
                  select: { spelerId: true },
                },
              },
            },
            selectieGroepen: {
              where: { gebundeld: true },
              select: {
                naam: true,
                gebundeld: true,
                teams: {
                  select: { naam: true, kleur: true, volgorde: true },
                  orderBy: { volgorde: "asc" },
                },
                spelers: {
                  select: { spelerId: true },
                },
              },
            },
          },
        },
      },
    }),

    // 4e: actieve werkitems op spelers (niet-gearchiveerde)
    prisma.werkitem.findMany({
      where: {
        spelerId: { not: null },
        status: { notIn: ["GEARCHIVEERD"] },
      },
      select: { spelerId: true },
    }),
  ]);

  // Bouw spelerId → huidig indelingsdoel mapping (team of gebundelde selectie)
  const teamMapping = new Map<string, { naam: string; kleur: string | null }>();
  const versie = werkindeling?.versies?.[0];
  if (versie) {
    // Eerst losse teams
    for (const team of versie.teams) {
      for (const ts of team.spelers) {
        teamMapping.set(ts.spelerId, { naam: team.naam, kleur: team.kleur ?? null });
      }
    }
    // Daarna gebundelde selecties — overrule team-koppeling als speler in een pool zit
    const selectieGroepen =
      (
        versie as unknown as {
          selectieGroepen?: Array<{
            naam: string | null;
            gebundeld: boolean;
            teams: Array<{ naam: string; kleur: string | null }>;
            spelers: Array<{ spelerId: string }>;
          }>;
        }
      ).selectieGroepen ?? [];
    for (const sg of selectieGroepen) {
      if (!sg.gebundeld) continue;
      const selectieNaam = sg.naam ?? sg.teams.map((t) => t.naam).join(" + ");
      const selectieKleur = sg.teams[0]?.kleur ?? null;
      for (const ss of sg.spelers) {
        teamMapping.set(ss.spelerId, { naam: selectieNaam, kleur: selectieKleur });
      }
    }
  }

  const gezienMap = new Map(kadersSpelers.map((ks) => [ks.spelerId, ks]));
  const memoSet = new Set(actieveWerkitems.map((w) => w.spelerId).filter(Boolean) as string[]);

  return spelers.map((s) => {
    const gezien = gezienMap.get(s.id);
    const huidigRecord = s.huidig as { team?: string; kleur?: string } | null;
    const spelerspad = s.spelerspad as Array<{
      seizoen: string;
      team: string;
      kleur?: string;
    }> | null;
    // index 0 = huidig seizoen, index 1 = vorig seizoen
    const vorigSeizoenEntry = spelerspad?.[1];

    return {
      id: s.id as string,
      roepnaam: s.roepnaam as string,
      achternaam: s.achternaam as string,
      geboortejaar: s.geboortejaar as number,
      geslacht: s.geslacht as "M" | "V",
      status: effectieveSpelerStatus(s.status, gezien?.statusOverride),
      gezienStatus: (gezien?.gezienStatus ?? "ONGEZIEN") as
        | "ONGEZIEN"
        | "GROEN"
        | "GEEL"
        | "ORANJE"
        | "ROOD",
      notitie: (gezien?.notitie ?? null) as string | null,
      huidigTeamNaam: (huidigRecord?.team ?? null) as string | null,
      huidigTeamKleur: (huidigRecord?.kleur ?? null) as string | null,
      vorigTeamNaam: (vorigSeizoenEntry?.team ?? null) as string | null,
      vorigTeamKleur: (vorigSeizoenEntry?.kleur ?? null) as string | null,
      huidigIndelingTeam: (teamMapping.get(s.id) ?? null) as {
        naam: string;
        kleur: string | null;
      } | null,
      heeftActiefMemo: memoSet.has(s.id),
    };
  });
}

export type StudioSpeler = Awaited<ReturnType<typeof getSpelersVoorStudio>>[number];

// ─── Handmatige speler aanmaken ───────────────────────────────────────────────

export async function maakHandmatigeSpelerAan(data: {
  roepnaam: string;
  achternaam: string;
  geslacht: "M" | "V";
  geboortedatum: string; // "YYYY-MM-DD"
  status?: string;
  notitie?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    const kaders = await prisma.kaders.findFirst({
      where: { isWerkseizoen: true },
      select: { id: true },
    });
    if (!kaders) return { ok: false, error: "Geen actief werkseizoen" };

    const handmatigeId = `HANDMATIG-${crypto.randomUUID().replace(/-/g, "")}`;
    const geboortejaar = new Date(data.geboortedatum).getFullYear();

    await prisma.$transaction([
      prisma.speler.create({
        data: {
          id: handmatigeId,
          roepnaam: data.roepnaam,
          achternaam: data.achternaam,
          geslacht: data.geslacht,
          geboortedatum: new Date(data.geboortedatum),
          geboortejaar,
          status: "NIEUW_POTENTIEEL",
        },
      }),
      prisma.kadersSpeler.create({
        data: {
          kadersId: kaders.id,
          spelerId: handmatigeId,
          notitie: data.notitie ?? null,
        },
      }),
    ]);

    revalidatePath("/personen/spelers");
    return { ok: true };
  } catch (err) {
    logger.warn("maakHandmatigeSpelerAan mislukt:", err);
    return { ok: false, error: "Kon speler niet aanmaken" };
  }
}
