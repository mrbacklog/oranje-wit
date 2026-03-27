import { Badge, Button } from "@oranje-wit/ui";
import { getImportHistorie } from "./actions";

export const dynamic = "force-dynamic";

function formatDatum(datum: Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(datum);
}

export default async function ImportPage() {
  const imports = await getImportHistorie();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Import
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Data-import historie en synchronisatie
        </p>
      </div>

      {/* Actie-sectie */}
      <div
        className="mb-6 overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
              Sportlink-import
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
              Importeer actuele ledendata en teamindelingen vanuit Sportlink.
            </p>
          </div>
          <Button variant="secondary" size="sm" disabled title="Nog niet beschikbaar">
            Import starten
          </Button>
        </div>
      </div>

      {/* Import-historie */}
      <div className="mb-4">
        <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Import-historie ({imports.length} imports)
        </h3>
      </div>

      <div
        className="overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        {imports.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Nog geen imports uitgevoerd.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="beheer-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Seizoen</th>
                  <th>Spelers</th>
                  <th>Staf</th>
                  <th className="text-right">Teams</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((imp) => (
                  <tr key={imp.id}>
                    <td className="muted">{formatDatum(imp.createdAt)}</td>
                    <td>
                      <Badge color="blue">{imp.seizoen}</Badge>
                    </td>
                    <td>
                      <span className="font-medium">{imp.spelersNieuw}</span>
                      <span style={{ color: "var(--text-tertiary)" }}> nieuw, </span>
                      <span className="font-medium">{imp.spelersBijgewerkt}</span>
                      <span style={{ color: "var(--text-tertiary)" }}> bijgewerkt</span>
                    </td>
                    <td>
                      <span className="font-medium">{imp.stafNieuw}</span>
                      <span style={{ color: "var(--text-tertiary)" }}> nieuw, </span>
                      <span className="font-medium">{imp.stafBijgewerkt}</span>
                      <span style={{ color: "var(--text-tertiary)" }}> bijgewerkt</span>
                    </td>
                    <td className="text-right font-medium">{imp.teamsGeladen}</td>
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
