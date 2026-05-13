import { requireTC } from "@oranje-wit/auth/checks";
import { getSyncStatus, getHistorie } from "./actions";
import { SyncGrid } from "@/components/sync/SyncGrid";
import { HistorieLijst } from "@/components/sync/HistorieLijst";
import type { SyncKaartData } from "@/components/sync/types";

export default async function SyncPagina() {
  await requireTC();
  const status = await getSyncStatus();
  const historieResult = await getHistorie(50);

  const notificaties = historieResult.ok ? historieResult.data : [];

  // Bepaal laatste notificatie-datum voor de kaartdata
  const eersteNotificatie = notificaties[0] ?? null;
  const historieKaartData: SyncKaartData = {
    ...status.historie,
    laatstGesyncOp: eersteNotificatie?.datum ?? null,
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Sync grid — client component met overlay state */}
      <SyncGrid status={status} historieKaartData={historieKaartData} />

      {/* Notificatie-log */}
      <div
        style={{
          marginTop: 32,
          borderRadius: 12,
          border: "1px solid var(--border-light)",
          background: "var(--surface-card)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            Sportlink Notificaties
          </span>
          {status.historie.aantalRecords !== null && (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-tertiary)",
                background: "rgba(255,255,255,.05)",
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              {status.historie.aantalRecords} totaal
            </span>
          )}
        </div>

        {historieResult.ok ? (
          <HistorieLijst notificaties={notificaties} limit={50} />
        ) : (
          <div
            style={{
              padding: "20px",
              color: "var(--text-tertiary)",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            Kon notificaties niet laden
          </div>
        )}
      </div>
    </div>
  );
}
