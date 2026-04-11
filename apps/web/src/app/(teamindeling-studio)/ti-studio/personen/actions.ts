"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { assertBewerkbaar } from "@/lib/teamindeling/seizoen";
import { logger } from "@oranje-wit/types";
import type { PinType } from "@oranje-wit/database";

export async function getSpelersVoorStudio() {
  await requireTC();

  // Haal actief werkseizoen kaders op
  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true },
  });

  if (!kaders) return [];

  // Haal alle spelers parallel op
  const [kadersSpelers, spelers, werkindeling, pins, actieveWerkitems] = await Promise.all([
    prisma.kadersSpeler.findMany({
      where: { kadersId: kaders.id },
      select: {
        spelerId: true,
        gezienStatus: true,
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
          },
        },
      },
    }),

    // 4e: gepinde spelers voor dit kaders (SPELER_GEPIND type)
    prisma.pin.findMany({
      where: { kadersId: kaders.id, spelerId: { not: null }, type: "SPELER_GEPIND" },
      select: { spelerId: true },
    }),

    // 5e: actieve werkitems op spelers (niet-gearchiveerde)
    prisma.werkitem.findMany({
      where: {
        spelerId: { not: null },
        status: { notIn: ["GEARCHIVEERD"] },
      },
      select: { spelerId: true },
    }),
  ]);

  // Bouw spelerId → huidig indelingsteam mapping
  const teamMapping = new Map<string, { naam: string; kleur: string | null }>();
  const versie = werkindeling?.versies?.[0];
  if (versie) {
    for (const team of versie.teams) {
      for (const ts of team.spelers) {
        teamMapping.set(ts.spelerId, { naam: team.naam, kleur: team.kleur ?? null });
      }
    }
  }

  const gezienMap = new Map(kadersSpelers.map((ks) => [ks.spelerId, ks]));
  const gepindSet = new Set(pins.map((p) => p.spelerId).filter(Boolean) as string[]);
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
      status: s.status as string,
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
      gepind: gepindSet.has(s.id),
      heeftActiefMemo: memoSet.has(s.id),
    };
  });
}

export type StudioSpeler = Awaited<ReturnType<typeof getSpelersVoorStudio>>[number];

// ─── Pins ────────────────────────────────────────────────────────────────────

async function assertKadersBewerkbaar(kadersId: string) {
  const kaders = await prisma.kaders.findUniqueOrThrow({
    where: { id: kadersId },
    select: { seizoen: true },
  });
  await assertBewerkbaar(kaders.seizoen);
}

async function getOrCreateUser() {
  const session = await requireTC();
  const email = session.user!.email!;
  const naam = session.user!.name ?? email;
  return prisma.user.upsert({
    where: { email },
    create: { email, naam, rol: "EDITOR" },
    update: { naam },
    select: { id: true },
  });
}

const pinInclude = {
  speler: { select: { id: true, roepnaam: true, achternaam: true } },
  staf: { select: { id: true, naam: true } },
  gepindDoor: { select: { id: true, naam: true } },
};

export async function createPin(data: {
  kadersId: string;
  spelerId: string;
  type: PinType;
  waarde: { teamNaam: string; teamId: string };
  notitie?: string;
}) {
  await assertKadersBewerkbaar(data.kadersId);
  const user = await getOrCreateUser();
  await prisma.pin.deleteMany({
    where: { kadersId: data.kadersId, spelerId: data.spelerId, type: data.type },
  });
  return prisma.pin.create({
    data: {
      kadersId: data.kadersId,
      spelerId: data.spelerId,
      type: data.type,
      waarde: data.waarde,
      notitie: data.notitie ?? null,
      gepindDoorId: user.id,
    },
    include: pinInclude,
  });
}

export async function deletePin(pinId: string) {
  const pin = await prisma.pin.findUniqueOrThrow({
    where: { id: pinId },
    select: { kadersId: true },
  });
  await assertKadersBewerkbaar(pin.kadersId);
  return prisma.pin.delete({ where: { id: pinId } });
}

export async function getPinsVoorWerkindeling(werkindelingId: string) {
  const werkindeling = await prisma.werkindeling.findUniqueOrThrow({
    where: { id: werkindelingId },
    select: { kadersId: true },
  });
  return prisma.pin.findMany({
    where: { kadersId: werkindeling.kadersId },
    include: pinInclude,
    orderBy: { gepindOp: "desc" },
  });
}

// ─── Speler-pin toggle ────────────────────────────────────────────────────────

export async function togglePinSpeler(
  spelerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const kaders = await prisma.kaders.findFirst({
      where: { isWerkseizoen: true },
      select: { id: true },
    });
    if (!kaders) return { ok: false, error: "Geen actief werkseizoen" };

    const bestaandePin = await prisma.pin.findFirst({
      where: { kadersId: kaders.id, spelerId, type: "SPELER_GEPIND" },
    });

    if (bestaandePin) {
      await prisma.pin.delete({ where: { id: bestaandePin.id } });
    } else {
      const user = await getOrCreateUser();
      await prisma.pin.create({
        data: {
          kadersId: kaders.id,
          spelerId,
          type: "SPELER_GEPIND",
          waarde: {},
          gepindDoorId: user.id,
        },
      });
    }

    revalidatePath("/ti-studio/personen/spelers");
    revalidatePath("/ti-studio/indeling");
    return { ok: true };
  } catch (err) {
    logger.warn("togglePinSpeler mislukt:", err);
    return { ok: false, error: "Kon pin niet togglen" };
  }
}

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
          status: (data.status as "NIEUW_POTENTIEEL") ?? "NIEUW_POTENTIEEL",
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

    revalidatePath("/ti-studio/personen/spelers");
    return { ok: true };
  } catch (err) {
    logger.warn("maakHandmatigeSpelerAan mislukt:", err);
    return { ok: false, error: "Kon speler niet aanmaken" };
  }
}
