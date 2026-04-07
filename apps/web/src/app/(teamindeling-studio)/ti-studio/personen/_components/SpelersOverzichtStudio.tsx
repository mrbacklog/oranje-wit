"use client";

import { useState, useMemo } from "react";
import type { StudioSpeler } from "../actions";

interface SpelersOverzichtStudioProps {
  spelers: StudioSpeler[];
  onRowClick: (spelerId: string) => void;
}

type SortKey = "achternaam" | "geboortejaar" | "status" | "gezienStatus";
type SortDir = "asc" | "desc";

type StatusFilter =
  | "allen"
  | "BESCHIKBAAR"
  | "TWIJFELT"
  | "GAAT_STOPPEN"
  | "NIEUW"
  | "ALGEMEEN_RESERVE";
type GeslachtFilter = "allen" | "M" | "V";

const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GAAT_STOPPEN: "Gaat stoppen",
  NIEUW_POTENTIEEL: "Nieuw",
  NIEUW_DEFINITIEF: "Nieuw",
  ALGEMEEN_RESERVE: "Reserve",
};

const STATUS_DOT: Record<string, string> = {
  BESCHIKBAAR: "#22c55e",
  TWIJFELT: "#f59e0b",
  GAAT_STOPPEN: "#ef4444",
  NIEUW_POTENTIEEL: "#3b82f6",
  NIEUW_DEFINITIEF: "#3b82f6",
  ALGEMEEN_RESERVE: "#6b7280",
};

const GEZIEN_DOT: Record<string, string> = {
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
  ONGEZIEN: "#4b5563",
};

const GEZIEN_LABEL: Record<string, string> = {
  GROEN: "Groen",
  GEEL: "Geel",
  ORANJE: "Oranje",
  ROOD: "Rood",
  ONGEZIEN: "Ongezien",
};

const KLEUR_DOT: Record<string, string> = {
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  paars: "#a855f7",
};

function geboortejaarKleur(jaar: number): string {
  const leeftijd = new Date().getFullYear() - jaar;
  if (leeftijd <= 8) return "#3b82f6";
  if (leeftijd <= 9) return "#22c55e";
  if (leeftijd <= 12) return "#eab308";
  if (leeftijd <= 15) return "#f97316";
  if (leeftijd <= 18) return "#ef4444";
  return "#6b7280";
}

function initialen(roepnaam: string, achternaam: string): string {
  const v = roepnaam.trim().charAt(0).toUpperCase();
  const a = achternaam.trim().charAt(0).toUpperCase();
  return `${v}${a}`.trim() || "??";
}

function matchesStatusFilter(speler: StudioSpeler, filter: StatusFilter): boolean {
  if (filter === "allen") return true;
  if (filter === "NIEUW") {
    return speler.status === "NIEUW_POTENTIEEL" || speler.status === "NIEUW_DEFINITIEF";
  }
  return speler.status === filter;
}

const STATUS_FILTER_LABELS: { value: StatusFilter; label: string }[] = [
  { value: "allen", label: "Allen" },
  { value: "BESCHIKBAAR", label: "Beschikbaar" },
  { value: "TWIJFELT", label: "Twijfelt" },
  { value: "GAAT_STOPPEN", label: "Gaat stoppen" },
  { value: "NIEUW", label: "Nieuw" },
  { value: "ALGEMEEN_RESERVE", label: "Reserve" },
];

export default function SpelersOverzichtStudio({
  spelers,
  onRowClick,
}: SpelersOverzichtStudioProps) {
  const [zoekterm, setZoekterm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("allen");
  const [geslachtFilter, setGeslachtFilter] = useState<GeslachtFilter>("allen");
  const [sortKey, setSortKey] = useState<SortKey>("achternaam");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleKolomKlik(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const gefilterd = useMemo(() => {
    let result = spelers;

    if (zoekterm.trim()) {
      const q = zoekterm.trim().toLowerCase();
      result = result.filter(
        (s) => s.roepnaam.toLowerCase().includes(q) || s.achternaam.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "allen") {
      result = result.filter((s) => matchesStatusFilter(s, statusFilter));
    }

    if (geslachtFilter !== "allen") {
      result = result.filter((s) => s.geslacht === geslachtFilter);
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "achternaam") {
        cmp = a.achternaam.localeCompare(b.achternaam, "nl");
      } else if (sortKey === "geboortejaar") {
        cmp = (a.geboortejaar ?? 0) - (b.geboortejaar ?? 0);
      } else if (sortKey === "status") {
        cmp = (a.status ?? "").localeCompare(b.status ?? "", "nl");
      } else if (sortKey === "gezienStatus") {
        const volgorde = ["ROOD", "ORANJE", "GEEL", "GROEN", "ONGEZIEN"];
        cmp = volgorde.indexOf(a.gezienStatus) - volgorde.indexOf(b.gezienStatus);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [spelers, zoekterm, statusFilter, geslachtFilter, sortKey, sortDir]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ opacity: 0.3, fontSize: "0.65rem" }}> ↕</span>;
    return (
      <span style={{ fontSize: "0.65rem", color: "var(--ow-oranje-500)" }}>
        {" "}
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
        }}
      >
        {/* Zoek */}
        <input
          type="search"
          placeholder="Zoek op naam..."
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          style={{
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-default)",
            borderRadius: 8,
            padding: "0.375rem 0.75rem",
            color: "var(--text-primary)",
            fontSize: "0.875rem",
            outline: "none",
            width: 200,
          }}
        />

        {/* Status filter pills */}
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {STATUS_FILTER_LABELS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              style={{
                padding: "0.25rem 0.625rem",
                borderRadius: 99,
                border:
                  statusFilter === value
                    ? "1px solid var(--ow-oranje-500)"
                    : "1px solid var(--border-default)",
                background: statusFilter === value ? "rgba(255,107,0,0.12)" : "var(--surface-card)",
                color: statusFilter === value ? "var(--ow-oranje-500)" : "var(--text-secondary)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Geslacht filter */}
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {(
            [
              { value: "allen", label: "Allen" },
              { value: "V", label: "Dames" },
              { value: "M", label: "Heren" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setGeslachtFilter(value as GeslachtFilter)}
              style={{
                padding: "0.25rem 0.625rem",
                borderRadius: 99,
                border:
                  geslachtFilter === value
                    ? "1px solid var(--ow-oranje-500)"
                    : "1px solid var(--border-default)",
                background:
                  geslachtFilter === value ? "rgba(255,107,0,0.12)" : "var(--surface-card)",
                color: geslachtFilter === value ? "var(--ow-oranje-500)" : "var(--text-secondary)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Count */}
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
          }}
        >
          {gefilterd.length} speler{gefilterd.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabel */}
      <div
        style={{
          background: "var(--surface-card)",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--border-default)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "auto",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border-default)",
              }}
            >
              {(
                [
                  { label: "Naam", key: "achternaam" as SortKey },
                  { label: "Status", key: "status" as SortKey },
                  { label: "Gezien", key: "gezienStatus" as SortKey },
                  { label: "Vorig team", key: null },
                  { label: "Indeling", key: null },
                  { label: "Jaar", key: "geboortejaar" as SortKey },
                ] as { label: string; key: SortKey | null }[]
              ).map(({ label, key }) => (
                <th
                  key={label}
                  onClick={key ? () => handleKolomKlik(key) : undefined}
                  style={{
                    padding: "0.625rem 0.875rem",
                    textAlign: "left",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--text-secondary)",
                    cursor: key ? "pointer" : "default",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                  {key && <SortIcon col={key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gefilterd.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                  }}
                >
                  Geen spelers gevonden
                </td>
              </tr>
            )}
            {gefilterd.map((speler, i) => {
              const avatarKleur = geboortejaarKleur(speler.geboortejaar);
              const init = initialen(speler.roepnaam, speler.achternaam);
              const statusLabel = STATUS_LABELS[speler.status] ?? speler.status;
              const statusDot = STATUS_DOT[speler.status] ?? "#6b7280";
              const gezienDot = GEZIEN_DOT[speler.gezienStatus] ?? "#4b5563";
              const gezienLabel = GEZIEN_LABEL[speler.gezienStatus] ?? speler.gezienStatus;
              const vorigKleur = speler.vorigTeamKleur
                ? (KLEUR_DOT[speler.vorigTeamKleur.toLowerCase()] ?? "#6b7280")
                : "#6b7280";
              const indelingKleur = speler.huidigIndelingTeam?.kleur
                ? (KLEUR_DOT[speler.huidigIndelingTeam.kleur.toLowerCase()] ?? "#22c55e")
                : "#22c55e";

              return (
                <tr
                  key={speler.id}
                  onClick={() => onRowClick(speler.id)}
                  style={{
                    borderBottom:
                      i < gefilterd.length - 1 ? "1px solid var(--border-default)" : "none",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "var(--surface-raised)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
                  {/* Naam */}
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: avatarKleur,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.6875rem",
                          fontWeight: 800,
                          color: "#fff",
                          flexShrink: 0,
                          letterSpacing: "0.03em",
                        }}
                      >
                        {init}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            lineHeight: 1.2,
                          }}
                        >
                          {speler.roepnaam} {speler.achternaam}
                        </div>
                      </div>
                      {/* Geslacht badge */}
                      <span
                        style={{
                          fontSize: "0.7rem",
                          padding: "0.1rem 0.35rem",
                          borderRadius: 99,
                          background:
                            speler.geslacht === "V"
                              ? "rgba(236,72,153,0.15)"
                              : "rgba(59,130,246,0.15)",
                          color: speler.geslacht === "V" ? "#f9a8d4" : "#93c5fd",
                          fontWeight: 700,
                          lineHeight: 1.4,
                        }}
                      >
                        {speler.geslacht === "V" ? "♀" : "♂"}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.8125rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: statusDot,
                          flexShrink: 0,
                        }}
                      />
                      {statusLabel}
                    </span>
                  </td>

                  {/* Gezien */}
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: gezienDot,
                          flexShrink: 0,
                          boxShadow:
                            speler.gezienStatus !== "ONGEZIEN" ? `0 0 4px ${gezienDot}88` : "none",
                        }}
                      />
                      {gezienLabel}
                    </span>
                  </td>

                  {/* Vorig team */}
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    {speler.vorigTeamNaam ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          background: "var(--surface-raised)",
                          border: "1px solid var(--border-default)",
                          borderRadius: 6,
                          padding: "0.2rem 0.5rem",
                          fontSize: "0.75rem",
                          color: "var(--text-primary)",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: vorigKleur,
                            flexShrink: 0,
                          }}
                        />
                        {speler.vorigTeamNaam}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                        —
                      </span>
                    )}
                  </td>

                  {/* Indelingsteam */}
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    {speler.huidigIndelingTeam ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          background: "rgba(34,197,94,0.1)",
                          border: "1px solid rgba(34,197,94,0.25)",
                          borderRadius: 6,
                          padding: "0.2rem 0.5rem",
                          fontSize: "0.75rem",
                          color: "#4ade80",
                          fontWeight: 500,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: indelingKleur,
                            flexShrink: 0,
                          }}
                        />
                        {speler.huidigIndelingTeam.naam}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                        —
                      </span>
                    )}
                  </td>

                  {/* Jaar */}
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {speler.geboortejaar}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
