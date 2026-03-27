import { Badge } from "@oranje-wit/ui";
import { prisma } from "@/lib/db/prisma";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

export const dynamic = "force-dynamic";

export default async function SportlinkSyncPage() {
  // Laatste import ophalen
  const laatsteImport = await prisma.import.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      seizoen: true,
      exportDatum: true,
      snapshotDatum: true,
      spelersNieuw: true,
      spelersBijgewerkt: true,
      stafNieuw: true,
      stafBijgewerkt: true,
      teamsGeladen: true,
      createdAt: true,
    },
  });

  // Huidige aantallen
  const [aantalLeden, aantalTeams] = await Promise.all([
    prisma.competitieSpeler.count({ where: { seizoen: HUIDIG_SEIZOEN } }),
    prisma.oWTeam.count({ where: { seizoen: HUIDIG_SEIZOEN } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Sportlink Sync
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Synchroniseer leden, teams en staf met Sportlink
        </p>
      </div>

      {/* Huidige staat */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="stat-card">
          <div className="stat-value">{aantalLeden}</div>
          <div className="stat-label">Spelers ({HUIDIG_SEIZOEN})</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{aantalTeams}</div>
          <div className="stat-label">Teams ({HUIDIG_SEIZOEN})</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {laatsteImport
              ? new Date(laatsteImport.createdAt).toLocaleDateString("nl-NL")
              : "Nooit"}
          </div>
          <div className="stat-label">Laatste sync</div>
        </div>
      </div>

      {/* Laatste import details */}
      {laatsteImport && (
        <div
          className="mb-4 overflow-hidden rounded-xl border"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Laatste import
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-5 py-4 text-sm">
            <div>
              <span style={{ color: "var(--text-tertiary)" }}>Seizoen: </span>
              <span style={{ color: "var(--text-primary)" }}>{laatsteImport.seizoen}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-tertiary)" }}>Export datum: </span>
              <span style={{ color: "var(--text-primary)" }}>{laatsteImport.exportDatum}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-tertiary)" }}>Spelers nieuw: </span>
              <Badge color={laatsteImport.spelersNieuw > 0 ? "green" : "gray"}>
                {laatsteImport.spelersNieuw}
              </Badge>
            </div>
            <div>
              <span style={{ color: "var(--text-tertiary)" }}>Spelers bijgewerkt: </span>
              <Badge color={laatsteImport.spelersBijgewerkt > 0 ? "blue" : "gray"}>
                {laatsteImport.spelersBijgewerkt}
              </Badge>
            </div>
            <div>
              <span style={{ color: "var(--text-tertiary)" }}>Staf nieuw: </span>
              <Badge color={laatsteImport.stafNieuw > 0 ? "green" : "gray"}>
                {laatsteImport.stafNieuw}
              </Badge>
            </div>
            <div>
              <span style={{ color: "var(--text-tertiary)" }}>Teams geladen: </span>
              <span style={{ color: "var(--text-primary)" }}>{laatsteImport.teamsGeladen}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sync-knop placeholder */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="px-5 py-4">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Automatische Sportlink-sync is nog niet beschikbaar. Gebruik het import-script (
            <code
              className="rounded px-1.5 py-0.5 text-xs"
              style={{ backgroundColor: "var(--surface-sunken)", color: "var(--text-secondary)" }}
            >
              pnpm import
            </code>
            ) om data handmatig te importeren.
          </p>
        </div>
      </div>
    </div>
  );
}
