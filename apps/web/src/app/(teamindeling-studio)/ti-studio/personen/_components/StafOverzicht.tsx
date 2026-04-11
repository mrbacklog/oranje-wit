"use client";

import { useState, useMemo } from "react";
import type { StudioStaf } from "../staf-actions";
import { NieuweStafDialog } from "./NieuweStafDialog";

const KLEUR_DOT: Record<string, string> = {
  BLAUW: "#3b82f6",
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
  SENIOR: "#94a3b8",
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  senior: "#94a3b8",
};

interface Props {
  stafLeden: StudioStaf[];
}

export function StafOverzicht({ stafLeden }: Props) {
  const [zoekterm, setZoekterm] = useState("");
  const [teamFilter, setTeamFilter] = useState("allen");
  const [rolFilter, setRolFilter] = useState("allen");
  const [gepindFilter, setGepindFilter] = useState(false);
  const [sortKey, setSortKey] = useState<"naam" | "teams" | "gepind">("naam");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [dialogOpen, setDialogOpen] = useState(false);

  const alleTeams = useMemo(
    () => [...new Set(stafLeden.flatMap((s) => s.teams.map((t) => t.teamNaam)))].sort(),
    [stafLeden]
  );
  const alleRollen = useMemo(
    () => [...new Set(stafLeden.flatMap((s) => s.rollen))].sort(),
    [stafLeden]
  );

  function handleSort(key: "naam" | "teams" | "gepind") {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const gefilterd = useMemo(() => {
    let result = stafLeden;
    if (zoekterm.trim()) {
      const q = zoekterm.trim().toLowerCase();
      result = result.filter((s) => s.naam.toLowerCase().includes(q));
    }
    if (teamFilter !== "allen")
      result = result.filter((s) => s.teams.some((t) => t.teamNaam === teamFilter));
    if (rolFilter !== "allen") result = result.filter((s) => s.rollen.includes(rolFilter));
    if (gepindFilter) result = result.filter((s) => s.gepind);
    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "naam":
          cmp = a.naam.localeCompare(b.naam, "nl");
          break;
        case "teams":
          cmp = (a.teams[0]?.teamNaam ?? "zzz").localeCompare(b.teams[0]?.teamNaam ?? "zzz", "nl");
          break;
        case "gepind":
          cmp = Number(b.gepind) - Number(a.gepind);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [stafLeden, zoekterm, teamFilter, rolFilter, gepindFilter, sortKey, sortDir]);

  function SortIcon({ col }: { col: "naam" | "teams" | "gepind" }) {
    if (sortKey !== col) return <span style={{ opacity: 0.3, fontSize: "0.65rem" }}> ↕</span>;
    return (
      <span style={{ fontSize: "0.65rem", color: "var(--ow-oranje-500)" }}>
        {" "}
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  const chipStyle = (actief: boolean): React.CSSProperties => ({
    padding: "0.25rem 0.625rem",
    borderRadius: 99,
    border: actief ? "1px solid var(--ow-oranje-500)" : "1px solid var(--border-default)",
    background: actief ? "rgba(255,107,0,0.12)" : "var(--surface-card)",
    color: actief ? "var(--ow-oranje-500)" : "var(--text-secondary)",
    fontSize: "0.8125rem",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  });

  const dropdownStyle: React.CSSProperties = {
    background: "var(--surface-sunken)",
    border: "1px solid var(--border-default)",
    borderRadius: 8,
    padding: "0.375rem 0.625rem",
    color: "var(--text-primary)",
    fontSize: "0.8125rem",
    outline: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const thStyle: React.CSSProperties = {
    padding: "0.625rem 0.875rem",
    textAlign: "left",
    fontSize: "0.6875rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--text-secondary)",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", alignItems: "center" }}>
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
            fontFamily: "inherit",
          }}
        />
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          style={dropdownStyle}
        >
          <option value="allen">Team: Allen</option>
          {alleTeams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={rolFilter}
          onChange={(e) => setRolFilter(e.target.value)}
          style={dropdownStyle}
        >
          <option value="allen">Rol: Allen</option>
          {alleRollen.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button onClick={() => setGepindFilter((v) => !v)} style={chipStyle(gepindFilter)}>
          📌 Gepind
        </button>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
          }}
        >
          {gefilterd.length} staflid{gefilterd.length !== 1 ? "en" : ""}
        </span>
        <button
          onClick={() => setDialogOpen(true)}
          style={{
            padding: "0.375rem 0.75rem",
            borderRadius: 7,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: "0.8125rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          + Nieuw staflid
        </button>
      </div>
      <div
        style={{
          background: "var(--surface-card)",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--border-default)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th onClick={() => handleSort("naam")} style={thStyle}>
                Naam
                <SortIcon col="naam" />
              </th>
              <th style={{ ...thStyle, cursor: "default" }}>Globale rollen</th>
              <th onClick={() => handleSort("teams")} style={thStyle}>
                Teams + rol
                <SortIcon col="teams" />
              </th>
              <th onClick={() => handleSort("gepind")} style={{ ...thStyle, textAlign: "center" }}>
                📌
                <SortIcon col="gepind" />
              </th>
            </tr>
          </thead>
          <tbody>
            {gefilterd.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                  }}
                >
                  Geen stafleden gevonden
                </td>
              </tr>
            )}
            {gefilterd.map((staf, i) => {
              const initialen = staf.naam
                .split(" ")
                .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <tr
                  key={staf.id}
                  style={{
                    borderBottom:
                      i < gefilterd.length - 1 ? "1px solid var(--border-default)" : "none",
                  }}
                >
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: "rgba(255,107,0,.15)",
                          border: "1.5px solid rgba(255,107,0,.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.6875rem",
                          fontWeight: 800,
                          color: "var(--accent)",
                          flexShrink: 0,
                        }}
                      >
                        {initialen}
                      </div>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {staf.naam}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "0.625rem 0.875rem",
                      fontSize: "0.8125rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {staf.rollen.length > 0 ? staf.rollen.join(", ") : "—"}
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    {staf.teams.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {staf.teams.map((t) => (
                          <div
                            key={t.teamId}
                            style={{ display: "flex", alignItems: "center", gap: 5 }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: KLEUR_DOT[t.kleur] ?? "#94a3b8",
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: "0.8125rem",
                                color: "var(--text-primary)",
                                fontWeight: 500,
                              }}
                            >
                              {t.teamNaam}
                            </span>
                            {t.rol && (
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--text-secondary)",
                                  background: "var(--surface-raised)",
                                  border: "1px solid var(--border-default)",
                                  borderRadius: 4,
                                  padding: "1px 6px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {t.rol}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--text-secondary)",
                          fontStyle: "italic",
                        }}
                      >
                        Niet ingedeeld
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem", textAlign: "center" }}>
                    <span style={{ fontSize: "0.875rem", opacity: staf.gepind ? 1 : 0.2 }}>📌</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <NieuweStafDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
