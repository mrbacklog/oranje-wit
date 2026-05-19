import { prisma } from "@/lib/teamindeling/db/prisma";
import type { SpelerLocatie } from "./types";

/**
 * Bepaalt waar de speler op dit moment volgens de DB staat:
 * - "team" als TeamSpeler-record bestaat in deze versie
 * - "selectie" als SelectieSpeler-record bestaat (en geen team)
 * - "pool" anders
 *
 * Bij een (ongezonde) staat met beide records: prefereert team (defensief, want
 * de invariant in werkindeling-actions.ts garandeert mutual-exclusion).
 */
export async function bepaalHuidigeLocatie(
  versieId: string,
  spelerId: string
): Promise<SpelerLocatie> {
  const teamPlaatsing = await prisma.teamSpeler.findFirst({
    where: { spelerId, team: { versieId } },
    select: { teamId: true },
  });
  if (teamPlaatsing) return { soort: "team", teamId: teamPlaatsing.teamId };

  const selPlaatsing = await prisma.selectieSpeler.findFirst({
    where: { spelerId, selectieGroep: { versieId } },
    select: { selectieGroepId: true },
  });
  if (selPlaatsing) return { soort: "selectie", selectieGroepId: selPlaatsing.selectieGroepId };

  return { soort: "pool" };
}

/** Vergelijkt twee speler-locaties op gelijkheid. */
export function vergelijkLocatie(a: SpelerLocatie, b: SpelerLocatie): boolean {
  if (a.soort !== b.soort) return false;
  if (a.soort === "pool") return true;
  if (a.soort === "team" && b.soort === "team") return a.teamId === b.teamId;
  if (a.soort === "selectie" && b.soort === "selectie")
    return a.selectieGroepId === b.selectieGroepId;
  return false;
}

/**
 * Haalt de laatste WerkbordMutatie op voor een speler in een versie —
 * gebruikt om bij een 409 conflict te kunnen melden wie de andere mutator was.
 */
export async function laatsteMutatieVoor(
  versieId: string,
  spelerId: string
): Promise<{ naam: string; sessionId: string | null; tijdstip: Date } | null> {
  const m = await prisma.werkbordMutatie.findFirst({
    where: { versieId, spelerId },
    orderBy: { createdAt: "desc" },
    include: { door: { select: { naam: true } } },
  });
  if (!m) return null;
  return { naam: m.door.naam, sessionId: m.sessionId, tijdstip: m.createdAt };
}
