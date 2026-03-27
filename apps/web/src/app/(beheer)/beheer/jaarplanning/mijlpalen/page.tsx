import { Badge } from "@oranje-wit/ui";
import { getMijlpalen, getSeizoenOpties } from "./actions";

export const dynamic = "force-dynamic";

function formatDatum(d: Date): string {
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function MijlpalenPage() {
  const [mijlpalen, seizoenOpties] = await Promise.all([getMijlpalen(), getSeizoenOpties()]);

  // Groepeer per seizoen
  const perSeizoen = new Map<string, typeof mijlpalen>();
  for (const m of mijlpalen) {
    const lijst = perSeizoen.get(m.seizoen) ?? [];
    lijst.push(m);
    perSeizoen.set(m.seizoen, lijst);
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Mijlpalen & Checklists
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {seizoenOpties.length} seizoenen, {mijlpalen.length} mijlpalen
        </p>
      </div>

      {perSeizoen.size === 0 ? (
        <div
          className="overflow-hidden rounded-xl border px-6 py-12 text-center"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nog geen mijlpalen gedefinieerd.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(perSeizoen.entries()).map(([seizoen, items]) => (
            <div
              key={seizoen}
              className="overflow-hidden rounded-xl border"
              style={{
                backgroundColor: "var(--surface-card)",
                borderColor: "var(--border-default)",
              }}
            >
              {/* Seizoen-header */}
              <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {seizoen}
                </h3>
              </div>

              {/* Tabel */}
              <div className="overflow-x-auto">
                <table className="beheer-table">
                  <thead>
                    <tr>
                      <th className="w-16">#</th>
                      <th>Mijlpaal</th>
                      <th>Datum</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((m) => (
                      <tr key={m.id}>
                        <td className="dimmed">{m.volgorde}</td>
                        <td className="font-medium">{m.label}</td>
                        <td className="muted">{formatDatum(m.datum)}</td>
                        <td>
                          {m.afgerond ? (
                            <span className="status-badge actief">
                              <span className="status-dot" />
                              Afgerond
                            </span>
                          ) : (
                            <Badge color="orange">Open</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
