export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { PEILJAAR } from "@oranje-wit/types";

export default async function SpelersOverview() {
  const spelers = await prisma.speler.findMany({
    orderBy: [{ geboortejaar: "asc" }, { achternaam: "asc" }],
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geboortejaar: true,
      geslacht: true,
      status: true,
    },
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
        Spelers
      </h1>
      <p style={{ color: "var(--text-tertiary)", marginBottom: "1rem" }}>
        {spelers.length} spelers in pool
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {spelers.map(
          (speler: {
            id: string;
            roepnaam: string;
            achternaam: string;
            geboortejaar: number;
            geslacht: string;
            status: string;
          }) => {
            const korfbalLeeftijd = PEILJAAR - speler.geboortejaar;
            return (
              <Link
                key={speler.id}
                href={`/teamindeling/spelers/${speler.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--surface-raised)",
                    borderRadius: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                      {speler.roepnaam} {speler.achternaam}
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      {speler.geslacht} &middot; KL {korfbalLeeftijd} &middot; geb.{" "}
                      {speler.geboortejaar}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                    }}
                  >
                    {speler.status}
                  </div>
                </div>
              </Link>
            );
          }
        )}

        {spelers.length === 0 && (
          <p style={{ color: "var(--text-tertiary)" }}>Geen spelers gevonden.</p>
        )}
      </div>
    </div>
  );
}
