"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { auth } from "@oranje-wit/auth";
import { ADMIN_EMAIL } from "@oranje-wit/auth/allowlist";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";

export async function isAdmin() {
  const session = await auth();
  return session?.user?.email === ADMIN_EMAIL;
}

export async function switchSeizoen(seizoen: string) {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) {
    throw new Error("Alleen admin mag seizoen wisselen");
  }
  await prisma.kaders.updateMany({ data: { isWerkseizoen: false } });
  await prisma.kaders.update({
    where: { seizoen },
    data: { isWerkseizoen: true },
  });
}

export async function getMijlpalen() {
  const seizoen = await getActiefSeizoen();
  return prisma.mijlpaal.findMany({
    where: { seizoen },
    orderBy: { volgorde: "asc" },
  });
}

export async function createMijlpaal(data: { label: string; datum: string }) {
  const seizoen = await getActiefSeizoen();
  const maxVolgorde = await prisma.mijlpaal.aggregate({
    where: { seizoen },
    _max: { volgorde: true },
  });
  return prisma.mijlpaal.create({
    data: {
      seizoen,
      label: data.label,
      datum: new Date(data.datum),
      volgorde: (maxVolgorde._max.volgorde ?? 0) + 1,
    },
  });
}

export async function updateMijlpaal(
  id: string,
  data: { label?: string; datum?: string; afgerond?: boolean }
) {
  return prisma.mijlpaal.update({
    where: { id },
    data: {
      ...(data.label && { label: data.label }),
      ...(data.datum && { datum: new Date(data.datum) }),
      ...(data.afgerond !== undefined && {
        afgerond: data.afgerond,
        afgerondOp: data.afgerond ? new Date() : null,
      }),
    },
  });
}

export async function deleteMijlpaal(id: string) {
  return prisma.mijlpaal.delete({ where: { id } });
}

export async function getImportHistorie() {
  return prisma.import.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export async function getAlleSeizoenen() {
  return prisma.kaders.findMany({
    orderBy: { seizoen: "desc" },
    select: { seizoen: true, isWerkseizoen: true },
  });
}
