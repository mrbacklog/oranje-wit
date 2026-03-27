"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireEditor } from "@/lib/teamindeling/auth-check";
import { assertBewerkbaar } from "@/lib/teamindeling/seizoen";
import type { PinType } from "@oranje-wit/database";

// ============================================================
// HELPERS
// ============================================================

async function getOrCreateUser() {
  const session = await requireEditor();
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

// ============================================================
// PIN CRUD
// ============================================================

const pinInclude = {
  speler: { select: { id: true, roepnaam: true, achternaam: true } },
  staf: { select: { id: true, naam: true } },
  gepindDoor: { select: { id: true, naam: true } },
};

export async function createPin(data: {
  blauwdrukId: string;
  spelerId: string;
  type: PinType;
  waarde: { teamNaam: string; teamId: string };
  notitie?: string;
}) {
  await assertBlauwdrukBewerkbaar(data.blauwdrukId);
  const user = await getOrCreateUser();

  // Verwijder eventuele bestaande pin voor dezelfde speler+type (upsert)
  await prisma.pin.deleteMany({
    where: {
      blauwdrukId: data.blauwdrukId,
      spelerId: data.spelerId,
      type: data.type,
    },
  });

  return prisma.pin.create({
    data: {
      blauwdrukId: data.blauwdrukId,
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
    select: { blauwdrukId: true },
  });
  await assertBlauwdrukBewerkbaar(pin.blauwdrukId);
  return prisma.pin.delete({ where: { id: pinId } });
}

export async function getPinsVoorScenario(scenarioId: string) {
  const scenario = await prisma.scenario.findUniqueOrThrow({
    where: { id: scenarioId },
    select: {
      concept: {
        select: { blauwdrukId: true },
      },
    },
  });

  return prisma.pin.findMany({
    where: { blauwdrukId: scenario.concept.blauwdrukId },
    include: pinInclude,
    orderBy: { gepindOp: "desc" },
  });
}
