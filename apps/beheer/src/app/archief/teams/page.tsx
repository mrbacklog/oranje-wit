import { Badge } from "@oranje-wit/ui";
import { getAfgerondeSeizoen, getTeamsVoorSeizoen } from "../actions";

export const dynamic = "force-dynamic";

export default async function TeamhistoriePage() {
  const seizoenen = await getAfgerondeSeizoen();

  // Pak het eerste seizoen met data als default
  const eersteSeizoen = seizoenen[0]?.seizoen;
  const teams = eersteSeizoen ? await getTeamsVoorSeizoen(eersteSeizoen) : [];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Teamhistorie
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {seizoenen.length} seizoenen beschikbaar
        </p>
      </div>

      {/* Seizoen-overzicht */}
      <div
        className="mb-4 overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="px-5 py-4">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Seizoenen
          </h3>
          <div className="flex flex-wrap gap-2">
            {seizoenen.map((s) => (
              <Badge
                key={s.seizoen}
                color={
                  s.status === "AFGEROND" ? "gray" : s.status === "ACTIEF" ? "green" : "orange"
                }
              >
                {s.seizoen} ({s._count.owTeams} teams, {s._count.competitieSpelers} spelers)
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Teams voor eerste seizoen */}
      {eersteSeizoen && (
        <div
          className="overflow-hidden rounded-xl border"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          {/* Seizoen-header */}
          <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Teams {eersteSeizoen}
            </h3>
          </div>

          {teams.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Geen teams gevonden.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="beheer-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Naam</th>
                    <th>Categorie</th>
                    <th>Kleur</th>
                    <th>Periodes</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span
                          className="font-mono text-xs"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {t.owCode}
                        </span>
                      </td>
                      <td className="font-medium">{t.naam ?? t.owCode}</td>
                      <td className="muted">{t.categorie}</td>
                      <td className="muted capitalize">{t.kleur ?? "-"}</td>
                      <td>
                        <div className="flex gap-1">
                          {t.periodes.map((p) => (
                            <Badge key={p.periode} color="gray">
                              {p.periode} {p.pool ? `(${p.pool})` : ""}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
