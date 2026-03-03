"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { assertBewerkbaar } from "@/lib/seizoen";

/**
 * Guard: controleer of de versie bij een bewerkbaar seizoen hoort.
 */
async function assertVersieBewerkbaar(versieId: string) {
  const versie = await prisma.versie.findUniqueOrThrow({
    where: { id: versieId },
    select: {
      scenario: { select: { concept: { select: { blauwdruk: { select: { seizoen: true } } } } } },
    },
  });
  await assertBewerkbaar(versie.scenario.concept.blauwdruk.seizoen);
}

/**
 * Werk de volgorde van teams bij (bulk update).
 */
export async function updateTeamVolgorde(
  versieId: string,
  volgordes: { teamId: string; volgorde: number }[]
) {
  await assertVersieBewerkbaar(versieId);
  await prisma.$transaction(
    volgordes.map(({ teamId, volgorde }) =>
      prisma.team.update({
        where: { id: teamId },
        data: { volgorde },
      })
    )
  );
  revalidatePath("/scenarios");
}
