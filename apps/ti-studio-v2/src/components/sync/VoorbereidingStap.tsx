import type { SyncKaartData } from "./types";

interface VoorbereidingStapProps {
  kaartData: SyncKaartData;
}

function formatDatumLang(datum: Date | null): string {
  if (!datum) return "nooit";
  return datum.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VoorbereidingStap({ kaartData }: VoorbereidingStapProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          background: "rgba(255,255,255,.03)",
          border: "1px solid var(--border-light)",
          fontSize: 12,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}
      >
        Volledige sync van {kaartData.titel.toLowerCase()} via Sportlink API.{" "}
        <span style={{ color: "var(--text-tertiary)" }}>Laatste succesvolle sync:</span>{" "}
        <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
          {formatDatumLang(kaartData.laatstGesyncOp)}
        </span>
      </div>

      {kaartData.aantalRecords !== null && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "rgba(255,255,255,.03)",
            border: "1px solid var(--border-light)",
            fontSize: 12,
            color: "var(--text-secondary)",
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: "var(--text-tertiary)" }}>Verwacht:</span>{" "}
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
            {kaartData.aantalRecords}
          </span>{" "}
          records ophalen
        </div>
      )}
    </div>
  );
}
