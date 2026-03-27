import { prisma } from "@/lib/db/prisma";
import { RaamwerkOverzicht } from "./raamwerk-overzicht";

// Prisma 7 type recursion workaround
const db = prisma as any;

export default async function RaamwerkPage() {
  // Haal alle versies op met tellingen
  const versies = await db.raamwerkVersie.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      groepen: {
        orderBy: { band: "asc" },
        include: {
          pijlers: {
            orderBy: { volgorde: "asc" },
            include: {
              items: {
                where: { actief: true },
                select: { isKern: true },
              },
            },
          },
        },
      },
    },
  });

  type VersieRow = {
    id: string;
    seizoen: string;
    naam: string;
    status: string;
    opmerking: string | null;
    createdAt: Date;
    updatedAt: Date;
    gepubliceerdOp: Date | null;
    groepen: Array<{
      id: string;
      band: string;
      schaalType: string;
      kernItemsTarget: number | null;
      pijlers: Array<{
        id: string;
        code: string;
        naam: string;
        items: Array<{ isKern: boolean }>;
      }>;
    }>;
  };

  const data = versies.map((v: VersieRow) => ({
    id: v.id,
    seizoen: v.seizoen,
    naam: v.naam,
    status: v.status,
    opmerking: v.opmerking,
    createdAt: v.createdAt.toISOString(),
    gepubliceerdOp: v.gepubliceerdOp?.toISOString() ?? null,
    groepen: v.groepen.map((g) => {
      const totaalItems = g.pijlers.reduce((sum, p) => sum + p.items.length, 0);
      const kernItems = g.pijlers.reduce(
        (sum, p) => sum + p.items.filter((i) => i.isKern).length,
        0
      );
      return {
        id: g.id,
        band: g.band,
        schaalType: g.schaalType,
        kernItemsTarget: g.kernItemsTarget,
        aantalPijlers: g.pijlers.length,
        totaalItems,
        kernItems,
      };
    }),
  }));

  return <RaamwerkOverzicht versies={data} />;
}
