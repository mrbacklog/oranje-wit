import { getSeizoenen } from "./actions";

export const dynamic = "force-dynamic";

function formatDatum(d: Date): string {
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    ACTIEF: { cls: "actief", label: "Actief" },
    VOORBEREIDING: { cls: "voorbereiding", label: "Voorbereiding" },
    AFGEROND: { cls: "afgerond", label: "Afgerond" },
  };
  const s = map[status] ?? { cls: "afgerond", label: status };
  return (
    <span className={`status-badge ${s.cls}`}>
      <span className="status-dot" />
      {s.label}
    </span>
  );
}

export default async function JaarkalenderPage() {
  const seizoenen = await getSeizoenen();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Jaarkalender
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Seizoenen en hun status
        </p>
      </div>

      {/* Tabel */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        {seizoenen.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Geen seizoenen gevonden.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="beheer-table">
              <thead>
                <tr>
                  <th>Seizoen</th>
                  <th>Start</th>
                  <th>Eind</th>
                  <th>Peildatum</th>
                  <th>Status</th>
                  <th className="text-right">Teams</th>
                  <th className="text-right">Spelers</th>
                  <th className="text-right">Mijlpalen</th>
                </tr>
              </thead>
              <tbody>
                {seizoenen.map((s) => (
                  <tr key={s.seizoen}>
                    <td className="font-medium">{s.seizoen}</td>
                    <td className="muted">{formatDatum(s.startDatum)}</td>
                    <td className="muted">{formatDatum(s.eindDatum)}</td>
                    <td className="muted">{formatDatum(s.peildatum)}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="muted text-right">{s._count.owTeams}</td>
                    <td className="muted text-right">{s._count.competitieSpelers}</td>
                    <td className="muted text-right">{s._count.mijlpalen}</td>
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
