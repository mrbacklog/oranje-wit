import { Badge } from "@oranje-wit/ui";
import { getScouts } from "./actions";

export const dynamic = "force-dynamic";

const rolKleur: Record<string, "orange" | "blue"> = {
  TC: "orange",
  SCOUT: "blue",
};

export default async function ScoutsPage() {
  const scouts = await getScouts();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Scouts
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {scouts.length} scouts geregistreerd
        </p>
      </div>

      {/* Stats */}
      {scouts.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="stat-card">
            <div className="stat-value">{scouts.length}</div>
            <div className="stat-label">Scouts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {scouts.reduce((sum, s) => sum + s.aantalRapporten, 0)}
            </div>
            <div className="stat-label">Rapporten</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{scouts.reduce((sum, s) => sum + s.aantalBadges, 0)}</div>
            <div className="stat-label">Badges</div>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        {scouts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Nog geen scouts geregistreerd. Scouts worden aangemaakt via de scouting-app.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="beheer-table">
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>E-mail</th>
                  <th>Rol</th>
                  <th className="text-right">Level</th>
                  <th className="text-right">XP</th>
                  <th className="text-right">Rapporten</th>
                  <th className="text-right">Badges</th>
                </tr>
              </thead>
              <tbody>
                {scouts.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.naam}</td>
                    <td className="muted">{s.email}</td>
                    <td>
                      <Badge color={rolKleur[s.rol] ?? "gray"}>{s.rol}</Badge>
                    </td>
                    <td className="muted text-right">{s.level}</td>
                    <td className="text-right">
                      <span style={{ color: "var(--ow-oranje-500)" }}>{s.xp}</span>
                    </td>
                    <td className="muted text-right">{s.aantalRapporten}</td>
                    <td className="muted text-right">{s.aantalBadges}</td>
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
