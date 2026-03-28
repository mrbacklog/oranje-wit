import { prisma } from "@/lib/db/prisma";
import { logger, HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { DashboardClient } from "./dashboard-client";

// ── Data ophalen ──────────────────────────────────────────────

async function getDashboardStats() {
  try {
    const [seizoen, teamsCount, raamwerk, uniekeLedenResult] = await Promise.all([
      prisma.seizoen.findFirst({
        where: { status: "ACTIEF" },
        select: { seizoen: true },
      }),
      prisma.oWTeam.count({
        where: { seizoen: HUIDIG_SEIZOEN },
      }),
      prisma.raamwerkVersie.findFirst({
        where: { status: "ACTIEF" },
        select: { naam: true },
      }),
      prisma.competitieSpeler.groupBy({
        by: ["relCode"],
        where: { seizoen: HUIDIG_SEIZOEN },
      }),
    ]);

    return {
      actiefSeizoen: seizoen?.seizoen ?? HUIDIG_SEIZOEN,
      ledenCount: uniekeLedenResult.length,
      teamsCount,
      raamwerkNaam: raamwerk?.naam ?? "Geen actief raamwerk",
    };
  } catch (error) {
    logger.warn("Dashboard stats ophalen mislukt:", error);
    return {
      actiefSeizoen: HUIDIG_SEIZOEN,
      ledenCount: 0,
      teamsCount: 0,
      raamwerkNaam: "Onbekend",
    };
  }
}

// ── Dashboard page (server component) ─────────────────────────

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return <DashboardClient stats={stats} />;
}
