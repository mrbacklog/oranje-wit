export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";

export default async function ScenariosOverview() {
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
              spelers: {
                select: {
                  speler: {
                    select: {
                      id: true,
                      roepnaam: true,
                      achternaam: true,
                      geboortejaar: true,
                      geslacht: true,
                    },
                  },
                },
              },
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
        Werkindeling
      </h1>
      <p style={{ color: "var(--text-tertiary)", marginBottom: "1rem" }}>
        {seizoen}
        {werkindeling && (
          <span>
            {" "}
            &middot; {werkindeling.naam} &middot; {werkindeling.status}
          </span>
        )}
      </p>

      {teams.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {teams.map(
            (team: {
              id: string;
              naam: string;
              categorie: string;
              kleur: string | null;
              spelers: Array<{
                speler: {
                  id: string;
                  roepnaam: string | null;
                  achternaam: string;
                  geboortejaar: number | null;
                  geslacht: string | null;
                };
              }>;
            }) => (
              <div
                key={team.id}
                style={{
                  backgroundColor: "var(--surface-raised)",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    borderBottom: "1px solid var(--border-default, rgba(255,255,255,0.1))",
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
                      {team.categorie} &middot; {team.spelers.length} spelers
                    </div>
                  </div>
                </div>

                <div style={{ padding: "0.5rem 0" }}>
                  {team.spelers.map(
                    (ts: {
                      speler: {
                        id: string;
                        roepnaam: string | null;
                        achternaam: string;
                        geboortejaar: number | null;
                        geslacht: string | null;
                      };
                    }) => (
                      <Link
                        key={ts.speler.id}
                        href={`/teamindeling/spelers/${ts.speler.id}`}
                        style={{ textDecoration: "none", display: "block" }}
                      >
                        <div
                          style={{
                            padding: "0.4rem 1rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ color: "var(--text-primary)" }}>
                            {ts.speler.roepnaam ?? ts.speler.achternaam}{" "}
                            {ts.speler.roepnaam ? ts.speler.achternaam : ""}
                          </span>
                          <span
                            style={{
                              color: "var(--text-tertiary)",
                              fontSize: "0.8125rem",
                            }}
                          >
                            {ts.speler.geboortejaar}
                            {ts.speler.geslacht && ` · ${ts.speler.geslacht}`}
                          </span>
                        </div>
                      </Link>
                    )
                  )}
                  {team.spelers.length === 0 && (
                    <div
                      style={{
                        padding: "0.4rem 1rem",
                        color: "var(--text-tertiary)",
                        fontSize: "0.875rem",
                      }}
                    >
                      Geen spelers
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <p style={{ color: "var(--text-tertiary)" }}>Nog geen werkindeling voor dit seizoen</p>
      )}
    </div>
  );
}
