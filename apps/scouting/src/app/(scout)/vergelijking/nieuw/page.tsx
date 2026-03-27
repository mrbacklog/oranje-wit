import { prisma } from "@/lib/db/prisma";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { VergelijkingWizard } from "./vergelijking-wizard";

const db = prisma as any;

export default async function VergelijkingPage() {
  // Haal alle teams op voor het huidige seizoen
  const teams = await (prisma.oWTeam as any).findMany({
    where: { seizoen: HUIDIG_SEIZOEN },
    select: { id: true, naam: true, kleur: true, leeftijdsgroep: true },
    orderBy: { naam: "asc" },
  });

  return <VergelijkingWizard teams={teams} />;
}
