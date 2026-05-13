import { db as prisma } from "@/lib/db";
import { logger } from "@oranje-wit/types";
import { ReserveringenFilterbar } from "@/components/personen/reserveringen/ReserveringenFilterbar";
import { ReserveringenTabel } from "@/components/personen/reserveringen/ReserveringenTabel";
import type { ReserveringRijData } from "@/components/personen/types";

export default async function ReserveringenPage() {
  let reserveringen: ReserveringRijData[] = [];

  try {
    const raw = await prisma.reserveringsspeler.findMany({
      orderBy: { titel: "asc" },
      select: {
        id: true,
        titel: true,
        geslacht: true,
        teamId: true,
        team: { select: { naam: true } },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reserveringen = raw.map((r: any) => ({
      id: r.id,
      titel: r.titel,
      geslacht: r.geslacht as "M" | "V",
      teamId: r.teamId,
      teamNaam: r.team?.naam ?? null,
    }));
  } catch (err) {
    logger.warn("ReserveringenPage: data ophalen mislukt:", err);
  }

  return (
    <div>
      <ReserveringenFilterbar />
      <ReserveringenTabel data={reserveringen} />
    </div>
  );
}
