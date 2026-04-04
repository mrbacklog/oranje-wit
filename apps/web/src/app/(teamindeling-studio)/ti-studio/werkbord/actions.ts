"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@/lib/teamindeling/auth-check";
import { assertBewerkbaar } from "@/lib/teamindeling/seizoen";
import { revalidatePath } from "next/cache";
import type {
  WerkitemType,
  WerkitemPrioriteit,
  WerkitemStatus,
  ActiepuntStatus,
  Besluitniveau,
  Doelgroep,
  Entiteit,
} from "@/components/teamindeling/werkbord/types";

// Werkitem model nog niet in Prisma schema — gebruik untyped accessor
const db = prisma as never as { werkitem: typeof prisma.actiepunt };

// ============================================================
// HELPERS
// ============================================================

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

async function assertBlauwdrukBewerkbaar(blauwdrukId: string) {
  const blauwdruk = await prisma.blauwdruk.findUniqueOrThrow({
    where: { id: blauwdrukId },
    select: { seizoen: true },
  });
  await assertBewerkbaar(blauwdruk.seizoen);
}

async function getWerkBlauwdruk() {
  const blauwdruk = await prisma.blauwdruk.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true },
  });
  if (!blauwdruk) throw new Error("Geen werkseizoen gevonden");
  return blauwdruk;
}

// ============================================================
// WERKITEMS
// ============================================================

const werkitemInclude = {
  auteur: { select: { id: true, naam: true } },
  speler: { select: { id: true, roepnaam: true, achternaam: true } },
  staf: { select: { id: true, naam: true } },
  scenario: { select: { id: true, naam: true } },
  actiepunten: {
    include: {
      toegewezenAan: { select: { id: true, naam: true } },
    },
    orderBy: [{ volgorde: "asc" as const }, { createdAt: "asc" as const }],
  },
};

export async function getWerkitems(
  blauwdrukId: string,
  filters?: {
    status?: WerkitemStatus[];
    prioriteit?: WerkitemPrioriteit[];
    type?: WerkitemType[];
    besluitniveau?: Besluitniveau[];
    doelgroep?: Doelgroep[];
    entiteit?: Entiteit[];
    spelerId?: string;
    stafId?: string;
    teamOwCode?: string;
    werkindelingId?: string | null;
  }
) {
  const where = {
    blauwdrukId,
    ...(filters?.status?.length && { status: { in: filters.status } }),
    ...(filters?.prioriteit?.length && { prioriteit: { in: filters.prioriteit } }),
    ...(filters?.type?.length && { type: { in: filters.type } }),
    ...(filters?.besluitniveau?.length && { besluitniveau: { in: filters.besluitniveau } }),
    ...(filters?.doelgroep?.length && { doelgroep: { in: filters.doelgroep } }),
    ...(filters?.entiteit?.length && { entiteit: { in: filters.entiteit } }),
    ...(filters?.spelerId && { spelerId: filters.spelerId }),
    ...(filters?.stafId && { stafId: filters.stafId }),
    ...(filters?.teamOwCode && { teamOwCode: filters.teamOwCode }),
    ...(filters?.werkindelingId !== undefined && { werkindelingId: filters.werkindelingId }),
  };

  return db.werkitem.findMany({
    where,
    include: werkitemInclude,
    orderBy: [{ prioriteit: "asc" }, { createdAt: "desc" }],
  });
}

export async function getWerkitem(werkitemId: string) {
  return db.werkitem.findUnique({
    where: { id: werkitemId },
    include: werkitemInclude,
  });
}

export async function createWerkitem(data: {
  blauwdrukId: string;
  titel: string;
  beschrijving: string;
  type: WerkitemType;
  prioriteit?: WerkitemPrioriteit;
  besluitniveau?: Besluitniveau;
  doelgroep?: Doelgroep;
  entiteit?: Entiteit;
  werkindelingId?: string;
  spelerId?: string;
  stafId?: string;
  teamOwCode?: string;
  resolutie?: string;
}) {
  await assertBlauwdrukBewerkbaar(data.blauwdrukId);
  const user = await getOrCreateUser();

  return db.werkitem.create({
    data: {
      blauwdrukId: data.blauwdrukId,
      titel: data.titel,
      beschrijving: data.beschrijving,
      type: data.type,
      prioriteit: data.prioriteit ?? "MIDDEL",
      besluitniveau: data.besluitniveau ?? null,
      doelgroep: data.doelgroep ?? null,
      entiteit: data.entiteit ?? null,
      werkindelingId: data.werkindelingId ?? null,
      spelerId: data.spelerId ?? null,
      stafId: data.stafId ?? null,
      teamOwCode: data.teamOwCode ?? null,
      resolutie: data.resolutie ?? null,
      status: data.type === "BESLUIT" && data.resolutie ? "OPGELOST" : "OPEN",
      opgelostOp: data.type === "BESLUIT" && data.resolutie ? new Date() : null,
      auteurId: user.id,
    },
    include: werkitemInclude,
  });
}

export async function updateWerkitem(
  werkitemId: string,
  data: {
    titel?: string;
    beschrijving?: string;
    type?: WerkitemType;
    prioriteit?: WerkitemPrioriteit;
    besluitniveau?: Besluitniveau | null;
    doelgroep?: Doelgroep | null;
    entiteit?: Entiteit | null;
  }
) {
  const werkitem = await db.werkitem.findUniqueOrThrow({
    where: { id: werkitemId },
    select: { blauwdrukId: true },
  });
  await assertBlauwdrukBewerkbaar(werkitem.blauwdrukId);

  return db.werkitem.update({
    where: { id: werkitemId },
    data,
    include: werkitemInclude,
  });
}

export async function updateWerkitemStatus(
  werkitemId: string,
  status: WerkitemStatus,
  resolutie?: string
) {
  const werkitem = await db.werkitem.findUniqueOrThrow({
    where: { id: werkitemId },
    select: { blauwdrukId: true },
  });
  await assertBlauwdrukBewerkbaar(werkitem.blauwdrukId);

  if (status === "OPGELOST" && !resolutie) {
    throw new Error("Resolutie is verplicht bij status OPGELOST");
  }

  const result = await db.werkitem.update({
    where: { id: werkitemId },
    data: {
      status,
      resolutie: resolutie ?? undefined,
      opgelostOp:
        status === "OPGELOST" || status === "GEACCEPTEERD_RISICO" ? new Date() : undefined,
    },
    include: werkitemInclude,
  });

  revalidatePath("/");
  return result;
}

export async function deleteWerkitem(werkitemId: string) {
  const werkitem = await db.werkitem.findUniqueOrThrow({
    where: { id: werkitemId },
    select: { blauwdrukId: true },
  });
  await assertBlauwdrukBewerkbaar(werkitem.blauwdrukId);

  await db.werkitem.delete({ where: { id: werkitemId } });
  revalidatePath("/");
}

export async function countBlockers(blauwdrukId: string) {
  return db.werkitem.count({
    where: {
      blauwdrukId,
      prioriteit: "BLOCKER",
      status: { in: ["OPEN", "IN_BESPREKING"] },
    },
  });
}

export async function getWerkitemStats(blauwdrukId: string) {
  const [open, blockers, besluiten, afgerond] = await Promise.all([
    db.werkitem.count({
      where: {
        blauwdrukId,
        status: { in: ["OPEN", "IN_BESPREKING"] },
      },
    }),
    db.werkitem.count({
      where: {
        blauwdrukId,
        prioriteit: "BLOCKER",
        status: { in: ["OPEN", "IN_BESPREKING"] },
      },
    }),
    db.werkitem.count({
      where: {
        blauwdrukId,
        type: "BESLUIT",
        status: "OPGELOST",
      },
    }),
    db.werkitem.count({
      where: {
        blauwdrukId,
        status: { in: ["OPGELOST", "GEACCEPTEERD_RISICO"] },
      },
    }),
  ]);
  return { open, blockers, besluiten, afgerond };
}

// ============================================================
// ACTIEPUNTEN
// ============================================================

export async function createActiepunt(data: {
  blauwdrukId: string;
  beschrijving: string;
  toegewezenAanId?: string;
  werkitemId?: string;
  werkindelingId?: string;
  deadline?: string;
  volgorde?: number;
}) {
  await assertBlauwdrukBewerkbaar(data.blauwdrukId);
  const user = await getOrCreateUser();

  const result = await prisma.actiepunt.create({
    data: {
      blauwdrukId: data.blauwdrukId,
      beschrijving: data.beschrijving,
      toegewezenAanId: data.toegewezenAanId ?? null,
      werkitemId: data.werkitemId ?? null,
      werkindelingId: data.werkindelingId ?? null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      volgorde: data.volgorde ?? 0,
      auteurId: user.id,
    },
    include: {
      toegewezenAan: { select: { id: true, naam: true } },
    },
  });

  revalidatePath("/");
  return result;
}

export async function updateActiepuntStatus(actiepuntId: string, status: ActiepuntStatus) {
  const actiepunt = await prisma.actiepunt.findUniqueOrThrow({
    where: { id: actiepuntId },
    select: { blauwdrukId: true },
  });
  await assertBlauwdrukBewerkbaar(actiepunt.blauwdrukId);

  const result = await prisma.actiepunt.update({
    where: { id: actiepuntId },
    data: {
      status,
      afgerondOp: status === "AFGEROND" ? new Date() : null,
    },
    include: {
      toegewezenAan: { select: { id: true, naam: true } },
    },
  });

  revalidatePath("/");
  return result;
}

export async function deleteActiepunt(actiepuntId: string) {
  const actiepunt = await prisma.actiepunt.findUniqueOrThrow({
    where: { id: actiepuntId },
    select: { blauwdrukId: true },
  });
  await assertBlauwdrukBewerkbaar(actiepunt.blauwdrukId);

  await prisma.actiepunt.delete({ where: { id: actiepuntId } });
  revalidatePath("/");
}

export async function reorderActiepunten(ids: string[]) {
  await requireTC();
  await Promise.all(
    ids.map((id, index) =>
      prisma.actiepunt.update({
        where: { id },
        data: { volgorde: index },
      })
    )
  );
  revalidatePath("/");
}

// ============================================================
// TIMELINE (voor speler/staf/team detail)
// ============================================================

export async function getTimelineVoorSubject(subject: {
  spelerId?: string;
  stafId?: string;
  teamOwCode?: string;
}) {
  const blauwdruk = await getWerkBlauwdruk();

  const where = {
    blauwdrukId: blauwdruk.id,
    ...(subject.spelerId && { spelerId: subject.spelerId }),
    ...(subject.stafId && { stafId: subject.stafId }),
    ...(subject.teamOwCode && { teamOwCode: subject.teamOwCode }),
  };

  return db.werkitem.findMany({
    where,
    include: werkitemInclude,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Maak een statuswijziging-werkitem aan.
 * Vervangt createStatusWijziging uit activiteiten/actions.ts.
 */
export async function createStatusWerkitem(
  spelerId: string,
  oudStatus: string,
  nieuwStatus: string
) {
  const blauwdruk = await getWerkBlauwdruk();
  const user = await getOrCreateUser();

  const result = await db.werkitem.create({
    data: {
      blauwdrukId: blauwdruk.id,
      titel: `Status: ${oudStatus} → ${nieuwStatus}`,
      beschrijving: `Spelerstatus gewijzigd van ${oudStatus} naar ${nieuwStatus}`,
      type: "SPELER",
      prioriteit: "INFO",
      entiteit: "SPELER",
      spelerId,
      auteurId: user.id,
    },
    include: werkitemInclude,
  });

  revalidatePath("/");
  return result;
}

// ============================================================
// USERS (voor toewijzing dropdowns)
// ============================================================

export async function getUsers() {
  return prisma.user.findMany({
    select: { id: true, naam: true, email: true, rol: true },
    orderBy: { naam: "asc" },
  });
}
