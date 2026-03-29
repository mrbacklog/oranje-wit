export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";

export default async function TeamIndelingMobileDashboard() {
  const seizoen = await getActiefSeizoen();

  const werkindeling = await prisma.scenario.findFirst({
    where: {
      isWerkindeling: true,
      concept: { blauwdruk: { seizoen } },
      verwijderdOp: null,
    },
    select: {
      naam: true,
      status: true,
      updatedAt: true,
      versies: {
        orderBy: { nummer: "desc" },
        take: 1,
        select: {
          teams: {
            orderBy: { volgorde: "asc" },
            select: {
              id: true,
              naam: true,
              categorie: true,
              kleur: true,
              _count: { select: { spelers: true } },
            },
          },
        },
      },
    },
  });

  const teams = werkindeling?.versies?.[0]?.teams ?? [];

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
        Team-Indeling
      </h1>
      <p style={{ color: "var(--text-tertiary)", marginBottom: "1rem" }}>{seizoen}</p>

      {werkindeling ? (
        <>
          <div
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: "var(--surface-raised)",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                marginBottom: "0.25rem",
              }}
            >
              {werkindeling.naam}
            </div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.875rem",
              }}
            >
              {werkindeling.status} &middot; {teams.length} teams
            </div>
          </div>

          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Teams
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {teams.map(
              (team: {
                id: string;
                naam: string;
                categorie: string;
                kleur: string | null;
                _count: { spelers: number };
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
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          color: "var(--text-primary)",
                          fontWeight: 600,
                        }}
                      >
                        {team.naam}
                      </div>
                      <div
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.875rem",
                        }}
                      >
                        {team.categorie} &middot; {team._count.spelers} spelers
                      </div>
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>
        </>
      ) : (
        <p style={{ color: "var(--text-tertiary)" }}>Nog geen werkindeling voor dit seizoen</p>
      )}
    </div>
  );
}
