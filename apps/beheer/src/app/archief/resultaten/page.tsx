import { Badge } from "@oranje-wit/ui";
import { getAfgerondeSeizoen, getResultatenVoorSeizoen } from "../actions";

export const dynamic = "force-dynamic";

export default async function ResultatenPage() {
  const seizoenen = await getAfgerondeSeizoen();

  // Pak het eerste seizoen met data als default
  const eersteSeizoen = seizoenen[0]?.seizoen;
  const poolStanden = eersteSeizoen ? await getResultatenVoorSeizoen(eersteSeizoen) : [];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Competitieresultaten
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {seizoenen.length} seizoenen, {poolStanden.length} poules
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
                {s.seizoen}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Resultaten voor eerste seizoen */}
      {eersteSeizoen && poolStanden.length > 0 ? (
        <div className="space-y-4">
          {poolStanden.map((ps) => (
            <div
              key={ps.id}
              className="overflow-hidden rounded-xl border"
              style={{
                backgroundColor: "var(--surface-card)",
                borderColor: "var(--border-default)",
              }}
            >
              {/* Pool-header */}
              <div
                className="flex items-center gap-2 px-5 py-3"
                style={{ borderBottom: "1px solid var(--border-light)" }}
              >
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {ps.pool}
                </h3>
                <Badge color="gray">{ps.periode}</Badge>
                {ps.niveau && <Badge color="blue">{ps.niveau}</Badge>}
              </div>

              <div className="overflow-x-auto">
                <table className="beheer-table">
                  <thead>
                    <tr>
                      <th className="w-10">#</th>
                      <th>Team</th>
                      <th className="text-right">GS</th>
                      <th className="text-right">W</th>
                      <th className="text-right">G</th>
                      <th className="text-right">V</th>
                      <th className="text-right">PT</th>
                      <th className="text-right">+/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ps.regels.map((r) => (
                      <tr
                        key={r.positie}
                        style={r.isOW ? { backgroundColor: "rgba(255, 107, 0, 0.04)" } : undefined}
                      >
                        <td className="dimmed">{r.positie}</td>
                        <td className={r.isOW ? "font-semibold" : "font-medium"}>
                          {r.teamNaam}
                          {r.isOW && (
                            <Badge color="orange" className="ml-2">
                              OW
                            </Badge>
                          )}
                        </td>
                        <td className="muted text-right">{r.gespeeld}</td>
                        <td className="muted text-right">{r.gewonnen}</td>
                        <td className="muted text-right">{r.gelijk}</td>
                        <td className="muted text-right">{r.verloren}</td>
                        <td className="text-right font-semibold">{r.punten}</td>
                        <td className="muted text-right">
                          {r.doelpuntenVoor - r.doelpuntenTegen > 0 ? "+" : ""}
                          {r.doelpuntenVoor - r.doelpuntenTegen}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-xl border px-6 py-12 text-center"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Geen resultaten beschikbaar.
          </p>
        </div>
      )}
    </div>
  );
}
