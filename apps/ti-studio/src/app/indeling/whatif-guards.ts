"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";

/**
 * Controleer dat de what-if van een team bewerkbaar is (status OPEN of BESLISBAAR).
 * Accepteert een whatIfTeamId en kijkt via de relatie naar de what-if status.
 */
export async function assertWhatIfBewerkbaar(whatIfTeamId: string): Promise<void> {
  const team = await prisma.whatIfTeam.findUniqueOrThrow({
    where: { id: whatIfTeamId },
    select: {
      whatIf: { select: { status: true } },
    },
  });
  const status = team.whatIf.status;
  if (status !== "OPEN" && status !== "BESLISBAAR") {
    throw new Error(`What-if heeft status "${status}", bewerking niet toegestaan`);
  }
}

/**
 * Controleer dat een what-if bewerkbaar is via het what-if ID.
 */
export async function assertWhatIfBewerkbaarById(whatIfId: string): Promise<void> {
  const whatIf = await prisma.whatIf.findUniqueOrThrow({
    where: { id: whatIfId },
    select: { status: true },
  });
  if (whatIf.status !== "OPEN" && whatIf.status !== "BESLISBAAR") {
    throw new Error(`What-if heeft status "${whatIf.status}", bewerking niet toegestaan`);
  }
}
