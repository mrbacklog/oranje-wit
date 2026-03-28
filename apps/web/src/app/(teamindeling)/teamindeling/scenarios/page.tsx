export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";

export default async function ScenariosOverview() {
  const seizoen = await getActiefSeizoen();

  const scenarios = await prisma.scenario.findMany({
    where: {
      verwijderdOp: null,
      concept: {
        blauwdruk: {
          seizoen,
        },
      },
    },
    include: {
      concept: {
        select: { naam: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ padding: "1rem" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.25rem",
        }}
      >
        Scenario&apos;s
      </h1>
      <p style={{ color: "var(--text-tertiary)", marginBottom: "1rem" }}>
        {seizoen} &middot; {scenarios.length} scenario&apos;s
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {scenarios.map(
          (scenario: { id: string; naam: string; status: string; concept: { naam: string } }) => (
            <Link
              key={scenario.id}
              href={`/teamindeling/scenarios/${scenario.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--surface-raised)",
                  borderRadius: "0.5rem",
                }}
              >
                <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{scenario.naam}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  {scenario.concept.naam} &middot; {scenario.status}
                </div>
              </div>
            </Link>
          )
        )}

        {scenarios.length === 0 && (
          <p style={{ color: "var(--text-tertiary)" }}>
            Geen scenario&apos;s gevonden voor {seizoen}.
          </p>
        )}
      </div>
    </div>
  );
}
