"use client";

import { Badge } from "@oranje-wit/ui";

export interface SnapshotPreviewData {
  teams: { naam: string; spelers: number; staf: number }[];
  totaalSpelers: number;
  totaalStaf: number;
  onbekendeRelCodes: string[];
  diff: {
    nieuw: { relCode: string; naam: string; team: string }[];
    gewisseld: { relCode: string; naam: string; vanTeam: string; naarTeam: string }[];
    verdwenen: { relCode: string; naam: string; wasTeam: string }[];
  };
}

interface Props {
  data: SnapshotPreviewData;
  onVerwerk: () => void;
  onReset: () => void;
}

export function TeamsSnapshotPreview({ data, onVerwerk, onReset }: Props) {
  const heeftDiff =
    data.diff.nieuw.length > 0 || data.diff.gewisseld.length > 0 || data.diff.verdwenen.length > 0;

  return (
    <div className="space-y-4">
      {/* Samenvatting */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <div className="stat-value">{data.teams.length}</div>
          <div className="stat-label">Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.totaalSpelers}</div>
          <div className="stat-label">Spelers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.totaalStaf}</div>
          <div className="stat-label">Staf</div>
        </div>
      </div>

      {/* Waarschuwing onbekende rel_codes */}
      {data.onbekendeRelCodes.length > 0 && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-warning-500) 10%, var(--surface-card))",
            borderColor: "var(--color-warning-500)",
            color: "var(--color-warning-500)",
          }}
        >
          {data.onbekendeRelCodes.length} onbekende rel_codes — eerst leden synchroniseren?
        </div>
      )}

      {/* Teams tabel */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <table className="beheer-table">
          <thead>
            <tr>
              <th>Team</th>
              <th className="text-right">Spelers</th>
              <th className="text-right">Staf</th>
            </tr>
          </thead>
          <tbody>
            {data.teams.map((t) => (
              <tr key={t.naam}>
                <td className="font-medium">{t.naam}</td>
                <td className="muted text-right">{t.spelers}</td>
                <td className="muted text-right">{t.staf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Diff met vorige snapshot */}
      {heeftDiff && (
        <div
          className="overflow-hidden rounded-xl border"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="px-5 py-2.5" style={{ borderBottom: "1px solid var(--border-light)" }}>
            <span
              className="text-xs font-medium tracking-wider uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              Wijzigingen t.o.v. vorige snapshot
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
            {data.diff.gewisseld.map((w) => (
              <div key={w.relCode} className="flex items-center justify-between px-5 py-2 text-sm">
                <span style={{ color: "var(--text-primary)" }}>{w.naam}</span>
                <span className="text-xs">
                  <Badge color="gray">{w.vanTeam}</Badge>
                  <span style={{ color: "var(--text-tertiary)" }}> → </span>
                  <Badge color="blue">{w.naarTeam}</Badge>
                </span>
              </div>
            ))}
            {data.diff.nieuw.map((n) => (
              <div key={n.relCode} className="flex items-center justify-between px-5 py-2 text-sm">
                <span style={{ color: "var(--text-primary)" }}>{n.naam}</span>
                <Badge color="green">nieuw in {n.team}</Badge>
              </div>
            ))}
            {data.diff.verdwenen.map((v) => (
              <div key={v.relCode} className="flex items-center justify-between px-5 py-2 text-sm">
                <span style={{ color: "var(--text-tertiary)" }}>{v.naam}</span>
                <Badge color="gray">was in {v.wasTeam}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actieknoppen */}
      <div className="flex gap-3">
        <button
          onClick={onVerwerk}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--ow-oranje-500)" }}
        >
          Snapshot opslaan
        </button>
        <button
          onClick={onReset}
          className="rounded-lg border px-4 py-2 text-sm"
          style={{
            borderColor: "var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}
