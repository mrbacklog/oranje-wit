import { Badge } from "@oranje-wit/ui";
import { getCoordinatoren } from "./actions";

export const dynamic = "force-dynamic";

export default async function CoordinatorenPage() {
  const coordinatoren = await getCoordinatoren();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Coordinatoren
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {coordinatoren.length} evaluatie-coordinatoren
        </p>
      </div>

      {coordinatoren.length === 0 ? (
        <div
          className="overflow-hidden rounded-xl border px-6 py-12 text-center"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nog geen coordinatoren aangemaakt.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {coordinatoren.map((c) => {
            const huidigeSeizoenen = [...new Set(c.teams.map((t) => t.seizoen))];

            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-xl border"
                style={{
                  backgroundColor: "var(--surface-card)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {c.naam}
                      </h3>
                      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                        {c.email}
                      </p>
                    </div>
                    <Badge color={c.teams.length > 0 ? "green" : "gray"}>
                      {c.teams.length} team{c.teams.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {c.teams.length > 0 && (
                    <div className="mt-3">
                      {huidigeSeizoenen.map((seizoen) => (
                        <div key={seizoen} className="mt-2">
                          <p
                            className="text-xs font-medium tracking-wide uppercase"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {seizoen}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {c.teams
                              .filter((t) => t.seizoen === seizoen)
                              .map((t) => (
                                <Badge key={t.id} color="orange">
                                  {t.owTeam.naam ?? t.owTeam.owCode}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
