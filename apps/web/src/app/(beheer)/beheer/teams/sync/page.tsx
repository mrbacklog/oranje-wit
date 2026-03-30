import { prisma } from "@/lib/db/prisma";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { SyncTabs } from "./sync-tabs";

export const dynamic = "force-dynamic";

export default async function SportlinkSyncPage() {
  // Parallelle queries voor initiele data
  const [laatsteImport, aantalLeden, seizoenOpties] = await Promise.all([
    prisma.import.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.lid.count(),
    prisma.seizoen
      .findMany({
        orderBy: { startJaar: "desc" },
        select: { seizoen: true },
      })
      .then((s) => s.map((r) => r.seizoen)),
  ]);

  // Waarschuwing als sync > 4 weken geleden
  const syncOud =
    laatsteImport &&
    Date.now() - new Date(laatsteImport.createdAt).getTime() > 4 * 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Sportlink Sync
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Synchroniseer leden en teams vanuit Sportlink CSV-exports
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="stat-card">
          <div className="stat-value">{aantalLeden}</div>
          <div className="stat-label">Leden in database</div>
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

      {/* Waarschuwing */}
      {syncOud && (
        <div
          className="mb-6 rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-warning-500) 10%, var(--surface-card))",
            borderColor: "var(--color-warning-500)",
            color: "var(--color-warning-500)",
          }}
        >
          Ledendata is meer dan 4 weken oud — synchroniseer met Sportlink.
        </div>
      )}

      {/* Tabs */}
      <SyncTabs seizoenOpties={seizoenOpties} huidigSeizoen={HUIDIG_SEIZOEN} />
    </div>
  );
}
