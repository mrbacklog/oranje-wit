import { Badge } from "@oranje-wit/ui";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { getTeams } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const teams = await getTeams();
  const totalSpelers = teams.reduce((sum, t) => sum + t.aantalSpelers, 0);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Teams
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {teams.length} teams, {totalSpelers} spelers ({HUIDIG_SEIZOEN})
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="stat-card">
          <div className="stat-value">{teams.length}</div>
          <div className="stat-label">Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalSpelers}</div>
          <div className="stat-label">Spelers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{teams.filter((t) => t.isSelectie).length}</div>
          <div className="stat-label">Selectieteams</div>
        </div>
      </div>

      {/* Tabel */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        {teams.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Geen teams gevonden voor {HUIDIG_SEIZOEN}.
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
                  <th className="text-right">Spelers</th>
                  <th>Selectie</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {t.owCode}
                      </span>
                    </td>
                    <td className="font-medium">{t.naam ?? t.owCode}</td>
                    <td>
                      <Badge color={t.categorie === "a" ? "green" : "blue"}>
                        {t.categorie === "a" ? "A-categorie" : "B-categorie"}
                      </Badge>
                    </td>
                    <td>
                      {t.kleur ? (
                        <span className="inline-flex items-center gap-1.5 text-sm capitalize">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: `var(--knkv-${t.kleur}-500, var(--text-tertiary))`,
                            }}
                          />
                          {t.kleur}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>-</span>
                      )}
                    </td>
                    <td className="muted text-right">{t.aantalSpelers}</td>
                    <td>
                      {t.isSelectie ? (
                        <Badge color="orange">Selectie</Badge>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
