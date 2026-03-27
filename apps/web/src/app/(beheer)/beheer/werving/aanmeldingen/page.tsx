import { Badge } from "@oranje-wit/ui";
import { getAanmeldingen } from "./actions";

export const dynamic = "force-dynamic";

const statusKleur: Record<string, "gray" | "green" | "orange" | "blue" | "red"> = {
  AANMELDING: "blue",
  PROEFLES: "orange",
  INTAKE: "orange",
  LID: "green",
  AFGEHAAKT: "red",
};

const statusLabel: Record<string, string> = {
  AANMELDING: "Aanmelding",
  PROEFLES: "Proefles",
  INTAKE: "Intake",
  LID: "Lid",
  AFGEHAAKT: "Afgehaakt",
};

function formatDatum(d: Date): string {
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AanmeldingenPage() {
  const aanmeldingen = await getAanmeldingen();
  const actief = aanmeldingen.filter((a) => a.status !== "LID" && a.status !== "AFGEHAAKT");

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Aanmeldingen
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {aanmeldingen.length} totaal, {actief.length} actief
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
        {aanmeldingen.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Nog geen aanmeldingen. Maak een nieuwe aanmelding aan om de funnel te starten.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="beheer-table">
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>Geboortejaar</th>
                  <th>Bron</th>
                  <th>Status</th>
                  <th>Aangemeld op</th>
                </tr>
              </thead>
              <tbody>
                {aanmeldingen.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium">{a.naam}</td>
                    <td className="muted">{a.geboortejaar ?? "-"}</td>
                    <td className="muted">{a.bron ?? "-"}</td>
                    <td>
                      <Badge color={statusKleur[a.status] ?? "gray"}>
                        {statusLabel[a.status] ?? a.status}
                      </Badge>
                    </td>
                    <td className="muted">{formatDatum(a.createdAt)}</td>
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
