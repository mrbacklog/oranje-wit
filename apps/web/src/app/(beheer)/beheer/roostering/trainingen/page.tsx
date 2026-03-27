import { Badge } from "@oranje-wit/ui";
import { getTeamsVoorRoostering } from "../actions";

export const dynamic = "force-dynamic";

export default async function TrainingenPage() {
  const teams = await getTeamsVoorRoostering();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Trainingen
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Trainingsplanning per team
        </p>
      </div>

      {/* Wat hier komt */}
      <div
        className="mb-4 overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="px-5 py-4">
          <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Wat hier komt
          </h3>
          <ul
            className="list-inside list-disc space-y-1 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            <li>Welk team traint wanneer (dag + tijdstip)</li>
            <li>Veld- of zaaltoewijzing per team</li>
            <li>Trainersrooster koppelen aan teams</li>
            <li>Conflictdetectie bij overlappende tijdslots</li>
          </ul>
        </div>
      </div>

      {/* Teams */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Beschikbare teams ({teams.length})
          </h3>
        </div>
        <div className="px-5 py-4">
          {teams.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Geen teams gevonden.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teams.map((t) => (
                <Badge key={t.id} color={t.categorie === "a" ? "green" : "blue"}>
                  {t.naam ?? t.owCode}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
