export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";

export default async function TeamsOverview() {
  const seizoen = await getActiefSeizoen();

  const teams = await prisma.oWTeam.findMany({
    where: { seizoen },
    orderBy: { sortOrder: "asc" },
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
        Teams
      </h1>
      <p style={{ color: "var(--text-tertiary)", marginBottom: "1rem" }}>
        {seizoen} &middot; {teams.length} teams
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {teams.map(
          (team: {
            id: number;
            naam: string | null;
            owCode: string;
            categorie: string;
            kleur: string | null;
          }) => (
            <Link
              key={team.id}
              href={`/teamindeling/teams/${team.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--surface-raised)",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                {team.kleur && (
                  <div
                    style={{
                      width: "0.75rem",
                      height: "0.75rem",
                      borderRadius: "50%",
                      backgroundColor: team.kleur,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                    {team.naam ?? team.owCode}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    Categorie {team.categorie.toUpperCase()}
                  </div>
                </div>
              </div>
            </Link>
          )
        )}

        {teams.length === 0 && (
          <p style={{ color: "var(--text-tertiary)" }}>Geen teams gevonden voor {seizoen}.</p>
        )}
      </div>
    </div>
  );
}
