import { Badge } from "@oranje-wit/ui";
import { getRondes } from "./actions";

export const dynamic = "force-dynamic";

const statusKleur: Record<string, "gray" | "green" | "red"> = {
  concept: "gray",
  actief: "green",
  gesloten: "red",
};

function formatDatum(d: Date): string {
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function RondesPage() {
  const rondes = await getRondes();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Evaluatierondes
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {rondes.length} rondes
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
        {rondes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Nog geen evaluatierondes aangemaakt.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="beheer-table">
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>Seizoen</th>
                  <th>Ronde</th>
                  <th>Type</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th className="text-right">Uitnodigingen</th>
                  <th className="text-right">Ingediend</th>
                </tr>
              </thead>
              <tbody>
                {rondes.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.naam}</td>
                    <td className="muted">{r.seizoen}</td>
                    <td className="muted">{r.ronde}</td>
                    <td className="muted capitalize">{r.type}</td>
                    <td className="muted">{formatDatum(r.deadline)}</td>
                    <td>
                      <Badge color={statusKleur[r.status] ?? "gray"}>{r.status}</Badge>
                    </td>
                    <td className="muted text-right">{r._count.uitnodigingen}</td>
                    <td className="muted text-right">{r._count.evaluaties}</td>
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
