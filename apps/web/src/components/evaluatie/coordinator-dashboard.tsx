"use client";

import { Card, CardBody, Badge, ProgressBar } from "@oranje-wit/ui";

interface RondeVoortgang {
  rondeId: string;
  rondeNaam: string;
  deadline: string;
  ingediend: number;
  uitnodigingen: number;
}

interface TeamStat {
  teamId: number;
  teamNaam: string;
  categorie: string;
  rondes: RondeVoortgang[];
}

interface CoordinatorDashboardProps {
  naam: string;
  teams: TeamStat[];
}

export function CoordinatorDashboard({ naam, teams }: CoordinatorDashboardProps) {
  const totaalIngediend = teams.reduce(
    (sum, t) => sum + t.rondes.reduce((s, r) => s + r.ingediend, 0),
    0
  );
  const totaalUitnodigingen = teams.reduce(
    (sum, t) => sum + t.rondes.reduce((s, r) => s + r.uitnodigingen, 0),
    0
  );

  return (
    <main
      className="min-h-screen px-5 pt-10 pb-20"
      style={{ backgroundColor: "var(--surface-page)" }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1
            className="text-xl font-bold tracking-tight sm:text-2xl"
            style={{ color: "var(--text-primary)" }}
          >
            Mijn teams
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-tertiary)" }}>
            {naam ? `Coordinator: ${naam}` : "Evaluatievoortgang per team"}
            {totaalUitnodigingen > 0 && (
              <span className="ml-2">
                &middot; {totaalIngediend}/{totaalUitnodigingen} evaluaties
              </span>
            )}
          </p>
        </div>

        <div className="space-y-4">
          {teams.map((team, teamIdx) => (
            <Card key={team.teamId}>
              <CardBody>
                <div className="flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--ow-oranje-500)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {team.teamNaam}
                  </h2>
                  {team.categorie && <Badge color="gray">{team.categorie}</Badge>}
                </div>

                {team.rondes.length === 0 ? (
                  <p className="mt-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Geen actieve evaluatierondes.
                  </p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {team.rondes.map((ronde, rondeIdx) => {
                      const deadlineDate = new Date(ronde.deadline);
                      const deadlineStr = deadlineDate.toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                      });
                      const isVerlopen = deadlineDate < new Date();
                      const isCompleet =
                        ronde.uitnodigingen > 0 && ronde.ingediend === ronde.uitnodigingen;

                      return (
                        <div key={ronde.rondeId}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {ronde.rondeNaam}
                            </span>
                            <span
                              className="flex items-center gap-1 text-xs"
                              style={{
                                color:
                                  isVerlopen && !isCompleet ? "#ef4444" : "var(--text-tertiary)",
                              }}
                            >
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <path d="M16 2v4M8 2v4M3 10h18" />
                                <path d="M12 14v4M10 16h4" />
                              </svg>
                              {deadlineStr}
                            </span>
                          </div>
                          {ronde.uitnodigingen > 0 ? (
                            <ProgressBar
                              value={ronde.ingediend}
                              max={ronde.uitnodigingen}
                              showValue
                              valueFormat="absolute"
                              size="sm"
                              delay={teamIdx * 0.1 + rondeIdx * 0.05}
                              color={
                                isCompleet
                                  ? { from: "#16a34a", to: "#22c55e" }
                                  : { from: "var(--ow-oranje-500)", to: "var(--ow-oranje-400)" }
                              }
                            />
                          ) : (
                            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                              Nog geen uitnodigingen verstuurd
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
