import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Tijdelijke debug-route — laat zien wat er in test-DB staat.
// Beveiligd door basic-auth-middleware. Verwijderen zodra v2 stabiel is.
export async function GET() {
  const [leden, spelers, staf, kaders, werkindeling, versie, teams, werkitems, seizoenen] =
    await Promise.all([
      db.lid.count(),
      db.speler.count(),
      db.staf.count(),
      db.kaders.findMany({
        select: { id: true, seizoen: true, isWerkseizoen: true },
        orderBy: { seizoen: "desc" },
        take: 10,
      }),
      db.werkindeling.count(),
      db.versie.count(),
      db.team.count(),
      db.werkitem.count(),
      db.seizoen.findMany({
        select: { seizoen: true, status: true },
        orderBy: { seizoen: "desc" },
        take: 10,
      }),
    ]);

  return NextResponse.json({
    counts: { leden, spelers, staf, werkindeling, versie, teams, werkitems },
    kaders,
    seizoenen,
  });
}
